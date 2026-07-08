package com.spglobal.scanorchestrator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositorySummaryDto {
    private String repoName;
    private String sva;
    private String sca;
    private SeverityCounts severityCounts;
}
