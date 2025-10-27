package com.practo.config;

import io.github.cdimascio.dotenv.Dotenv;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

import io.github.cdimascio.dotenv.DotenvException;

public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        
        try {
            // Load .env file from the root directory
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")
                    .ignoreIfMalformed()
                    .ignoreIfMissing()
                    .load();
            
            // Convert dotenv entries to a Map
            Map<String, Object> dotenvMap = new HashMap<>();
            dotenv.entries().forEach(entry -> {
                dotenvMap.put(entry.getKey(), entry.getValue());
            });
            
            // Add the properties to Spring's environment
            environment.getPropertySources().addLast(
                new MapPropertySource("dotenvProperties", dotenvMap)
            );
            
        } catch (DotenvException e) {
            System.out.println("Could not load .env file: " + e.getMessage());
            System.out.println("Application will use default values from application.properties");
        }
    }
}