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
type PromptKind = "diagnose" | "commit" | "docs" | "review";

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
  recommendedActions: Array<{
    kind: string;
    label: string;
    prompt: string;
  }>;
  updatedAt: string;
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  blocked: "Blocked",
};

const promptKindLabels: Record<PromptKind, string> = {
  diagnose: "Diagnose",
  commit: "Commit",
  docs: "Docs",
  review: "Review",
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
  const [formState, setFormState] = React.useState({
    name: "",
    path: "",
    type: "unknown",
    tags: "",
  });

  const selected = snapshots.find((snapshot) => snapshot.id === selectedId) ?? snapshots[0];
  const riskyProjects = snapshots.filter((snapshot) => riskRank(snapshot.riskLevel) >= riskRank("medium")).length;
  const needsCommit = snapshots.filter((snapshot) => snapshot.git.dirty || snapshot.git.untracked.length > 0).length;
  const needsDocs = snapshots.filter(
    (snapshot) => !snapshot.files.hasAgentsMd || !snapshot.files.hasReadme || !snapshot.files.hasDocsStatus,
  ).length;
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
      setActionMessage(`${project.name} added.`);
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
      setActionMessage(`${snapshot.name} removed from dashboard.`);
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
          <p className="eyebrow">Local AI Development Command Center</p>
          <h1>AI Project Orchestrator</h1>
        </div>
        <button className="primaryButton" type="button" onClick={() => void loadSnapshots()} disabled={isLoading}>
          <RefreshCw size={17} />
          {isLoading ? "Scanning" : "Rescan"}
        </button>
      </section>

      <section className="summaryGrid" aria-label="Project summary">
        <Metric label="Projects" value={snapshots.length.toString()} />
        <Metric label="Risky" value={riskyProjects.toString()} />
        <Metric label="Need Commit" value={needsCommit.toString()} />
        <Metric label="Need Docs" value={needsDocs.toString()} />
        <Metric label="Last Scan" value={lastScan ? new Date(lastScan).toLocaleTimeString("ko-KR") : "-"} />
      </section>

      {error ? <div className="errorBox">{error}</div> : null}
      {actionMessage ? <div className="successBox">{actionMessage}</div> : null}

      <section className="workspace">
        <div className="projectList" aria-label="Projects">
          <div className="sectionTitle">
            <h2>Projects</h2>
            <span>{isLoading ? "Reading local state" : `${snapshots.length} registered`}</span>
          </div>

          <form className="projectForm" onSubmit={(event) => void addProject(event)}>
            <label>
              Name
              <input
                type="text"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="LETHE Prototype"
                required
              />
            </label>
            <label>
              Path
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
                Type
                <select
                  value={formState.type}
                  onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="unknown">unknown</option>
                  <option value="web">web</option>
                  <option value="web-game">web-game</option>
                  <option value="unity">unity</option>
                  <option value="unreal">unreal</option>
                  <option value="portfolio">portfolio</option>
                  <option value="node">node</option>
                  <option value="docs">docs</option>
                </select>
              </label>
              <label>
                Tags
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
              {isSaving ? "Saving" : "Add Project"}
            </button>
          </form>

          {snapshots.map((snapshot) => (
            <article
              className={`projectCard ${selected?.id === snapshot.id ? "selected" : ""}`}
              key={snapshot.id}
            >
              <button className="cardSelect" type="button" onClick={() => setSelectedId(snapshot.id)}>
                <div className="cardHeader">
                  <div>
                    <h3>{snapshot.name}</h3>
                    <p>{snapshot.type}</p>
                  </div>
                  <RiskBadge level={snapshot.riskLevel} />
                </div>

                <p className="pathLine">{snapshot.path}</p>

                <div className="cardSignals">
                  <span>
                    <GitBranch size={14} />
                    {snapshot.git.branch || "no branch"}
                  </span>
                  <span>{snapshot.git.dirty ? "dirty" : "clean"}</span>
                  <span>{snapshot.exists ? "exists" : "missing"}</span>
                </div>
              </button>
              <button className="iconButton danger" type="button" onClick={() => void deleteProject(snapshot)}>
                <Trash2 size={15} />
                <span>Remove</span>
              </button>
            </article>
          ))}

          {!isLoading && snapshots.length === 0 ? (
            <div className="emptyBox">Add projects to `data/projects.json` to begin scanning.</div>
          ) : null}
        </div>

        <div className="detailPanel">
          {selected ? (
            <>
              <div className="detailHeader">
                <div>
                  <p className="eyebrow">Selected Project</p>
                  <h2>{selected.name}</h2>
                </div>
                <RiskBadge level={selected.riskLevel} />
              </div>

              <div className="detailGrid">
                <InfoBlock label="Branch" value={selected.git.branch || "unknown"} />
                <InfoBlock label="Latest Commit" value={selected.git.latestCommit?.message ?? "none"} />
                <InfoBlock label="Upstream" value={selected.git.hasUpstream ? "connected" : "missing"} />
                <InfoBlock label="Ahead / Behind" value={`${selected.git.ahead} / ${selected.git.behind}`} />
              </div>

              <div className="panelRow">
                <StatusGroup title="Git Status">
                  <Signal label="Staged" value={selected.git.staged.length} />
                  <Signal label="Modified" value={selected.git.modified.length} />
                  <Signal label="Untracked" value={selected.git.untracked.length} />
                </StatusGroup>

                <StatusGroup title="Important Docs">
                  <DocSignal label="AGENTS.md" ok={selected.files.hasAgentsMd} />
                  <DocSignal label="README.md" ok={selected.files.hasReadme} />
                  <DocSignal label="CODEX_STATUS" ok={selected.files.hasDocsStatus} />
                </StatusGroup>
              </div>

              <section className="fileSignalsPanel">
                <div className="sectionTitle compact">
                  <h3>File Signals</h3>
                  <span>{selected.files.scannedFiles} scanned</span>
                </div>
                <div className="fileSignalGrid">
                  <Signal label="TODO/FIXME/BUG" value={selected.files.todoCount} />
                  <Signal label="Large Files" value={selected.files.largeFiles.length} />
                  <Signal label="Recent Files" value={selected.files.recentFiles.length} />
                </div>
                {selected.files.truncated ? (
                  <p className="signalNote">Scan was capped to avoid reading too many files.</p>
                ) : null}
                <FileList
                  emptyText="No recent files found."
                  items={selected.files.recentFiles.slice(0, 5).map((file) => ({
                    label: file.path,
                    meta: new Date(file.modifiedAt).toLocaleString("ko-KR"),
                  }))}
                  title="Recent"
                />
                <FileList
                  emptyText="No large files found."
                  items={selected.files.largeFiles.slice(0, 5).map((file) => ({
                    label: file.path,
                    meta: formatBytes(file.sizeBytes),
                  }))}
                  title="Large"
                />
                <FileList
                  emptyText="No TODO/FIXME/BUG comments found."
                  items={selected.files.todoItems.slice(0, 5).map((item) => ({
                    label: `${item.path}:${item.line}`,
                    meta: item.text,
                  }))}
                  title="TODO"
                />
              </section>

              <section className="riskPanel">
                <h3>Risks</h3>
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
                    <span>No major risks detected.</span>
                  </div>
                )}
              </section>

              <section className="promptPanel">
                <div className="sectionTitle">
                  <h3>Codex Prompt</h3>
                  <span>{isPromptLoading ? "Generating" : promptKindLabels[promptKind]}</span>
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
                <pre>{promptText || selected.recommendedActions[0]?.prompt || "No prompt generated."}</pre>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => void copyPrompt(promptText || selected.recommendedActions[0]?.prompt || "", selected.id)}
                >
                  <Clipboard size={16} />
                  {copied === selected.id ? "Copied" : "Copy Prompt"}
                </button>
              </section>
            </>
          ) : (
            <div className="emptyDetail">No project selected.</div>
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
      <strong>{ok ? "yes" : "missing"}</strong>
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
