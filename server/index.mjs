import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
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
const activeCodexRuns = new Map();

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
const codexRunTimeoutMs = 20 * 60 * 1000;

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

const orchestrationInterfacePages = {
  dashboard: {
    label: "index.html",
    paths: ["docs/orchestration/interface/index.html", "docs/orchestration/index.html"],
  },
  command: {
    label: "command.html",
    paths: ["docs/orchestration/interface/command.html", "docs/orchestration/command.html"],
  },
  runbook: {
    label: "runbook.html",
    paths: ["docs/orchestration/interface/runbook.html", "docs/orchestration/runbook.html"],
  },
};

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

function getOrchestrationStatePath(relativePath) {
  const fileName = path.basename(relativePath);

  if (!relativePath.startsWith("docs/orchestration/") || !fileName.endsWith(".md")) {
    return relativePath;
  }

  return path.join("docs", "orchestration", "state", fileName);
}

async function findExistingProjectPath(projectPath, relativePaths) {
  for (const relativePath of relativePaths) {
    const fullPath = path.join(projectPath, relativePath);
    if (await pathExists(fullPath)) {
      return { relativePath: relativePath.replace(/\\/g, "/"), fullPath };
    }
  }

  return null;
}

async function readFirstExistingText(projectPath, relativePaths) {
  const found = await findExistingProjectPath(projectPath, relativePaths);

  if (!found) {
    return { relativePath: relativePaths[0].replace(/\\/g, "/"), fullPath: "", content: "" };
  }

  return {
    ...found,
    content: await fs.readFile(found.fullPath, "utf8").catch(() => ""),
  };
}

async function readOrchestrationInterfaceHtml(projectPath, pageKey) {
  const page = orchestrationInterfacePages[pageKey];
  const result = await readFirstExistingText(projectPath, page.paths);

  return {
    ...result,
    label: page.label,
  };
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

async function listOrchestrationReportFiles(projectPath) {
  const reportsDir = path.resolve(projectPath, "docs", "orchestration", "reports");
  const files = [];

  async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }

      if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".html") {
        continue;
      }

      const relativePath = path.relative(reportsDir, fullPath).replace(/\\/g, "/");

      if (relativePath.toLowerCase() === "index.html" || !relativePath.toLowerCase().endsWith("/index.html")) {
        continue;
      }

      const stats = await fs.stat(fullPath).catch(() => null);

      if (!stats) {
        continue;
      }

      const content = await fs.readFile(fullPath, "utf8").catch(() => "");
      const title =
        content.match(/<title>(.*?)<\/title>/is)?.[1]?.trim() ||
        content.match(/<h1[^>]*>(.*?)<\/h1>/is)?.[1]?.replace(/<[^>]+>/g, "").trim() ||
        entry.name.replace(/\.html$/i, "").replace(/[-_]+/g, " ");

      files.push({
        path: relativePath,
        name: entry.name,
        directory: path.dirname(relativePath) === "." ? "" : path.dirname(relativePath).replace(/\\/g, "/"),
        title,
        modifiedAt: stats.mtime.toISOString(),
        sizeBytes: stats.size,
        isDailyIndex: true,
      });
    }
  }

  await visit(reportsDir);
  return files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
}

function getPreferredDiscordReport(reports) {
  return reports[0] ?? null;
}

function resolveOrchestrationReportPath(projectPath, requestedPath) {
  const reportsDir = path.resolve(projectPath, "docs", "orchestration", "reports");
  const normalizedPath = requestedPath.replace(/\\/g, "/");

  if (!normalizedPath || normalizedPath.includes("\0") || path.isAbsolute(normalizedPath)) {
    throw new Error("invalid report path");
  }

  const fullPath = path.resolve(reportsDir, normalizedPath);

  if (fullPath !== reportsDir && !fullPath.startsWith(`${reportsDir}${path.sep}`)) {
    throw new Error("report path is outside docs/orchestration/reports");
  }

  if (path.extname(fullPath).toLowerCase() !== ".html") {
    throw new Error("only HTML reports can be previewed");
  }

  return fullPath;
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

function createRunId(date = new Date()) {
  const stamp = date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")
    .replace("T", "-");
  const suffix = Math.random().toString(36).slice(2, 7);

  return `${stamp}-${suffix}`;
}

function getCodexRunsDir(projectPath) {
  return path.join(projectPath, "docs", "orchestration", "agent_runs");
}

function getCodexRunDir(projectPath, runId) {
  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) {
    throw new Error("invalid run id");
  }

  return path.join(getCodexRunsDir(projectPath), runId);
}

