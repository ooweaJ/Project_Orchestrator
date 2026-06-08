import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const rootDir = process.cwd();
const projectsFile = path.join(rootDir, "data", "projects.json");

function readArg(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function markdownToHtml(markdown) {
  const lines = markdown.trim().split(/\r?\n/);
  const html = [];
  let listOpen = false;

  function closeList() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h4>${inlineMarkdown(line.slice(4))}</h4>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h3>${inlineMarkdown(line.slice(3))}</h3>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/u) ?? line.match(/^\d+\.\s+(.*)$/u);
    if (listMatch) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(listMatch[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

function firstHeading(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/mu)?.[1]?.trim();
  return heading || fallback;
}

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase());

  if (startIndex === -1) {
    return "";
  }

  const section = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (line.startsWith("## ")) {
      break;
    }
    section.push(line);
  }

  return section.join("\n").trim();
}

function firstContentLine(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("- ")) ?? "";
}

function normalizeSnippet(markdown, fallback = "아직 기록된 내용이 없습니다.") {
  const content = markdown.trim();
  if (!content) {
    return fallback;
  }
  return markdownToHtml(content.length > 2600 ? `${content.slice(0, 2599)}…` : content);
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8").catch(() => "");
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listRecentMarkdown(directory, limit = 5) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    const stats = await fs.stat(filePath).catch(() => null);
    if (!stats) {
      continue;
    }

    const content = await readText(filePath);
    files.push({
      name: entry.name,
      title: firstHeading(content, entry.name),
      modifiedAt: stats.mtime,
    });
  }

  return files.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()).slice(0, limit);
}

function renderRecentList(items, relativeDir, emptyText) {
  if (items.length === 0) {
    return `<p class="muted">${emptyText}</p>`;
  }

  return `<ul>${items
    .map(
      (item) =>
        `<li><a href="./${relativeDir}/${encodeURIComponent(item.name)}">${escapeHtml(item.title)}</a><small>${item.modifiedAt.toLocaleString("ko-KR")}</small></li>`,
    )
    .join("")}</ul>`;
}

function renderDocCard(title, fileName, markdown, fallback) {
  return `<section class="card">
    <div class="cardTitle">
      <h2>${escapeHtml(title)}</h2>
      <a href="./${fileName}">${fileName}</a>
    </div>
    <div class="markdown">${normalizeSnippet(markdown, fallback)}</div>
  </section>`;
}

