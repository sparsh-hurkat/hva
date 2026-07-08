package com.spglobal.scanorchestrator.service.scanner;

import com.fasterxml.jackson.databind.JsonNode;
import com.spglobal.scanorchestrator.model.RepositoryInfo;
import com.spglobal.scanorchestrator.model.ScanIssue;
import com.spglobal.scanorchestrator.model.ScanResult;
import com.spglobal.scanorchestrator.model.Severity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * First scanner tool integration: Mend. Login to get a JWT, then fetch active security alerts
 * scoped to a repo's Mend project token (spcom.json's "sca" field).
 *
 * Per the original integration notes, Mend requires SSL verification to be bypassed - that's
 * handled entirely inside this class (buildInsecureRestTemplate below) rather than as a shared
 * app-wide HTTP client, so it can't accidentally affect any other outgoing call.
 */
@Component
public class MendScannerClient implements SecurityScannerClient {

    private static final String TOOL_NAME = "MEND";

    @Value("${mend.base-url}")
    private String baseUrl;

    @Value("${mend.email}")
    private String email;

    @Value("${mend.org-token}")
    private String orgToken;

    @Value("${mend.user-key}")
    private String userKey;

    private final RestTemplate restTemplate = buildInsecureRestTemplate();

    @Override
    public String toolName() {
        return TOOL_NAME;
    }

    @Override
    public ScanResult fetchIssues(RepositoryInfo repo) {
        try {
            String jwt = login();
            List<ScanIssue> issues = fetchAlerts(jwt, repo.getSca());
            return ScanResult.builder()
                    .toolName(TOOL_NAME)
                    .issues(issues)
                    .fetchedAt(Instant.now())
                    .build();
        } catch (Exception e) {
            return ScanResult.builder()
                    .toolName(TOOL_NAME)
                    .issues(List.of())
                    .fetchedAt(Instant.now())
                    .error(e.getMessage())
                    .build();
        }
    }

    private String login() {
        String url = baseUrl + "/api/v2.0/login";
        Map<String, String> body = Map.of("email", email, "orgToken", orgToken, "userKey", userKey);
        JsonNode response = restTemplate.postForObject(url, new HttpEntity<>(body, jsonHeaders()), JsonNode.class);
        // TODO(you): confirm the actual field name Mend's login response uses for the JWT.
        String jwt = response.path("jwtToken").asText(null);
        if (jwt == null) {
            jwt = response.path("retVal").path("jwtToken").asText(null);
        }
        if (jwt == null) {
            throw new IllegalStateException("Could not find JWT token in Mend login response");
        }
        return jwt;
    }

    private List<ScanIssue> fetchAlerts(String jwt, String projectToken) {
        String url = baseUrl + "/api/v2.0/projects/" + projectToken + "/alerts/security?status=ACTIVE";
        HttpHeaders headers = jsonHeaders();
        headers.set("Authorization", "Bearer " + jwt);

        JsonNode response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class).getBody();

        // TODO(you): confirm the actual array field name and alert shape in Mend's response.
        JsonNode alerts = response.has("retVal") ? response.get("retVal") : response.path("alerts");

        List<ScanIssue> issues = new ArrayList<>();
        for (JsonNode alert : alerts) {
            issues.add(ScanIssue.builder()
                    .id(alert.path("alertUuid").asText(alert.path("id").asText(null)))
                    .title(alert.path("vulnerability").path("name").asText(alert.path("name").asText("Unknown")))
                    .severity(Severity.fromRawValue(alert.path("severity").asText(null)))
                    .description(alert.path("description").asText(null))
                    .toolName(TOOL_NAME)
                    .detectedAt(Instant.now())
                    .build());
        }
        return issues;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    /**
     * Trust-all SSLContext scoped to this RestTemplate instance only (via a per-connection
     * override in SimpleClientHttpRequestFactory) - equivalent to curl's -k flag, without
     * mutating any JVM-wide SSL defaults.
     */
    private static RestTemplate buildInsecureRestTemplate() {
        try {
            TrustManager[] trustAllCerts = new TrustManager[]{
                    new X509TrustManager() {
                        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                        public void checkClientTrusted(X509Certificate[] certs, String authType) { }
                        public void checkServerTrusted(X509Certificate[] certs, String authType) { }
                    }
            };
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllCerts, new SecureRandom());

            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory() {
                @Override
                protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
                    if (connection instanceof HttpsURLConnection https) {
                        https.setSSLSocketFactory(sslContext.getSocketFactory());
                        https.setHostnameVerifier((hostname, session) -> true);
                    }
                    super.prepareConnection(connection, httpMethod);
                }
            };
            factory.setConnectTimeout(30_000);
            factory.setReadTimeout(30_000);
            return new RestTemplate(factory);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build insecure-SSL RestTemplate for Mend", e);
        }
    }
}