async function writeCodexRunStatus(runDir, status) {
  await fs.writeFile(path.join(runDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");
}

async function readCodexRunStatus(projectPath, runId) {
  const runDir = getCodexRunDir(projectPath, runId);
  const content = await fs.readFile(path.join(runDir, "status.json"), "utf8");
  return JSON.parse(content);
}

async function reconcileCodexRunStatus(project, status) {
  if (status.status !== "running" || activeCodexRuns.has(`${project.id}:${status.runId}`)) {
    return status;
  }

  const runDir = getCodexRunDir(project.path, status.runId);
  const nextStatus = {
    ...status,
    status: "failed",
    finishedAt: status.finishedAt ?? new Date().toISOString(),
    exitCode: status.exitCode ?? null,
    error: status.error ?? "Codex run is no longer attached to the server process.",
  };

  await writeCodexRunStatus(runDir, nextStatus).catch(() => {});
  return nextStatus;
}

async function readProjectCodexRunStatus(project, runId) {
  const status = await readCodexRunStatus(project.path, runId);
  return reconcileCodexRunStatus(project, status);
}

function buildCodexRunPrompt(project, instruction) {
  const trimmedInstruction = instruction.trim();

  return [
    `${project.name} 자동 Codex 작업 지시`,
    "",
    "사용자 명령:",
    trimmedInstruction || "현재 오케스트레이션 문서를 기준으로 다음 작업을 진행해줘.",
    "",
    "작업 시작 전 읽을 것:",
    "- AGENTS.md",
    "- docs/orchestration/README.md",
    "- docs/orchestration/STATUS.md 또는 docs/orchestration/state/STATUS.md",
    "- docs/orchestration/CURRENT_TASK.md 또는 docs/orchestration/state/CURRENT_TASK.md",
    "- docs/orchestration/NEXT_TASKS.md 또는 docs/orchestration/state/NEXT_TASKS.md",
    "- docs/orchestration/PROMPT_CONTEXT.md 또는 docs/orchestration/state/PROMPT_CONTEXT.md",
    "- docs/orchestration/SCOPE_GUARD.md 또는 docs/orchestration/state/SCOPE_GUARD.md",
    "",
    "작업 규칙:",
    "- 필요한 변경만 작게 진행해.",
    "- destructive Git/filesystem 명령은 실행하지 마.",
    "- 사용자 변경을 되돌리지 마.",
    "- 검증 가능한 작업은 검증하고, 실패하면 원인과 다음 조치를 남겨.",
    "- 의미 있는 작업이 끝나면 state 문서, devlog, reports/YYYYMMDD/index.html을 갱신해.",
    "- HTML 인터페이스가 있는 프로젝트는 interface/index.html, interface/command.html, interface/runbook.html, reports/index.html 갱신 필요 여부를 확인해.",
    "",
    "완료 보고:",
    "- 변경 파일",
    "- 수행한 작업",
    "- 검증 결과",
    "- 남은 위험 또는 다음 작업",
  ].join("\n");
}

async function findNewestExecutable(candidates) {
  const existing = [];

  for (const candidate of candidates) {
    const stats = await fs.stat(candidate).catch(() => null);
    if (stats?.isFile()) {
      existing.push({ candidate, modifiedAt: stats.mtimeMs });
    }
  }

  return existing.sort((a, b) => b.modifiedAt - a.modifiedAt)[0]?.candidate ?? "";
}

async function findCodexInDirectory(baseDir, depth = 2) {
  const executableNames = process.platform === "win32" ? new Set(["codex.exe", "codex.cmd", "codex.bat"]) : new Set(["codex"]);
  const candidates = [];

  async function visit(directory, remainingDepth) {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isFile() && executableNames.has(entry.name.toLowerCase())) {
        candidates.push(fullPath);
        continue;
      }

      if (entry.isDirectory() && remainingDepth > 0) {
        await visit(fullPath, remainingDepth - 1);
      }
    }
  }

  await visit(baseDir, depth);
  return findNewestExecutable(candidates);
}