function renderCommandList(runbook) {
  const codeBlocks = [...runbook.matchAll(/```(?:\w+)?\s*([\s\S]*?)```/gu)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .slice(0, 6);

  if (codeBlocks.length === 0) {
    return '<p class="muted">RUNBOOK.md에 명령이 아직 정리되지 않았습니다.</p>';
  }

  return codeBlocks.map((command) => `<pre><code>${escapeHtml(command)}</code></pre>`).join("");
}

async function buildDashboard(targetRoot) {
  const orchestrationDir = path.join(targetRoot, "docs", "orchestration");
  const docs = {
    projectBrief: await readText(path.join(orchestrationDir, "PROJECT_BRIEF.md")),
    status: await readText(path.join(orchestrationDir, "STATUS.md")),
    currentTask: await readText(path.join(orchestrationDir, "CURRENT_TASK.md")),
    nextTasks: await readText(path.join(orchestrationDir, "NEXT_TASKS.md")),
    decisionLog: await readText(path.join(orchestrationDir, "DECISION_LOG.md")),
    runbook: await readText(path.join(orchestrationDir, "RUNBOOK.md")),
  };
  const devlog = await listRecentMarkdown(path.join(orchestrationDir, "devlog"));
  const reports = await listRecentMarkdown(path.join(orchestrationDir, "reports"));
  const projectName = firstContentLine(extractSection(docs.projectBrief, "Project")) || path.basename(targetRoot);
  const phase = extractSection(docs.status, "Current State") || extractSection(docs.status, "현재 상태");
  const blockers = extractSection(docs.status, "Blockers") || extractSection(docs.status, "블로커");
  const verification = extractSection(docs.status, "Latest Verification") || extractSection(docs.status, "최신 검증");
  const outputPath = path.join(orchestrationDir, "index.html");

  await fs.mkdir(orchestrationDir, { recursive: true });
  await fs.writeFile(
    outputPath,
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(projectName)} 오케스트레이션</title>
    <style>
      :root {
        color: #17211c;
        background: #f5f7f1;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { width: min(1180px, 100%); margin: 0 auto; padding: 32px 22px; }
      header { margin-bottom: 18px; }
      .eyebrow { margin: 0 0 8px; color: #60706a; font-size: 13px; font-weight: 900; }
      h1 { margin: 0; font-size: clamp(28px, 5vw, 46px); line-height: 1.05; }
      h2, h3, h4, p { margin-top: 0; }
      .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
      .metric, .card { border: 1px solid #d9e1d7; border-radius: 8px; background: #fff; }
      .metric { padding: 16px; }
      .metric span { display: block; color: #697873; font-size: 13px; font-weight: 900; }
      .metric strong { display: block; margin-top: 8px; font-size: 20px; line-height: 1.35; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .wide { grid-column: 1 / -1; }
      .card { padding: 18px; min-width: 0; }
      .cardTitle { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .cardTitle h2 { margin: 0; font-size: 18px; }
      a { color: #1f6b4d; font-weight: 900; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .markdown { color: #26342f; font-size: 14px; line-height: 1.65; }
      .markdown h3 { margin: 14px 0 8px; color: #1f6b4d; font-size: 15px; }
      .markdown h4 { margin: 12px 0 6px; font-size: 14px; }
      .markdown p { margin: 0 0 10px; }
      .markdown ul { margin: 0 0 10px; padding-left: 20px; }
      .markdown li { margin-bottom: 4px; }
      code { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
      pre { overflow: auto; margin: 0 0 10px; padding: 12px; border-radius: 8px; background: #f2f5ef; font-size: 13px; line-height: 1.55; }
      .listCard ul { display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; }
      .listCard li { display: grid; gap: 3px; }
      small, .muted { color: #697873; font-size: 13px; }
      footer { margin-top: 20px; color: #697873; font-size: 13px; }
      @media (max-width: 760px) {
        .summary, .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">오케스트레이션 대시보드</p>
        <h1>${escapeHtml(projectName)}</h1>
      </header>

      <section class="summary">
        <div class="metric"><span>현재 단계</span><strong>${escapeHtml(firstHeading(docs.currentTask, "진행 중"))}</strong></div>
        <div class="metric"><span>최신 검증</span><strong>${verification ? escapeHtml(verification.split(/\r?\n/).find(Boolean) ?? "기록 없음") : "기록 없음"}</strong></div>
        <div class="metric"><span>현재 blocker</span><strong>${blockers ? escapeHtml(blockers.split(/\r?\n/).find(Boolean) ?? "없음") : "없음"}</strong></div>
      </section>

      <div class="grid">
        ${renderDocCard("현재 프로젝트 상태", "STATUS.md", docs.status, "STATUS.md가 아직 작성되지 않았습니다.")}
        ${renderDocCard("이번 작업", "CURRENT_TASK.md", docs.currentTask, "CURRENT_TASK.md가 아직 작성되지 않았습니다.")}
        ${renderDocCard("다음 작업 5개", "NEXT_TASKS.md", docs.nextTasks, "NEXT_TASKS.md가 아직 작성되지 않았습니다.")}
        ${renderDocCard("최근 결정", "DECISION_LOG.md", docs.decisionLog, "DECISION_LOG.md가 아직 작성되지 않았습니다.")}
        <section class="card listCard">
          <div class="cardTitle"><h2>최근 devlog</h2><a href="./devlog/">devlog/</a></div>
          ${renderRecentList(devlog, "devlog", "아직 devlog가 없습니다.")}
        </section>
        <section class="card listCard">
          <div class="cardTitle"><h2>최근 report</h2><a href="./reports/">reports/</a></div>
          ${renderRecentList(reports, "reports", "아직 report가 없습니다.")}
        </section>
        <section class="card wide">
          <div class="cardTitle"><h2>자주 쓰는 명령</h2><a href="./RUNBOOK.md">RUNBOOK.md</a></div>
          ${renderCommandList(docs.runbook)}
        </section>
        <section class="card wide">
          <div class="cardTitle"><h2>관련 문서 링크</h2><span class="muted">Markdown 원본</span></div>
          <div class="markdown">
            <ul>
              <li><a href="./PROJECT_BRIEF.md">PROJECT_BRIEF.md</a></li>
              <li><a href="./STATUS.md">STATUS.md</a></li>
              <li><a href="./CURRENT_TASK.md">CURRENT_TASK.md</a></li>
              <li><a href="./NEXT_TASKS.md">NEXT_TASKS.md</a></li>
              <li><a href="./PROMPT_CONTEXT.md">PROMPT_CONTEXT.md</a></li>
              <li><a href="./RUNBOOK.md">RUNBOOK.md</a></li>
              <li><a href="./SCOPE_GUARD.md">SCOPE_GUARD.md</a></li>
              <li><a href="./DECISION_LOG.md">DECISION_LOG.md</a></li>
            </ul>
          </div>
        </section>
      </div>
      <footer>Generated from Markdown. Markdown remains the source of truth. ${new Date().toLocaleString("ko-KR")}</footer>
    </main>
  </body>
</html>
`,
    "utf8",
  );

  return outputPath;
}

async function getTargets() {
  if (args.includes("--all")) {
    const projects = JSON.parse(await fs.readFile(projectsFile, "utf8"));
    return projects.map((project) => path.resolve(project.path));
  }

  const target = readArg("--target") ?? args.find((arg) => !arg.startsWith("--")) ?? ".";
  return [path.resolve(target)];
}

const targets = await getTargets();
const built = [];
const skipped = [];

for (const target of targets) {
  if (!(await pathExists(target))) {
    skipped.push(`${target} (missing target)`);
    continue;
  }

  const orchestrationDir = path.join(target, "docs", "orchestration");
  if (!(await pathExists(orchestrationDir))) {
    skipped.push(`${target} (missing docs/orchestration)`);
    continue;
  }

  built.push(await buildDashboard(target));
}

console.log(`Built dashboards: ${built.length}`);
for (const outputPath of built) {
  console.log(`  + ${outputPath}`);
}

if (skipped.length > 0) {
  console.log(`Skipped: ${skipped.length}`);
  for (const item of skipped) {
    console.log(`  = ${item}`);
  }
}
