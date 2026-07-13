import { Link, useParams } from "react-router-dom";
import { useReleaseItemDetail } from "../hooks";
import { AiSummaryCard, ErrorState, Loading, SeverityCountsBar, ToolCountsTable } from "../components";

export function ReleaseItemDetailPage() {
  const { workItemId } = useParams<{ workItemId: string }>();
  const parsedId = Number(workItemId);
  const { data: item, isLoading, isError, error } = useReleaseItemDetail(parsedId);

  return (
    <div>
      <Link to="/" className="back-link">
        ← Back to all release items
      </Link>

      {isLoading && <Loading label="Loading release item..." />}
      {isError && <ErrorState message={error.message} />}

      {item && (
        <>
          <div className="page-header">
            <h1>{item.applicationName}</h1>
            {item.releaseDate && (
              <span className="muted-text">Release date: {new Date(item.releaseDate).toLocaleDateString()}</span>
            )}
          </div>

          <h2 className="section-title">Builds in this release</h2>
          <div className="card-list">
            {item.builds.map((build) => (
              <Link
                key={build.buildId}
                to={`/release-items/${item.workItemId}/builds/${build.buildId}`}
                className="card"
              >
                <div className="card-header">
                  <h3 className="card-title">Build {build.buildId}</h3>
                  <span className="branch-text">{build.sourceBranch}</span>
                </div>
                <SeverityCountsBar counts={build.totalCounts} />
                <div className="tool-counts-wrap">
                  <ToolCountsTable toolCounts={build.toolCounts} />
                </div>
                <AiSummaryCard summary={build.aiSummary} label="Build summary" />
              </Link>
            ))}
            {item.builds.length === 0 && <p className="muted-text">No builds found for this release item.</p>}
          </div>
        </>
      )}
    </div>
  );
}
