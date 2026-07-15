// Static fixture data + a ScanApi implementation built from it. No simulated network delay
// or staged progress timers - it just returns data directly, so it's easy to read and debug.

import {
  countsFromIssues,
  toolCountsFromIssues,
  SEVERITY_ORDER,
  type BuildDetail,
  type IssueSortColumn,
  type IssuesPage,
  type ReleaseItemDetail,
  type ScanApi,
  type ScanIssue,
  type ScanRunStatus,
  type ScanSummary,
  type Severity,
} from "./api";

const severityRank: Record<string, number> = Object.fromEntries(SEVERITY_ORDER.map((s, i) => [s, i]));

// Stands in for what a real backend would do server-side: sort the flattened issue list
// by the requested column before paginating.
function compareIssues(a: ScanIssue, b: ScanIssue, column: IssueSortColumn): number {
  switch (column) {
    case "severity":
      return severityRank[a.severity] - severityRank[b.severity];
    case "title":
      return a.title.localeCompare(b.title);
    case "tool":
      return a.toolName.localeCompare(b.toolName);
    case "detected":
      return (a.detectedAt ?? "").localeCompare(b.detectedAt ?? "");
  }
}

// Fixture issues omit repoName - it's implicit from the FixtureRepo they're nested under,
// and only gets attached when producing the flattened, paginated API response.
type FixtureIssue = Omit<ScanIssue, "repoName">;

interface FixtureRepo {
  repoName: string;
  sva: string;
  sca: string;
  issues: FixtureIssue[];
}

interface FixtureBuild {
  buildId: number;
  pipelineId: number;
  pipelineUrl: string;
  sourceBranch: string;
  aiSummary: string;
  repositories: FixtureRepo[];
}

interface FixtureReleaseItem {
  workItemId: number;
  applicationName: string;
  releaseDate: string;
  aiSummary: string;
  builds: FixtureBuild[];
}

function issue(
  id: string,
  title: string,
  severity: Severity,
  description: string,
  toolName: string,
  detectedAt: string,
  fixDetails: string | null,
): FixtureIssue {
  return { id, title, severity, description, toolName, detectedAt, fixDetails };
}

