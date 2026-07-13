// Types mirroring the backend's DTOs (plus the releaseDate/toolCounts/aiSummary fields
// recommended in readme-refined.md's follow-up section), shared severity helpers, the
// ScanApi contract, and the real backend client. mockData.ts implements the same
// ScanApi contract against static fixture data.

export type RunStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ToolSeverityCounts {
  toolName: string;
  counts: SeverityCounts;
}

export interface ScanRunStatus {
  runId: string;
  status: RunStatus;
  currentStep: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface ReleaseItemSummary {
  workItemId: number;
  applicationName: string;
  releaseDate: string | null;
  toolCounts: ToolSeverityCounts[];
  totalCounts: SeverityCounts;
  aiSummary: string;
}

export interface ScanSummary {
  runId: string;
  status: RunStatus;
  releaseItems: ReleaseItemSummary[];
}

export interface BuildSummary {
  buildId: number;
  pipelineId: number;
  pipelineUrl: string;
  sourceBranch: string;
  toolCounts: ToolSeverityCounts[];
  totalCounts: SeverityCounts;
  aiSummary: string;
}

export interface ReleaseItemDetail {
  workItemId: number;
  applicationName: string;
  releaseDate: string | null;
  aiSummary: string;
  builds: BuildSummary[];
}

export interface ScanIssue {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  toolName: string;
  detectedAt: string | null;
  fixDetails: string | null;
  /** Which repo this issue belongs to - always present now that issues are fetched flattened/paginated across repos. */
  repoName: string;
}

export interface RepositorySummary {
  repoName: string;
  sva: string;
  sca: string;
  totalCounts: SeverityCounts;
}

export interface BuildDetail {
  buildId: number;
  pipelineUrl: string;
  sourceBranch: string;
  aiSummary: string;
  repositories: RepositorySummary[];
}

export type IssueSortColumn = "severity" | "title" | "tool" | "detected";
export type SortDirection = "asc" | "desc";

export interface GetBuildIssuesParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: IssueSortColumn;
  sortDirection?: SortDirection;
}

export interface IssuesPage {
  items: ScanIssue[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScanApi {
  startScan(): Promise<{ runId: string }>;
  getCurrentRunStatus(): Promise<ScanRunStatus>;
  getSummary(): Promise<ScanSummary>;
  getReleaseItemDetail(workItemId: number): Promise<ReleaseItemDetail>;
  getBuildDetail(workItemId: number, buildId: number): Promise<BuildDetail>;
  getBuildIssues(workItemId: number, buildId: number, params: GetBuildIssuesParams): Promise<IssuesPage>;
}

// --- severity helpers, shared by mockData.ts and the display components ---

export const SEVERITY_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

export const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFO: "Info",
};

export function emptyCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

export function totalCount(counts: SeverityCounts): number {
  return counts.critical + counts.high + counts.medium + counts.low + counts.info;
}

export function severityKey(severity: Severity): keyof SeverityCounts {
  return severity.toLowerCase() as keyof SeverityCounts;
}

export function countsFromIssues(issues: Pick<ScanIssue, "severity">[]): SeverityCounts {
  const counts = emptyCounts();
  for (const issue of issues) {
    counts[severityKey(issue.severity)] += 1;
  }
  return counts;
}

export function toolCountsFromIssues(issues: Pick<ScanIssue, "severity" | "toolName">[]): ToolSeverityCounts[] {
  const byTool = new Map<string, Pick<ScanIssue, "severity" | "toolName">[]>();
  for (const issue of issues) {
    const existing = byTool.get(issue.toolName) ?? [];
    existing.push(issue);
    byTool.set(issue.toolName, existing);
  }
  return Array.from(byTool.entries()).map(([toolName, toolIssues]) => ({
    toolName,
    counts: countsFromIssues(toolIssues),
  }));
}

// Matches the org/project used throughout readme-refined.md's ADO API examples.
const ADO_ORG = "spglobal";
const ADO_PROJECT = "ratingsproducts";

/** Deep link to the actual ADO work item, for "open this in ADO" affordances. */
export function adoWorkItemUrl(workItemId: number): string {
  return `https://dev.azure.com/${ADO_ORG}/${ADO_PROJECT}/_workitems/edit/${workItemId}`;
}

// --- real backend client ---

const baseUrl = import.meta.env.VITE_API_BASE_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${response.status} ${body}`);
  }
  return response.json() as Promise<T>;
}

// NOTE: assumes the backend has been updated to return releaseDate / toolCounts / aiSummary /
// per-repo counts (instead of inline issues) / a paginated, searchable, sortable issues
// endpoint, as documented in readme-refined.md's follow-up section.
export const realApiClient: ScanApi = {
  startScan: () => request("/scan-runs/start", { method: "POST" }),
  getCurrentRunStatus: () => request<ScanRunStatus>("/scan-runs/current"),
  getSummary: () => request<ScanSummary>("/scan-runs/current/summary"),
  getReleaseItemDetail: (workItemId) =>
    request<ReleaseItemDetail>(`/scan-runs/current/release-items/${workItemId}`),
  getBuildDetail: (workItemId, buildId) =>
    request<BuildDetail>(`/scan-runs/current/release-items/${workItemId}/builds/${buildId}`),
  getBuildIssues: (workItemId, buildId, params) => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.search) query.set("search", params.search);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.sortDirection) query.set("sortDirection", params.sortDirection);
    return request<IssuesPage>(
      `/scan-runs/current/release-items/${workItemId}/builds/${buildId}/issues?${query.toString()}`,
    );
  },
};
