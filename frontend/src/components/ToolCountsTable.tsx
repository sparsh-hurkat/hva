import type { ToolSeverityCounts } from "../api";
import { SeverityCountsBar } from "./SeverityCountsBar";

/** Breaks issue counts out by which scanning tool found them. */
export function ToolCountsTable({ toolCounts }: { toolCounts: ToolSeverityCounts[] }) {
  if (toolCounts.length === 0) {
    return <span className="severity-clean">No issues found</span>;
  }
  return (
    <table className="tool-counts-table">
      <tbody>
        {toolCounts.map((tool) => (
          <tr key={tool.toolName}>
            <td className="tool-name">{tool.toolName}</td>
            <td>
              <SeverityCountsBar counts={tool.counts} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
