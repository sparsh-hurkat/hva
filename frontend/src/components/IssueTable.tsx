import type { ScanIssue } from "../api";
import { SEVERITY_LABELS, SEVERITY_ORDER } from "../api";

export interface IssueWithRepo extends ScanIssue {
  repoName: string;
}

const severityRank: Record<string, number> = Object.fromEntries(SEVERITY_ORDER.map((s, i) => [s, i]));

/** Flat table of every issue in a build - no per-repo expand/collapse, everything is visible at once. */
export function IssueTable({ issues, showRepoColumn }: { issues: IssueWithRepo[]; showRepoColumn: boolean }) {
  if (issues.length === 0) {
    return <p className="empty-state">No issues found for this build.</p>;
  }
  const sorted = [...issues].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return (
    <table className="issue-table">
      <thead>
        <tr>
          <th>Severity</th>
          <th>Issue</th>
          {showRepoColumn && <th>Repository</th>}
          <th>Tool</th>
          <th>Detected</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((issue) => (
          <tr key={issue.id}>
            <td>
              <span className={`severity-badge severity-${issue.severity.toLowerCase()}`}>
                {SEVERITY_LABELS[issue.severity]}
              </span>
            </td>
            <td>
              <div className="issue-title">{issue.title}</div>
              <div className="issue-description">{issue.description}</div>
            </td>
            {showRepoColumn && <td className="repo-cell">{issue.repoName}</td>}
            <td>{issue.toolName}</td>
            <td className="date-cell">{issue.detectedAt ? new Date(issue.detectedAt).toLocaleDateString() : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
