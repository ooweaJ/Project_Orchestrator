import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const projectsFile = path.join(dataDir, "projects.json");
const snapshotsDir = path.join(dataDir, "snapshots");
const activityFile = path.join(dataDir, "activity.jsonl");
const envFile = path.join(rootDir, ".env");
const port = Number(process.env.PORT ?? 4317);

const app = express();

app.use(cors());
app.use(express.json());

const ignoredDirectoryNames = new Set([
  ".git",
  "node_modules",
  "Binaries",
  "Intermediate",
  "Saved",
  "Library",
  "Temp",
  ".vs",
  ".next",
  "dist",
  "build",
]);

const textFileExtensions = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".css",
  ".h",
  ".hpp",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".md",
  ".py",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const orchestrationViewerExtensions = new Set([".md", ".html", ".txt", ".json"]);

const maxScannedFiles = 2500;
const maxTodoFileBytes = 300000;
const largeFileThresholdBytes = 10 * 1024 * 1024;

const orchestrationRequiredEntries = [
  { label: "README", path: "docs/orchestration/README.md", type: "file" },
  { label: "PROJECT_BRIEF", path: "docs/orchestration/PROJECT_BRIEF.md", type: "file" },
  { label: "STATUS", path: "docs/orchestration/STATUS.md", type: "file" },
  { label: "CURRENT_TASK", path: "docs/orchestration/CURRENT_TASK.md", type: "file" },
  { label: "NEXT_TASKS", path: "docs/orchestration/NEXT_TASKS.md", type: "file" },
  { label: "PROMPT_CONTEXT", path: "docs/orchestration/PROMPT_CONTEXT.md", type: "file" },
  { label: "RUNBOOK", path: "docs/orchestration/RUNBOOK.md", type: "file" },
  { label: "SCOPE_GUARD", path: "docs/orchestration/SCOPE_GUARD.md", type: "file" },
  { label: "DECISION_LOG", path: "docs/orchestration/DECISION_LOG.md", type: "file" },
  { label: "devlog", path: "docs/orchestration/devlog", type: "directory" },
  { label: "reports", path: "docs/orchestration/reports", type: "directory" },
];

const orchestrationRecommendedEntries = [
  { label: "review_prompts", path: "docs/orchestration/review_prompts", type: "directory" },
  { label: "review_responses", path: "docs/orchestration/review_responses", type: "directory" },
  { label: "evidence", path: "docs/orchestration/evidence", type: "directory" },
  { label: "templates", path: "docs/orchestration/templates", type: "directory" },
];

const orchestrationDashboardDocs = [
  { key: "status", label: "STATUS.md", path: "docs/orchestration/STATUS.md" },
  { key: "currentTask", label: "CURRENT_TASK.md", path: "docs/orchestration/CURRENT_TASK.md" },
  { key: "nextTasks", label: "NEXT_TASKS.md", path: "docs/orchestration/NEXT_TASKS.md" },
  { key: "decisionLog", label: "DECISION_LOG.md", path: "docs/orchestration/DECISION_LOG.md" },
];

async function ensureDataFiles() {
  await fs.mkdir(snapshotsDir, { recursive: true });
  try {
    await fs.access(projectsFile);
  } catch {
    await fs.writeFile(projectsFile, "[]\n", "utf8");
  }
}

async function getWindowsDriveRoots() {
  const roots = [];

  for (let code = 65; code <= 90; code += 1) {
    const drive = `${String.fromCharCode(code)}:\\`;
    if (await pathExists(drive)) {
      roots.push(drive);
    }
  }

  return roots;
}

async function getFolderRoots() {
  if (process.platform === "win32") {
    return getWindowsDriveRoots();
  }

  return ["/"];
}

async function listFolders(targetPath) {
  const roots = await getFolderRoots();
  const fallbackPath = roots[0] ?? path.parse(rootDir).root;
  const currentPath = targetPath ? path.resolve(targetPath) : fallbackPath;
  const stats = await fs.stat(currentPath);

  if (!stats.isDirectory()) {
    throw new Error("선택한 경로가 폴더가 아닙니다.");
  }

  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(currentPath, entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const rootPath = path.parse(currentPath).root;

  return {
    currentPath,
    parentPath: currentPath === rootPath ? "" : path.dirname(currentPath),
    roots,
    folders,
  };
}

function runGit(args, cwd) {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, windowsHide: true, timeout: 8000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          ok: false,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          message: error.message,
        });
        return;
      }

      resolve({
        ok: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        message: "",
      });
    });
  });
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function resolveOrchestrationViewerPath(projectPath, requestedPath) {
  const baseDir = path.resolve(projectPath, "docs", "orchestration");
  const normalizedPath = requestedPath.replace(/\\/g, "/");

  if (!normalizedPath || normalizedPath.includes("\0") || path.isAbsolute(normalizedPath)) {
    throw new Error("invalid document path");
  }

  const fullPath = path.resolve(baseDir, normalizedPath);

  if (fullPath !== baseDir && !fullPath.startsWith(`${baseDir}${path.sep}`)) {
    throw new Error("document path is outside docs/orchestration");
  }

  return { baseDir, fullPath };
}

