package com.spglobal.scanorchestrator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildSummaryDto {
    private int buildId;
    private int pipelineId;
    private String pipelineUrl;
    private String sourceBranch;
    private SeverityCounts severityCounts;
}
