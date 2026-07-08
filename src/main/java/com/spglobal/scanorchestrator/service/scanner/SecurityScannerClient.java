package com.spglobal.scanorchestrator.service.scanner;

import com.spglobal.scanorchestrator.model.RepositoryInfo;
import com.spglobal.scanorchestrator.model.ScanResult;

/**
 * One security scanner tool integration. Mend is the first implementation; 2 more tools are
 * planned later - adding one is just a new @Component implementing this interface, since
 * ScanOrchestratorService loops over every registered bean of this type.
 */
public interface SecurityScannerClient {

    /** Short identifier for this tool, e.g. "MEND". Stored on ScanResult/ScanIssue. */
    String toolName();

    /** Fetches and normalizes this tool's findings for one repository. Must not throw - failures go in ScanResult.error. */
    ScanResult fetchIssues(RepositoryInfo repo);
}
