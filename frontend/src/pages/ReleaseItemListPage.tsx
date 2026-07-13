import { Link } from "react-router-dom";
import { useScanSummary } from "../hooks";
import { AiSummaryCard, ErrorState, Loading, SeverityCountsBar, StartScanButton, ToolCountsTable } from "../components";

export function ReleaseItemListPage() {
  const { data: summary, isLoading, isError, error } = useScanSummary();

  return (
    <div>
      <h1>Release security scan results</h1>
      <p className="page-subtitle">
        Start a scan to check every upcoming release for security issues, or review results from the last run.
      </p>

      <StartScanButton />

      {isLoading && <Loading label="Loading release items..." />}
      {isError && <ErrorState message={error.message} />}

      {summary && (
        <div className="card-list">
          {summary.releaseItems.map((item) => (
            <Link key={item.workItemId} to={`/release-items/${item.workItemId}`} className="card">
              <div className="card-header">
                <h2 className="card-title">{item.applicationName}</h2>
                {item.releaseDate && (
                  <span className="muted-text">Release date: {new Date(item.releaseDate).toLocaleDateString()}</span>
                )}
              </div>
              <SeverityCountsBar counts={item.totalCounts} />
              <div className="tool-counts-wrap">
                <ToolCountsTable toolCounts={item.toolCounts} />
              </div>
              <AiSummaryCard summary={item.aiSummary} />
            </Link>
          ))}
          {summary.releaseItems.length === 0 && (
            <p className="muted-text">No release work items found for the current run.</p>
          )}
        </div>
      )}
    </div>
  );
}
