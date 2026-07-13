import { Link, useParams } from "react-router-dom";
import { useBuildDetail } from "../hooks";
import { AiSummaryCard, ErrorState, IssueTable, Loading, type IssueWithRepo } from "../components";

export function BuildDetailPage() {
  const { workItemId, buildId } = useParams<{ workItemId: string; buildId: string }>();
  const { data: build, isLoading, isError, error } = useBuildDetail(Number(workItemId), Number(buildId));

  const repositories = build?.repositories ?? [];
  const issues: IssueWithRepo[] = repositories.flatMap((repo) =>
    repo.issues.map((issue) => ({ ...issue, repoName: repo.repoName })),
  );

  return (
    <div>
      <Link to={`/release-items/${workItemId}`} className="back-link">
        ← Back to release item
      </Link>

      {isLoading && <Loading label="Loading build details..." />}
      {isError && <ErrorState message={error.message} />}

      {build && (
        <>
          <div className="page-header">
            <h1>Build {build.buildId}</h1>
            <a href={build.pipelineUrl} target="_blank" rel="noreferrer" className="pipeline-link">
              View pipeline run ↗
            </a>
          </div>
          <p className="branch-text">Branch: {build.sourceBranch}</p>
          <p className="muted-text">
            {repositories.length === 0 && "No scanned repositories found for this build."}
            {repositories.length === 1 && `Repository: ${repositories[0].repoName}`}
            {repositories.length > 1 &&
              `Repositories (${repositories.length}): ${repositories.map((r) => r.repoName).join(", ")}`}
          </p>

          <AiSummaryCard summary={build.aiSummary} />

          <h2 className="section-title">Issues</h2>
          <IssueTable issues={issues} showRepoColumn={repositories.length > 1} />
        </>
      )}
    </div>
  );
}