async function listOrchestrationViewerFiles(projectPath) {
  const baseDir = path.resolve(projectPath, "docs", "orchestration");
  const files = [];

  async function visit(directory) {
    if (files.length >= 240) {
      return;
    }

    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      if (files.length >= 240) {
        return;
      }

      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }

      if (!entry.isFile() || !orchestrationViewerExtensions.has(path.extname(entry.name).toLowerCase())) {
        continue;
      }

      const stats = await fs.stat(fullPath).catch(() => null);

      if (!stats) {
        continue;
      }

      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      files.push({
        path: relativePath,
        name: entry.name,
        directory: path.dirname(relativePath) === "." ? "" : path.dirname(relativePath).replace(/\\/g, "/"),
        extension: path.extname(entry.name).toLowerCase(),
        sizeBytes: stats.size,
        modifiedAt: stats.mtime.toISOString(),
      });
    }
  }

  await visit(baseDir);
  return files.sort((a, b) => a.path.localeCompare(b.path, "ko"));
}

async function readProjects() {
  await ensureDataFiles();
  const content = await fs.readFile(projectsFile, "utf8");
  return JSON.parse(content);
}

async function writeProjects(projects) {
  await fs.writeFile(projectsFile, `${JSON.stringify(projects, null, 2)}\n`, "utf8");
}

async function appendActivity(event) {
  const record = {
    ...event,
    createdAt: new Date().toISOString(),
  };
  await fs.appendFile(activityFile, `${JSON.stringify(record)}\n`, "utf8");
}

async function readEnv() {
  const env = { ...process.env };
  const content = await fs.readFile(envFile, "utf8").catch(() => "");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  return env;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function parseStatusPorcelain(output) {
  const staged = [];
  const modified = [];
  const untracked = [];

  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const indexStatus = line[0];
    const workTreeStatus = line[1];
    const filePath = line.slice(3);

    if (indexStatus === "?" && workTreeStatus === "?") {
      untracked.push(filePath);
      continue;
    }

    if (indexStatus !== " " && indexStatus !== "?") {
      staged.push(filePath);
    }

    if (workTreeStatus !== " " && workTreeStatus !== "?") {
      modified.push(filePath);
    }
  }

  return { staged, modified, untracked };
}

async function hasFile(projectPath, relativePath) {
  return pathExists(path.join(projectPath, relativePath));
}

async function hasProjectEntry(projectPath, entry) {
  const fullPath = path.join(projectPath, entry.path);
  const stats = await fs.stat(fullPath).catch(() => null);

  if (!stats) {
    return false;
  }

  return entry.type === "directory" ? stats.isDirectory() : stats.isFile();
}

function emptyOrchestrationSignals() {
  const required = orchestrationRequiredEntries.map((entry) => ({
    ...entry,
    exists: false,
  }));
  const recommended = orchestrationRecommendedEntries.map((entry) => ({
    ...entry,
    exists: false,
  }));

  return {
    required,
    recommended,
    requiredPresent: 0,
    requiredTotal: required.length,
    recommendedPresent: 0,
    recommendedTotal: recommended.length,
    missingRequired: required.map((entry) => entry.path),
    complete: false,
  };
}

async function collectOrchestrationSignals(projectPath) {
  const required = await Promise.all(
    orchestrationRequiredEntries.map(async (entry) => ({
      ...entry,
      exists: await hasProjectEntry(projectPath, entry),
    })),
  );
  const recommended = await Promise.all(
    orchestrationRecommendedEntries.map(async (entry) => ({
      ...entry,
      exists: await hasProjectEntry(projectPath, entry),
    })),
  );
  const requiredPresent = required.filter((entry) => entry.exists).length;
  const recommendedPresent = recommended.filter((entry) => entry.exists).length;

  return {
    required,
    recommended,
    requiredPresent,
    requiredTotal: required.length,
    recommendedPresent,
    recommendedTotal: recommended.length,
    missingRequired: required.filter((entry) => !entry.exists).map((entry) => entry.path),
    complete: requiredPresent === required.length,
  };
}

function trimMarkdownContent(value, maxLength = 4200) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function hasMeaningfulMarkdown(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .some((line) => !/^[-*]\s*$/.test(line) && line !== "-");
}

async function readOrchestrationDocument(projectPath, doc) {
  const fullPath = path.join(projectPath, doc.path);
  const content = await fs.readFile(fullPath, "utf8").catch(() => "");

  return {
    key: doc.key,
    label: doc.label,
    path: doc.path,
    exists: content.length > 0,
    hasContent: hasMeaningfulMarkdown(content),
    content: trimMarkdownContent(content),
  };
}