async function resolveCodexExecutable() {
  const explicitPath = process.env.CODEX_CLI_PATH;
  if (explicitPath && (await pathExists(explicitPath))) {
    return explicitPath;
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || "", "AppData", "Local");
    const codexBin = path.join(localAppData, "OpenAI", "Codex", "bin");
    const codexFromLocalAppData = await findCodexInDirectory(codexBin, 2);

    if (codexFromLocalAppData) {
      return codexFromLocalAppData;
    }

    const vscodeExtensions = path.join(process.env.USERPROFILE || "", ".vscode", "extensions");
    const extensionEntries = await fs.readdir(vscodeExtensions, { withFileTypes: true }).catch(() => []);
    const extensionCandidates = extensionEntries
      .filter((entry) => entry.isDirectory() && entry.name.toLowerCase().startsWith("openai.chatgpt-"))
      .map((entry) => path.join(vscodeExtensions, entry.name, "bin", "windows-x86_64", "codex.exe"));
    const codexFromExtension = await findNewestExecutable(extensionCandidates);

    if (codexFromExtension) {
      return codexFromExtension;
    }
  }

  return "codex";
}

function buildRunScript(projectPath, runDir, codexExecutable = "codex") {
  const promptPath = path.join(runDir, "prompt.md");
  const outputPath = path.join(runDir, "output.log");
  const lastMessagePath = path.join(runDir, "last_message.md");

  return [
    "$ErrorActionPreference = 'Stop'",
    `$projectPath = ${JSON.stringify(projectPath)}`,
    `$promptPath = ${JSON.stringify(promptPath)}`,
    `$outputPath = ${JSON.stringify(outputPath)}`,
    `$lastMessagePath = ${JSON.stringify(lastMessagePath)}`,
    `$codexPath = ${JSON.stringify(codexExecutable)}`,
    "Get-Content -Raw -LiteralPath $promptPath | & $codexPath exec -c 'approval_policy=\"never\"' --cd $projectPath --sandbox workspace-write --output-last-message $lastMessagePath - 2>&1 | Tee-Object -FilePath $outputPath",
  ].join("\r\n");
}

function buildOrchestrationDashboard(targetPath) {
  const scriptPath = path.join(rootDir, "scripts", "build-orchestration-dashboard.mjs");

  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [scriptPath, "--target", targetPath],
      { cwd: rootDir, windowsHide: true, timeout: 30000 },
      (error, stdout, stderr) => {
        const result = {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        };

        if (error) {
          reject(Object.assign(error, result));
          return;
        }

        resolve(result);
      },
    );
  });
}

function installDevDocsPlugin(targetPath, { dryRun = false, withAgents = false } = {}) {
  const scriptPath = path.join(rootDir, "scripts", "install-orchestration.mjs");
  const args = [scriptPath, "--target", targetPath];

  if (dryRun) {
    args.push("--dry-run");
  }

  if (withAgents) {
    args.push("--with-agents");
  }

  return new Promise((resolve, reject) => {
    execFile(process.execPath, args, { cwd: rootDir, windowsHide: true, timeout: 30000 }, (error, stdout, stderr) => {
      const result = {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };

      if (error) {
        reject(Object.assign(error, result));
        return;
      }

      resolve(result);
    });
  });
}

async function createMigrationPromptFile(projectPath, { overwrite = false, dryRun = false } = {}) {
  const templatePath = path.join(rootDir, "docs", "orchestration", "templates", "EXISTING_PROJECT_MIGRATION_PROMPT.md");
  const targetDir = path.join(projectPath, "docs", "orchestration");
  const targetPath = path.join(targetDir, "MIGRATION_PROMPT.md");
  const exists = await pathExists(targetPath);
  const relativePath = path.relative(projectPath, targetPath).replace(/\\/g, "/");

  if (dryRun) {
    return {
      created: !exists || overwrite,
      dryRun: true,
      path: relativePath,
      message: exists && !overwrite ? "MIGRATION_PROMPT.md already exists" : "MIGRATION_PROMPT.md would be written",
    };
  }

  if (exists && !overwrite) {
    return {
      created: false,
      path: relativePath,
      message: "MIGRATION_PROMPT.md already exists",
    };
  }

  const template = await fs.readFile(templatePath, "utf8");
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, template, "utf8");

  return {
    created: true,
    path: relativePath,
  };
}

