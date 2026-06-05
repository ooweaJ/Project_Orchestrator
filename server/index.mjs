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

const maxScannedFiles = 2500;
const maxTodoFileBytes = 300000;
const largeFileThresholdBytes = 10 * 1024 * 1024;

async function ensureDataFiles() {
  await fs.mkdir(snapshotsDir, { recursive: true });
  try {
    await fs.access(projectsFile);
  } catch {
    await fs.writeFile(projectsFile, "[]\n", "utf8");
  }
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
      message: "Registered project path does not exist.",
    });
    return risks;
  }

  if (!git.isRepo) {
    risks.push({
      level: "medium",
      type: "not-git-repo",
      message: "Project is not a Git repository.",
    });
  }

  if (git.dirty) {
    risks.push({
      level: "medium",
      type: "dirty-tree",
      message: "Working tree has uncommitted changes.",
    });
  }

  if (git.untracked.length > 0) {
    risks.push({
      level: "medium",
      type: "untracked-files",
      message: "Project has untracked files that may need review.",
    });
  }

  if (git.isRepo && !git.hasUpstream) {
    risks.push({
      level: "medium",
      type: "no-upstream",
      message: "Current branch has no upstream remote.",
    });
  }

  if (git.ahead > 0) {
    risks.push({
      level: "medium",
      type: "ahead-of-remote",
      message: "Local branch has commits that are not pushed.",
    });
  }

  if (git.behind > 0) {
    risks.push({
      level: "high",
      type: "behind-remote",
      message: "Local branch is behind its upstream.",
    });
  }

  if (!files.hasAgentsMd) {
    risks.push({
      level: "low",
      type: "missing-agents",
      message: "Project has no AGENTS.md guidance file.",
    });
  }

  if (!files.hasReadme) {
    risks.push({
      level: "low",
      type: "missing-readme",
      message: "Project has no README.md.",
    });
  }

  if (files.todoCount > 0) {
    risks.push({
      level: "low",
      type: "todo-comments",
      message: `${files.todoCount} TODO/FIXME/BUG comments need review.`,
    });
  }

  if (files.largeFiles.length > 0) {
    risks.push({
      level: "high",
      type: "large-files",
      message: `${files.largeFiles.length} large files were found. Check whether Git LFS is needed.`,
    });
  }

  if (project.type === "unreal" && !files.hasGitAttributes) {
    risks.push({
      level: "high",
      type: "git-lfs-candidate",
      message: "Unreal projects usually need .gitattributes with Git LFS patterns for .uasset, .umap, and binaries.",
    });
  }

  if (project.type === "unity" && !files.hasGitAttributes) {
    risks.push({
      level: "high",
      type: "git-lfs-candidate",
      message: "Unity projects often need .gitattributes with Git LFS patterns for assets, scenes, prefabs, and binaries.",
    });
  }

  if (files.truncated) {
    risks.push({
      level: "medium",
      type: "scan-truncated",
      message: `File scan stopped after ${files.scannedFiles} files to avoid scanning too much.`,
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

function generatePrompt(project, snapshot, kind = "diagnose") {
  const dirtyLine = snapshot.git.dirty
    ? `- working tree has ${snapshot.git.modified.length} modified, ${snapshot.git.staged.length} staged, and ${snapshot.git.untracked.length} untracked files`
    : "- working tree appears clean";

  const base = [
    `${project.name} 프로젝트 상태를 먼저 확인해줘.`,
    "",
    "현재 신호:",
    `- path: ${project.path}`,
    `- type: ${snapshot.type}`,
    `- branch: ${snapshot.git.branch || "unknown"}`,
    dirtyLine,
    `- todo/fixme/bug comments: ${snapshot.files.todoCount}`,
    `- large files: ${snapshot.files.largeFiles.length}`,
    `- recent files: ${snapshot.files.recentFiles.map((file) => file.path).join(", ") || "none"}`,
    `- risk level: ${snapshot.riskLevel}`,
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

  actions.push({
    kind: "codex-prompt",
    label: "Diagnose project",
    prompt: generatePrompt(project, snapshot, "diagnose"),
  });

  if (snapshot.git.dirty || snapshot.git.untracked.length > 0) {
    actions.push({
      kind: "codex-prompt",
      label: "Prepare commit",
      prompt: generatePrompt(project, snapshot, "commit"),
    });
  }

  if (!snapshot.files.hasAgentsMd || !snapshot.files.hasReadme || !snapshot.files.hasDocsStatus) {
    actions.push({
      kind: "codex-prompt",
      label: "Update docs",
      prompt: generatePrompt(project, snapshot, "docs"),
    });
  }

  return actions;
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
    };
    const risks = scoreRisks(project, blankGit, files, false);
    const snapshot = {
      ...project,
      exists,
      type: project.type ?? "unknown",
      git: blankGit,
      files,
      risks,
      riskLevel: getRiskLevel(risks),
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
    ...fileSignals,
  };

  const normalizedProject = { ...project, type };
  const risks = scoreRisks(normalizedProject, git, files, exists);
  const snapshot = {
    ...normalizedProject,
    exists,
    git,
    files,
    risks,
    riskLevel: getRiskLevel(risks),
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

await ensureDataFiles();

app.listen(port, "127.0.0.1", () => {
  console.log(`AI Project Orchestrator API listening on http://127.0.0.1:${port}`);
});