async function listRecentMarkdownFiles(projectPath, relativeDir) {
  const fullDir = path.join(projectPath, relativeDir);
  const entries = await fs.readdir(fullDir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) {
      continue;
    }

    const fullPath = path.join(fullDir, entry.name);
    const stats = await fs.stat(fullPath).catch(() => null);

    if (!stats) {
      continue;
    }

    files.push({
      path: path.join(relativeDir, entry.name).replace(/\\/g, "/"),
      modifiedAt: stats.mtime.toISOString(),
    });
  }

  return files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()).slice(0, 5);
}

async function collectOrchestrationDashboard(projectPath) {
  const documents = await Promise.all(
    orchestrationDashboardDocs.map((doc) => readOrchestrationDocument(projectPath, doc)),
  );
  const currentTask = documents.find((doc) => doc.key === "currentTask");

  return {
    phase: currentTask?.hasContent ? "진행 중" : "현재 작업 미정",
    documents,
    recentDevlog: await listRecentMarkdownFiles(projectPath, "docs/orchestration/devlog"),
    recentReports: await listRecentMarkdownFiles(projectPath, "docs/orchestration/reports"),
  };
}

function toRelativePath(projectPath, filePath) {
  return path.relative(projectPath, filePath).replace(/\\/g, "/");
}

function shouldReadForTodos(filePath, size) {
  return size <= maxTodoFileBytes && textFileExtensions.has(path.extname(filePath).toLowerCase());
}

async function collectFileSignals(projectPath) {
  const recentFiles = [];
  const largeFiles = [];
  const todoItems = [];
  let todoCount = 0;
  let scannedFiles = 0;
  let truncated = false;

  async function visit(directory) {
    if (scannedFiles >= maxScannedFiles) {
      truncated = true;
      return;
    }

    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      if (scannedFiles >= maxScannedFiles) {
        truncated = true;
        return;
      }

      if (entry.name.startsWith(".") && entry.name !== ".gitattributes") {
        if (entry.isDirectory() || ignoredDirectoryNames.has(entry.name)) {
          continue;
        }
      }

      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!ignoredDirectoryNames.has(entry.name)) {
          await visit(fullPath);
        }
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      scannedFiles += 1;
      const stats = await fs.stat(fullPath).catch(() => null);
      if (!stats) {
        continue;
      }

      const relativePath = toRelativePath(projectPath, fullPath);

      recentFiles.push({
        path: relativePath,
        modifiedAt: stats.mtime.toISOString(),
      });

      if (stats.size >= largeFileThresholdBytes) {
        largeFiles.push({
          path: relativePath,
          sizeBytes: stats.size,
        });
      }

      if (shouldReadForTodos(fullPath, stats.size)) {
        const content = await fs.readFile(fullPath, "utf8").catch(() => "");
        const lines = content.split(/\r?\n/);

        lines.forEach((line, index) => {
          if (/\b(TODO|FIXME|BUG)\b/i.test(line)) {
            todoCount += 1;

            if (todoItems.length < 12) {
              todoItems.push({
                path: relativePath,
                line: index + 1,
                text: line.trim().slice(0, 180),
              });
            }
          }
        });
      }
    }
  }

  await visit(projectPath);

  recentFiles.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
  largeFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);

  return {
    recentFiles: recentFiles.slice(0, 10),
    largeFiles: largeFiles.slice(0, 10),
    todoCount,
    todoItems,
    scannedFiles,
    truncated,
  };
}

async function detectProjectType(project, projectPath) {
  if (project.type && project.type !== "unknown") {
    return project.type;
  }

  const entries = await fs.readdir(projectPath).catch(() => []);

  if (entries.some((entry) => entry.endsWith(".uproject"))) {
    return "unreal";
  }

  if (
    entries.includes("Assets") &&
    entries.includes("ProjectSettings") &&
    (await hasFile(projectPath, "Packages/manifest.json"))
  ) {
    return "unity";
  }

  if (await hasFile(projectPath, "package.json")) {
    return "node";
  }

  if ((await hasFile(projectPath, "index.html")) && project.name.toLowerCase().includes("portfolio")) {
    return "portfolio";
  }

  if (entries.includes("docs")) {
    return "docs";
  }

  return project.type ?? "unknown";
}

