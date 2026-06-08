import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);

function readArg(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

const targetArg = readArg("--target") ?? args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");
const withAgents = args.includes("--with-agents");

if (!targetArg) {
  console.error("Usage: npm run orchestration:install -- --target <project-path> [--with-agents] [--dry-run]");
  process.exit(1);
}

const repoRoot = process.cwd();
const templatesDir = path.join(repoRoot, "docs", "orchestration", "templates");
const targetRoot = path.resolve(targetArg);
const targetOrchestrationDir = path.join(targetRoot, "docs", "orchestration");
const targetTemplatesDir = path.join(targetOrchestrationDir, "templates");

const requiredDirs = [
  targetOrchestrationDir,
  path.join(targetOrchestrationDir, "devlog"),
  path.join(targetOrchestrationDir, "reports"),
  path.join(targetOrchestrationDir, "review_prompts"),
  path.join(targetOrchestrationDir, "review_responses"),
  path.join(targetOrchestrationDir, "evidence"),
  targetTemplatesDir,
];

const fileMappings = [
  ["README_TEMPLATE.md", path.join(targetOrchestrationDir, "README.md")],
  ["PROJECT_BRIEF_TEMPLATE.md", path.join(targetOrchestrationDir, "PROJECT_BRIEF.md")],
  ["STATUS_TEMPLATE.md", path.join(targetOrchestrationDir, "STATUS.md")],
  ["CURRENT_TASK_TEMPLATE.md", path.join(targetOrchestrationDir, "CURRENT_TASK.md")],
  ["NEXT_TASKS_TEMPLATE.md", path.join(targetOrchestrationDir, "NEXT_TASKS.md")],
  ["PROMPT_CONTEXT_TEMPLATE.md", path.join(targetOrchestrationDir, "PROMPT_CONTEXT.md")],
  ["RUNBOOK_TEMPLATE.md", path.join(targetOrchestrationDir, "RUNBOOK.md")],
  ["SCOPE_GUARD_TEMPLATE.md", path.join(targetOrchestrationDir, "SCOPE_GUARD.md")],
  ["DECISION_LOG_TEMPLATE.md", path.join(targetOrchestrationDir, "DECISION_LOG.md")],
];

const templateCopies = [
  "AGENTS_TEMPLATE.md",
  "CURRENT_TASK_TEMPLATE.md",
  "DECISION_LOG_TEMPLATE.md",
  "DEVLOG_DAY_TEMPLATE.md",
  "EXISTING_PROJECT_MIGRATION_PROMPT.md",
  "NEXT_TASKS_TEMPLATE.md",
  "PROJECT_BRIEF_TEMPLATE.md",
  "PROMPT_CONTEXT_TEMPLATE.md",
  "README_TEMPLATE.md",
  "REPORT_TEMPLATE.md",
  "REVIEW_PROMPT_TEMPLATE.md",
  "REVIEW_RESPONSE_TEMPLATE.md",
  "RUNBOOK_TEMPLATE.md",
  "SCOPE_GUARD_TEMPLATE.md",
  "STATUS_TEMPLATE.md",
];

const created = [];
const skipped = [];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  const relativeTarget = path.relative(targetRoot, dirPath) || ".";

  if (await pathExists(dirPath)) {
    skipped.push(`${relativeTarget}\\`);
    return;
  }

  if (dryRun) {
    created.push(`[dry-run] dir ${relativeTarget}`);
    return;
  }

  await fs.mkdir(dirPath, { recursive: true });
  created.push(`dir ${relativeTarget}`);
}

async function copyIfMissing(sourcePath, targetPath) {
  const relativeTarget = path.relative(targetRoot, targetPath);

  if (await pathExists(targetPath)) {
    skipped.push(relativeTarget);
    return;
  }

  if (dryRun) {
    created.push(`[dry-run] file ${relativeTarget}`);
    return;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
  created.push(`file ${relativeTarget}`);
}

async function writeIfMissing(targetPath, content) {
  const relativeTarget = path.relative(targetRoot, targetPath);

  if (await pathExists(targetPath)) {
    skipped.push(relativeTarget);
    return;
  }

  if (dryRun) {
    created.push(`[dry-run] file ${relativeTarget}`);
    return;
  }

  await fs.writeFile(targetPath, content, "utf8");
  created.push(`file ${relativeTarget}`);
}

if (!(await pathExists(targetRoot))) {
  console.error(`Target path does not exist: ${targetRoot}`);
  process.exit(1);
}

for (const dir of requiredDirs) {
  await ensureDir(dir);
}

for (const [templateName, targetPath] of fileMappings) {
  await copyIfMissing(path.join(templatesDir, templateName), targetPath);
}

for (const templateName of templateCopies) {
  await copyIfMissing(path.join(templatesDir, templateName), path.join(targetTemplatesDir, templateName));
}

for (const keepDir of ["devlog", "reports", "review_prompts", "review_responses", "evidence"]) {
  await writeIfMissing(path.join(targetOrchestrationDir, keepDir, ".gitkeep"), "");
}

if (withAgents) {
  await copyIfMissing(path.join(templatesDir, "AGENTS_TEMPLATE.md"), path.join(targetRoot, "AGENTS.md"));
}

console.log("Orchestration install complete.");
console.log(`Target: ${targetRoot}`);
console.log(`Created: ${created.length}`);
for (const item of created) {
  console.log(`  + ${item}`);
}
console.log(`Skipped existing: ${skipped.length}`);
for (const item of skipped) {
  console.log(`  = ${item}`);
}

if (!withAgents) {
  console.log("AGENTS.md was not created. Add --with-agents to scaffold it when the target project does not already have one.");
}
