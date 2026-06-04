import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const envFile = path.join(rootDir, ".env");
const reportFile = path.join(rootDir, "docs", "reports", "latest-status.html");
const isDryRun = process.argv.includes("--dry-run");
const shouldAttachHtml = !process.argv.includes("--no-attach");

function stripTags(value) {
  return value
    .replace(/<code>(.*?)<\/code>/g, "`$1`")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
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

function extractListSection(html, heading) {
  const pattern = new RegExp(`<h2>${heading}<\\/h2>\\s*<ul>([\\s\\S]*?)<\\/ul>`, "u");
  const match = html.match(pattern);

  if (!match) {
    return "";
  }

  const items = [...match[1].matchAll(/<li>([\s\S]*?)<\/li>/gu)].map((item) => `- ${stripTags(item[1])}`);
  return items.join("\n");
}

function extractReport(html) {
  const title = stripTags(html.match(/<h1>([\s\S]*?)<\/h1>/u)?.[1] ?? "AI Project Orchestrator 진행 보고서");
  const status = stripTags(html.match(/<span class="status">([\s\S]*?)<\/span>/u)?.[1] ?? "");

  return {
    title,
    status,
    work: extractListSection(html, "어떤 작업"),
    progress: extractListSection(html, "진행 내용"),
    result: extractListSection(html, "결과"),
  };
}

function buildPayload(report, username) {
  const description = report.status ? `기준: ${report.status}` : "최신 진행 보고서";

  return {
    username,
    embeds: [
      {
        title: report.title,
        description,
        color: 2050893,
        fields: [
          {
            name: "어떤 작업",
            value: truncate(report.work || "기록된 작업이 없습니다.", 1024),
            inline: false,
          },
          {
            name: "진행 내용",
            value: truncate(report.progress || "특이사항이 없습니다.", 1024),
            inline: false,
          },
          {
            name: "결과",
            value: truncate(report.result || "기록된 결과가 없습니다.", 1024),
            inline: false,
          },
        ],
        footer: {
          text: "docs/reports/latest-status.html 기준으로 생성됨",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

const env = await readEnv();
const html = await fs.readFile(reportFile, "utf8");
const report = extractReport(html);
const payload = buildPayload(report, env.DISCORD_REPORT_USERNAME || "AI Project Orchestrator");

if (isDryRun) {
  console.log(
    JSON.stringify(
      {
        ...payload,
        attachments: shouldAttachHtml ? ["latest-status.html"] : [],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!env.DISCORD_WEBHOOK_URL) {
  console.error("DISCORD_WEBHOOK_URL is missing. Add it to .env or run with --dry-run.");
  process.exit(1);
}

let response;

if (shouldAttachHtml) {
  const formData = new FormData();
  const reportBytes = await fs.readFile(reportFile);
  const reportBlob = new Blob([reportBytes], { type: "text/html" });

  formData.append("payload_json", JSON.stringify(payload));
  formData.append("files[0]", reportBlob, "latest-status.html");

  response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    body: formData,
  });
} else {
  response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

if (!response.ok) {
  const body = await response.text();
  console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
  console.error(body);
  process.exit(1);
}

console.log(shouldAttachHtml ? "Discord report sent with HTML attachment." : "Discord report sent.");
