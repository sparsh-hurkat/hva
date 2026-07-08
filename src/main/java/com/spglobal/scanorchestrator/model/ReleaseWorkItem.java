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
public class ReleaseWorkItem {
    private int workItemId;
    /** Custom.CMDBApplicationName */
    private String applicationName;
    /** Original Custom.BuildID string, kept for traceability (may contain multiple delimited build ids). */
    private String rawBuildIdField;
    @Builder.Default
    private List<BuildInfo> builds = new ArrayList<>();
}
