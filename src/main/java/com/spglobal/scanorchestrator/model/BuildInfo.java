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
public class BuildInfo {
    private int buildId;
    /** definition.id from the ADO build details response. */
    private int pipelineId;
    /** _links.web.href from the ADO build details response. */
    private String pipelineUrl;
    private String sourceBranch;
    /** The build re-triggered (without deploy) in step 8, so scanners see a fresh build. */
    private Integer triggeredBuildId;
    private BuildStatus triggeredBuildStatus;
    @Builder.Default
    private List<RepositoryInfo> repositories = new ArrayList<>();
}
