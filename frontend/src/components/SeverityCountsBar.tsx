import type { SeverityCounts } from "../api";
import { SEVERITY_LABELS, SEVERITY_ORDER } from "../api";

const SEVERITY_KEYS: Record<string, keyof SeverityCounts> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
};

/** Small colored badges, one per severity that has at least one issue. */
export function SeverityCountsBar({ counts }: { counts: SeverityCounts }) {
  const total = counts.critical + counts.high + counts.medium + counts.low + counts.info;
  if (total === 0) {
    return <span className="severity-clean">No issues found</span>;
  }
  return (
    <div className="severity-bar">
      {SEVERITY_ORDER.map((severity) => {
        const count = counts[SEVERITY_KEYS[severity]];
        if (count === 0) return null;
        return (
          <span key={severity} className={`severity-badge severity-${severity.toLowerCase()}`}>
            {SEVERITY_LABELS[severity]}: {count}
          </span>
        );
      })}
    </div>
  );
}
