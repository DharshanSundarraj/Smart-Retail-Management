package com.zetlan.smartretailmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class SmartRetailManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartRetailManagementApplication.class, args);
	}
}