function scoreRisks(project, git, files, exists) {
  const risks = [];

  if (!exists) {
    risks.push({
      level: "blocked",
      type: "missing-path",
      message: "등록된 프로젝트 폴더를 찾을 수 없습니다.",
    });
    return risks;
  }

  if (!git.isRepo) {
    risks.push({
      level: "medium",
      type: "not-git-repo",
      message: "이 폴더는 Git 저장소가 아닙니다.",
    });
  }

  if (git.dirty) {
    risks.push({
      level: "medium",
      type: "dirty-tree",
      message: "아직 커밋하지 않은 변경사항이 있습니다.",
    });
  }

  if (git.untracked.length > 0) {
    risks.push({
      level: "medium",
      type: "untracked-files",
      message: "Git이 추적하지 않는 파일이 있어 검토가 필요합니다.",
    });
  }

  if (git.isRepo && !git.hasUpstream) {
    risks.push({
      level: "medium",
      type: "no-upstream",
      message: "현재 브랜치에 연결된 원격 upstream이 없습니다.",
    });
  }

  if (git.ahead > 0) {
    risks.push({
      level: "medium",
      type: "ahead-of-remote",
      message: "아직 원격에 push하지 않은 로컬 커밋이 있습니다.",
    });
  }

  if (git.behind > 0) {
    risks.push({
      level: "high",
      type: "behind-remote",
      message: "로컬 브랜치가 원격 upstream보다 뒤처져 있습니다.",
    });
  }

  if (!files.hasAgentsMd) {
    risks.push({
      level: "low",
      type: "missing-agents",
      message: "AGENTS.md 작업 지침 파일이 없습니다.",
    });
  }

  if (!files.hasReadme) {
    risks.push({
      level: "low",
      type: "missing-readme",
      message: "README.md 문서가 없습니다.",
    });
  }

  if (files.orchestration && !files.orchestration.complete) {
    risks.push({
      level: "low",
      type: "missing-orchestration-interface",
      message: `오케스트레이션 필수 문서 ${files.orchestration.missingRequired.length}개가 없습니다.`,
    });
  }

  if (files.todoCount > 0) {
    risks.push({
      level: "low",
      type: "todo-comments",
      message: `검토할 TODO/FIXME/BUG 주석이 ${files.todoCount}개 있습니다.`,
    });
  }

  if (files.largeFiles.length > 0) {
    risks.push({
      level: "high",
      type: "large-files",
      message: `대용량 파일 ${files.largeFiles.length}개가 발견됐습니다. Git LFS가 필요한지 확인하세요.`,
    });
  }

  if (project.type === "unreal" && !files.hasGitAttributes) {
    risks.push({
      level: "high",
      type: "git-lfs-candidate",
      message: "Unreal 프로젝트는 보통 .uasset, .umap, 바이너리 파일용 Git LFS 설정이 필요합니다.",
    });
  }

  if (project.type === "unity" && !files.hasGitAttributes) {
    risks.push({
      level: "high",
      type: "git-lfs-candidate",
      message: "Unity 프로젝트는 보통 에셋, 씬, 프리팹, 바이너리 파일용 Git LFS 설정이 필요합니다.",
    });
  }

  if (files.truncated) {
    risks.push({
      level: "medium",
      type: "scan-truncated",
      message: `너무 많은 파일을 읽지 않도록 ${files.scannedFiles}개 파일에서 스캔을 멈췄습니다.`,
    });
  }

  return risks;
}

function getRiskLevel(risks) {
  const order = ["low", "medium", "high", "blocked"];
  return risks.reduce((current, risk) => {
    return order.indexOf(risk.level) > order.indexOf(current) ? risk.level : current;
  }, "low");
}

function getRiskLevelLabel(level) {
  return {
    low: "정상",
    medium: "주의",
    high: "높은 위험",
    blocked: "확인 필요",
  }[level] ?? level;
}

function getActionCategories(git, files, exists) {
  if (!exists) {
    return {
      blocked: true,
      needsCommit: false,
      needsDocs: false,
      needsPush: false,
      needsPull: false,
      needsReview: false,
      needsLfs: false,
      needsTest: false,
      needsCleanup: false,
    };
  }

  const needsOrchestrationDocs = files.orchestration ? !files.orchestration.complete : false;

  return {
    blocked: false,
    needsCommit: git.dirty || git.staged.length > 0 || git.modified.length > 0 || git.untracked.length > 0,
    needsDocs: !files.hasAgentsMd || !files.hasReadme || !files.hasDocsStatus || !files.hasDocsNextTasks || needsOrchestrationDocs,
    needsPush: git.ahead > 0 || (git.isRepo && !git.hasUpstream),
    needsPull: git.behind > 0,
    needsReview: files.todoCount > 0 || files.largeFiles.length > 0 || files.truncated,
    needsLfs: files.largeFiles.length > 0 || !files.hasGitAttributes,
    needsTest: git.dirty || files.todoCount > 0,
    needsCleanup: git.untracked.length > 0 || files.truncated,
  };
}