async function startCodexRun(project, instruction) {
  if (!(await pathExists(project.path))) {
    throw new Error("project path does not exist");
  }

  const runId = createRunId();
  const runsDir = getCodexRunsDir(project.path);
  const runDir = getCodexRunDir(project.path, runId);
  const startedAt = new Date().toISOString();
  const prompt = buildCodexRunPrompt(project, instruction);
  const lastMessagePath = path.join(runDir, "last_message.md");
  const codexExecutable = await resolveCodexExecutable();
  const command = [
    codexExecutable,
    "exec",
    "-c",
    'approval_policy="never"',
    "--cd",
    project.path,
    "--sandbox",
    "workspace-write",
    "--output-last-message",
    lastMessagePath,
    "-",
  ];

  await fs.mkdir(runsDir, { recursive: true });
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(path.join(runDir, "prompt.md"), prompt, "utf8");
  await fs.writeFile(path.join(runDir, "run.ps1"), buildRunScript(project.path, runDir, codexExecutable), "utf8");
  await fs.writeFile(path.join(runDir, "output.log"), "", "utf8");
  await fs.writeFile(path.join(runDir, "stderr.log"), "", "utf8");

  const status = {
    runId,
    projectId: project.id,
    projectName: project.name,
    status: "running",
    startedAt,
    finishedAt: null,
    exitCode: null,
    runDir,
    promptPath: path.join(runDir, "prompt.md"),
    outputPath: path.join(runDir, "output.log"),
    lastMessagePath,
    command: command.join(" "),
  };

  await writeCodexRunStatus(runDir, status);

  const child = spawn(command[0], command.slice(1), {
    cwd: project.path,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let settled = false;

  const finishRun = (nextStatus) => {
    if (settled) {
      return;
    }

    settled = true;
    activeCodexRuns.delete(`${project.id}:${runId}`);
    void writeCodexRunStatus(runDir, nextStatus);
  };

  const timeout = setTimeout(() => {
    const finishedAt = new Date().toISOString();
    const nextStatus = {
      ...status,
      status: "failed",
      finishedAt,
      exitCode: null,
      error: `Codex run timed out after ${Math.round(codexRunTimeoutMs / 60000)} minutes`,
    };
    child.kill();
    finishRun(nextStatus);
  }, codexRunTimeoutMs);

  activeCodexRuns.set(`${project.id}:${runId}`, child);

  child.stdin.write(prompt);
  child.stdin.end();

  child.stdout.on("data", (chunk) => {
    void fs.appendFile(path.join(runDir, "output.log"), chunk);
  });

  child.stderr.on("data", (chunk) => {
    void fs.appendFile(path.join(runDir, "stderr.log"), chunk);
    void fs.appendFile(path.join(runDir, "output.log"), chunk);
  });

  child.on("error", (error) => {
    const finishedAt = new Date().toISOString();
    const nextStatus = {
      ...status,
      status: "failed",
      finishedAt,
      exitCode: null,
      error: error.message,
    };
    clearTimeout(timeout);
    finishRun(nextStatus);
  });

  child.on("close", (exitCode) => {
    clearTimeout(timeout);
    const finishedAt = new Date().toISOString();
    const nextStatus = {
      ...status,
      status: exitCode === 0 ? "complete" : "failed",
      finishedAt,
      exitCode,
    };
    finishRun(nextStatus);
  });

  await appendActivity({ type: "codex-run-started", projectId: project.id, runId });
  return status;
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
  const paths =
    entry.type === "file" && entry.path.startsWith("docs/orchestration/") && entry.path.endsWith(".md")
      ? [entry.path, getOrchestrationStatePath(entry.path)]
      : [entry.path];

  for (const relativePath of paths) {
    const fullPath = path.join(projectPath, relativePath);
    const stats = await fs.stat(fullPath).catch(() => null);

    if (!stats) {
      continue;
    }

    if (entry.type === "directory" ? stats.isDirectory() : stats.isFile()) {
      return true;
    }
  }

  return false;
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
  const result = await readFirstExistingText(projectPath, [doc.path, getOrchestrationStatePath(doc.path)]);
  const content = result.content;

  return {
    key: doc.key,
    label: doc.label,
    path: result.relativePath,
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

function stripHtml(value) {
  return value
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h1|h2|h3|div|section)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractHtmlTitle(html, fallback) {
  return (
    stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ||
    stripHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") ||
    fallback
  );
}

function extractHtmlSection(html, headingPatterns) {
  const headings = [...html.matchAll(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/gi)];

  for (let index = 0; index < headings.length; index += 1) {
    const headingText = stripHtml(headings[index][1]);
    if (!headingPatterns.some((pattern) => pattern.test(headingText))) {
      continue;
    }

    const start = headings[index].index + headings[index][0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : html.length;
    return stripHtml(html.slice(start, end));
  }

  return "";
}

function extractDiscordReportFromHtml(html, fallbackTitle) {
  return {
    title: extractHtmlTitle(html, fallbackTitle),
    work:
      extractHtmlSection(html, [/^어떤 작업/u, /오늘 바뀐 것/u, /작업$/u]) ||
      extractHtmlSection(html, [/현재 빌드 상태/u, /현재 상태/u]),
    progress:
      extractHtmlSection(html, [/^진행 내용/u, /결정한 것/u, /문제 또는 리스크/u]) ||
      extractHtmlSection(html, [/오늘 바뀐 것/u]),
    result:
      extractHtmlSection(html, [/^결과/u, /테스트 결과/u, /검증/u]) ||
      extractHtmlSection(html, [/현재 빌드 상태/u]),
    nextTask: extractHtmlSection(html, [/다음 Codex 작업/u, /^다음/u, /다음 작업/u]),
  };
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

function buildReportDiscordPayload(project, report, username) {
  const toValue = (value, fallback) => truncate(value || fallback, 1024);

  return {
    username,
    embeds: [
      {
        title: `${project.name}: ${report.title}`,
        description: `보고서: ${report.path}`,
        color: 2050893,
        fields: [
          {
            name: "어떤 작업",
            value: toValue(report.work, "보고서에서 작업 요약을 찾지 못했습니다."),
            inline: false,
          },
          {
            name: "진행 내용",
            value: toValue(report.progress, "보고서에서 진행 내용을 찾지 못했습니다."),
            inline: false,
          },
          {
            name: "결과",
            value: toValue(report.result, "보고서에서 결과를 찾지 못했습니다."),
            inline: false,
          },
          {
            name: "다음 작업",
            value: toValue(report.nextTask, "다음 작업이 기록되지 않았습니다."),
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

async function getProjectForDiscordSubmission(body, routeProjectId = "") {
  const projects = await readProjects();
  const requestedId = routeProjectId || body?.projectId || body?.id || "";
  const requestedName = body?.projectName || body?.name || "";
  const requestedPath = body?.projectPath || body?.path || "";
  const project = projects.find(
    (item) =>
      (requestedId && item.id === requestedId) ||
      (requestedName && item.name === requestedName) ||
      (requestedPath && path.resolve(item.path).toLowerCase() === path.resolve(requestedPath).toLowerCase()),
  );

  if (!project) {
    throw Object.assign(new Error("project not found"), { statusCode: 404 });
  }

  if (!(await pathExists(project.path))) {
    throw Object.assign(new Error("project path does not exist"), { statusCode: 400 });
  }

  return project;
}

async function buildDiscordDispatch(project, body) {
  const env = await readEnv();
  const username = env.DISCORD_REPORT_USERNAME || "AI Project Orchestrator";
  const attachHtml = body?.attachHtml !== false;
  const directReport = body?.report && typeof body.report === "object" ? body.report : null;

  if (directReport) {
    const report = {
      title: directReport.title || body.title || "작업 완료 보고",
      path: body.reportPath || directReport.path || "submitted-json",
      work: directReport.work || directReport.what || directReport.summary || "",
      progress: directReport.progress || directReport.details || "",
      result: directReport.result || directReport.verification || "",
      nextTask: directReport.nextTask || directReport.next || "",
    };
    return {
      env,
      payload: buildReportDiscordPayload(project, report, username),
      attachment: null,
      attachHtml,
    };
  }

  if (typeof body?.reportHtml === "string" && body.reportHtml.trim()) {
    const report = {
      ...extractDiscordReportFromHtml(body.reportHtml, body.title || "작업 완료 보고"),
      path: body.reportPath || "submitted-html",
    };
    const fileName = body.fileName || body.attachmentName || "orchestration-report.html";

    return {
      env,
      payload: buildReportDiscordPayload(project, report, username),
      attachment: {
        name: path.basename(fileName),
        reportPath: report.path,
        html: body.reportHtml,
      },
      attachHtml,
    };
  }

  const reports = await listOrchestrationReportFiles(project.path);
  const requestedReportPath = typeof body?.reportPath === "string" ? body.reportPath : "";
  const selectedReport = requestedReportPath ? { path: requestedReportPath, title: path.basename(requestedReportPath) } : getPreferredDiscordReport(reports);
  const dashboard = await collectOrchestrationDashboard(project.path);
  let payload = buildOrchestrationDiscordPayload(project, dashboard, username);
  let attachment = null;

  if (selectedReport) {
    const reportPath = resolveOrchestrationReportPath(project.path, selectedReport.path);
    const html = await fs.readFile(reportPath, "utf8");
    const extractedReport = {
      ...extractDiscordReportFromHtml(html, selectedReport.title),
      path: selectedReport.path,
    };

    payload = buildReportDiscordPayload(project, extractedReport, username);
    attachment = {
      path: reportPath,
      name: path.basename(selectedReport.path),
      reportPath: selectedReport.path,
    };
  }

  return { env, payload, attachment, attachHtml };
}

async function sendDiscordDispatch({ env, payload, attachment, attachHtml }) {
  if (!env.DISCORD_WEBHOOK_URL) {
    throw Object.assign(new Error("DISCORD_WEBHOOK_URL is missing in orchestrator .env"), { statusCode: 400 });
  }

  const response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw Object.assign(new Error(`Discord webhook failed: ${response.status} ${response.statusText}`), {
      statusCode: 502,
    });
  }

  if (!attachHtml || !attachment) {
    return { attachmentSent: false };
  }

  const formData = new FormData();
  const reportBytes = attachment.html ?? (await fs.readFile(attachment.path));
  const reportBlob = new Blob([reportBytes], { type: "text/html" });

  formData.append("payload_json", JSON.stringify({ content: "상세 HTML 보고서 파일입니다." }));
  formData.append("files[0]", reportBlob, attachment.name);

  const attachmentResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    body: formData,
  });

  if (!attachmentResponse.ok) {
    throw Object.assign(
      new Error(`Discord attachment failed: ${attachmentResponse.status} ${attachmentResponse.statusText}`),
      {
        statusCode: 502,
      },
    );
  }

  return { attachmentSent: true };
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

    const dashboard = await readOrchestrationInterfaceHtml(project.path, "dashboard");
    const html = dashboard.content;

    if (!html) {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><html><body><p>docs/orchestration/interface/index.html이 아직 생성되지 않았습니다.</p></body></html>",
        );
      return;
    }

    res.type("html").send(html);
  } catch (error) {
    res.status(500).type("html").send(error.message);
  }
});

app.post("/api/projects/:id/orchestration-dashboard", async (req, res) => {
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

    if (!(await pathExists(path.join(project.path, "docs", "orchestration")))) {
      res.status(400).json({ error: "docs/orchestration does not exist" });
      return;
    }

    const result = await buildOrchestrationDashboard(project.path);
    await appendActivity({ type: "orchestration-dashboard-built", projectId: project.id });
    res.json({ built: true, ...result });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    });
  }
});

app.post("/api/projects/:id/dev-doc-plugin/install", async (req, res) => {
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

    const installResult = await installDevDocsPlugin(project.path, {
      dryRun: Boolean(req.body?.dryRun),
      withAgents: Boolean(req.body?.withAgents),
    });
    let dashboardResult = null;

    if (!req.body?.dryRun && (await pathExists(path.join(project.path, "docs", "orchestration")))) {
      dashboardResult = await buildOrchestrationDashboard(project.path).catch((error) => ({
        error: error.message,
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? "",
      }));
    }

    await appendActivity({ type: "dev-doc-plugin-installed", projectId: project.id, dryRun: Boolean(req.body?.dryRun) });
    res.json({ installed: !req.body?.dryRun, dryRun: Boolean(req.body?.dryRun), install: installResult, dashboard: dashboardResult });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    });
  }
});

