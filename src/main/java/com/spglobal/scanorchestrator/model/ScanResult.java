package com.spglobal.scanorchestrator.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** One scanner tool's findings for a single repository. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanResult {
    private String toolName;
    @Builder.Default
    private List<ScanIssue> issues = new ArrayList<>();
    private Instant fetchedAt;
    /** Set when this tool failed to produce results for this repo; issues will be empty in that case. */
    private String error;
}
