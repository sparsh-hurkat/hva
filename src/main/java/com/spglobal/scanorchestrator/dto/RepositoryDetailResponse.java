package com.spglobal.scanorchestrator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Issue-level detail for a single repository - no counts, matches the "no more counts once you drill in" requirement. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryDetailResponse {
    private String repoName;
    private String sva;
    private String sca;
    private List<ScanIssueDto> issues;
}
