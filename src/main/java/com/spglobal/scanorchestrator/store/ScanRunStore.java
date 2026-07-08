package com.spglobal.scanorchestrator.store;

import com.spglobal.scanorchestrator.model.RunStatus;
import com.spglobal.scanorchestrator.model.ScanRun;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Holds exactly one {@link ScanRun} in memory - this is what a database would normally do.
 * Also enforces the single-run-at-a-time rule so state can safely live in memory without
 * concurrent writers stomping on each other.
 */
@Component
public class ScanRunStore {

    private ScanRun current;

    /**
     * Registers {@code newRun} as the current run, unless one is already in progress.
     *
     * @return true if {@code newRun} was accepted, false if a run is already in progress.
     */
    public synchronized boolean startNewRun(ScanRun newRun) {
        if (current != null && current.getStatus() == RunStatus.IN_PROGRESS) {
            return false;
        }
        current = newRun;
        return true;
    }

    public synchronized Optional<ScanRun> getCurrent() {
        return Optional.ofNullable(current);
    }

    public synchronized boolean isRunInProgress() {
        return current != null && current.getStatus() == RunStatus.IN_PROGRESS;
    }
}