app.post("/api/projects/:id/dev-doc-plugin/migration-prompt", async (req, res) => {
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

    const result = await createMigrationPromptFile(project.path, {
      overwrite: Boolean(req.body?.overwrite),
      dryRun: Boolean(req.body?.dryRun),
    });
    await appendActivity({ type: "dev-doc-plugin-migration-prompt-created", projectId: project.id, created: result.created });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    const command = await readOrchestrationInterfaceHtml(project.path, "command");
    const html = command.content;

    if (!html) {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><html><body><p>docs/orchestration/interface/command.html이 아직 생성되지 않았습니다.</p></body></html>",
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

    const runbook = await readOrchestrationInterfaceHtml(project.path, "runbook");
    const html = runbook.content;

    if (!html) {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><html><body><p>docs/orchestration/interface/runbook.html이 아직 생성되지 않았습니다.</p></body></html>",
        );
      return;
    }

    res.type("html").send(html);
  } catch (error) {
    res.status(500).type("html").send(error.message);
  }
});

app.get("/api/projects/:id/orchestration-reports", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    res.json(await listOrchestrationReportFiles(project.path));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects/:id/orchestration-report", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).type("html").send("project not found");
      return;
    }

    const requestedPath = typeof req.query.path === "string" ? req.query.path : "";
    const reportPath = resolveOrchestrationReportPath(project.path, requestedPath);
    const html = await fs.readFile(reportPath, "utf8").catch(() => "");

    if (!html) {
      res.status(404).type("html").send("report not found");
      return;
    }

    res.type("html").send(html);
  } catch (error) {
    res.status(400).type("html").send(error.message);
  }
});

