package com.spglobal.scanorchestrator.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryInfo {
    private String repoName;
    private String sva;
    private String sca;
    @Builder.Default
    private List<ScanResult> scanResults = new ArrayList<>();
}
