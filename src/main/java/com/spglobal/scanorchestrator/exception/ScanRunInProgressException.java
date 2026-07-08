package com.spglobal.scanorchestrator.exception;

/** Thrown when a new scan run is requested while one is already in progress. Maps to HTTP 409. */
public class ScanRunInProgressException extends RuntimeException {
    public ScanRunInProgressException(String message) {
        super(message);
    }
}
