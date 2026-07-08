package com.spglobal.scanorchestrator.model;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * The single in-memory representation of a scan run. There is no database backing this -
 * {@link com.spglobal.scanorchestrator.store.ScanRunStore} holds exactly one of these at a time.
 * Fields mutated by the background orchestrator thread and read by API request threads are volatile.
 */
@Getter
public class ScanRun {

    private final String runId;
    private final Instant startedAt;

    @Setter
    private volatile RunStatus status;

    @Setter
    private volatile String currentStep;

    @Setter
    private volatile Instant completedAt;

    @Setter
    private volatile String error;

    private final List<ReleaseWorkItem> releaseWorkItems = new CopyOnWriteArrayList<>();

    public ScanRun(String runId) {
        this.runId = runId;
        this.startedAt = Instant.now();
        this.status = RunStatus.IN_PROGRESS;
        this.currentStep = "Starting";
    }
}
