package com.spglobal.scanorchestrator.dto;

import com.spglobal.scanorchestrator.model.ScanIssue;
import com.spglobal.scanorchestrator.model.ScanResult;
import com.spglobal.scanorchestrator.model.Severity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Rolled-up issue counts by severity. Used at the release-item, build, and repository summary levels. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeverityCounts {
    private int critical;
    private int high;
    private int medium;
    private int low;
    private int info;

    public static SeverityCounts fromScanResults(List<ScanResult> scanResults) {
        SeverityCounts counts = new SeverityCounts();
        if (scanResults == null) {
            return counts;
        }
        for (ScanResult result : scanResults) {
            if (result.getIssues() == null) {
                continue;
            }
            for (ScanIssue issue : result.getIssues()) {
                counts.increment(issue.getSeverity());
            }
        }
        return counts;
    }

    public void increment(Severity severity) {
        switch (severity) {
            case CRITICAL -> critical++;
            case HIGH -> high++;
            case MEDIUM -> medium++;
            case LOW -> low++;
            case INFO -> info++;
        }
    }

    public void addAll(SeverityCounts other) {
        this.critical += other.critical;
        this.high += other.high;
        this.medium += other.medium;
        this.low += other.low;
        this.info += other.info;
    }
}
