package com.spglobal.scanorchestrator.dto;

import com.spglobal.scanorchestrator.model.RunStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanRunStatusResponse {
    private String runId;
    private RunStatus status;
    private String currentStep;
    private Instant startedAt;
    private Instant completedAt;
    private String error;
}
