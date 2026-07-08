package com.spglobal.scanorchestrator.dto;

import com.spglobal.scanorchestrator.model.Severity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanIssueDto {
    private String id;
    private String title;
    private Severity severity;
    private String description;
    private String toolName;
    private Instant detectedAt;
}
