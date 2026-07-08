# ADO → Security Scan Orchestrator

## What this does

A button click kicks off a backend process that:
1. finds all upcoming release work items in ADO
2. walks each one down to its builds and repositories
3. re-triggers those builds (without deploying) so security scanners have fresh data to report on
4. pulls security findings from Mend (more scanners to be added later)
5. exposes APIs so the frontend can drill down: release item → build → repository → issue

Stack: **Java 17 + Spring Boot 3.2 (Maven)**. No database — all state for a run lives in memory. Only one run can be in progress at a time.

Project coordinates: groupId `com.spglobal`, artifactId `scan-orchestrator`, base package `com.spglobal.scanorchestrator`.

---

## Flow

### 1. Trigger

Frontend button click calls `POST /api/scan-runs/start`. This returns immediately (202) with a `runId`. If a run is already in progress, it returns `409 Conflict` instead of starting a second one. Everything below happens on a background thread.

### 2. Get upcoming release work items

Run a WIQL query against ADO to get the list of release work item IDs.

```
POST https://dev.azure.com/spglobal/ratingsproducts/_apis/wit/wiql?api-version=7.0
Content-Type: application/json

{
  "query": "TODO(you): paste the exact WIQL text here, e.g. SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Release' AND [System.State] <> 'Closed'"
}
```
> **TODO(you):** fill in the real WIQL query (or a saved query GUID via `GET .../wit/wiql/{queryId}?api-version=7.0`).

### 3. Get work item details

For each work item ID from step 2:

```
curl -u :%ADO_PAT% "https://dev.azure.com/spglobal/ratingsproducts/_apis/wit/workitems/{WORK_ITEM_ID}?api-version=7.0"
```

Extract:
- `fields["Custom.CMDBApplicationName"]` → application name
- `fields["Custom.BuildID"]` → a **delimited string of one or more build IDs** (confirmed: one release item can map to multiple builds). Split on the delimiter to get a list of build IDs.

### 4. Get build details

For each build ID from step 3:

```
curl -u :%ADO_PAT% "https://dev.azure.com/spglobal/ratingsproducts/_apis/build/builds/{BUILD_ID}?api-version=7.0"
```

