package com.spglobal.scanorchestrator.service;

import com.spglobal.scanorchestrator.exception.ScanRunInProgressException;
import com.spglobal.scanorchestrator.model.BuildInfo;
import com.spglobal.scanorchestrator.model.BuildStatus;
import com.spglobal.scanorchestrator.model.ReleaseWorkItem;
import com.spglobal.scanorchestrator.model.RepositoryInfo;
import com.spglobal.scanorchestrator.model.RunStatus;
import com.spglobal.scanorchestrator.model.ScanRun;
import com.spglobal.scanorchestrator.service.scanner.SecurityScannerClient;
import com.spglobal.scanorchestrator.store.ScanRunStore;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Drives the whole flow end to end on a background thread: query ADO for release work items,
 * walk down to builds/repositories, re-trigger builds without deploying, wait for them, then
 * run every registered scanner against each repository. Release items/builds are processed
 * sequentially to avoid hammering ADO/Mend.
 */
@Service
public class ScanOrchestratorService {

    private final AdoClientService adoClientService;
    private final SpcomLookupService spcomLookupService;
    private final List<SecurityScannerClient> scannerClients;
    private final ScanRunStore scanRunStore;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public ScanOrchestratorService(AdoClientService adoClientService,
                                    SpcomLookupService spcomLookupService,
                                    List<SecurityScannerClient> scannerClients,
                                    ScanRunStore scanRunStore) {
        this.adoClientService = adoClientService;
        this.spcomLookupService = spcomLookupService;
        this.scannerClients = scannerClients;
        this.scanRunStore = scanRunStore;
    }

    /** Starts a new run in the background. Throws if one is already in progress. Returns the new run id. */
    public String startRun() {
        ScanRun run = new ScanRun(UUID.randomUUID().toString());
        if (!scanRunStore.startNewRun(run)) {
            throw new ScanRunInProgressException("A scan run is already in progress");
        }
        executor.submit(() -> execute(run));
        return run.getRunId();
    }

    private void execute(ScanRun run) {
        try {
            run.setCurrentStep("Querying ADO for upcoming release work items");
            List<Integer> workItemIds = adoClientService.queryUpcomingReleaseWorkItemIds();

            for (int workItemId : workItemIds) {
                run.setCurrentStep("Fetching details for release work item " + workItemId);
                run.getReleaseWorkItems().add(buildReleaseWorkItem(workItemId));
            }

            run.setCurrentStep("Triggering builds and waiting for them to complete");
            triggerAndAwaitAllBuilds(run);

            run.setCurrentStep("Running security scans");
            runScansForAllRepositories(run);

            run.setStatus(RunStatus.COMPLETED);
        } catch (Exception e) {
            run.setError(e.getMessage());
            run.setStatus(RunStatus.FAILED);
        } finally {
            run.setCompletedAt(Instant.now());
        }
    }

    private ReleaseWorkItem buildReleaseWorkItem(int workItemId) {
        AdoClientService.WorkItemDetails details = adoClientService.fetchWorkItemDetails(workItemId);

        ReleaseWorkItem item = ReleaseWorkItem.builder()
                .workItemId(workItemId)
                .applicationName(details.applicationName())
                .rawBuildIdField(details.rawBuildIdField())
                .build();

        for (int buildId : details.buildIds()) {
            item.getBuilds().add(buildBuildInfo(buildId));
        }
        return item;
    }

    private BuildInfo buildBuildInfo(int buildId) {
        AdoClientService.BuildDetails buildDetails = adoClientService.fetchBuildDetails(buildId);
        List<String> repoNames = adoClientService.fetchRepositoryNames(buildId, buildDetails.primaryRepoName());

        BuildInfo buildInfo = BuildInfo.builder()
                .buildId(buildId)
                .pipelineId(buildDetails.pipelineId())
                .pipelineUrl(buildDetails.pipelineUrl())
                .sourceBranch(buildDetails.sourceBranch())
                .build();

        // Step 7: drop any repo not registered in spcom.json - it isn't scanned.
        for (String repoName : repoNames) {
            spcomLookupService.lookup(repoName).ifPresent(creds ->
                    buildInfo.getRepositories().add(RepositoryInfo.builder()
                            .repoName(repoName)
                            .sva(creds.sva())
                            .sca(creds.sca())
                            .build()));
        }
        return buildInfo;
    }

    private void triggerAndAwaitAllBuilds(ScanRun run) {
        for (ReleaseWorkItem item : run.getReleaseWorkItems()) {
            for (BuildInfo build : item.getBuilds()) {
                run.setCurrentStep("Triggering build for pipeline " + build.getPipelineId());
                int triggeredBuildId = adoClientService.triggerBuild(build.getPipelineId(), build.getSourceBranch());
                build.setTriggeredBuildId(triggeredBuildId);
                build.setTriggeredBuildStatus(BuildStatus.IN_PROGRESS);

                run.setCurrentStep("Waiting for triggered build " + triggeredBuildId + " to complete");
                build.setTriggeredBuildStatus(adoClientService.pollBuildUntilComplete(triggeredBuildId));
            }
        }
    }

    private void runScansForAllRepositories(ScanRun run) {
        for (ReleaseWorkItem item : run.getReleaseWorkItems()) {
            for (BuildInfo build : item.getBuilds()) {
                if (build.getTriggeredBuildStatus() != BuildStatus.COMPLETED) {
                    continue; // build failed or timed out - nothing fresh to scan
                }
                for (RepositoryInfo repo : build.getRepositories()) {
                    run.setCurrentStep("Scanning repository " + repo.getRepoName());
                    for (SecurityScannerClient scanner : scannerClients) {
                        repo.getScanResults().add(scanner.fetchIssues(repo));
                    }
                }
            }
        }
    }
}
