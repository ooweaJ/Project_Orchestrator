import React from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, CheckCircle2, Clipboard, FileText, GitBranch, RefreshCw } from "lucide-react";
import "./styles.css";

type RiskLevel = "low" | "medium" | "high" | "blocked";

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
    recentFiles: string[];
    todoCount: number;
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

function riskRank(level: RiskLevel) {
  return ["low", "medium", "high", "blocked"].indexOf(level);
}

function App() {
  const [snapshots, setSnapshots] = React.useState<ProjectSnapshot[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState("");

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
      setSelectedId((current) => current || data[0]?.id || "");
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

  React.useEffect(() => {
    void loadSnapshots();
  }, []);

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

      <section className="workspace">
        <div className="projectList" aria-label="Projects">
          <div className="sectionTitle">
            <h2>Projects</h2>
            <span>{isLoading ? "Reading local state" : `${snapshots.length} registered`}</span>
          </div>

          {snapshots.map((snapshot) => (
            <button
              className={`projectCard ${selected?.id === snapshot.id ? "selected" : ""}`}
              key={snapshot.id}
              type="button"
              onClick={() => setSelectedId(snapshot.id)}
            >
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
                  <span>{selected.recommendedActions[0]?.label ?? "Diagnose"}</span>
                </div>
                <pre>{selected.recommendedActions[0]?.prompt ?? "No prompt generated."}</pre>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => void copyPrompt(selected.recommendedActions[0]?.prompt ?? "", selected.id)}
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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
