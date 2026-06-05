import React from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  FileText,
  GitBranch,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import "./styles.css";

type RiskLevel = "low" | "medium" | "high" | "blocked";
type PromptKind = "diagnose" | "commit" | "docs" | "review" | "continue" | "verification" | "cleanup" | "push";

type ProjectSnapshot = {
  id: string;
  name: string;
  path: string;
  type: string;
  exists: boolean;
  git: {
    isRepo: boolean;
    branch: string;
    latestCommit: null | {
      hash: string;
      message: string;
    };
    hasUpstream: boolean;
    ahead: number;
    behind: number;
    modified: string[];
    staged: string[];
    untracked: string[];
    dirty: boolean;
  };
  files: {
    hasAgentsMd: boolean;
    hasReadme: boolean;
    hasPackageJson: boolean;
    hasDocsStatus: boolean;
    hasDocsNextTasks: boolean;
    hasGitAttributes: boolean;
    recentFiles: Array<{
      path: string;
      modifiedAt: string;
    }>;
    largeFiles: Array<{
      path: string;
      sizeBytes: number;
    }>;
    todoCount: number;
    todoItems: Array<{
      path: string;
      line: number;
      text: string;
    }>;
    scannedFiles: number;
    truncated: boolean;
  };
  risks: Array<{
    level: RiskLevel;
    type: string;
    message: string;
  }>;
  riskLevel: RiskLevel;
  actionCategories: {
    blocked: boolean;
    needsCommit: boolean;
    needsDocs: boolean;
    needsPush: boolean;
    needsPull: boolean;
    needsReview: boolean;
    needsLfs: boolean;
    needsTest: boolean;
    needsCleanup: boolean;
  };
  recommendedActions: Array<{
    kind: string;
    label: string;
    prompt: string;
  }>;
  updatedAt: string;
};

const riskLabels: Record<RiskLevel, string> = {
  low: "정상",
  medium: "주의",
  high: "높은 위험",
  blocked: "확인 필요",
};

const riskDescriptions: Record<RiskLevel, string> = {
  low: "지금 바로 이어서 작업해도 괜찮아 보입니다.",
  medium: "커밋, 문서, 파일 상태를 한 번 확인하는 게 좋습니다.",
  high: "push, pull, 대용량 파일, LFS 같은 위험을 먼저 확인해야 합니다.",
  blocked: "등록된 폴더를 찾지 못해서 실제 스캔을 진행하지 못했습니다.",
};

const promptKindLabels: Record<PromptKind, string> = {
  diagnose: "상태 진단",
  commit: "커밋 준비",
  docs: "문서 정리",
  review: "리뷰",
  continue: "다음 구현",
  verification: "검증",
  cleanup: "정리",
  push: "푸시 준비",
};

const actionLabels: Array<[keyof ProjectSnapshot["actionCategories"], string]> = [
  ["blocked", "경로 확인"],
  ["needsCommit", "커밋"],
  ["needsDocs", "문서"],
  ["needsPush", "푸시"],
  ["needsPull", "풀"],
  ["needsReview", "리뷰"],
  ["needsLfs", "LFS"],
  ["needsTest", "테스트"],
  ["needsCleanup", "정리"],
];

const typeLabels: Record<string, string> = {
  unknown: "미분류",
  web: "웹",
  "web-game": "웹 게임",
  unity: "Unity",
  unreal: "Unreal",
  portfolio: "포트폴리오",
  node: "Node",
  docs: "문서",
};