app.post("/api/projects/:id/codex-run", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    const instruction = typeof req.body?.instruction === "string" ? req.body.instruction : "";

    if (!instruction.trim()) {
      res.status(400).json({ error: "instruction is required" });
      return;
    }

    res.status(202).json(await startCodexRun(project, instruction));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects/:id/codex-runs", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    const runsDir = getCodexRunsDir(project.path);
    const entries = await fs.readdir(runsDir, { withFileTypes: true }).catch(() => []);
    const runs = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const status = await readProjectCodexRunStatus(project, entry.name).catch(() => null);
      if (status) {
        runs.push(status);
      }
    }

    runs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
    res.json(runs.slice(0, 12));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects/:id/codex-runs/:runId", async (req, res) => {
  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      res.status(404).json({ error: "project not found" });
      return;
    }

    const status = await readProjectCodexRunStatus(project, req.params.runId);
    const output = await fs.readFile(path.join(getCodexRunDir(project.path, req.params.runId), "output.log"), "utf8").catch(() => "");
    const lastMessage = await fs
      .readFile(path.join(getCodexRunDir(project.path, req.params.runId), "last_message.md"), "utf8")
      .catch(() => "");

    res.json({
      ...status,
      output: output.slice(-12000),
      lastMessage,
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
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
    const project = await getProjectForDiscordSubmission(req.body, req.params.id);
    const dispatch = await buildDiscordDispatch(project, req.body);

    if (req.body?.dryRun) {
      res.json({
        dryRun: true,
        payload: dispatch.payload,
        attachment: dispatch.attachment
          ? {
              name: dispatch.attachment.name,
              path: dispatch.attachment.reportPath,
            }
          : null,
      });
      return;
    }

    const sendResult = await sendDiscordDispatch(dispatch);

    await appendActivity({ type: "discord-report-sent", projectId: project.id });
    res.json({
      sent: true,
      payload: dispatch.payload,
      attachment: dispatch.attachment
        ? {
            name: dispatch.attachment.name,
            path: dispatch.attachment.reportPath,
            sent: sendResult.attachmentSent,
          }
        : null,
    });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message });
  }
});

app.post("/api/orchestration/discord-report", async (req, res) => {
  try {
    const project = await getProjectForDiscordSubmission(req.body);
    const dispatch = await buildDiscordDispatch(project, req.body);

    if (req.body?.dryRun) {
      res.json({
        dryRun: true,
        projectId: project.id,
        payload: dispatch.payload,
        attachment: dispatch.attachment
          ? {
              name: dispatch.attachment.name,
              path: dispatch.attachment.reportPath,
            }
          : null,
      });
      return;
    }

    const sendResult = await sendDiscordDispatch(dispatch);
    await appendActivity({ type: "discord-report-ingested", projectId: project.id });
    res.status(202).json({
      accepted: true,
      sent: true,
      projectId: project.id,
      attachment: dispatch.attachment
        ? {
            name: dispatch.attachment.name,
            path: dispatch.attachment.reportPath,
            sent: sendResult.attachmentSent,
          }
        : null,
    });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message });
  }
});

await ensureDataFiles();

app.listen(port, "127.0.0.1", () => {
  console.log(`AI Project Orchestrator API listening on http://127.0.0.1:${port}`);
});
