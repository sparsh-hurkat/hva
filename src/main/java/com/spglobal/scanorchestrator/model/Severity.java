package com.spglobal.scanorchestrator.model;

/**
 * Canonical severity taxonomy. Every {@link com.spglobal.scanorchestrator.service.scanner.SecurityScannerClient}
 * implementation must normalize its tool-specific severity values into one of these.
 */
public enum Severity {
    CRITICAL,
    HIGH,
    MEDIUM,
    LOW,
    INFO;

    public static Severity fromRawValue(String raw) {
        if (raw == null) {
            return INFO;
        }
        return switch (raw.trim().toUpperCase()) {
            case "CRITICAL" -> CRITICAL;
            case "HIGH" -> HIGH;
            case "MEDIUM", "MODERATE" -> MEDIUM;
            case "LOW" -> LOW;
            default -> INFO;
        };
    }
}
