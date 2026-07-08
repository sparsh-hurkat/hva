package com.spglobal.scanorchestrator.dto;

import com.spglobal.scanorchestrator.model.RunStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanSummaryResponse {
    private String runId;
    private RunStatus status;
    private List<ReleaseItemSummaryDto> releaseItems;
}
