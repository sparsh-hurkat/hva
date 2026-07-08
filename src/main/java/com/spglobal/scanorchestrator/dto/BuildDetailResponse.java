package com.spglobal.scanorchestrator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildDetailResponse {
    private int buildId;
    private String pipelineUrl;
    private String sourceBranch;
    private List<RepositorySummaryDto> repositories;
}
