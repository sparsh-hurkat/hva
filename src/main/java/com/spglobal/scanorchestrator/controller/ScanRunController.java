package com.spglobal.scanorchestrator.controller;

import com.spglobal.scanorchestrator.dto.BuildDetailResponse;
import com.spglobal.scanorchestrator.dto.BuildSummaryDto;
import com.spglobal.scanorchestrator.dto.ReleaseItemDetailResponse;
import com.spglobal.scanorchestrator.dto.ReleaseItemSummaryDto;
import com.spglobal.scanorchestrator.dto.RepositoryDetailResponse;
import com.spglobal.scanorchestrator.dto.RepositorySummaryDto;
import com.spglobal.scanorchestrator.dto.ScanIssueDto;
import com.spglobal.scanorchestrator.dto.ScanRunStatusResponse;
import com.spglobal.scanorchestrator.dto.ScanSummaryResponse;
import com.spglobal.scanorchestrator.dto.SeverityCounts;
import com.spglobal.scanorchestrator.exception.ScanRunNotFoundException;
import com.spglobal.scanorchestrator.model.BuildInfo;
import com.spglobal.scanorchestrator.model.ReleaseWorkItem;
import com.spglobal.scanorchestrator.model.RepositoryInfo;
import com.spglobal.scanorchestrator.model.ScanIssue;
import com.spglobal.scanorchestrator.model.ScanRun;
import com.spglobal.scanorchestrator.service.ScanOrchestratorService;
import com.spglobal.scanorchestrator.store.ScanRunStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scan-runs")
public class ScanRunController {

    private final ScanOrchestratorService orchestratorService;
    private final ScanRunStore scanRunStore;

    public ScanRunController(ScanOrchestratorService orchestratorService, ScanRunStore scanRunStore) {
        this.orchestratorService = orchestratorService;
        this.scanRunStore = scanRunStore;
    }