This single response already contains everything needed except the full repo list:
- `definition.id` → **pipeline ID** (this is what the original notes weren't sure how to find — it's just the build's own definition ID, no extra call needed)
- `sourceBranch` → **source branch** (also already on this response, no extra call needed)
- `repository.name` → the *primary* repo (only one — multi-repo builds need step 5 below)
- `_links.web.href` → pipeline URL

### 5. Get build timeline (for multi-repo builds)

```
curl -u :%ADO_PAT% "https://dev.azure.com/spglobal/ratingsproducts/_apis/build/builds/{BUILD_ID}/timeline?api-version=7.0"
```

Walk `records[]` where `task.name == "Checkout"` and read the repo name off each matching record. This gives the full list of repositories checked out by the build, not just the primary one.

> **Validate before relying on this:** grab one real timeline response and confirm which exact field holds the repo name (it may be the record `name`, an `identifier`, or a variable) — the exact shape isn't confirmed yet. Fall back to `repository.name` from step 4 when there's only one repo.

### 6. Build the in-memory data structure

Assemble everything from steps 3–5 into: **release work item → builds → (pipeline URL, pipeline ID, source branch) → repositories**.

### 7. Cross-reference `spcom.json`

For each repo name found in step 6, look it up in `spcom.json`:

```json
{
  "appName": "",
  "repositories": [
    { "repoName": "", "sva": "12321", "sca": "asdasdfasdfasdfasdfasdfasdfasdfasdfsdf" }
  ]
}
```

Attach `sva` and `sca` to that repository. **If the repo name isn't in `spcom.json`, drop it from the structure entirely** — it's not scanned.

> Assumption: `spcom.json` path is configurable (`application.yml`), defaulting to a bundled classpath resource.

Once assembled, log the full structure (debug visibility only, not an API).

### 8. Re-trigger each build (no deploy)

We need a fresh build per pipeline so the scanner tools report against the *latest* build for each repo (they only report on the latest). Trigger it, but skip the deploy stage via a template parameter:

```
curl -u :%ADO_PAT% -X POST -H "Content-Type: application/json" \
  -d '{
        "definition": { "id": {PIPELINE_ID} },
        "sourceBranch": "{SOURCE_BRANCH}",
        "templateParameters": { "TODO(you): skip-deploy param name": "TODO(you): value" }
      }' \
  "https://dev.azure.com/spglobal/ratingsproducts/_apis/build/builds?api-version=7.0"
```
> **TODO(you):** fill in the actual template parameter name/value your pipelines use to skip the deploy stage.

Save the new triggered build's ID against its `BuildInfo` entry. Poll:

```
curl -u :%ADO_PAT% "https://dev.azure.com/spglobal/ratingsproducts/_apis/build/builds/{TRIGGERED_BUILD_ID}?api-version=7.0"
```

until `status == "completed"`. Default: poll every 30s, timeout after 60 minutes (a full build run takes ~45 min per your estimate — there's a race-condition risk if two builds for the same repo land close together, but we're ignoring that for now, as noted in the original brief).

### 9. Scan with Mend

Once a triggered build completes, for each repository in it:

**Login:**
```
curl -k -X POST -H "Content-Type: application/json" \
  -d '{ "email": "%MEND_EMAIL%", "orgToken": "%MEND_ORG_TOKEN%", "userKey": "%MEND_USER_KEY%" }' \
  "https://api-spglobal.mend.io/api/v2.0/login"
```
Returns a JWT.

**Fetch active security alerts, scoped to this repo's project token (`sca`):**
```
curl -k -H "Authorization: Bearer {JWT}" \
  "https://api-spglobal.mend.io/api/v2.0/projects/{sca}/alerts/security?status=ACTIVE"
```
> The original endpoint (`/alerts/security?search=status:;equals:ACTIVE`) looked malformed and had no way to scope to a specific repo. This corrected version scopes by `sca` as the Mend project token — **confirm the exact query params against the Mend API docs** before relying on it. `-k` (insecure SSL bypass) is required per the original notes; the trust-all `SSLContext` lives entirely inside `MendScannerClient` (built once per instance, not a shared/global HTTP client), so it can't leak into any other outgoing call.

Normalize each returned alert into a `ScanIssue` with a severity from a canonical set: `CRITICAL / HIGH / MEDIUM / LOW / INFO`.

### 10. Pluggable scanners

Mend is the first of 3 planned tools. Each tool logs in/authenticates differently and returns differently-shaped data, so scanning is behind one interface:

```java
interface SecurityScannerClient {
    String toolName();
    ScanResult fetchIssues(RepositoryInfo repo); // uses repo.sva / repo.sca as needed
}
```

`MendScannerClient` is the first implementation. Spring auto-wires every bean of this type, so adding tool #2 and #3 later is just adding another `@Component` — no orchestration code changes.

---

## Data structures / DTOs

### Domain model (in-memory only — this is what replaces a database)

```
ScanRun
  runId: String
  status: RunStatus (IN_PROGRESS, COMPLETED, FAILED)
  currentStep: String            // human-readable progress, e.g. "Scanning repo X"
  startedAt / completedAt: Instant
  error: String?
  releaseWorkItems: List<ReleaseWorkItem>

ReleaseWorkItem
  workItemId: int
  applicationName: String        // Custom.CMDBApplicationName
  rawBuildIdField: String        // original Custom.BuildID string, kept for traceability
  builds: List<BuildInfo>

BuildInfo
  buildId: int
  pipelineId: int                // definition.id
  pipelineUrl: String            // _links.web.href
  sourceBranch: String
  triggeredBuildId: int?
  triggeredBuildStatus: BuildStatus (QUEUED, IN_PROGRESS, COMPLETED, FAILED, TIMED_OUT)
  repositories: List<RepositoryInfo>

RepositoryInfo
  repoName: String
  sva: String
  sca: String
  scanResults: List<ScanResult>  // one per scanner tool

ScanResult
  toolName: String               // e.g. "MEND"
  issues: List<ScanIssue>
  fetchedAt: Instant
  error: String?                 // if this tool failed for this repo

ScanIssue
  id: String
  title: String
  severity: Severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)
  description: String
  toolName: String
  detectedAt: Instant?
  rawData: Map<String, Object>   // tool-specific extra fields, optional
```

### API response DTOs (separate from the domain model, shaped per endpoint)

```
ScanRunStatusResponse    { runId, status, currentStep, startedAt, completedAt, error }

ScanSummaryResponse      { runId, status, releaseItems: List<ReleaseItemSummaryDto> }
ReleaseItemSummaryDto    { workItemId, applicationName, severityCounts }

ReleaseItemDetailResponse { workItemId, applicationName, builds: List<BuildSummaryDto> }
BuildSummaryDto          { buildId, pipelineId, pipelineUrl, sourceBranch, severityCounts }

BuildDetailResponse      { buildId, pipelineUrl, sourceBranch, repositories: List<RepositorySummaryDto> }
RepositorySummaryDto     { repoName, sva, sca, severityCounts }

RepositoryDetailResponse { repoName, sva, sca, issues: List<ScanIssueDto> }  // no counts — full detail
ScanIssueDto             { id, title, severity, description, toolName, detectedAt }
```

`severityCounts` is a rolled-up `{ critical, high, medium, low, info }` count, aggregated bottom-up (repo counts roll up into build counts, which roll up into release-item counts). Counts disappear once you drill down to the repository level — at that point you see the actual issue list instead.

---

## APIs

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/scan-runs/start` | Starts a run. `409` if one is already in progress. |
| GET | `/api/scan-runs/current` | Status/progress of the current or last run. |
| GET | `/api/scan-runs/current/summary` | Per-release-item severity counts. |
| GET | `/api/scan-runs/current/release-items/{id}` | Per-build severity counts under that release item. |
| GET | `/api/scan-runs/current/release-items/{id}/builds/{buildId}` | Per-repo severity counts under that build. |
| GET | `/api/scan-runs/current/release-items/{id}/builds/{buildId}/repositories/{repoName}` | Full issue list for that repo, no counts. |

---

## Backend architecture (Spring Boot)

This is the package layout as actually implemented:

```
controller/   ScanRunController — the endpoints above

service/
  ScanOrchestratorService   — drives the whole async flow end to end, on a single background
                              thread (Executors.newSingleThreadExecutor); processes release
                              items/builds sequentially
  AdoClientService          — WIQL query, work item fetch, build fetch, timeline fetch, trigger
                              build, poll status; owns its own plain RestTemplate
  SpcomLookupService        — loads spcom.json (via ResourceLoader, @PostConstruct) into a
                              repoName -> {sva, sca} in-memory map
  scanner/
    SecurityScannerClient   — interface all scanners implement
    MendScannerClient       — first implementation (login, JWT, fetch alerts); builds its own
                              insecure-SSL RestTemplate internally (see step 9 note above) —
                              there is no shared/global HTTP client config

model/    ScanRun, ReleaseWorkItem, BuildInfo, RepositoryInfo, ScanResult, ScanIssue
          + Severity, BuildStatus, RunStatus enums

dto/      the API response DTOs listed above, plus SeverityCounts (holds the roll-up logic)

store/    ScanRunStore — a synchronized single-field holder (not AtomicReference — a plain
          field behind synchronized methods, since starting a run needs a check-then-set) that
          replaces what a DB would normally do; also enforces single-run-at-a-time

exception/ ScanRunInProgressException (-> 409), ScanRunNotFoundException (-> 404),
           GlobalExceptionHandler (@RestControllerAdvice mapping both, plus a 500 fallback)
```

**No `config/` package.** ADO settings (base URL, org, project, PAT, WIQL query, skip-deploy parameter, poll interval/timeout) and Mend settings (base URL, email, orgToken, userKey) are bound directly via `@Value("${...}")` fields on `AdoClientService` and `MendScannerClient` respectively — no dedicated `@ConfigurationProperties` classes. All values live in `application.yml`; PAT/email/orgToken/userKey are read from environment variables via `${ADO_PAT:}` / `${MEND_EMAIL:}` / etc. placeholders, never hardcoded.

---

## Open items — still need real values before this runs against ADO/Mend

These are literally marked `TODO(you)` in the code (`application.yml`, `AdoClientService.java`, `MendScannerClient.java`) — grep for that string to find every one:

1. **WIQL query** for "upcoming release work items" — placeholder in `application.yml` (`ado.release-work-item-wiql`), needs the real query text or saved query GUID.
2. **Skip-deploy template parameter** name/value — placeholder in `application.yml` (`ado.skip-deploy-parameter-name` / `-value`), needs the real pipeline parameter your YAML checks.
3. **Timeline repo-name field** — `AdoClientService.fetchRepositoryNames()` parses `Checkout` task records and reads the repo name off the `name` field; needs validating against one real timeline JSON response (may actually be `identifier` or a variable instead).
4. **Mend login/alerts response shape** — `MendScannerClient.login()` and `.fetchAlerts()` guess at field names (`jwtToken`, `retVal`, `alertUuid`, `vulnerability.name`, etc.); confirm the real response shape against Mend API docs and fix the parsing.

## Implemented as configurable defaults (not blocking, but worth knowing)

5. **`spcom.json` location** — `spcom.path` in `application.yml`, defaults to `classpath:spcom.json`; point it at an absolute file path to override. Loaded once at startup by `SpcomLookupService`.
6. **Credentials** — `ado.pat`, `mend.email`, `mend.org-token`, `mend.user-key` all read from environment variables (`ADO_PAT`, `MEND_EMAIL`, `MEND_ORG_TOKEN`, `MEND_USER_KEY`) via `application.yml` placeholders, never hardcoded.
7. **Severity taxonomy** — `Severity` enum: `CRITICAL / HIGH / MEDIUM / LOW / INFO`, with a `fromRawValue()` normalizer every scanner client calls.
8. **Build polling** — `ado.build-poll-interval-seconds` (30) / `ado.build-poll-timeout-minutes` (60) in `application.yml`.
9. **Processing order** — `ScanOrchestratorService` walks release items → builds → repositories sequentially, on a single background thread; can be parallelized later if ADO/Mend rate limits allow.
10. **Known race condition** (from original brief, unchanged): if two builds for the same repo land close together, scanner tools might report on the wrong one. Ignored for now.