const fixtureReleaseItems: FixtureReleaseItem[] = [
  {
    workItemId: 10432,
    applicationName: "Ratings Portal",
    releaseDate: "2026-07-20",
    aiSummary:
      "Ratings Portal has 2 builds in this release. One open-source library has a critical vulnerability that " +
      "should be patched before release; everything else found is lower priority and can be scheduled normally.",
    builds: [
      {
        buildId: 88231,
        pipelineId: 42,
        pipelineUrl: "https://dev.azure.com/spglobal/ratingsproducts/_build/results?buildId=88231",
        sourceBranch: "refs/heads/release/2026.07",
        aiSummary:
          "This build found 1 critical and 2 high-severity issues, mostly outdated dependencies in the API " +
          "service. The critical issue is a known remote-code-execution flaw in a logging library - recommend " +
          "patching before this build ships.",
        repositories: [
          {
            repoName: "ratings-portal-api",
            sva: "48213",
            sca: "sca-token-ratings-portal-api-01",
            issues: [
              issue(
                "MEND-9911",
                "Remote code execution in logging-lib 2.14.1",
                "CRITICAL",
                "A known remote-code-execution vulnerability affects the bundled logging library. Upgrade to 2.17.1 or later.",
                "MEND",
                "2026-07-19T14:32:00Z",
                "Upgrade logging-lib to 2.17.1 or later and redeploy.",
              ),
              issue(
                "MEND-9902",
                "Outdated HTTP client with request-smuggling issue",
                "HIGH",
                "The bundled HTTP client version is affected by a request-smuggling vulnerability.",
                "MEND",
                "2026-07-19T14:32:00Z",
                "Upgrade the HTTP client dependency to the latest patched version.",
              ),
              issue(
                "MEND-9700",
                "Hardcoded credential detected in config loader",
                "HIGH",
                "A hardcoded credential was found in the configuration loading code path.",
                "FORTIFY",
                "2026-07-19T14:40:00Z",
                "Remove the hardcoded credential and load it from a secrets manager instead.",
              ),
              issue(
                "FORTIFY-198",
                "Unused dependency increases attack surface",
                "LOW",
                "An unused dependency is still bundled and should be removed.",
                "FORTIFY",
                "2026-07-19T14:40:00Z",
                "Remove the unused dependency from the build.",
              ),
            ],
          },
          {
            repoName: "ratings-portal-web",
            sva: "48214",
            sca: "sca-token-ratings-portal-web-01",
            issues: [
              issue(
                "WIZ-441",
                "Reflected XSS in search input",
                "MEDIUM",
                "User-controlled search input is reflected without sufficient sanitization.",
                "WIZ",
                "2026-07-19T15:05:00Z",
                "Sanitize and encode the search input before rendering it back to the page.",
              ),
            ],
          },
        ],
      },
      {
        buildId: 88240,
        pipelineId: 43,
        pipelineUrl: "https://dev.azure.com/spglobal/ratingsproducts/_build/results?buildId=88240",
        sourceBranch: "refs/heads/release/2026.07",
        aiSummary: "This build is clean aside from a couple of informational findings - no action needed before release.",
        repositories: [
          {
            repoName: "ratings-portal-batch",
            sva: "48220",
            sca: "sca-token-ratings-portal-batch-01",
            issues: [
              issue(
                "MEND-9950",
                "Newer version available for JSON parsing library",
                "INFO",
                "A newer, non-security-related version of the JSON parsing library is available.",
                "MEND",
                "2026-07-19T16:00:00Z",
                null,
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    workItemId: 10501,
    applicationName: "Market Data Gateway",
    releaseDate: "2026-07-18",
    aiSummary:
      "Market Data Gateway looks good for this release - only low and informational findings across its one " +
      "build, nothing that should block shipping.",
    builds: [
      {
        buildId: 88305,
        pipelineId: 51,
        pipelineUrl: "https://dev.azure.com/spglobal/ratingsproducts/_build/results?buildId=88305",
        sourceBranch: "refs/heads/release/2026.07",
        aiSummary: "No critical or high-severity issues found. A couple of minor cleanup items were flagged.",
        repositories: [
          {
            repoName: "market-data-gateway",
            sva: "51110",
            sca: "sca-token-market-data-gateway-01",
            issues: [
              issue(
                "MEND-9977",
                "Deprecated encoding utility still referenced",
                "LOW",
                "A deprecated but not vulnerable encoding utility is still referenced in one module.",
                "MEND",
                "2026-07-17T10:12:00Z",
                "Replace the deprecated utility with the standard library equivalent.",
              ),
              issue(
                "FORTIFY-305",
                "Duplicate code block flagged for cleanup",
                "INFO",
                "A duplicated code block was flagged for maintainability, not a security issue.",
                "FORTIFY",
                "2026-07-17T10:20:00Z",
                null,
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    workItemId: 10577,
    applicationName: "Analytics Pipeline",
    releaseDate: "2026-07-25",
    aiSummary:
      "Analytics Pipeline has the most open issues of this release - 1 critical and 3 high-severity findings " +
      "spread across 2 builds, largely from outdated data-processing dependencies. Recommend prioritizing a " +
      "dependency upgrade pass before this ships.",
    builds: [
      {
        buildId: 88410,
        pipelineId: 60,
        pipelineUrl: "https://dev.azure.com/spglobal/ratingsproducts/_build/results?buildId=88410",
        sourceBranch: "refs/heads/release/2026.07",
        aiSummary:
          "1 critical deserialization vulnerability found in the data ingestion service, plus 2 high-severity " +
          "dependency issues. This is the priority build to fix before release.",
        repositories: [
          {
            repoName: "analytics-ingestion",
            sva: "60210",
            sca: "sca-token-analytics-ingestion-01",
            issues: [
              issue(
                "MEND-9700",
                "Insecure deserialization in data ingestion library",
                "CRITICAL",
                "The data ingestion library deserializes untrusted input unsafely, allowing arbitrary code execution. Upgrade to the patched version immediately.",
                "MEND",
                "2026-07-24T09:00:00Z",
                "Upgrade the data ingestion library to the patched version and disable unsafe deserialization.",
              ),
              issue(
                "MEND-9701",
                "Outdated compression library with denial-of-service issue",
                "HIGH",
                "The bundled compression library is affected by a denial-of-service vulnerability.",
                "MEND",
                "2026-07-24T09:00:00Z",
                "Upgrade the compression library to the version that addresses the denial-of-service issue.",
              ),
              issue(
                "WIZ-500",
                "SQL built via string concatenation",
                "HIGH",
                "A query is built via string concatenation instead of parameterized SQL.",
                "WIZ",
                "2026-07-24T09:15:00Z",
                "Replace string-concatenated SQL with parameterized queries.",
              ),
            ],
          },
        ],
      },
      {
        buildId: 88421,
        pipelineId: 61,
        pipelineUrl: "https://dev.azure.com/spglobal/ratingsproducts/_build/results?buildId=88421",
        sourceBranch: "refs/heads/release/2026.07",
        aiSummary: "1 additional high-severity issue found; everything else in this build is low priority.",
        repositories: [
          {
            repoName: "analytics-reporting",
            sva: "60225",
            sca: "sca-token-analytics-reporting-01",
            issues: [
              issue(
                "FORTIFY-410",
                "Missing access control check on export endpoint",
                "HIGH",
                "An internal export endpoint is missing an access control check.",
                "FORTIFY",
                "2026-07-24T11:30:00Z",
                "Add an authorization check to the export endpoint before returning data.",
              ),
              issue(
                "MEND-9720",
                "Minor version update available",
                "INFO",
                "A minor, non-security dependency update is available.",
                "MEND",
                "2026-07-24T11:35:00Z",
                null,
              ),
            ],
          },
        ],
      },
    ],
  },
];

function findReleaseItem(workItemId: number) {
  const item = fixtureReleaseItems.find((i) => i.workItemId === workItemId);
  if (!item) throw new Error(`Release work item ${workItemId} not found`);
  return item;
}

function findBuild(workItemId: number, buildId: number) {
  const build = findReleaseItem(workItemId).builds.find((b) => b.buildId === buildId);
  if (!build) throw new Error(`Build ${buildId} not found under release item ${workItemId}`);
  return build;
}

function allIssues(build: FixtureBuild) {
  return build.repositories.flatMap((repo) => repo.issues);
}

const mockRunStatus: ScanRunStatus = {
  runId: "mock-run-1",
  status: "COMPLETED",
  currentStep: "Done",
  startedAt: "2026-07-25T09:00:00Z",
  completedAt: "2026-07-25T09:45:00Z",
  error: null,
};

export const mockApiClient: ScanApi = {
  async startScan() {
    return { runId: mockRunStatus.runId };
  },

  async getCurrentRunStatus() {
    return mockRunStatus;
  },

  async getSummary(): Promise<ScanSummary> {
    return {
      runId: mockRunStatus.runId,
      status: mockRunStatus.status,
      releaseItems: fixtureReleaseItems.map((item) => {
        const issues = item.builds.flatMap(allIssues);
        return {
          workItemId: item.workItemId,
          applicationName: item.applicationName,
          releaseDate: item.releaseDate,
          toolCounts: toolCountsFromIssues(issues),
          totalCounts: countsFromIssues(issues),
          aiSummary: item.aiSummary,
        };
      }),
    };
  },

  async getReleaseItemDetail(workItemId): Promise<ReleaseItemDetail> {
    const item = findReleaseItem(workItemId);
    return {
      workItemId: item.workItemId,
      applicationName: item.applicationName,
      releaseDate: item.releaseDate,
      aiSummary: item.aiSummary,
      builds: item.builds.map((build) => {
        const issues = allIssues(build);
        return {
          buildId: build.buildId,
          pipelineId: build.pipelineId,
          pipelineUrl: build.pipelineUrl,
          sourceBranch: build.sourceBranch,
          toolCounts: toolCountsFromIssues(issues),
          totalCounts: countsFromIssues(issues),
          aiSummary: build.aiSummary,
        };
      }),
    };
  },

  async getBuildDetail(workItemId, buildId): Promise<BuildDetail> {
    const build = findBuild(workItemId, buildId);
    return {
      buildId: build.buildId,
      pipelineUrl: build.pipelineUrl,
      sourceBranch: build.sourceBranch,
      aiSummary: build.aiSummary,
      repositories: build.repositories.map((repo) => ({
        repoName: repo.repoName,
        sva: repo.sva,
        sca: repo.sca,
        totalCounts: countsFromIssues(repo.issues),
      })),
    };
  },

  async getBuildIssues(workItemId, buildId, params): Promise<IssuesPage> {
    const build = findBuild(workItemId, buildId);
    const allIssuesWithRepo: ScanIssue[] = build.repositories.flatMap((repo) =>
      repo.issues.map((issue) => ({ ...issue, repoName: repo.repoName })),
    );

    const search = params.search?.trim().toLowerCase();
    const filtered = search
      ? allIssuesWithRepo.filter((issue) =>
          `${issue.title} ${issue.description} ${issue.toolName} ${issue.repoName}`.toLowerCase().includes(search),
        )
      : allIssuesWithRepo;

    const sortBy = params.sortBy ?? "severity";
    const direction = params.sortDirection ?? "asc";
    const sorted = [...filtered].sort((a, b) => compareIssues(a, b, sortBy));
    if (direction === "desc") sorted.reverse();

    const start = (params.page - 1) * params.pageSize;
    const items = sorted.slice(start, start + params.pageSize);

    return { items, total: sorted.length, page: params.page, pageSize: params.pageSize };
  },
};