    /** Button click hits this. Starts a run in the background; 409 if one is already in progress. */
    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> start() {
        String runId = orchestratorService.startRun();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("runId", runId));
    }

    /** Frontend polls this for progress. */
    @GetMapping("/current")
    public ScanRunStatusResponse currentStatus() {
        ScanRun run = currentRunOrThrow();
        return ScanRunStatusResponse.builder()
                .runId(run.getRunId())
                .status(run.getStatus())
                .currentStep(run.getCurrentStep())
                .startedAt(run.getStartedAt())
                .completedAt(run.getCompletedAt())
                .error(run.getError())
                .build();
    }

    /** Per-release-item severity counts. */
    @GetMapping("/current/summary")
    public ScanSummaryResponse summary() {
        ScanRun run = currentRunOrThrow();
        List<ReleaseItemSummaryDto> items = run.getReleaseWorkItems().stream()
                .map(this::toReleaseItemSummary)
                .toList();
        return ScanSummaryResponse.builder().runId(run.getRunId()).status(run.getStatus()).releaseItems(items).build();
    }

    /** Per-build severity counts under one release item. */
    @GetMapping("/current/release-items/{workItemId}")
    public ReleaseItemDetailResponse releaseItemDetail(@PathVariable int workItemId) {
        ReleaseWorkItem item = findReleaseItem(workItemId);
        List<BuildSummaryDto> builds = item.getBuilds().stream().map(this::toBuildSummary).toList();
        return ReleaseItemDetailResponse.builder()
                .workItemId(item.getWorkItemId())
                .applicationName(item.getApplicationName())
                .builds(builds)
                .build();
    }

    /** Per-repository severity counts under one build. */
    @GetMapping("/current/release-items/{workItemId}/builds/{buildId}")
    public BuildDetailResponse buildDetail(@PathVariable int workItemId, @PathVariable int buildId) {
        ReleaseWorkItem item = findReleaseItem(workItemId);
        BuildInfo build = findBuild(item, buildId);
        List<RepositorySummaryDto> repos = build.getRepositories().stream().map(this::toRepositorySummary).toList();
        return BuildDetailResponse.builder()
                .buildId(build.getBuildId())
                .pipelineUrl(build.getPipelineUrl())
                .sourceBranch(build.getSourceBranch())
                .repositories(repos)
                .build();
    }

    /** Full issue list for one repository - no counts, matches the "drill in and see detail" requirement. */
    @GetMapping("/current/release-items/{workItemId}/builds/{buildId}/repositories/{repoName}")
    public RepositoryDetailResponse repositoryDetail(@PathVariable int workItemId,
                                                       @PathVariable int buildId,
                                                       @PathVariable String repoName) {
        ReleaseWorkItem item = findReleaseItem(workItemId);
        BuildInfo build = findBuild(item, buildId);
        RepositoryInfo repo = findRepository(build, repoName);

        List<ScanIssueDto> issues = repo.getScanResults().stream()
                .flatMap(result -> result.getIssues().stream())
                .map(this::toIssueDto)
                .toList();

        return RepositoryDetailResponse.builder()
                .repoName(repo.getRepoName())
                .sva(repo.getSva())
                .sca(repo.getSca())
                .issues(issues)
                .build();
    }

    // --- lookups ---

    private ScanRun currentRunOrThrow() {
        return scanRunStore.getCurrent()
                .orElseThrow(() -> new ScanRunNotFoundException("No scan run has been started yet"));
    }

    private ReleaseWorkItem findReleaseItem(int workItemId) {
        return currentRunOrThrow().getReleaseWorkItems().stream()
                .filter(item -> item.getWorkItemId() == workItemId)
                .findFirst()
                .orElseThrow(() -> new ScanRunNotFoundException("Release work item " + workItemId + " not found in current run"));
    }

    private BuildInfo findBuild(ReleaseWorkItem item, int buildId) {
        return item.getBuilds().stream()
                .filter(build -> build.getBuildId() == buildId)
                .findFirst()
                .orElseThrow(() -> new ScanRunNotFoundException("Build " + buildId + " not found under release item " + item.getWorkItemId()));
    }

    private RepositoryInfo findRepository(BuildInfo build, String repoName) {
        return build.getRepositories().stream()
                .filter(repo -> repo.getRepoName().equals(repoName))
                .findFirst()
                .orElseThrow(() -> new ScanRunNotFoundException("Repository " + repoName + " not found under build " + build.getBuildId()));
    }

    // --- DTO mapping ---

    private ReleaseItemSummaryDto toReleaseItemSummary(ReleaseWorkItem item) {
        SeverityCounts counts = new SeverityCounts();
        for (BuildInfo build : item.getBuilds()) {
            for (RepositoryInfo repo : build.getRepositories()) {
                counts.addAll(SeverityCounts.fromScanResults(repo.getScanResults()));
            }
        }
        return ReleaseItemSummaryDto.builder()
                .workItemId(item.getWorkItemId())
                .applicationName(item.getApplicationName())
                .severityCounts(counts)
                .build();
    }

    private BuildSummaryDto toBuildSummary(BuildInfo build) {
        SeverityCounts counts = new SeverityCounts();
        for (RepositoryInfo repo : build.getRepositories()) {
            counts.addAll(SeverityCounts.fromScanResults(repo.getScanResults()));
        }
        return BuildSummaryDto.builder()
                .buildId(build.getBuildId())
                .pipelineId(build.getPipelineId())
                .pipelineUrl(build.getPipelineUrl())
                .sourceBranch(build.getSourceBranch())
                .severityCounts(counts)
                .build();
    }

    private RepositorySummaryDto toRepositorySummary(RepositoryInfo repo) {
        return RepositorySummaryDto.builder()
                .repoName(repo.getRepoName())
                .sva(repo.getSva())
                .sca(repo.getSca())
                .severityCounts(SeverityCounts.fromScanResults(repo.getScanResults()))
                .build();
    }

    private ScanIssueDto toIssueDto(ScanIssue issue) {
        return ScanIssueDto.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .severity(issue.getSeverity())
                .description(issue.getDescription())
                .toolName(issue.getToolName())
                .detectedAt(issue.getDetectedAt())
                .build();
    }
}
