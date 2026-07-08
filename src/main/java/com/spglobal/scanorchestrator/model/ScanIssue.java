package com.spglobal.scanorchestrator.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanIssue {
    private String id;
    private String title;
    private Severity severity;
    private String description;
    private String toolName;
    private Instant detectedAt;
    /** Tool-specific extra fields that don't fit the normalized shape. Optional. */
    private Map<String, Object> rawData;
}
