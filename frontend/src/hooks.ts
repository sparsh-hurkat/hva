// All data-fetching hooks in one place, built on React Query. The VITE_USE_MOCK_API flag
// picks which ScanApi implementation every hook here talks to.

import { useEffect, useRef } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { realApiClient, type GetBuildIssuesParams, type RunStatus, type ScanApi } from "./api";
import { mockApiClient } from "./mockData";

const api: ScanApi = import.meta.env.VITE_USE_MOCK_API === "true" ? mockApiClient : realApiClient;

/** Polls run status every 3s while a run is in progress, and refreshes the summary once it completes. */
export function useScanRunStatus() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["scanRunStatus"],
    queryFn: () => api.getCurrentRunStatus(),
    refetchInterval: (q) => (q.state.data?.status === "IN_PROGRESS" ? 3000 : false),
  });

  const previousStatus = useRef<RunStatus | undefined>(undefined);
  useEffect(() => {
    if (previousStatus.current === "IN_PROGRESS" && query.data?.status === "COMPLETED") {
      queryClient.invalidateQueries({ queryKey: ["scanSummary"] });
    }
    previousStatus.current = query.data?.status;
  }, [query.data?.status, queryClient]);

  return query;
}

/** Kicks off a scan run (button click). Refreshes run status right after so polling picks it up. */
export function useStartScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.startScan(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scanRunStatus"] }),
  });
}

export function useScanSummary() {
  return useQuery({ queryKey: ["scanSummary"], queryFn: () => api.getSummary() });
}

export function useReleaseItemDetail(workItemId: number) {
  return useQuery({
    queryKey: ["releaseItemDetail", workItemId],
    queryFn: () => api.getReleaseItemDetail(workItemId),
  });
}

export function useBuildDetail(workItemId: number, buildId: number) {
  return useQuery({
    queryKey: ["buildDetail", workItemId, buildId],
    queryFn: () => api.getBuildDetail(workItemId, buildId),
  });
}

/** Server-side paginated/sorted/searched issue list. Keeps the previous page's data on
 * screen while the next one loads, instead of flashing a loading state on every change. */
export function useBuildIssues(workItemId: number, buildId: number, params: GetBuildIssuesParams) {
  return useQuery({
    queryKey: ["buildIssues", workItemId, buildId, params],
    queryFn: () => api.getBuildIssues(workItemId, buildId, params),
    placeholderData: keepPreviousData,
  });
}
