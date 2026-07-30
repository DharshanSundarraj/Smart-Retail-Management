package com.zetlan.smartretailmanagement.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI smartRetailOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart Retail Management API")
                        .description("Enterprise REST API for POS Transactions, Inventory Management, and Employee Data.")
                        .version("v1.0.0"));
    }
}