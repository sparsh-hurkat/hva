package com.spglobal.scanorchestrator.exception;

/** Thrown when a run/release-item/build/repository is looked up that doesn't exist in the current run. Maps to HTTP 404. */
public class ScanRunNotFoundException extends RuntimeException {
    public ScanRunNotFoundException(String message) {
        super(message);
    }
}
