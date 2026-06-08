import React from "react";
import { createRoot } from "react-dom/client";
import {
  Clipboard,
  ExternalLink,
  FileText,
  FolderOpen,
  GitBranch,
  MessageSquare,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import "./styles.css";

type RiskLevel = "low" | "medium" | "high" | "blocked";
type OrchestrationDocKey = "status" | "currentTask" | "nextTasks" | "decisionLog";

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
    orchestration: {
      required: Array<{
        label: string;
        path: string;
        type: "file" | "directory";
        exists: boolean;
      }>;
      recommended: Array<{
        label: string;
        path: string;
        type: "file" | "directory";
        exists: boolean;
      }>;
      requiredPresent: number;
      requiredTotal: number;
      recommendedPresent: number;
      recommendedTotal: number;
      missingRequired: string[];
      complete: boolean;
    };
    orchestrationDashboard: {
      phase: string;
      documents: Array<{
        key: OrchestrationDocKey;
        label: string;
        path: string;
        exists: boolean;
        hasContent: boolean;
        content: string;
      }>;
      recentDevlog: Array<{
        path: string;
        modifiedAt: string;
      }>;
      recentReports: Array<{
        path: string;
        modifiedAt: string;
      }>;
    };
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

type FolderBrowser = {
  currentPath: string;
  parentPath: string;
  roots: string[];
  folders: Array<{
    name: string;
    path: string;
  }>;
};

type OrchestrationFile = {
  path: string;
  name: string;
  directory: string;
  extension: string;
  sizeBytes: number;
  modifiedAt: string;
};

type OrchestrationFileContent = {
  path: string;
  extension: string;
  modifiedAt: string;
  content: string;
};

const riskLabels: Record<RiskLevel, string> = {
  low: "정상",
  medium: "주의",
  high: "높은 위험",
  blocked: "확인 필요",
};

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

function App() {
  const [snapshots, setSnapshots] = React.useState<ProjectSnapshot[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState("");
  const [actionMessage, setActionMessage] = React.useState("");
  const [customInstruction, setCustomInstruction] = React.useState("");
  const [commandText, setCommandText] = React.useState("");
  const [discordPreview, setDiscordPreview] = React.useState("");
  const [documentFiles, setDocumentFiles] = React.useState<OrchestrationFile[]>([]);
  const [selectedDocumentPath, setSelectedDocumentPath] = React.useState("");
  const [documentContent, setDocumentContent] = React.useState<OrchestrationFileContent | null>(null);
  const [isDocumentLoading, setIsDocumentLoading] = React.useState(false);
  const [portfolioMode, setPortfolioMode] = React.useState(false);
  const [folderBrowser, setFolderBrowser] = React.useState<FolderBrowser | null>(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = React.useState(false);
  const [isFolderLoading, setIsFolderLoading] = React.useState(false);
  const [formState, setFormState] = React.useState({
    name: "",
    path: "",
    type: "unknown",
    tags: "",
  });

  const selected = snapshots.find((snapshot) => snapshot.id === selectedId) ?? snapshots[0];
  const orchestrationReady = snapshots.filter((snapshot) => snapshot.files?.orchestration?.complete).length;
  const activeProjects = snapshots.filter((snapshot) => snapshot.files?.orchestrationDashboard?.phase === "진행 중").length;
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

  async function copyText(value: string, id: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function loadFolders(targetPath = "") {
    setIsFolderLoading(true);
    setError("");

    try {
      const search = targetPath ? `?path=${encodeURIComponent(targetPath)}` : "";
      const response = await fetch(`/api/folders${search}`);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as null | { error?: string };
        throw new Error(body?.error ?? `폴더를 읽지 못했습니다: ${response.status}`);
      }

      setFolderBrowser((await response.json()) as FolderBrowser);
      setIsFolderPickerOpen(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "알 수 없는 오류");
    } finally {
      setIsFolderLoading(false);
    }
  }

  async function openFolderPicker() {
    if (folderBrowser) {
      setIsFolderPickerOpen((current) => !current);
      return;
    }

    await loadFolders(formState.path.trim());
  }

  function selectFolder(folderPath: string) {
    setFormState((current) => ({ ...current, path: folderPath }));
    setIsFolderPickerOpen(false);
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

  function displayText(value: string) {
    if (!portfolioMode || !selected) {
      return value;
    }

    return value
      .replaceAll(selected.path, "[로컬 경로 숨김]")
      .replaceAll(selected.name, displayProjectName(selected));
  }

  function getOrchestrationDoc(snapshot: ProjectSnapshot, key: OrchestrationDocKey) {
    return snapshot.files.orchestrationDashboard.documents.find((doc) => doc.key === key);
  }

  function summarizeDocument(snapshot: ProjectSnapshot, key: OrchestrationDocKey, fallback: string) {
    const content = getOrchestrationDoc(snapshot, key)?.content || "";
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
      .filter((line) => line && line !== "-")
      .slice(0, 4);

    return lines.join("\n") || fallback;
  }

  async function loadProjectDocument(snapshot: ProjectSnapshot, documentPath: string) {
    if (!documentPath) {
      setDocumentContent(null);
      return;
    }

    setIsDocumentLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${snapshot.id}/orchestration-file?path=${encodeURIComponent(documentPath)}`,
      );
      const body = (await response.json().catch(() => null)) as null | OrchestrationFileContent | { error?: string };

      if (!response.ok) {
        throw new Error((body as { error?: string } | null)?.error ?? `문서를 읽지 못했습니다: ${response.status}`);
      }

      setSelectedDocumentPath(documentPath);
      setDocumentContent(body as OrchestrationFileContent);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setIsDocumentLoading(false);
    }
  }

  async function loadProjectDocuments(snapshot: ProjectSnapshot) {
    setDocumentFiles([]);
    setDocumentContent(null);
    setSelectedDocumentPath("");

    try {
      const response = await fetch(`/api/projects/${snapshot.id}/orchestration-files`);
      const body = (await response.json().catch(() => null)) as null | OrchestrationFile[] | { error?: string };

      if (!response.ok) {
        throw new Error((body as { error?: string } | null)?.error ?? `문서 목록을 읽지 못했습니다: ${response.status}`);
      }

      const files = (body as OrchestrationFile[]).filter((file) => file.extension !== ".html");
      const defaultPath =
        files.find((file) => file.path === "STATUS.md")?.path ||
        files.find((file) => file.path === "CURRENT_TASK.md")?.path ||
        files[0]?.path ||
        "";

      setDocumentFiles(files);

      if (defaultPath) {
        await loadProjectDocument(snapshot, defaultPath);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    }
  }

  function generateCommandText(snapshot: ProjectSnapshot) {
    const instruction = customInstruction.trim() || "현재 오케스트레이션 문서를 기준으로 다음 작업을 진행해줘.";
    const status = getOrchestrationDoc(snapshot, "status")?.content || "STATUS.md 내용 없음";
    const currentTask = getOrchestrationDoc(snapshot, "currentTask")?.content || "CURRENT_TASK.md 내용 없음";
    const nextTasks = getOrchestrationDoc(snapshot, "nextTasks")?.content || "NEXT_TASKS.md 내용 없음";
    const scopeGuard = snapshot.files.orchestration.required.find((entry) => entry.label === "SCOPE_GUARD")?.exists
      ? "docs/orchestration/SCOPE_GUARD.md를 확인하고 범위를 넘기지 마."
      : "SCOPE_GUARD.md가 없으니 범위가 애매하면 먼저 확인해.";

    setCommandText(
      [
        `${displayProjectName(snapshot)} 오케스트레이션 작업 지시`,
        "",
        "사용자 명령:",
        `- ${instruction}`,
        "",
        "프로젝트 현재 상태:",
        status,
        "",
        "현재 작업:",
        currentTask,
        "",
        "다음 작업:",
        nextTasks,
        "",
        "작업 규칙:",
        "- 먼저 STATUS/CURRENT_TASK/NEXT_TASKS 기준으로 현재 판단을 요약해줘.",
        "- 필요한 변경만 작게 진행해줘.",
        "- 검증 후 STATUS, CURRENT_TASK, NEXT_TASKS, devlog/reports를 갱신해줘.",
        `- ${scopeGuard}`,
      ].join("\n"),
    );
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

  async function sendDiscordReport(snapshot: ProjectSnapshot, dryRun: boolean) {
    setIsDiscordLoading(true);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch(`/api/projects/${snapshot.id}/discord-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => null)) as null | { error?: string; payload?: unknown };

      if (!response.ok) {
        throw new Error(body?.error ?? `Discord report failed: ${response.status}`);
      }

      if (dryRun) {
        setDiscordPreview(JSON.stringify(body?.payload ?? {}, null, 2));
        setActionMessage("Discord 보고 미리보기를 생성했습니다.");
      } else {
        setDiscordPreview("");
        setActionMessage("Discord로 오케스트레이션 보고를 보냈습니다.");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setIsDiscordLoading(false);
    }
  }

  React.useEffect(() => {
    void loadSnapshots();
  }, []);

  React.useEffect(() => {
    setCommandText("");
    setDiscordPreview("");
    if (selected) {
      void loadProjectDocuments(selected);
    }
  }, [selected?.id]);

  return (
    <main className="appShell">
      <section className="topBar">
        <div>
          <p className="eyebrow">로컬 AI 개발 관제실</p>
          <h1>AI Project Orchestrator</h1>
          <p className="topDescription">여러 프로젝트의 오케스트레이션 문서를 읽고 현재 작업, 다음 작업, 보고 흐름을 한 화면에서 관리합니다.</p>
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
        <Metric label="진행 중" value={activeProjects.toString()} />
        <Metric label="인터페이스 완료" value={`${orchestrationReady}/${snapshots.length}`} />
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
              <span className="pathInputGroup">
                <input
                  type="text"
                  value={formState.path}
                  onChange={(event) => setFormState((current) => ({ ...current, path: event.target.value }))}
                  placeholder="C:\\Projects\\MyProject"
                  required
                />
                <button className="browseButton" type="button" onClick={() => void openFolderPicker()}>
                  <FolderOpen size={15} />
                  찾아보기
                </button>
              </span>
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

          {isFolderPickerOpen && folderBrowser ? (
            <section className="folderPicker" aria-label="폴더 선택">
              <div className="folderPickerHeader">
                <div>
                  <h3>폴더 선택</h3>
                  <p>{folderBrowser.currentPath}</p>
                </div>
                <button className="secondaryButton" type="button" onClick={() => selectFolder(folderBrowser.currentPath)}>
                  이 폴더 선택
                </button>
              </div>

              <div className="folderRootRow">
                {folderBrowser.roots.map((root) => (
                  <button
                    className={folderBrowser.currentPath === root ? "active" : ""}
                    key={root}
                    type="button"
                    onClick={() => void loadFolders(root)}
                  >
                    {root}
                  </button>
                ))}
              </div>

              <div className="folderToolbar">
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => void loadFolders(folderBrowser.parentPath)}
                  disabled={!folderBrowser.parentPath || isFolderLoading}
                >
                  상위 폴더
                </button>
                <button className="secondaryButton" type="button" onClick={() => setIsFolderPickerOpen(false)}>
                  닫기
                </button>
              </div>

              <div className="folderList">
                {folderBrowser.folders.length > 0 ? (
                  folderBrowser.folders.map((folder) => (
                    <div className="folderRow" key={folder.path}>
                      <button type="button" onClick={() => void loadFolders(folder.path)} disabled={isFolderLoading}>
                        <FolderOpen size={15} />
                        <span>{folder.name}</span>
                      </button>
                      <button type="button" onClick={() => selectFolder(folder.path)}>
                        선택
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="folderEmpty">하위 폴더가 없습니다.</p>
                )}
              </div>
            </section>
          ) : null}

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
                  <span>{snapshot.files.orchestrationDashboard.phase}</span>
                  <span>인터페이스 {snapshot.files.orchestration.requiredPresent}/{snapshot.files.orchestration.requiredTotal}</span>
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
                  <p className="statusDescription">{selected.files.orchestrationDashboard.phase}</p>
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

              <section className="workCommandPanel">
                <div className="sectionTitle">
                  <h3>명령</h3>
                  <span>문서 기준으로 지시하기</span>
                </div>
                <div className="instructionBrief">
                  <div>
                    <span>현재 작업</span>
                    <p>{displayText(summarizeDocument(selected, "currentTask", "CURRENT_TASK.md에 현재 작업이 없습니다."))}</p>
                  </div>
                  <div>
                    <span>다음 지시 기준</span>
                    <p>{displayText(summarizeDocument(selected, "nextTasks", "NEXT_TASKS.md에 다음 후보가 없습니다."))}</p>
                  </div>
                </div>
                <label className="commandInput">
                  내가 내릴 명령
                  <textarea
                    value={customInstruction}
                    onChange={(event) => setCustomInstruction(event.target.value)}
                    placeholder="예: CURRENT_TASK의 완료 기준까지 진행하고, 검증 후 STATUS와 devlog를 갱신해줘"
                  />
                </label>
                <div className="commandActions">
                  <button className="primaryButton" type="button" onClick={() => generateCommandText(selected)}>
                    명령 만들기
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => void copyText(displayText(commandText), selected.id)}
                    disabled={!commandText}
                  >
                    <Clipboard size={16} />
                    {copied === selected.id ? "복사됨" : "복사"}
                  </button>
                </div>
                {commandText ? <pre className="commandPreview">{displayText(commandText)}</pre> : null}
              </section>

              <section className="generatedDashboardPanel">
                <div className="sectionTitle">
                  <h3>HTML 대시보드</h3>
                  <a
                    className="secondaryButton compactButton"
                    href={`/api/projects/${selected.id}/orchestration-dashboard`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={15} />
                    새 창
                  </a>
                </div>
                <iframe
                  className="orchestrationFrame"
                  key={selected.id}
                  src={`/api/projects/${selected.id}/orchestration-dashboard`}
                  title={`${displayProjectName(selected)} 오케스트레이션 HTML 대시보드`}
                />
              </section>

              <section className="documentBrowserPanel">
                <div className="sectionTitle">
                  <h3>개발 문서</h3>
                  <span>docs/orchestration</span>
                </div>
                <div className="documentBrowser">
                  <div className="documentList">
                    {documentFiles.length > 0 ? (
                      documentFiles.map((file) => (
                        <button
                          className={selectedDocumentPath === file.path ? "active" : ""}
                          key={file.path}
                          type="button"
                          onClick={() => void loadProjectDocument(selected, file.path)}
                        >
                          <span>{file.name}</span>
                          {file.directory ? <small>{file.directory}</small> : null}
                        </button>
                      ))
                    ) : (
                      <p>볼 수 있는 개발 문서가 없습니다.</p>
                    )}
                  </div>
                  <div className="documentPreview">
                    <div>
                      <strong>{selectedDocumentPath || "문서 미선택"}</strong>
                      <span>{isDocumentLoading ? "읽는 중" : documentContent?.extension || ""}</span>
                    </div>
                    <pre>{documentContent ? displayText(documentContent.content) : "왼쪽에서 문서를 선택하세요."}</pre>
                  </div>
                </div>
              </section>

              <section className="orchestrationPanel">
                <div className="sectionTitle compact">
                  <h3>오케스트레이션 인터페이스</h3>
                  <span>
                    필수 {selected.files.orchestration.requiredPresent}/{selected.files.orchestration.requiredTotal}
                  </span>
                </div>
                <div
                  className="interfaceMeter"
                  aria-label="오케스트레이션 필수 문서 완료율"
                  style={{
                    "--interface-progress": `${Math.round(
                      (selected.files.orchestration.requiredPresent /
                        Math.max(1, selected.files.orchestration.requiredTotal)) *
                        100,
                    )}%`,
                  } as React.CSSProperties}
                >
                  <span />
                </div>
                <div className="orchestrationGrid">
                  {selected.files.orchestration.required.map((entry) => (
                    <div className={entry.exists ? "ready" : "missing"} key={entry.path}>
                      <FileText size={15} />
                      <span>{entry.label}</span>
                      <strong>{entry.exists ? "있음" : "없음"}</strong>
                    </div>
                  ))}
                </div>
                {selected.files.orchestration.missingRequired.length > 0 ? (
                  <p className="orchestrationNote">
                    진행 중인 프로젝트는 마이그레이션 프롬프트로 기존 문서를 읽고 새 인터페이스에 매핑하는 것이 좋습니다.
                  </p>
                ) : (
                  <p className="orchestrationNote ready">필수 코어 문서가 모두 준비되어 있습니다.</p>
                )}
                <details className="recommendedDocs">
                  <summary>
                    권장 확장 {selected.files.orchestration.recommendedPresent}/
                    {selected.files.orchestration.recommendedTotal}
                  </summary>
                  <div className="orchestrationGrid compact">
                    {selected.files.orchestration.recommended.map((entry) => (
                      <div className={entry.exists ? "ready" : "missing"} key={entry.path}>
                        <FileText size={15} />
                        <span>{entry.label}</span>
                        <strong>{entry.exists ? "있음" : "없음"}</strong>
                      </div>
                    ))}
                  </div>
                </details>
              </section>

              <section className="reportPanel">
                <div className="sectionTitle">
                  <h3>보고</h3>
                  <span>오케스트레이터 중앙 전송</span>
                </div>
                <p className="promptHelp">
                  Discord 보고는 각 프로젝트가 아니라 AI Project Orchestrator의 루트 <code>.env</code>에 있는 웹훅으로만 보냅니다.
                </p>
                <div className="commandActions">
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => void sendDiscordReport(selected, true)}
                    disabled={isDiscordLoading}
                  >
                    <MessageSquare size={16} />
                    미리보기
                  </button>
                  <button
                    className="primaryButton"
                    type="button"
                    onClick={() => void sendDiscordReport(selected, false)}
                    disabled={isDiscordLoading}
                  >
                    <MessageSquare size={16} />
                    Discord 보내기
                  </button>
                </div>
                {discordPreview ? <pre className="commandPreview">{displayText(discordPreview)}</pre> : null}
              </section>
            </>
          ) : (
            <div className="emptyDetail">
              <h2>프로젝트를 먼저 추가하세요</h2>
              <p>프로젝트가 선택되어야 오케스트레이션 문서와 보고 메뉴가 표시됩니다.</p>
            </div>
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

function MarkdownPanel({
  title,
  doc,
  portfolioMode,
  project,
}: {
  title: string;
  doc: ProjectSnapshot["files"]["orchestrationDashboard"]["documents"][number] | undefined;
  portfolioMode: boolean;
  project: ProjectSnapshot;
}) {
  const content = doc?.content || "아직 기록된 내용이 없습니다.";
  const displayContent = portfolioMode
    ? content.replaceAll(project.path, "[로컬 경로 숨김]").replaceAll(project.name, "프로젝트 예시")
    : content;

  return (
    <div className="markdownPanel">
      <div>
        <span>{title}</span>
        <strong>{doc?.hasContent ? doc.label : "미작성"}</strong>
      </div>
      <pre>{displayContent}</pre>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
