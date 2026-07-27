package com.zetlan.smartretailmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

// This bypasses the CSRF blocker and default login screen
@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
public class SmartRetailManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartRetailManagementApplication.class, args);
	}
}