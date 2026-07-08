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
public class ReleaseItemDetailResponse {
    private int workItemId;
    private String applicationName;
    private List<BuildSummaryDto> builds;
}
