package com.spglobal.scanorchestrator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ScanOrchestratorApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScanOrchestratorApplication.class, args);
    }
}
