package com.spglobal.scanorchestrator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.spglobal.scanorchestrator.model.BuildStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * All ADO REST calls: WIQL query, work item details, build details, build timeline,
 * triggering a build, and polling a build until it completes.
 */
@Service
public class AdoClientService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ado.base-url}")
    private String baseUrl;

    @Value("${ado.organization}")
    private String organization;

    @Value("${ado.project}")
    private String project;

    @Value("${ado.api-version}")
    private String apiVersion;

    @Value("${ado.pat}")
    private String pat;

    @Value("${ado.release-work-item-wiql}")
    private String releaseWorkItemWiql;

    @Value("${ado.build-id-delimiter}")
    private String buildIdDelimiter;

    @Value("${ado.skip-deploy-parameter-name}")
    private String skipDeployParameterName;

    @Value("${ado.skip-deploy-parameter-value}")
    private String skipDeployParameterValue;

    @Value("${ado.build-poll-interval-seconds}")
    private int buildPollIntervalSeconds;

    @Value("${ado.build-poll-timeout-minutes}")
    private int buildPollTimeoutMinutes;

    /** Result of parsing a work item detail response: application name + the individual build ids from Custom.BuildID. */
    public record WorkItemDetails(int workItemId, String applicationName, String rawBuildIdField, List<Integer> buildIds) {}

    /** Result of parsing a build detail response. */
    public record BuildDetails(int buildId, int pipelineId, String sourceBranch, String pipelineUrl, String primaryRepoName) {}

    private String projectApiBase() {
        return baseUrl + "/" + organization + "/" + project + "/_apis";
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String basicAuth = Base64.getEncoder().encodeToString((":" + pat).getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + basicAuth);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    /** Step 2: WIQL query for upcoming release work items. Returns the raw work item IDs. */
    public List<Integer> queryUpcomingReleaseWorkItemIds() {
        String url = projectApiBase() + "/wit/wiql?api-version=" + apiVersion;
        Map<String, String> body = Map.of("query", releaseWorkItemWiql);
        JsonNode response = restTemplate.postForObject(url, new HttpEntity<>(body, authHeaders()), JsonNode.class);

        List<Integer> ids = new ArrayList<>();
        if (response != null && response.has("workItems")) {
            for (JsonNode item : response.get("workItems")) {
                ids.add(item.get("id").asInt());
            }
        }
        return ids;
    }

    /** Step 3: fetch a work item's details and pull out Custom.CMDBApplicationName / Custom.BuildID. */
    public WorkItemDetails fetchWorkItemDetails(int workItemId) {
        String url = projectApiBase() + "/wit/workitems/" + workItemId + "?api-version=" + apiVersion;
        JsonNode response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(authHeaders()), JsonNode.class).getBody();

        JsonNode fields = response.get("fields");
        String applicationName = fields.path("Custom.CMDBApplicationName").asText(null);
        String rawBuildIdField = fields.path("Custom.BuildID").asText(null);

        List<Integer> buildIds = new ArrayList<>();
        if (rawBuildIdField != null && !rawBuildIdField.isBlank()) {
            for (String part : rawBuildIdField.split(buildIdDelimiter)) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    buildIds.add(Integer.parseInt(trimmed));
                }
            }
        }
        return new WorkItemDetails(workItemId, applicationName, rawBuildIdField, buildIds);
    }

    /** Step 4: fetch build details - pipeline id (definition.id), source branch, pipeline URL, primary repo name. */
    public BuildDetails fetchBuildDetails(int buildId) {
        String url = projectApiBase() + "/build/builds/" + buildId + "?api-version=" + apiVersion;
        JsonNode response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(authHeaders()), JsonNode.class).getBody();

        int pipelineId = response.path("definition").path("id").asInt();
        String sourceBranch = response.path("sourceBranch").asText(null);
        String pipelineUrl = response.path("_links").path("web").path("href").asText(null);
        String primaryRepoName = response.path("repository").path("name").asText(null);

        return new BuildDetails(buildId, pipelineId, sourceBranch, pipelineUrl, primaryRepoName);
    }

    /**
     * Step 5: fetch the build timeline and pull repo names off "Checkout" task records, to cover
     * multi-repo builds. NOT YET VALIDATED against a real timeline response - see readme-refined.md
     * open item #3 for which field actually holds the repo name.
     */
    public List<String> fetchRepositoryNames(int buildId, String primaryRepoName) {
        String url = projectApiBase() + "/build/builds/" + buildId + "/timeline?api-version=" + apiVersion;
        JsonNode response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(authHeaders()), JsonNode.class).getBody();

        List<String> repoNames = new ArrayList<>();
        if (response != null && response.has("records")) {
            for (JsonNode record : response.get("records")) {
                String taskName = record.path("task").path("name").asText("");
                if ("Checkout".equalsIgnoreCase(taskName)) {
                    // TODO(you): confirm this is the right field - record "name" may be a repo alias, not the actual repo name.
                    String repoName = record.path("name").asText(null);
                    if (repoName != null && !repoName.isBlank()) {
                        repoNames.add(repoName);
                    }
                }
            }
        }
        if (repoNames.isEmpty() && primaryRepoName != null) {
            repoNames.add(primaryRepoName);
        }
        return repoNames;
    }

    /** Step 8: re-trigger a build without deploying, via a skip-deploy template parameter. Returns the new build id. */
    public int triggerBuild(int pipelineId, String sourceBranch) {
        String url = projectApiBase() + "/build/builds?api-version=" + apiVersion;

        Map<String, Object> definition = Map.of("id", pipelineId);
        Map<String, String> templateParameters = Map.of(skipDeployParameterName, skipDeployParameterValue);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("definition", definition);
        body.put("sourceBranch", sourceBranch);
        body.put("templateParameters", templateParameters);

        JsonNode response = restTemplate.postForObject(url, new HttpEntity<>(body, authHeaders()), JsonNode.class);
        return response.get("id").asInt();
    }

    /**
     * Step 8 (continued): poll a triggered build until it completes, fails, or times out.
     * Default poll interval/timeout come from ado.build-poll-interval-seconds / ado.build-poll-timeout-minutes.
     */
    public BuildStatus pollBuildUntilComplete(int buildId) {
        String url = projectApiBase() + "/build/builds/" + buildId + "?api-version=" + apiVersion;
        Instant deadline = Instant.now().plus(Duration.ofMinutes(buildPollTimeoutMinutes));

        while (Instant.now().isBefore(deadline)) {
            JsonNode response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(authHeaders()), JsonNode.class).getBody();
            String status = response.path("status").asText("");
            if ("completed".equalsIgnoreCase(status)) {
                String result = response.path("result").asText("");
                return "succeeded".equalsIgnoreCase(result) ? BuildStatus.COMPLETED : BuildStatus.FAILED;
            }
            sleep(Duration.ofSeconds(buildPollIntervalSeconds));
        }
        return BuildStatus.TIMED_OUT;
    }

    private void sleep(Duration duration) {
        try {
            Thread.sleep(duration.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while polling ADO build status", e);
        }
    }
}
