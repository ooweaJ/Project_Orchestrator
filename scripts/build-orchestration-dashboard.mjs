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

async function readFirstText(filePaths) {
  for (const filePath of filePaths) {
    const content = await readText(filePath);
    if (content) {
      return content;
    }
  }

  return "";
}

function encodeRelativeHref(relativePath) {
  return relativePath.split("/").map(encodeURIComponent).join("/");
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

function firstHtmlTitle(html, fallback) {
  const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/is)?.[1]?.replace(/<[^>]+>/g, "").trim();

  return title || h1 || fallback;
}

function humanizeFileName(fileName) {
  return fileName.replace(/\.(html|md)$/i, "").replace(/[-_]+/g, " ");
}

async function listReportFiles(directory, limit = 12) {
  const files = [];

  async function visit(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      const filePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await visit(filePath);
        continue;
      }

      if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".html") {
        continue;
      }

      const relativePath = path.relative(directory, filePath).replace(/\\/g, "/");
      if (relativePath.toLowerCase() === "index.html" || !relativePath.toLowerCase().endsWith("/index.html")) {
        continue;
      }

      const stats = await fs.stat(filePath).catch(() => null);
      if (!stats) {
        continue;
      }

      const content = await readText(filePath);
      const title = firstHtmlTitle(content, humanizeFileName(path.dirname(relativePath)));

      files.push({
        name: entry.name,
        path: relativePath,
        title,
        modifiedAt: stats.mtime,
        isHtml: true,
      });
    }
  }

  await visit(directory);
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

function firstNonEmptyLine(value, fallback = "기록 없음") {
  return (
    value
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
      .find((line) => line && !line.startsWith("#")) ?? fallback
  );
}

function extractListItems(value, limit = 4) {
  const items = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(/^[-*]\s+(.*)$/u)?.[1] ?? line.match(/^\d+\.\s+(.*)$/u)?.[1] ?? "")
    .filter(Boolean)
    .slice(0, limit);

  return items.length > 0 ? items : [firstNonEmptyLine(value, "다음 판단 기준이 아직 없습니다.")];
}

function renderPlainList(items) {
  return `<ul>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`;
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
  const commands = [];
  const lines = runbook.split(/\r?\n/);
  let currentHeading = "명령";
  let codeLines = [];
  let inCode = false;

  for (const line of lines) {
    if (!inCode && line.startsWith("## ")) {
      currentHeading = line.slice(3).trim();
      continue;
    }

    if (line.startsWith("```")) {
      if (inCode) {
        const command = codeLines.join("\n").trim();
        if (command) {
          commands.push({ title: currentHeading, command });
        }
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
    }
  }

  const visibleCommands = commands.slice(0, 6);

  if (visibleCommands.length === 0) {
    return '<p class="muted">RUNBOOK.md에 명령이 아직 정리되지 않았습니다.</p>';
  }

  return `<div class="commandManual">${visibleCommands
    .map(
      (item) => `<article>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(getCommandDescription(item.title))}</p>
        <pre><code>${escapeHtml(item.command)}</code></pre>
      </article>`,
    )
    .join("")}</div>`;
}

function getCommandDescription(title) {
  const normalized = title.toLowerCase();

  if (normalized.includes("preflight")) {
    return "작업 전 변경 상태와 영향 범위를 확인합니다.";
  }

  if (normalized.includes("build")) {
    return "프론트엔드와 타입 검사를 포함해 배포 가능한지 확인합니다.";
  }

  if (normalized.includes("discord")) {
    return "중앙 오케스트레이터 설정으로 보고 메시지를 미리 확인하거나 전송합니다.";
  }

  if (normalized.includes("install")) {
    return "다른 프로젝트에 오케스트레이션 문서 구조를 설치합니다.";
  }

  if (normalized.includes("migrate")) {
    return "기존 프로젝트의 문서와 작업 흔적을 새 인터페이스로 옮길 때 사용합니다.";
  }

  if (normalized.includes("dashboard")) {
    return "Markdown 원본을 사람이 보기 좋은 HTML 대시보드로 다시 생성합니다.";
  }

  return "프로젝트 운영 중 반복해서 쓰는 절차입니다.";
}

function renderMarkdownCard(title, markdown, fallback) {
  return `<section class="card">
    <h2>${escapeHtml(title)}</h2>
    <div class="markdown">${normalizeSnippet(markdown, fallback)}</div>
  </section>`;
}