function generatePrompt(project, snapshot, kind = "diagnose") {
  const dirtyLine = snapshot.git.dirty
    ? `- 작업 트리에 수정 ${snapshot.git.modified.length}개, 스테이징 ${snapshot.git.staged.length}개, 추적 안 됨 ${snapshot.git.untracked.length}개가 있습니다.`
    : "- 작업 트리가 깨끗해 보입니다.";

  const base = [
    `${project.name} 프로젝트 상태를 먼저 확인해줘.`,
    "",
    "현재 신호:",
    `- 경로: ${project.path}`,
    `- 종류: ${snapshot.type}`,
    `- 브랜치: ${snapshot.git.branch || "알 수 없음"}`,
    dirtyLine,
    `- TODO/FIXME/BUG 주석: ${snapshot.files.todoCount}`,
    `- 대용량 파일: ${snapshot.files.largeFiles.length}`,
    `- 최근 파일: ${snapshot.files.recentFiles.map((file) => file.path).join(", ") || "없음"}`,
    `- 위험도: ${getRiskLevelLabel(snapshot.riskLevel)}`,
    "",
    "주의:",
    "- destructive 명령은 실행하지 마",
    "- 사용자 변경을 되돌리지 마",
    "- 먼저 상태를 요약하고 필요한 검증 계획을 제안해줘",
  ];

  if (kind === "commit") {
    return [
      ...base,
      "",
      "목표:",
      "- 변경 파일을 기능 단위로 요약",
      "- 커밋해도 되는 범위인지 판단",
      "- 필요한 테스트/검증 항목 제안",
      "- Conventional Commits 형식의 커밋 메시지 후보 제안",
    ].join("\n");
  }

  if (kind === "docs") {
    return [
      ...base,
      "",
      "목표:",
      "- README.md, AGENTS.md, docs/CODEX_STATUS.md, docs/NEXT_TASKS.md 상태 확인",
      "- 구현과 어긋난 문서 항목 찾기",
      "- 바로 반영 가능한 최소 문서 패치 제안",
    ].join("\n");
  }

  if (kind === "review") {
    return [
      ...base,
      "",
      "목표:",
      "- 변경사항을 코드 리뷰 관점으로 점검",
      "- 버그, 회귀 위험, 누락된 검증을 우선순위로 정리",
      "- 관련 파일과 근거를 함께 제시",
    ].join("\n");
  }

  if (kind === "continue") {
    return [
      ...base,
      "",
      "목표:",
      "- 현재 구현 상태와 최근 파일을 보고 이어서 할 최소 작업을 정해줘",
      "- 이미 완료된 작업과 중복되지 않게 다음 작은 구현 단위를 제안해줘",
      "- 변경 전 검증 기준을 먼저 제시해줘",
    ].join("\n");
  }

  if (kind === "verification") {
    return [
      ...base,
      "",
      "목표:",
      "- 지금 상태에서 필요한 검증 명령과 수동 확인 항목을 제안해줘",
      "- 실패 가능성이 높은 부분을 우선순위로 정리해줘",
      "- 검증 후 커밋 가능 여부를 판단해줘",
    ].join("\n");
  }

  if (kind === "cleanup") {
    return [
      ...base,
      "",
      "목표:",
      "- untracked 파일, TODO/FIXME/BUG, 스캔 제한 신호를 검토해줘",
      "- 삭제나 되돌리기 같은 destructive 작업은 하지 말고 정리 계획만 제안해줘",
      "- 안전하게 남길 파일과 검토할 파일을 분류해줘",
    ].join("\n");
  }

  if (kind === "push") {
    return [
      ...base,
      "",
      "목표:",
      "- upstream, ahead/behind, dirty 상태를 보고 push 준비 상태를 판단해줘",
      "- push 전에 필요한 commit/test/docs 확인 목록을 제안해줘",
      "- force push나 history rewrite가 필요해 보이면 먼저 위험과 대안을 설명해줘",
    ].join("\n");
  }

  return [
    ...base,
    "",
    "목표:",
    "- 현재 상태 요약",
    "- 위험하거나 막힌 부분 판단",
    "- 다음 Codex 작업 프롬프트 제안",
    "- commit, test, push, docs 중 필요한 액션 분류",
  ].join("\n");
}

function recommendedActions(project, snapshot) {
  const actions = [];
  const categories = snapshot.actionCategories;

  actions.push({
    kind: "codex-prompt",
    label: "상태 진단",
    prompt: generatePrompt(project, snapshot, "diagnose"),
  });

  if (categories.needsCommit) {
    actions.push({
      kind: "codex-prompt",
      label: "커밋 준비",
      prompt: generatePrompt(project, snapshot, "commit"),
    });
  }

  if (categories.needsDocs) {
    actions.push({
      kind: "codex-prompt",
      label: "문서 정리",
      prompt: generatePrompt(project, snapshot, "docs"),
    });
  }

  if (categories.needsTest) {
    actions.push({
      kind: "codex-prompt",
      label: "검증 계획",
      prompt: generatePrompt(project, snapshot, "verification"),
    });
  }

  if (categories.needsReview) {
    actions.push({
      kind: "codex-prompt",
      label: "위험 리뷰",
      prompt: generatePrompt(project, snapshot, "review"),
    });
  }

  if (categories.needsPush) {
    actions.push({
      kind: "codex-prompt",
      label: "푸시 준비",
      prompt: generatePrompt(project, snapshot, "push"),
    });
  }

  if (categories.needsCleanup) {
    actions.push({
      kind: "codex-prompt",
      label: "정리 계획",
      prompt: generatePrompt(project, snapshot, "cleanup"),
    });
  }

  return actions;
}

