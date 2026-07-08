package com.spglobal.scanorchestrator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads spcom.json and provides repoName -> (sva, sca) lookups.
 * Step 7: repos not present in this file are dropped from the scan structure entirely.
 */
@Service
public class SpcomLookupService {

    public record RepoCredentials(String sva, String sca) {}

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private Map<String, RepoCredentials> repoNameToCredentials = new HashMap<>();

    @Value("${spcom.path}")
    private String spcomPath;

    public SpcomLookupService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void load() {
        Map<String, RepoCredentials> loaded = new HashMap<>();
        try (InputStream in = resourceLoader.getResource(spcomPath).getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode app : root) {
                for (JsonNode repo : app.path("repositories")) {
                    String repoName = repo.path("repoName").asText(null);
                    if (repoName != null && !repoName.isBlank()) {
                        loaded.put(repoName, new RepoCredentials(
                                repo.path("sva").asText(null),
                                repo.path("sca").asText(null)));
                    }
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load spcom.json from " + spcomPath, e);
        }
        this.repoNameToCredentials = loaded;
    }

    /** Returns credentials for a repo name, or empty if it's not registered in spcom.json (meaning: don't scan it). */
    public java.util.Optional<RepoCredentials> lookup(String repoName) {
        return java.util.Optional.ofNullable(repoNameToCredentials.get(repoName));
    }
}
