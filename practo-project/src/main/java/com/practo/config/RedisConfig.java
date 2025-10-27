package com.practo.config;

import java.time.Duration;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.practo.dto.AvailabilitySearchDto;
import com.practo.dto.DoctorSearchResponse;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        // defaults to localhost:6379
        return new LettuceConnectionFactory();
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        RedisSerializer<Object> serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
            .entryTtl(Duration.ofMinutes(5));

        ObjectMapper doctorSearchObjectMapper = new ObjectMapper();
        Jackson2JsonRedisSerializer<DoctorSearchResponse> doctorSearchSerializer = 
            new Jackson2JsonRedisSerializer<>(doctorSearchObjectMapper, DoctorSearchResponse.class);
        
        RedisCacheConfiguration doctorSearchCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(doctorSearchSerializer)
            )
            .entryTtl(Duration.ofMinutes(5));

        ObjectMapper availabilityObjectMapper = new ObjectMapper();
        availabilityObjectMapper.registerModule(new JavaTimeModule());
        Jackson2JsonRedisSerializer<AvailabilitySearchDto> availabilitySerializer = 
            new Jackson2JsonRedisSerializer<>(availabilityObjectMapper, AvailabilitySearchDto.class);
        
        RedisCacheConfiguration doctorAvailabilityCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(availabilitySerializer)
            )
            .entryTtl(Duration.ofMinutes(5));

        

        return RedisCacheManager.builder(factory)
        .withCacheConfiguration("doctorSearch", doctorSearchCacheConfig)
        .withCacheConfiguration("doctorAvailability", doctorAvailabilityCacheConfig)
                .cacheDefaults(defaultConfig)
                .build();
    }
}