function buildReportFromSnapshots(snapshots) {
  const projectCount = snapshots.length;
  const riskyCount = snapshots.filter((snapshot) => getRiskLevel(snapshot.risks) !== "low").length;
  const blockedCount = snapshots.filter((snapshot) => snapshot.actionCategories.blocked).length;
  const needsCommitCount = snapshots.filter((snapshot) => snapshot.actionCategories.needsCommit).length;
  const needsDocsCount = snapshots.filter((snapshot) => snapshot.actionCategories.needsDocs).length;
  const needsPushCount = snapshots.filter((snapshot) => snapshot.actionCategories.needsPush).length;
  const needsReviewCount = snapshots.filter((snapshot) => snapshot.actionCategories.needsReview).length;
  const topRisks = snapshots
    .flatMap((snapshot) => snapshot.risks.map((risk) => `${snapshot.name}: ${risk.message}`))
    .slice(0, 5);

  return {
    title: "AI Project Orchestrator 스캔 보고서",
    status: new Date().toISOString(),
    work: [
      `${projectCount}개 프로젝트 스냅샷을 스캔했습니다.`,
      "Git 상태, 문서 상태, 파일 신호, 위험도, 추천 액션을 요약했습니다.",
    ],
    progress: [
      `${riskyCount}개 프로젝트에 주의 이상의 위험 신호가 있습니다.`,
      `${blockedCount}개 프로젝트가 확인 필요 상태입니다.`,
      `${needsReviewCount}개 프로젝트가 리뷰 신호를 가지고 있습니다.`,
      ...(topRisks.length > 0 ? topRisks : ["상위 위험 신호가 없습니다."]),
    ],
    result: [
      `커밋 필요: ${needsCommitCount}`,
      `문서 필요: ${needsDocsCount}`,
      `푸시 필요: ${needsPushCount}`,
      "다음 작업은 위험도 분류와 추천 액션을 확인한 뒤 Codex 프롬프트로 이어가는 것입니다.",
    ],
    nextTask: "위험도와 추천 액션을 기준으로 가장 막힌 프로젝트부터 처리합니다.",
  };
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function getDiscordField(doc, fallback) {
  if (!doc?.content) {
    return fallback;
  }

  return truncate(doc.content.replace(/\r?\n{3,}/g, "\n\n"), 1000);
}

function buildOrchestrationDiscordPayload(project, dashboard, username) {
  const docByKey = Object.fromEntries(dashboard.documents.map((doc) => [doc.key, doc]));

  return {
    username,
    embeds: [
      {
        title: `${project.name} 오케스트레이션 보고`,
        description: `현재 단계: ${dashboard.phase}`,
        color: 2050893,
        fields: [
          {
            name: "현재 상태",
            value: getDiscordField(docByKey.status, "STATUS.md에 기록된 상태가 없습니다."),
            inline: false,
          },
          {
            name: "현재 작업",
            value: getDiscordField(docByKey.currentTask, "CURRENT_TASK.md에 진행 중인 작업이 없습니다."),
            inline: false,
          },
          {
            name: "다음 작업",
            value: getDiscordField(docByKey.nextTasks, "NEXT_TASKS.md에 다음 작업이 없습니다."),
            inline: false,
          },
        ],
        footer: {
          text: "AI Project Orchestrator 중앙 .env 기준으로 전송됨",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function scanProject(project) {
  const exists = await pathExists(project.path);
  const blankGit = {
    isRepo: false,
    branch: "",
    latestCommit: null,
    hasUpstream: false,
    ahead: 0,
    behind: 0,
    modified: [],
    staged: [],
    untracked: [],
    dirty: false,
  };

  if (!exists) {
    const files = {
      hasAgentsMd: false,
      hasReadme: false,
      hasPackageJson: false,
      hasDocsStatus: false,
      hasDocsNextTasks: false,
      hasGitAttributes: false,
      recentFiles: [],
      largeFiles: [],
      todoCount: 0,
      todoItems: [],
      scannedFiles: 0,
      truncated: false,
      orchestration: emptyOrchestrationSignals(),
      orchestrationDashboard: {
        phase: "경로 없음",
        documents: orchestrationDashboardDocs.map((doc) => ({
          ...doc,
          exists: false,
          hasContent: false,
          content: "",
        })),
        recentDevlog: [],
        recentReports: [],
      },
    };
    const risks = scoreRisks(project, blankGit, files, false);
    const actionCategories = getActionCategories(blankGit, files, false);
    const snapshot = {
      ...project,
      exists,
      type: project.type ?? "unknown",
      git: blankGit,
      files,
      risks,
      riskLevel: getRiskLevel(risks),
      actionCategories,
      recommendedActions: [],
      updatedAt: new Date().toISOString(),
    };
    snapshot.recommendedActions = recommendedActions(project, snapshot);
    return snapshot;
  }

  const type = await detectProjectType(project, project.path);
  const isRepoResult = await runGit(["rev-parse", "--is-inside-work-tree"], project.path);
  const isRepo = isRepoResult.ok && isRepoResult.stdout === "true";
  const git = { ...blankGit, isRepo };

  if (isRepo) {
    const [branch, latestCommit, status, upstream] = await Promise.all([
      runGit(["branch", "--show-current"], project.path),
      runGit(["log", "-1", "--pretty=format:%h%x09%s"], project.path),
      runGit(["status", "--porcelain=v1"], project.path),
      runGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], project.path),
    ]);

    git.branch = branch.ok ? branch.stdout : "";
    git.hasUpstream = upstream.ok && upstream.stdout.length > 0;

    if (latestCommit.ok && latestCommit.stdout) {
      const [hash, ...messageParts] = latestCommit.stdout.split("\t");
      git.latestCommit = {
        hash,
        message: messageParts.join("\t"),
      };
    }

    if (status.ok) {
      const parsed = parseStatusPorcelain(status.stdout);
      git.modified = parsed.modified;
      git.staged = parsed.staged;
      git.untracked = parsed.untracked;
      git.dirty = git.modified.length > 0 || git.staged.length > 0 || git.untracked.length > 0;
    }

    if (git.hasUpstream) {
      const counts = await runGit(["rev-list", "--left-right", "--count", "HEAD...@{u}"], project.path);
      if (counts.ok) {
        const [ahead, behind] = counts.stdout.split(/\s+/).map((value) => Number(value));
        git.ahead = Number.isFinite(ahead) ? ahead : 0;
        git.behind = Number.isFinite(behind) ? behind : 0;
      }
    }
  }

  const fileSignals = await collectFileSignals(project.path);
  const files = {
    hasAgentsMd: await hasFile(project.path, "AGENTS.md"),
    hasReadme: await hasFile(project.path, "README.md"),
    hasPackageJson: await hasFile(project.path, "package.json"),
    hasDocsStatus: await hasFile(project.path, "docs/CODEX_STATUS.md"),
    hasDocsNextTasks: await hasFile(project.path, "docs/NEXT_TASKS.md"),
    hasGitAttributes: await hasFile(project.path, ".gitattributes"),
    orchestration: await collectOrchestrationSignals(project.path),
    orchestrationDashboard: await collectOrchestrationDashboard(project.path),
    ...fileSignals,
  };

  const normalizedProject = { ...project, type };
  const risks = scoreRisks(normalizedProject, git, files, exists);
  const actionCategories = getActionCategories(git, files, exists);
  const snapshot = {
    ...normalizedProject,
    exists,
    git,
    files,
    risks,
    riskLevel: getRiskLevel(risks),
    actionCategories,
    recommendedActions: [],
    updatedAt: new Date().toISOString(),
  };

  snapshot.recommendedActions = recommendedActions(normalizedProject, snapshot);
  await fs.writeFile(path.join(snapshotsDir, `${project.id}.json`), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return snapshot;
}

app.get("/api/projects", async (_req, res) => {
  try {
    res.json(await readProjects());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/folders", async (req, res) => {
  try {
    const requestedPath = typeof req.query.path === "string" ? req.query.path : "";
    res.json(await listFolders(requestedPath));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { name, path: projectPath, type = "unknown", tags = [] } = req.body;

    if (!name || !projectPath) {
      res.status(400).json({ error: "name and path are required" });
      return;
    }

    if (!(await pathExists(projectPath))) {
      res.status(400).json({ error: "project path does not exist" });
      return;
    }

    const projects = await readProjects();
    const baseId = slugify(name) || `project-${projects.length + 1}`;
    let id = baseId;
    let suffix = 2;

    while (projects.some((project) => project.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const now = new Date().toISOString();
    const project = {
      id,
      name,
      path: projectPath,
      type,
      tags,
      importantFiles: ["AGENTS.md", "README.md", "docs/CODEX_STATUS.md", "docs/NEXT_TASKS.md", "package.json"],
      createdAt: now,
      updatedAt: now,
    };

    projects.push(project);
    await writeProjects(projects);
    await appendActivity({ type: "project-added", projectId: id, name });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const projects = await readProjects();
    const nextProjects = projects.filter((project) => project.id !== req.params.id);

    if (nextProjects.length === projects.length) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    await writeProjects(nextProjects);
    await appendActivity({ type: "project-removed", projectId: req.params.id });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects/:id/snapshot", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    const snapshot = await scanProject(project);
    await appendActivity({ type: "project-scanned", projectId: project.id });
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects/:id/orchestration-dashboard", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).type("html").send("project not found");
      return;
    }

    const dashboardPath = path.join(project.path, "docs", "orchestration", "index.html");
    const html = await fs.readFile(dashboardPath, "utf8").catch(() => "");

    if (!html) {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><html><body><p>docs/orchestration/index.html이 아직 생성되지 않았습니다.</p></body></html>",
        );
      return;
    }

    res.type("html").send(html);
  } catch (error) {
    res.status(500).type("html").send(error.message);
  }
});

app.get("/api/projects/:id/orchestration-command", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).type("html").send("project not found");
      return;
    }

    const commandPath = path.join(project.path, "docs", "orchestration", "command.html");
    const html = await fs.readFile(commandPath, "utf8").catch(() => "");

    if (!html) {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><html><body><p>docs/orchestration/command.html이 아직 생성되지 않았습니다.</p></body></html>",
        );
      return;
    }

    res.type("html").send(html);
  } catch (error) {
    res.status(500).type("html").send(error.message);
  }
});

app.get("/api/projects/:id/orchestration-runbook", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).type("html").send("project not found");
      return;
    }

    const runbookPath = path.join(project.path, "docs", "orchestration", "runbook.html");
    const html = await fs.readFile(runbookPath, "utf8").catch(() => "");

    if (!html) {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><html><body><p>docs/orchestration/runbook.html이 아직 생성되지 않았습니다.</p></body></html>",
        );
      return;
    }

    res.type("html").send(html);
  } catch (error) {
    res.status(500).type("html").send(error.message);
  }
});