async function buildDashboard(targetRoot) {
  const orchestrationDir = path.join(targetRoot, "docs", "orchestration");
  const stateDir = path.join(orchestrationDir, "state");
  const interfaceDir = path.join(orchestrationDir, "interface");
  const readStateDoc = (fileName) => readFirstText([path.join(stateDir, fileName), path.join(orchestrationDir, fileName)]);
  const docs = {
    projectBrief: await readStateDoc("PROJECT_BRIEF.md"),
    status: await readStateDoc("STATUS.md"),
    currentTask: await readStateDoc("CURRENT_TASK.md"),
    nextTasks: await readStateDoc("NEXT_TASKS.md"),
    decisionLog: await readStateDoc("DECISION_LOG.md"),
    runbook: await readStateDoc("RUNBOOK.md"),
  };
  const reportsDir = path.join(orchestrationDir, "reports");
  const reports = await listReportFiles(reportsDir);
  const projectName = firstContentLine(extractSection(docs.projectBrief, "Project")) || path.basename(targetRoot);
  const phase = extractSection(docs.status, "Current State") || extractSection(docs.status, "현재 상태");
  const blockers = extractSection(docs.status, "Blockers") || extractSection(docs.status, "블로커");
  const verification = extractSection(docs.status, "Latest Verification") || extractSection(docs.status, "최신 검증");
  const currentTaskSummary =
    [
      extractSection(docs.currentTask, "Task") || extractSection(docs.currentTask, "작업"),
      extractSection(docs.currentTask, "Goal") || extractSection(docs.currentTask, "목표"),
      extractSection(docs.currentTask, "Done Criteria") || extractSection(docs.currentTask, "완료 기준"),
    ]
      .filter(Boolean)
      .join("\n\n") || docs.currentTask;
  const nextInstructionSummary =
    extractSection(docs.nextTasks, "Top Candidates") || extractSection(docs.nextTasks, "다음 후보") || docs.nextTasks;
  const decisionSummary = extractSection(docs.decisionLog, "Decisions") || docs.decisionLog;
  const outputPath = path.join(interfaceDir, "index.html");
  const commandOutputPath = path.join(interfaceDir, "command.html");
  const runbookOutputPath = path.join(interfaceDir, "runbook.html");
  const reportsIndexOutputPath = path.join(reportsDir, "index.html");
  const latestReport = reports[0] ?? null;
  const reportItems = reports;
  const reportListHtml =
    reportItems.length > 0
      ? `<ul>${reportItems
          .map(
            (report) => `<li>
            <a href="./${encodeRelativeHref(report.path)}">${escapeHtml(report.title)}</a>
            <span class="tag">일지</span>
            <small>${report.modifiedAt.toLocaleString("ko-KR")}</small>
          </li>`,
          )
          .join("")}</ul>`
      : "<p>아직 진행 보고서가 없습니다.</p>";

  await fs.mkdir(orchestrationDir, { recursive: true });
  await fs.mkdir(interfaceDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(
    outputPath,
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(projectName)} 프로젝트 대시보드</title>
    <style>
      :root {
        --bg: #f6f7f3;
        --panel: #ffffff;
        --text: #17201d;
        --muted: #64706b;
        --line: #dce2da;
        --green: #1f6b4d;
        --blue: #285f8f;
        --amber: #916019;
        --red: #9a3d36;
        --soft-green: #e7f3ec;
        --soft-blue: #e8f1f8;
        --soft-amber: #f8efe0;
        --soft-red: #fae9e7;
        color: var(--text);
        background: var(--bg);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { width: min(1120px, 100%); margin: 0 auto; padding: 30px 22px 38px; }
      header { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: end; margin-bottom: 16px; }
      .eyebrow { margin: 0 0 8px; color: var(--green); font-size: 13px; font-weight: 900; }
      h1 { margin: 0; font-size: clamp(28px, 5vw, 46px); line-height: 1.05; }
      h2, h3, h4, p { margin-top: 0; }
      .badge { display: inline-flex; align-items: center; min-height: 34px; padding: 7px 11px; border: 1px solid var(--line); border-radius: 999px; background: var(--soft-amber); color: var(--amber); font-size: 13px; font-weight: 900; white-space: nowrap; }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
      .metric, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .metric { min-height: 106px; padding: 15px; }
      .metric span { display: block; margin-bottom: 8px; color: var(--muted); font-size: 13px; font-weight: 900; }
      .metric strong { display: block; font-size: 18px; line-height: 1.32; }
      .metric small { display: block; margin-top: 7px; color: var(--muted); font-size: 12px; line-height: 1.4; }
      .green { background: var(--soft-green); }
      .blue { background: var(--soft-blue); }
      .amber { background: var(--soft-amber); }
      .red { background: var(--soft-red); }
      .heroPanel { padding: 18px; margin-bottom: 14px; border: 1px solid #cbdcce; border-radius: 8px; background: linear-gradient(180deg, #ffffff 0%, #f0f7f2 100%); }
      .heroPanel h2, .panel h2 { margin: 0 0 10px; font-size: 19px; }
      .heroPanel p, .panel p { margin: 0; color: var(--muted); line-height: 1.65; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
      .panel { min-height: 166px; padding: 17px; }
      .panel ul { margin: 0; padding-left: 19px; line-height: 1.58; }
      .panel li { margin-bottom: 5px; }
      .label { color: var(--muted); font-size: 13px; font-weight: 900; }
      .value { display: block; margin-top: 4px; line-height: 1.5; }
      .decision { display: grid; gap: 10px; }
      .decision div { padding-bottom: 9px; border-bottom: 1px solid #edf0eb; }
      .decision div:last-child { padding-bottom: 0; border-bottom: 0; }
      .cardTitle { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .cardTitle h2 { margin: 0; font-size: 18px; }
      a { color: var(--green); font-weight: 900; text-decoration: none; }
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
        header, .metrics, .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(projectName)} 프로젝트 대시보드</p>
          <h1>상태 요약</h1>
        </div>
        <span class="badge">${escapeHtml(firstHeading(docs.currentTask, "진행 중"))}</span>
      </header>

      <section class="metrics" aria-label="핵심 상태 요약">
        <div class="metric green">
          <span>현재 단계</span>
          <strong>${escapeHtml(firstHeading(docs.currentTask, "진행 중"))}</strong>
          <small>${escapeHtml(firstNonEmptyLine(phase, "상태 기록 없음"))}</small>
        </div>
        <div class="metric blue">
          <span>최신 검증</span>
          <strong>${escapeHtml(firstNonEmptyLine(verification, "기록 없음"))}</strong>
          <small>검증 원본은 STATUS.md</small>
        </div>
        <div class="metric amber">
          <span>막힌 점</span>
          <strong>${escapeHtml(firstNonEmptyLine(blockers, "없음"))}</strong>
          <small>판단 보류 지점</small>
        </div>
        <div class="metric red">
          <span>다음 게이트</span>
          <strong>${escapeHtml(firstNonEmptyLine(nextInstructionSummary, "다음 후보 없음"))}</strong>
          <small>NEXT_TASKS.md 기준</small>
        </div>
      </section>

      <section class="heroPanel">
        <h2>현재 결론</h2>
        <p>${escapeHtml(firstNonEmptyLine(phase, "현재 결론이 아직 정리되지 않았습니다."))}</p>
      </section>

      <div class="grid">
        <article class="panel">
          <h2>이번 목표</h2>
          <div class="decision">
            <div>
              <span class="label">해야 할 일</span>
              <span class="value">${inlineMarkdown(firstNonEmptyLine(currentTaskSummary, "현재 작업 없음"))}</span>
            </div>
            <div>
              <span class="label">완료 신호</span>
              <span class="value">${inlineMarkdown(firstNonEmptyLine(extractSection(docs.currentTask, "Done Criteria") || extractSection(docs.currentTask, "완료 기준"), "완료 기준 없음"))}</span>
            </div>
            <div>
              <span class="label">원본</span>
              <span class="value"><code>CURRENT_TASK.md</code></span>
            </div>
          </div>
        </article>

        <article class="panel">
          <h2>다음 판단</h2>
          ${renderPlainList(extractListItems(nextInstructionSummary))}
        </article>

        <article class="panel">
          <h2>최근 완료</h2>
          <div class="decision">
            <div>
              <span class="label">보고</span>
              <span class="value">${latestReport ? `<a href="../reports/${encodeRelativeHref(latestReport.path)}">${escapeHtml(latestReport.title)}</a>` : "아직 진행 보고가 없습니다."}</span>
            </div>
            <div>
              <span class="label">결정</span>
              <span class="value">${inlineMarkdown(firstNonEmptyLine(decisionSummary, "최근 결정 없음"))}</span>
            </div>
            <div>
              <span class="label">목록</span>
              <span class="value"><a href="../reports/index.html">reports/index.html</a></span>
            </div>
          </div>
        </article>
      </div>
      <footer>Generated from Markdown. Markdown remains the source of truth. ${new Date().toLocaleString("ko-KR")}</footer>
    </main>
  </body>
</html>
`,
    "utf8",
  );

  await fs.writeFile(
    commandOutputPath,
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(projectName)} 다음 지시</title>
    <style>
      :root { color: #17211c; background: #f7fcf8; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { padding: 16px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
      h1 { margin: 0; font-size: 18px; }
      a { color: #1f6b4d; font-weight: 900; text-decoration: none; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      article { min-width: 0; padding: 12px; border: 1px solid #d9e1d7; border-radius: 8px; background: #fff; }
      h2 { margin: 0 0 8px; color: #1f6b4d; font-size: 14px; }
      .markdown { color: #26342f; font-size: 13px; line-height: 1.55; }
      .markdown h3, .markdown h4 { margin: 10px 0 6px; font-size: 13px; }
      .markdown p { margin: 0 0 8px; }
      .markdown ul { margin: 0; padding-left: 18px; }
      .markdown li { margin-bottom: 3px; }
      code { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
      @media (max-width: 680px) { .grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>다음 지시</h1>
        <a href="./CURRENT_TASK.md">CURRENT_TASK.md</a>
      </header>
      <div class="grid">
        <article>
          <h2>이번에 끝낼 작업</h2>
          <div class="markdown">${normalizeSnippet(currentTaskSummary, "CURRENT_TASK.md가 아직 작성되지 않았습니다.")}</div>
        </article>
        <article>
          <h2>다음 후보</h2>
          <div class="markdown">${normalizeSnippet(nextInstructionSummary, "NEXT_TASKS.md가 아직 작성되지 않았습니다.")}</div>
        </article>
      </div>
    </main>
  </body>
</html>
`,
    "utf8",
  );

  await fs.writeFile(
    runbookOutputPath,
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(projectName)} 운영 절차</title>
    <style>
      :root { color: #17211c; background: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { padding: 16px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      h1 { margin: 0; font-size: 18px; }
      a { color: #1f6b4d; font-weight: 900; text-decoration: none; }
      p { margin: 0 0 12px; color: #60706a; font-size: 13px; line-height: 1.55; }
      .commandManual { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .commandManual article { min-width: 0; padding: 14px; border: 1px solid #d9e1d7; border-radius: 8px; background: #f8faf7; }
      .commandManual h3 { margin: 0 0 6px; color: #1f6b4d; font-size: 15px; }
      .commandManual p { margin: 0 0 10px; }
      pre { overflow: auto; margin: 0; padding: 12px; border-radius: 8px; background: #f2f5ef; font-size: 13px; line-height: 1.55; }
      code { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
      @media (max-width: 680px) { .commandManual { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>운영 절차</h1>
        <a href="./RUNBOOK.md">RUNBOOK.md</a>
      </header>
      <p>검증, 설치, 대시보드 재생성처럼 반복되는 조작은 여기서 확인합니다. 명령은 원본 RUNBOOK.md에서 관리합니다.</p>
      ${renderCommandList(docs.runbook)}
    </main>
  </body>
</html>
`,
    "utf8",
  );

  await fs.writeFile(
    reportsIndexOutputPath,
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(projectName)} 보고서 목록</title>
    <style>
      :root {
        --bg: #f6f7f3;
        --panel: #ffffff;
        --text: #17201d;
        --muted: #64706b;
        --line: #dce2da;
        --green: #1f6b4d;
        --blue: #285f8f;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { width: min(1050px, 100%); margin: 0 auto; padding: 30px 22px 42px; }
      a { color: var(--green); font-weight: 900; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .eyebrow { margin: 0 0 8px; color: var(--green); font-size: 13px; font-weight: 900; }
      h1 { margin: 0 0 10px; font-size: clamp(30px, 5vw, 46px); line-height: 1.08; }
      p { margin: 0 0 12px; color: var(--muted); line-height: 1.65; }
      .panel { margin-top: 14px; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .panelHeader { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-bottom: 12px; }
      h2 { margin: 0; font-size: 19px; }
      ul { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
      li { padding: 12px 0; border-bottom: 1px solid #edf0eb; }
      li:last-child { border-bottom: 0; }
      small { display: block; margin-top: 5px; color: var(--muted); line-height: 1.45; }
      .tag { display: inline-flex; margin-left: 8px; padding: 3px 7px; border-radius: 999px; background: #e8f1f8; color: var(--blue); font-size: 12px; font-weight: 900; }
      footer { margin-top: 20px; color: var(--muted); font-size: 13px; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">${escapeHtml(projectName)} 개발일지</p>
      <h1>보고서 목록</h1>
      <p>
        날짜별 사용자 개발일지를 모아보는 HTML 목록입니다.
        Markdown/state가 원본이고 HTML은 사람이 빠르게 확인하기 위한 진행 기록입니다.
      </p>

      <section class="panel">
        <div class="panelHeader">
          <h2>진행 보고서</h2>
          <a href="../interface/index.html">대시보드로 돌아가기</a>
        </div>
        ${reportListHtml}
      </section>

      <footer>이 목록은 <code>docs/orchestration/reports/YYYYMMDD/index.html</code> 날짜 개발일지를 기준으로 생성됩니다.</footer>
    </main>
  </body>
</html>
`,
    "utf8",
  );

  return [outputPath, commandOutputPath, runbookOutputPath, reportsIndexOutputPath];
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

  built.push(...(await buildDashboard(target)));
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