function riskRank(level: RiskLevel) {
  return ["low", "medium", "high", "blocked"].indexOf(level);
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function App() {
  const [snapshots, setSnapshots] = React.useState<ProjectSnapshot[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPromptLoading, setIsPromptLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState("");
  const [actionMessage, setActionMessage] = React.useState("");
  const [promptKind, setPromptKind] = React.useState<PromptKind>("diagnose");
  const [promptText, setPromptText] = React.useState("");
  const [portfolioMode, setPortfolioMode] = React.useState(false);
  const [formState, setFormState] = React.useState({
    name: "",
    path: "",
    type: "unknown",
    tags: "",
  });

  const selected = snapshots.find((snapshot) => snapshot.id === selectedId) ?? snapshots[0];
  const riskyProjects = snapshots.filter((snapshot) => riskRank(snapshot.riskLevel) >= riskRank("medium")).length;
  const needsCommit = snapshots.filter((snapshot) => snapshot.actionCategories?.needsCommit).length;
  const needsDocs = snapshots.filter((snapshot) => snapshot.actionCategories?.needsDocs).length;
  const needsPush = snapshots.filter((snapshot) => snapshot.actionCategories?.needsPush).length;
  const lastScan = snapshots
    .map((snapshot) => new Date(snapshot.updatedAt).getTime())
    .sort((a, b) => b - a)[0];

  async function loadSnapshots() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/snapshots");
      if (!response.ok) {
        throw new Error(`Scan failed: ${response.status}`);
      }
      const data = (await response.json()) as ProjectSnapshot[];
      setSnapshots(data);
      setSelectedId((current) => {
        if (current && data.some((snapshot) => snapshot.id === current)) {
          return current;
        }

        return data[0]?.id || "";
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyPrompt(prompt: string, id: string) {
    await navigator.clipboard.writeText(prompt);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1600);
  }

  function displayProjectName(snapshot: ProjectSnapshot) {
    if (!portfolioMode) {
      return snapshot.name;
    }

    const typeLabel = snapshot.type === "unknown" ? "프로젝트" : (typeLabels[snapshot.type] ?? snapshot.type);
    return `${typeLabel} 예시`;
  }

  function displayProjectPath(snapshot: ProjectSnapshot) {
    return portfolioMode ? "로컬 경로 숨김" : snapshot.path;
  }

  function displayFilePath(value: string, index: number) {
    return portfolioMode ? `파일 ${index + 1}` : value;
  }

  function displayPrompt(value: string) {
    if (!portfolioMode || !selected) {
      return value;
    }

    return value
      .replaceAll(selected.path, "[로컬 경로 숨김]")
      .replaceAll(selected.name, displayProjectName(selected));
  }

  function getProjectStatusText(snapshot: ProjectSnapshot) {
    if (!snapshot.exists) {
      return "경로 없음";
    }

    if (!snapshot.git.isRepo) {
      return "Git 아님";
    }

    if (snapshot.git.dirty) {
      return "변경 있음";
    }

    return "정상";
  }

  async function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name.trim(),
          path: formState.path.trim(),
          type: formState.type,
          tags: formState.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as null | { error?: string };
        throw new Error(body?.error ?? `Add failed: ${response.status}`);
      }

      const project = (await response.json()) as { id: string; name: string };
      setFormState({ name: "", path: "", type: "unknown", tags: "" });
      setSelectedId(project.id);
      setActionMessage(`${project.name} 프로젝트를 추가했습니다.`);
      await loadSnapshots();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProject(snapshot: ProjectSnapshot) {
    const confirmed = window.confirm(`${snapshot.name} 프로젝트를 목록에서 제거할까요? 실제 폴더는 삭제하지 않습니다.`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch(`/api/projects/${snapshot.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setSelectedId((current) => (current === snapshot.id ? "" : current));
      setActionMessage(`${snapshot.name} 프로젝트를 대시보드에서 제거했습니다.`);
      await loadSnapshots();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }

  async function loadPrompt(projectId: string, kind: PromptKind) {
    setIsPromptLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kind }),
      });

      if (!response.ok) {
        throw new Error(`Prompt failed: ${response.status}`);
      }

      const data = (await response.json()) as { prompt: string };
      setPromptText(data.prompt);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
      setPromptText("");
    } finally {
      setIsPromptLoading(false);
    }
  }

  React.useEffect(() => {
    void loadSnapshots();
  }, []);

  React.useEffect(() => {
    if (!selected) {
      setPromptText("");
      return;
    }

    void loadPrompt(selected.id, promptKind);
  }, [selected?.id, promptKind]);

  return (
    <main className="appShell">
      <section className="topBar">
        <div>
          <p className="eyebrow">로컬 AI 개발 관제실</p>
          <h1>AI Project Orchestrator</h1>
          <p className="topDescription">여러 프로젝트의 Git 상태, 파일 신호, 다음 Codex 작업을 한 화면에서 정리합니다.</p>
        </div>
        <div className="topActions">
          <label className="toggleControl">
            <input
              checked={portfolioMode}
              onChange={(event) => setPortfolioMode(event.target.checked)}
              type="checkbox"
            />
            포트폴리오 모드
          </label>
          <button className="primaryButton" type="button" onClick={() => void loadSnapshots()} disabled={isLoading}>
            <RefreshCw size={17} />
            {isLoading ? "스캔 중" : "다시 스캔"}
          </button>
        </div>
      </section>

      <section className="summaryGrid" aria-label="Project summary">
        <Metric label="등록 프로젝트" value={snapshots.length.toString()} />
        <Metric label="확인 필요" value={riskyProjects.toString()} />
        <Metric label="커밋 필요" value={needsCommit.toString()} />
        <Metric label="문서 필요" value={needsDocs.toString()} />
        <Metric label="푸시 필요" value={needsPush.toString()} />
        <Metric label="최근 스캔" value={lastScan ? new Date(lastScan).toLocaleTimeString("ko-KR") : "-"} />
      </section>

      {portfolioMode ? (
        <section className="portfolioBanner">
          <div>
            <h2>포트폴리오 모드</h2>
            <p>화면 공유나 포트폴리오 정리에 쓸 수 있도록 로컬 경로, 파일명, TODO 내용을 숨깁니다.</p>
          </div>
        </section>
      ) : null}

      {error ? <div className="errorBox">{error}</div> : null}
      {actionMessage ? <div className="successBox">{actionMessage}</div> : null}

      <section className="workspace">
        <div className="projectList" aria-label="Projects">
          <div className="sectionTitle">
            <h2>프로젝트</h2>
            <span>{isLoading ? "로컬 상태 읽는 중" : `${snapshots.length}개 등록됨`}</span>
          </div>

          <form className="projectForm" onSubmit={(event) => void addProject(event)}>
            <label>
              프로젝트 이름
              <input
                type="text"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="LETHE Prototype"
                required
              />
            </label>
            <label>
              폴더 경로
              <input
                type="text"
                value={formState.path}
                onChange={(event) => setFormState((current) => ({ ...current, path: event.target.value }))}
                placeholder="C:\\Projects\\MyProject"
                required
              />
            </label>
            <div className="formRow">
              <label>
                종류
                <select
                  value={formState.type}
                  onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="unknown">미분류</option>
                  <option value="web">웹</option>
                  <option value="web-game">웹 게임</option>
                  <option value="unity">Unity</option>
                  <option value="unreal">Unreal</option>
                  <option value="portfolio">포트폴리오</option>
                  <option value="node">Node</option>
                  <option value="docs">문서</option>
                </select>
              </label>
              <label>
                태그
                <input
                  type="text"
                  value={formState.tags}
                  onChange={(event) => setFormState((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="game, prototype"
                />
              </label>
            </div>
            <button className="primaryButton fullWidth" type="submit" disabled={isSaving}>
              <Plus size={16} />
              {isSaving ? "저장 중" : "프로젝트 추가"}
            </button>
            <p className="formHint">`확인 필요`는 앱 오류가 아니라, 등록된 경로를 찾지 못했거나 먼저 처리할 항목이 있다는 뜻입니다.</p>
          </form>

          {snapshots.map((snapshot) => (
            <article
              className={`projectCard ${selected?.id === snapshot.id ? "selected" : ""}`}
              key={snapshot.id}
            >
              <button className="cardSelect" type="button" onClick={() => setSelectedId(snapshot.id)}>
                <div className="cardHeader">
                  <div>
                    <h3>{displayProjectName(snapshot)}</h3>
                    <p>{typeLabels[snapshot.type] ?? snapshot.type}</p>
                  </div>
                  <RiskBadge level={snapshot.riskLevel} />
                </div>

                <p className="pathLine">{displayProjectPath(snapshot)}</p>

                <div className="cardSignals">
                  <span>
                    <GitBranch size={14} />
                    {snapshot.git.branch || "브랜치 없음"}
                  </span>
                  <span>{snapshot.git.dirty ? "변경 있음" : "깨끗함"}</span>
                  <span>{getProjectStatusText(snapshot)}</span>
                </div>
              </button>
              <button className="iconButton danger" type="button" onClick={() => void deleteProject(snapshot)}>
                <Trash2 size={15} />
                <span>제거</span>
              </button>
            </article>
          ))}

          {!isLoading && snapshots.length === 0 ? (
            <div className="emptyBox">스캔할 프로젝트를 추가하면 여기에서 상태를 볼 수 있습니다.</div>
          ) : null}
        </div>

        <div className="detailPanel">
          {selected ? (
            <>
              <div className="detailHeader">
                <div>
                  <p className="eyebrow">선택된 프로젝트</p>
                  <h2>{displayProjectName(selected)}</h2>
                  <p className="statusDescription">{riskDescriptions[selected.riskLevel]}</p>
                </div>
                <RiskBadge level={selected.riskLevel} />
              </div>

              {!selected.exists ? (
                <section className="blockedHelp">
                  <strong>실제 폴더 경로를 등록해야 스캔할 수 있어요.</strong>
                  <p>
                    현재 기본 프로젝트는 포트폴리오용 예시 경로입니다. 왼쪽에서 실제 LETHE 또는 SoulLike 폴더 경로를
                    추가하면 Git 상태와 파일 신호가 정상적으로 표시됩니다.
                  </p>
                </section>
              ) : null}

              <div className="detailGrid">
                <InfoBlock label="브랜치" value={selected.git.branch || "알 수 없음"} />
                <InfoBlock label="최근 커밋" value={selected.git.latestCommit?.message ?? "없음"} />
                <InfoBlock label="원격 연결" value={selected.git.hasUpstream ? "연결됨" : "없음"} />
                <InfoBlock label="앞섬 / 뒤처짐" value={`${selected.git.ahead} / ${selected.git.behind}`} />
              </div>

              <section className="actionPanel">
                <div className="sectionTitle compact">
                  <h3>추천 작업</h3>
                  <span>{selected.recommendedActions.length}개 프롬프트</span>
                </div>
                <div className="actionChips">
                  {actionLabels.map(([key, label]) => (
                    <span className={selected.actionCategories[key] ? "active" : ""} key={key}>
                      {label}
                    </span>
                  ))}
                </div>
              </section>

              <div className="panelRow">
                <StatusGroup title="Git 상태">
                  <Signal label="스테이징" value={selected.git.staged.length} />
                  <Signal label="수정됨" value={selected.git.modified.length} />
                  <Signal label="추적 안 됨" value={selected.git.untracked.length} />
                </StatusGroup>

                <StatusGroup title="중요 문서">
                  <DocSignal label="AGENTS.md" ok={selected.files.hasAgentsMd} />
                  <DocSignal label="README.md" ok={selected.files.hasReadme} />
                  <DocSignal label="CODEX_STATUS" ok={selected.files.hasDocsStatus} />
                </StatusGroup>
              </div>

              <section className="fileSignalsPanel">
                <div className="sectionTitle compact">
                  <h3>파일 신호</h3>
                  <span>{selected.files.scannedFiles}개 스캔</span>
                </div>
                <div className="fileSignalGrid">
                  <Signal label="TODO/FIXME/BUG" value={selected.files.todoCount} />
                  <Signal label="대용량 파일" value={selected.files.largeFiles.length} />
                  <Signal label="최근 파일" value={selected.files.recentFiles.length} />
                </div>
                {selected.files.truncated ? (
                  <p className="signalNote">너무 많은 파일을 읽지 않도록 스캔을 제한했습니다.</p>
                ) : null}
                <FileList
                  emptyText="최근 파일이 없습니다."
                  items={selected.files.recentFiles.slice(0, 5).map((file, index) => ({
                    label: displayFilePath(file.path, index),
                    meta: new Date(file.modifiedAt).toLocaleString("ko-KR"),
                  }))}
                  title="최근 파일"
                />
                <FileList
                  emptyText="대용량 파일이 없습니다."
                  items={selected.files.largeFiles.slice(0, 5).map((file, index) => ({
                    label: displayFilePath(file.path, index),
                    meta: formatBytes(file.sizeBytes),
                  }))}
                  title="대용량"
                />
                <FileList
                  emptyText="TODO/FIXME/BUG 주석이 없습니다."
                  items={selected.files.todoItems.slice(0, 5).map((item, index) => ({
                    label: portfolioMode ? `TODO ${index + 1}` : `${item.path}:${item.line}`,
                    meta: portfolioMode ? "주석 내용 숨김" : item.text,
                  }))}
                  title="TODO"
                />
              </section>

              <section className="riskPanel">
                <h3>위험 신호</h3>
                {selected.risks.length > 0 ? (
                  selected.risks.map((risk) => (
                    <div className="riskItem" key={`${risk.type}-${risk.message}`}>
                      <AlertTriangle size={16} />
                      <span>{risk.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="riskItem calm">
                    <CheckCircle2 size={16} />
                    <span>큰 위험 신호가 없습니다.</span>
                  </div>
                )}
              </section>

              <section className="promptPanel">
                <div className="sectionTitle">
                  <h3>Codex 작업 프롬프트</h3>
                  <span>{isPromptLoading ? "생성 중" : promptKindLabels[promptKind]}</span>
                </div>
                <div className="segmentedControl" aria-label="Prompt type">
                  {(Object.keys(promptKindLabels) as PromptKind[]).map((kind) => (
                    <button
                      className={promptKind === kind ? "active" : ""}
                      key={kind}
                      type="button"
                      onClick={() => setPromptKind(kind)}
                    >
                      {promptKindLabels[kind]}
                    </button>
                  ))}
                </div>
                <pre>{displayPrompt(promptText || selected.recommendedActions[0]?.prompt || "생성된 프롬프트가 없습니다.")}</pre>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() =>
                    void copyPrompt(displayPrompt(promptText || selected.recommendedActions[0]?.prompt || ""), selected.id)
                  }
                >
                  <Clipboard size={16} />
                  {copied === selected.id ? "복사됨" : "프롬프트 복사"}
                </button>
              </section>
            </>
          ) : (
            <div className="emptyDetail">선택된 프로젝트가 없습니다.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`riskBadge ${level}`}>{riskLabels[level]}</span>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="infoBlock">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="statusGroup">
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className="signal">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DocSignal({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="docSignal">
      <FileText size={15} />
      <span>{label}</span>
      <strong>{ok ? "있음" : "없음"}</strong>
    </div>
  );
}

function FileList({ title, items, emptyText }: { title: string; items: Array<{ label: string; meta: string }>; emptyText: string }) {
  return (
    <div className="fileList">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={`${item.label}-${item.meta}`}>
              <span>{item.label}</span>
              <small>{item.meta}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