app.get("/api/projects/:id/orchestration-files", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    if (!(await pathExists(path.join(project.path, "docs", "orchestration")))) {
      res.json([]);
      return;
    }

    res.json(await listOrchestrationViewerFiles(project.path));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects/:id/orchestration-file", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    const requestedPath = typeof req.query.path === "string" ? req.query.path : "";
    const { fullPath } = resolveOrchestrationViewerPath(project.path, requestedPath);
    const extension = path.extname(fullPath).toLowerCase();

    if (!orchestrationViewerExtensions.has(extension)) {
      res.status(400).json({ error: "unsupported document type" });
      return;
    }

    const stats = await fs.stat(fullPath).catch(() => null);

    if (!stats?.isFile()) {
      res.status(404).json({ error: "document not found" });
      return;
    }

    if (stats.size > 500000) {
      res.status(413).json({ error: "document is too large to preview" });
      return;
    }

    res.json({
      path: requestedPath.replace(/\\/g, "/"),
      extension,
      modifiedAt: stats.mtime.toISOString(),
      content: await fs.readFile(fullPath, "utf8"),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/snapshots", async (_req, res) => {
  try {
    const projects = await readProjects();
    const snapshots = await Promise.all(projects.map((project) => scanProject(project)));
    await appendActivity({ type: "all-projects-scanned", count: snapshots.length });
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects/:id/prompt", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    const snapshot = await scanProject(project);
    const kind = req.body?.kind ?? "diagnose";
    const prompt = generatePrompt(project, snapshot, kind);
    await appendActivity({ type: "prompt-generated", projectId: project.id, kind });
    res.json({ kind, prompt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/activity", async (_req, res) => {
  try {
    const content = await fs.readFile(activityFile, "utf8").catch(() => "");
    const activity = content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .reverse()
      .slice(0, 50);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/report", async (_req, res) => {
  try {
    const projects = await readProjects();
    const snapshots = await Promise.all(projects.map((project) => scanProject(project)));
    const report = buildReportFromSnapshots(snapshots);
    await appendActivity({ type: "report-generated", count: snapshots.length });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects/:id/discord-report", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    if (!(await pathExists(project.path))) {
      res.status(400).json({ error: "project path does not exist" });
      return;
    }

    const dashboard = await collectOrchestrationDashboard(project.path);
    const env = await readEnv();
    const payload = buildOrchestrationDiscordPayload(
      project,
      dashboard,
      env.DISCORD_REPORT_USERNAME || "AI Project Orchestrator",
    );

    if (req.body?.dryRun) {
      res.json({ dryRun: true, payload });
      return;
    }

    if (!env.DISCORD_WEBHOOK_URL) {
      res.status(400).json({ error: "DISCORD_WEBHOOK_URL is missing in orchestrator .env" });
      return;
    }

    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      res.status(502).json({ error: `Discord webhook failed: ${response.status} ${response.statusText}` });
      return;
    }

    await appendActivity({ type: "discord-report-sent", projectId: project.id });
    res.json({ sent: true, payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

await ensureDataFiles();

app.listen(port, "127.0.0.1", () => {
  console.log(`AI Project Orchestrator API listening on http://127.0.0.1:${port}`);
});
