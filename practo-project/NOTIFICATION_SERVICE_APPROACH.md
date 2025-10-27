# 🔔 **Notification Service with Kafka Integration - Complete Learning & Implementation Guide**

## � **Learning Objectives**
By the end of this implementation, you will understand:
- **Microservices Architecture** and service communication patterns
- **Apache Kafka** for event-driven messaging
- **Asynchronous Processing** vs synchronous communication
- **Producer-Consumer Pattern** in distributed systems
- **Message Serialization/Deserialization** with JSON
- **Email/SMS Integration** in Spring Boot
- **Template Engines** (Thymeleaf) for dynamic content
- **Retry Mechanisms** and error handling in distributed systems
- **Docker containerization** for development environments

## �📋 **Overview**
This document provides a step-by-step implementation guide for creating a **Notification Service** that will handle sending notifications to doctors when appointments are confirmed. The service will be connected to the main Practo application via **Apache Kafka** for asynchronous, reliable message processing.

### 🤔 **Why Build a Separate Notification Service?**

**Before (Monolithic Approach):**
```java
// In AppointmentService - TIGHTLY COUPLED
public void confirmAppointment() {
    updateDatabase();
    sendEmail();     // Blocks if email server is slow
    sendSMS();       // Blocks if SMS provider fails  
    // If email/SMS fails, entire appointment confirmation fails!
}
```

**After (Microservices with Kafka):**
```java
// In AppointmentService - LOOSELY COUPLED  
public void confirmAppointment() {
    updateDatabase();
    kafkaProducer.sendNotificationEvent(); // Fast, non-blocking
    // Appointment confirmation succeeds regardless of notification status
}
```

**Key Benefits:**
- 🚀 **Performance**: Main app doesn't wait for notifications
- 🔧 **Reliability**: Notification failures don't break appointments  
- 📈 **Scalability**: Can scale notification service independently
- 🛠️ **Maintainability**: Separate teams can work on different services
- 🔄 **Resilience**: If notification service is down, appointments still work

## 🏗️ **Architecture Deep Dive**

### **Event-Driven Microservices Architecture Explained:**

```
┌─────────────────────┐         Kafka Topic:          ┌──────────────────────┐
│    Practo Main      │    "appointment-notifications" │   Notification       │
│    Application      │                                │     Service          │
│                     │    ┌─────────────────────┐     │                      │
│ ┌─────────────────┐ │    │                     │     │ ┌──────────────────┐ │
│ │ AppointmentSvc  │─┼───▶│  Message Queue      │────▶│ │ Email Service    │ │
│ │                 │ │    │                     │     │ │                  │ │
│ │ PaymentCallback │ │    │ Event: {            │     │ │ SMS Service      │ │
│ └─────────────────┘ │    │   appointmentId: 1  │     │ │                  │ │
│                     │    │   doctorEmail: ..   │     │ │ Template Engine  │ │
│ ┌─────────────────┐ │    │   eventType: "CONF" │     │ └──────────────────┘ │
│ │ Kafka Producer  │ │    │ }                   │     │                      │
│ └─────────────────┘ │    └─────────────────────┘     └──────────────────────┘
└─────────────────────┘                                         │
        🏃‍♂️ FAST                    📦 RELIABLE                    📧📱 DELIVERY
     (Non-blocking)              (Persisted, Ordered)         (Email + SMS)
```

### 🧠 **Core Concepts Explained:**

#### **1. Event-Driven Architecture (EDA)**
- **Definition**: Services communicate through events rather than direct API calls
- **Event**: "Something happened" - e.g., "Appointment was confirmed"
- **Publisher**: Service that announces events (Practo Main App)
- **Consumer**: Service that reacts to events (Notification Service)

#### **2. Apache Kafka - The Message Broker**
**What is Kafka?**
- **Distributed streaming platform** for handling real-time data feeds
- **Message broker** that sits between producer and consumer services
- **Persistent storage** - messages are stored on disk, not lost if consumer is down

**Key Kafka Concepts:**
- **Topic**: Category/channel for messages (e.g., "appointment-notifications")
- **Partition**: Topics split into partitions for parallel processing
- **Producer**: Sends messages to topics
- **Consumer**: Reads messages from topics  
- **Offset**: Position of message in partition (like a bookmark)

**Why Kafka vs Database?**
```java
// ❌ Database approach (synchronous)
appointmentService.confirmAppointment();
notificationService.checkDatabaseForNewAppointments(); // Polling - inefficient

// ✅ Kafka approach (asynchronous, event-driven)
appointmentService.confirmAppointment();
kafkaProducer.send("appointment-confirmed-event"); // Push - efficient
// Notification service automatically receives event
```

#### **3. Producer-Consumer Pattern**
- **Producer**: Creates/sends messages (doesn't care who receives them)
- **Consumer**: Receives/processes messages (doesn't care who sent them)
- **Decoupling**: Services don't need to know about each other directly

## 🎯 **Key Features & Learning Benefits**

### **1. 🚀 Asynchronous Processing**
**Concept**: Operations that don't block the main thread/process
```java
// Synchronous (Blocking) - BAD
public void confirmAppointment() {
    updateDatabase();        // 10ms
    sendEmail();            // 2000ms - BLOCKS here!
    sendSMS();             // 1000ms - BLOCKS here!
    return "Appointment confirmed"; // Takes 3010ms total
}

// Asynchronous (Non-blocking) - GOOD  
public void confirmAppointment() {
    updateDatabase();              // 10ms
    publishToKafka();             // 5ms - just sends message
    return "Appointment confirmed"; // Takes only 15ms!
}
// Email/SMS happen in background via separate service
```

### **2. 📧📱 Multiple Notification Channels**
**Strategy Pattern**: Different ways to notify users
- **Email**: Rich HTML content, attachments, formal communication
- **SMS**: Immediate, short messages, high open rates
- **Push**: Mobile app notifications, instant alerts

### **3. 🔄 Reliable Message Delivery**
**At-Least-Once Delivery**: Kafka guarantees messages won't be lost
- **Persistence**: Messages stored on disk across multiple servers
- **Replication**: Copies of messages on different Kafka brokers
- **Consumer Acknowledgment**: Consumer confirms message processing

### **4. 📈 Independent Scaling**
**Horizontal Scaling**: Add more instances based on load
```
High Email Volume Day:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Notification│    │ Notification│    │ Notification│
│ Service #1  │    │ Service #2  │    │ Service #3  │
└─────────────┘    └─────────────┘    └─────────────┘
      ▲                   ▲                   ▲
      │                   │                   │
      └───────────────────┼───────────────────┘
                    Kafka Topic
```

### **5. 🔧 Retry Logic & Error Handling**
**Circuit Breaker Pattern**: Handle external service failures gracefully
**Dead Letter Queue**: Store failed messages for manual investigation
**Exponential Backoff**: Gradually increase retry intervals

---

## 🚀 **Part 1: Main Application (Kafka Producer Setup)**

### **🎓 Learning: Understanding Maven Dependencies**

**What happens when you add a dependency?**
1. **Maven downloads** the JAR files from Maven Central Repository
2. **Spring Boot Auto-Configuration** detects Kafka on classpath
3. **Automatic beans** are created for Kafka functionality
4. **Configuration properties** become available (spring.kafka.*)

### **1.1 Add Kafka Dependencies to Main Project**

Add to your existing `pom.xml`:

```xml
<!-- Kafka Dependencies -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
    <!-- Version managed by Spring Boot parent -->
    <!-- Provides: KafkaTemplate, @KafkaListener, Producer/Consumer configs -->
</dependency>
```

**🧠 What this dependency includes:**
- **KafkaTemplate**: High-level API for sending messages
- **@KafkaListener**: Annotation for consuming messages  
- **ProducerFactory/ConsumerFactory**: Low-level configuration
- **Serializers/Deserializers**: Convert Java objects to/from bytes
- **Error handling utilities**: Retry, dead letter topics

### **1.2 Kafka Configuration Deep Dive**

### **🎓 Learning: Spring Configuration Pattern**

**@Configuration Classes:**
- **Purpose**: Define beans that Spring should manage
- **@Bean methods**: Tell Spring "create this object and manage its lifecycle"
- **Dependency Injection**: Spring injects dependencies into beans
- **Singleton by default**: Same instance used throughout application

**Producer Configuration Explained:**
- **ProducerFactory**: Creates Kafka producer instances
- **KafkaTemplate**: High-level wrapper around Kafka producer
- **Serialization**: Convert Java objects → bytes for network transmission

Create `KafkaProducerConfig.java`:

```java
package com.practo.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

@Configuration  // 📝 Tells Spring this class contains bean definitions
public class KafkaProducerConfig {

    // 🔧 @Value injects property from application.properties
    // Default value used if property not found
    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Bean  // 📦 Spring will manage this ProducerFactory instance
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        
        // 🌐 BOOTSTRAP_SERVERS: Where to find Kafka brokers
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        
        // 🔑 KEY_SERIALIZER: How to convert message keys to bytes
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        
        // 📄 VALUE_SERIALIZER: How to convert message values to bytes
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        
        // 🔒 RELIABILITY CONFIGURATIONS:
        
        // ACKS="all": Wait for all replicas to acknowledge message
        // Ensures message is fully replicated before considering it sent
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        
        // RETRIES=3: Retry up to 3 times if send fails
        // Network issues, broker temporarily down, etc.
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        
        // IDEMPOTENCE=true: Prevent duplicate messages during retries  
        // Same message sent multiple times = stored only once
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean  // 📨 High-level API for sending messages
    public KafkaTemplate<String, Object> kafkaTemplate() {
        // KafkaTemplate wraps ProducerFactory with convenient methods:
        // - send(topic, key, value)
        // - send(topic, value) 
        // - sendDefault(key, value)
        return new KafkaTemplate<>(producerFactory());
    }
}

/*
🎓 LEARNING SUMMARY:
1. ProducerFactory = Low-level producer configuration
2. KafkaTemplate = High-level sending API  
3. Serializers = Convert Java objects → bytes
4. Reliability configs = Ensure messages aren't lost
5. Spring manages all instances as singletons
*/
```

### **1.3 Notification Event DTO - Data Transfer Object Pattern**

### **🎓 Learning: DTO Pattern & Event Design**

**Data Transfer Object (DTO):**
- **Purpose**: Carry data between processes/layers without behavior
- **Immutable**: Data shouldn't change once created (use @Builder for this)
- **Serializable**: Can be converted to JSON/bytes for network transfer
- **Validation**: Can include validation annotations

**Event Design Principles:**
1. **Self-contained**: Event has all data needed by consumers
2. **Immutable**: Events represent facts that happened (don't change)
3. **Versioned**: Include version info for future schema evolution
4. **Timestamped**: Always include when event occurred

Create `NotificationEvent.java`:

```java
package com.practo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 📨 Notification Event DTO
 * 
 * Represents an event that triggers a notification.
 * This object will be serialized to JSON and sent via Kafka.
 * 
 * Design principles:
 * - Self-contained (all data needed for notification)
 * - Immutable (represents a fact that occurred)
 * - Extensible (templateData for custom fields)
 */
@Data           // 🔧 Lombok: generates getters, setters, toString, equals, hashCode
@Builder        // 🏗️ Lombok: generates builder pattern methods
@NoArgsConstructor  // 🔧 Required for JSON deserialization
@AllArgsConstructor // 🔧 Required for @Builder
public class NotificationEvent {
    
    // 🆔 Unique identifier for this specific event
    private String eventId;
    
    // 📝 Type of event - used by consumer to determine handling logic
    // Examples: APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, PAYMENT_RECEIVED
    private String eventType;
    
    // 👤 Recipient information
    private String recipientEmail;    // Where to send email
    private String recipientPhone;    // Where to send SMS
    
    // 📋 Business data for notification content
    private String doctorName;
    private String patientName;
    private LocalDateTime appointmentTime;
    private Double consultationFee;
    private String appointmentId;
    
    // 📅 Event metadata
    private LocalDateTime createdAt;   // When this event was created
    
    // 🎨 Flexible template data - allows adding custom fields
    // without changing the core event structure
    private Map<String, Object> templateData;
}

/*
🎓 JSON SERIALIZATION EXAMPLE:
{
  "eventId": "evt_123456789",
  "eventType": "APPOINTMENT_CONFIRMED", 
  "recipientEmail": "doctor@hospital.com",
  "recipientPhone": "+919876543210",
  "doctorName": "Dr. Smith",
  "patientName": "John Doe",
  "appointmentTime": "2024-12-15T10:00:00",
  "consultationFee": 500.0,
  "appointmentId": "1",
  "createdAt": "2024-12-14T15:30:00",
  "templateData": {
    "hospitalName": "City Hospital",
    "speciality": "Cardiology"
  }
}
*/
```

### **1.4 Notification Producer Service - Publisher Pattern**

### **🎓 Learning: Service Layer Pattern & Event Publishing**

**Service Layer Pattern:**
- **Business Logic**: Contains domain-specific operations
- **Abstraction**: Hides complexity from controllers
- **Transactional**: Can manage database transactions
- **Testable**: Easy to unit test business logic

**Event Publishing Best Practices:**
1. **Fire-and-forget**: Don't wait for acknowledgment in main flow
2. **Idempotent**: Safe to send same event multiple times
3. **Enriched**: Include all data consumer might need
4. **Logged**: Track what events were sent for debugging

Create `NotificationProducerService.java`:

```java
package com.practo.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.practo.dto.NotificationEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 📨 Notification Producer Service
 * 
 * Responsible for publishing notification events to Kafka topics.
 * This service acts as a bridge between business logic and messaging infrastructure.
 */
@Service            // 🏷️ Spring stereotype - business logic layer
@RequiredArgsConstructor  // 🔧 Lombok - generates constructor for final fields
@Slf4j             // 📝 Lombok - generates logger field
public class NotificationProducerService {
    
    // 📨 Injected by Spring - used to send messages to Kafka
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    /**
     * 📧 Sends appointment confirmation notification
     * 
     * This method demonstrates the Publisher pattern:
     * 1. Enriches data (adds computed fields)
     * 2. Creates event object
     * 3. Publishes to Kafka topic
     * 4. Logs success/failure
     */
    public void sendAppointmentConfirmationNotification(
            String doctorEmail, 
            String doctorPhone,
            String doctorName,
            String patientName,
            LocalDateTime appointmentTime,
            Double consultationFee,
            String appointmentId) {
        
        // 🎨 DATA ENRICHMENT: Add computed/formatted fields
        // This reduces processing load on consumer service
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("appointmentDate", appointmentTime.toLocalDate());
        templateData.put("appointmentTime", appointmentTime.toLocalTime());
        templateData.put("formattedFee", String.format("₹%.2f", consultationFee));
        
        // 🏗️ BUILD EVENT: Using Builder pattern for clean object creation
        NotificationEvent event = NotificationEvent.builder()
                .eventId(UUID.randomUUID().toString())        // 🆔 Unique event ID
                .eventType("APPOINTMENT_CONFIRMED")           // 🏷️ Event classification
                .recipientEmail(doctorEmail)                 // 📧 Where to send email
                .recipientPhone(doctorPhone)                 // 📱 Where to send SMS
                .doctorName(doctorName)                      // 👨‍⚕️ Content data
                .patientName(patientName)                    // 👤 Content data
                .appointmentTime(appointmentTime)            // 📅 Content data
                .consultationFee(consultationFee)            // 💰 Content data
                .appointmentId(appointmentId)                // 🔗 Reference ID
                .createdAt(LocalDateTime.now())              // 📅 Event timestamp
                .templateData(templateData)                  // 🎨 Additional data
                .build();
        
        try {
            // 📤 PUBLISH TO KAFKA:
            // Topic: "appointment-notifications"
            // Key: appointmentId (for partitioning - same appointment goes to same partition)
            // Value: event object (will be JSON serialized)
            kafkaTemplate.send("appointment-notifications", appointmentId, event);
            
            // 📝 SUCCESS LOGGING: Important for monitoring and debugging
            log.info("Sent appointment confirmation notification for appointment: {}", appointmentId);
            
        } catch (Exception e) {
            // 📝 ERROR LOGGING: Log but don't throw - don't break appointment flow
            // In production, you might want to:
            // - Store failed events in database for retry
            // - Send to dead letter queue
            // - Alert monitoring systems
            log.error("Failed to send notification for appointment: {}", appointmentId, e);
        }
    }
}

/*
🎓 LEARNING POINTS:

1. SEPARATION OF CONCERNS:
   - AppointmentService: Manages appointments
   - NotificationProducerService: Handles messaging
   - Each class has single responsibility

2. ERROR HANDLING:
   - Catch exceptions to prevent breaking main flow
   - Log errors for debugging and monitoring
   - Consider dead letter queues for production

3. DATA ENRICHMENT:
   - Pre-compute formatted data for consumer
   - Reduces consumer processing time
   - Makes events self-contained

4. KAFKA KEY STRATEGY:
   - Use appointmentId as key
   - Ensures related messages go to same partition
   - Maintains message ordering per appointment

5. LOGGING STRATEGY:
   - Log successful operations for audit trail
   - Log errors with context for debugging
   - Use structured logging in production
*/
```

### **1.5 Update AppointmentService to Send Notifications**

Update your `handlePaymentCallback` method:

```java
@Transactional
public void handlePaymentCallback(PaymentCallbackRequest request) {
    // ... existing validation and update logic ...
    
    if ("captured".equals(request.getStatus()) || "SUCCESS".equals(request.getStatus())) {
        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        payment.setGatewayPaymentId(request.getPaymentId());
        payment.setPaidOn(new Timestamp(System.currentTimeMillis()));
        appointment.setStatus(Appointment.Status.CONFIRMED);
        
        // Send notification after successful payment
        DoctorAvailability availability = appointment.getAvailability();
        Person doctor = availability.getDoctor().getPerson();
        Person patient = personRepository.findById(appointment.getPatientId()).orElse(null);
        
        if (doctor != null && patient != null) {
            notificationProducerService.sendAppointmentConfirmationNotification(
                doctor.getEmail(),
                doctor.getPhone(),
                doctor.getUsername(),
                patient.getUsername(),
                availability.getStartTime(), // You might need to adjust this
                payment.getAmount(),
                appointment.getAppointmentId().toString()
            );
        }
    }
    
    // ... rest of the method ...
}
```

---

## 🔔 **Part 2: Notification Service (New Spring Boot Project)**

### **🎓 Learning: Microservices Development Strategy**

**Why Create a Separate Project?**
- **Domain Separation**: Each service owns its specific business domain
- **Technology Independence**: Can use different databases, frameworks per service
- **Team Independence**: Different teams can work on different services
- **Deployment Independence**: Deploy, scale, and update services independently
- **Failure Isolation**: If one service fails, others continue working

**Microservice Design Principles:**
1. **Single Responsibility**: Each service does one thing well
2. **Decentralized**: No shared databases between services
3. **Fault Tolerant**: Handle failures gracefully
4. **Observable**: Extensive logging and monitoring
5. **Automated**: Automated testing and deployment

### **2.1 Create New Spring Boot Project - Maven Deep Dive**

### **🎓 Learning: Maven Project Structure & Dependencies**

**Maven POM.xml Explained:**
- **Parent POM**: Inherits dependency versions and configurations
- **Dependencies**: External libraries your project needs
- **Spring Boot Starters**: Pre-configured dependency bundles
- **Auto-Configuration**: Spring Boot automatically configures beans based on classpath

Create a new Spring Boot project with dependencies:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <!-- 👨‍👩‍👧‍👦 PARENT POM: Inherits Spring Boot configurations -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
        <!-- 
        🎓 What Parent POM Provides:
        - Dependency version management (no need to specify versions)
        - Plugin configurations (compiler, surefire, etc.)
        - Maven repository configurations
        - Java version defaults
        -->
    </parent>
    
    <!-- 📦 PROJECT COORDINATES -->
    <groupId>com.practo</groupId>                    <!-- Organization identifier -->
    <artifactId>notification-service</artifactId>    <!-- Project name -->
    <version>0.0.1-SNAPSHOT</version>               <!-- Current version -->
    <name>notification-service</name>               <!-- Display name -->
    <description>Notification Service for Practo Application</description>
    
    <properties>
        <java.version>17</java.version>              <!-- 📋 Java version to use -->
    </properties>
    
    <dependencies>
        <!-- 🌐 SPRING BOOT WEB STARTER -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <!-- 
            🎓 Includes:
            - Embedded Tomcat server
            - Spring MVC for REST controllers  
            - Jackson for JSON serialization
            - Logging frameworks (Logback, SLF4J)
            - Auto-configuration for web apps
            -->
        </dependency>
        
        <!-- 📨 KAFKA MESSAGING -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
            <!-- 
            🎓 Includes:
            - KafkaTemplate for producing messages
            - @KafkaListener for consuming messages
            - Consumer/Producer factories and configurations
            - Error handling and retry mechanisms
            - JSON serialization support
            -->
        </dependency>
        
        <!-- 📧 EMAIL SUPPORT -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
            <!-- 
            🎓 Includes:
            - JavaMailSender interface and implementation
            - SMTP configuration support
            - MimeMessage support for HTML emails
            - Auto-configuration for mail properties
            -->
        </dependency>
        
        <!-- 🎨 TEMPLATE ENGINE -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
            <!-- 
            🎓 Includes:
            - Thymeleaf template engine
            - Auto-configuration for template resolver
            - Support for HTML email templates
            - Template caching configurations
            -->
        </dependency>
        
        <!-- 🔧 CODE GENERATION -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
            <!-- 
            🎓 Provides annotations for:
            - @Data: Generates getters, setters, toString, equals, hashCode
            - @Builder: Generates builder pattern methods
            - @Slf4j: Generates logger field
            - @RequiredArgsConstructor: Constructor for final fields
            -->
        </dependency>
        
        <!-- ✅ VALIDATION SUPPORT -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
            <!-- 
            🎓 Includes:
            - Bean Validation API (JSR-303)
            - Hibernate Validator implementation
            - @Valid, @NotNull, @NotEmpty annotations
            - Automatic validation in Spring MVC
            -->
        </dependency>
        
        <!-- 📱 SMS SERVICE (Twilio) -->
        <dependency>
            <groupId>com.twilio.sdk</groupId>
            <artifactId>twilio</artifactId>
            <version>9.14.1</version>
            <!-- 
            🎓 Third-party library for:
            - SMS messaging via Twilio API
            - Phone number validation
            - Message delivery status tracking
            - International SMS support
            -->
        </dependency>
    </dependencies>
</project>

/*
🎓 SPRING BOOT STARTERS EXPLAINED:

Spring Boot "Starters" are dependency descriptors that include:
1. Core library + all its dependencies
2. Auto-configuration classes
3. Default configuration properties
4. Compatible versions of related libraries

Example: spring-boot-starter-web includes:
- spring-web, spring-webmvc
- embedded tomcat
- jackson for JSON
- validation libraries
- logging frameworks

This eliminates "dependency hell" and version conflicts!
*/

### **2.2 Application Configuration Deep Dive**

### **🎓 Learning: External Configuration in Spring Boot**

**Configuration Externalization Benefits:**
- **Environment-specific**: Different settings for dev/test/prod
- **Security**: Keep secrets out of code (passwords, API keys)
- **Flexibility**: Change behavior without code changes
- **12-Factor App**: Configuration stored in environment variables

**Spring Boot Configuration Hierarchy (highest priority first):**
1. Command line arguments
2. Environment variables  
3. application-{profile}.properties
4. application.properties
5. Default values in code

`application.properties`:

```properties
# 🏷️ APPLICATION IDENTITY
spring.application.name=notification-service
server.port=8081

# 📨 KAFKA CONSUMER CONFIGURATION
spring.kafka.bootstrap-servers=localhost:9092
# 🎓 Bootstrap servers: Initial Kafka broker addresses to connect to

spring.kafka.consumer.group-id=notification-service  
# 🎓 Consumer Group: Logical group of consumers working together
# - Kafka distributes messages across consumers in same group
# - Each message delivered to only one consumer in group
# - Enables horizontal scaling and fault tolerance

spring.kafka.consumer.auto-offset-reset=earliest
# 🎓 Offset Reset Strategy:
# - earliest: Read from beginning if no saved offset
# - latest: Read only new messages
# - none: Throw error if no saved offset

spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
# 🎓 Key Deserializer: Converts bytes → Java String for message keys

spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
# 🎓 Value Deserializer: Converts bytes → Java Object for message values

spring.kafka.consumer.properties.spring.json.trusted.packages=*
# 🎓 Security Setting: Which packages can be deserialized from JSON
# - "*" means trust all packages (dev only!)
# - In production: specify exact packages for security

# 📧 EMAIL CONFIGURATION (Gmail SMTP)
spring.mail.host=smtp.gmail.com
# 🎓 SMTP Server: Gmail's outgoing mail server

spring.mail.port=587
# 🎓 Port 587: Standard port for encrypted email submission (STARTTLS)
# Port 25: Unencrypted (not recommended)
# Port 465: SSL encrypted (alternative)

spring.mail.username=your-email@gmail.com
# 🎓 Authentication: Your Gmail address

spring.mail.password=your-app-password
# 🎓 App Password: NOT your Gmail password!
# Generate at: Google Account → Security → App passwords
# Required when 2FA is enabled

spring.mail.properties.mail.smtp.auth=true
# 🎓 Enable SMTP authentication

spring.mail.properties.mail.smtp.starttls.enable=true
# 🎓 Enable STARTTLS encryption: Secure connection after initial plain connection

# 📱 TWILIO SMS CONFIGURATION
twilio.account-sid=your-twilio-account-sid
# 🎓 Account SID: Your Twilio account identifier
# Format: AC + 32 hex characters

twilio.auth-token=your-twilio-auth-token  
# 🎓 Auth Token: Secret key for API authentication
# Keep this secure! Treat like a password

twilio.phone-number=your-twilio-phone-number
# 🎓 From Number: Your Twilio phone number for sending SMS
# Format: +1234567890 (with country code)

# 🔄 NOTIFICATION RETRY SETTINGS
notification.retry.max-attempts=3
# 🎓 Maximum retry attempts for failed notifications

notification.retry.delay=5000
# 🎓 Delay between retries in milliseconds (5 seconds)

# 📊 ACTUATOR CONFIGURATION (for monitoring)
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always

# 🔍 LOGGING CONFIGURATION
logging.level.com.practo.notification=DEBUG
logging.level.org.springframework.kafka=INFO
logging.pattern.console=%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n
```

### **🎓 Configuration Best Practices:**

1. **Environment Variables for Secrets:**
```properties
# Instead of hardcoding:
spring.mail.password=your-app-password

# Use environment variables:
spring.mail.password=${GMAIL_APP_PASSWORD}
```

2. **Profile-Specific Configuration:**
```properties
# application-dev.properties (development)
spring.kafka.bootstrap-servers=localhost:9092

# application-prod.properties (production)  
spring.kafka.bootstrap-servers=kafka1:9092,kafka2:9092,kafka3:9092
```

3. **Validation:**
```java
@ConfigurationProperties(prefix = "twilio")
@Validated
public class TwilioConfig {
    @NotEmpty
    private String accountSid;
    
    @NotEmpty 
    private String authToken;
}
```

### **2.3 Kafka Consumer Configuration Deep Dive**

### **🎓 Learning: Consumer Configuration Patterns**

**Consumer Factory Pattern:**
- **Purpose**: Creates Kafka consumers with standardized configuration
- **Reusability**: Same factory creates multiple consumers
- **Configuration**: Centralizes consumer settings

**Listener Container Factory:**
- **Thread Management**: Controls concurrent message processing
- **Error Handling**: Defines retry and error recovery behavior  
- **Acknowledgment**: Controls when messages are marked as processed

```java
package com.practo.notification.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

import com.practo.notification.dto.NotificationEvent;

/**
 * 🎓 Kafka Consumer Configuration Class
 * 
 * Key Concepts:
 * - @EnableKafka: Enables Kafka listener processing
 * - ConsumerFactory: Creates consumer instances with configuration
 * - ListenerContainerFactory: Manages message processing containers
 */
@EnableKafka // 🎓 Enables @KafkaListener annotation processing
@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers; // 🎓 Kafka broker addresses
    
    @Value("${spring.kafka.consumer.group-id}")  
    private String groupId; // 🎓 Consumer group identifier

    /**
     * 🎓 Consumer Factory Bean
     * Creates Kafka consumers with standardized configuration
     */
    @Bean
    public ConsumerFactory<String, NotificationEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        
        // 🎓 Connection Configuration
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        
        // 🎓 Deserialization Configuration  
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        
        // 🎓 Security: Which packages can be deserialized
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        
        // 🎓 Consumer Behavior Configuration
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false); // Manual acknowledgment
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000); // 30 seconds
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 10000); // 10 seconds
        
        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(), // 🎓 Key deserializer instance
                new JsonDeserializer<>(NotificationEvent.class)); // 🎓 Value deserializer instance
    }

    /**
     * 🎓 Kafka Listener Container Factory
     * Manages concurrent message processing and error handling
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, NotificationEvent> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, NotificationEvent> factory = 
                new ConcurrentKafkaListenerContainerFactory<>();
        
        factory.setConsumerFactory(consumerFactory());
        
        // 🎓 Concurrency: Number of consumer threads
        factory.setConcurrency(3); // 3 threads for parallel processing
        
        // 🎓 Acknowledgment Mode: Control when messages are marked as processed
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        
        // 🎓 Error Handler: Retry failed messages with exponential backoff
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
            new FixedBackOff(5000L, 3L) // 5 seconds delay, 3 retries
        );
        factory.setCommonErrorHandler(errorHandler);
        
        return factory;
    }
}
```

### **2.4 Kafka Event Listener Deep Dive**

### **🎓 Learning: @KafkaListener Pattern**

**Event-Driven Processing:**
- **Asynchronous**: Non-blocking message consumption
- **Scalable**: Multiple consumers can process in parallel
- **Resilient**: Failed messages can be retried
- **Traceable**: Headers provide debugging information

```java
package com.practo.notification.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;

import com.practo.notification.dto.NotificationEvent;
import com.practo.notification.service.NotificationService;

/**
 * 🎓 Kafka Event Listener
 * 
 * Responsibilities:
 * - Listen to notification events from Kafka topics
 * - Handle deserialization and validation
 * - Coordinate with business logic services
 * - Manage acknowledgments and error handling
 */
@Component
public class NotificationEventListener {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);
    
    @Autowired
    private NotificationService notificationService;

    /**
     * 🎓 Kafka Listener Method
     * 
     * Annotations Explained:
     * - @KafkaListener: Marks method as Kafka message consumer
     * - @Payload: Extracts message body
     * - @Header: Extracts message metadata
     */
    @KafkaListener(topics = "notification-events", groupId = "notification-service")
    @Retryable(value = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void handleNotificationEvent(
            @Payload NotificationEvent event, // 🎓 Message content
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic, // 🎓 Source topic
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition, // 🎓 Partition number
            @Header(KafkaHeaders.OFFSET) long offset, // 🎓 Message position
            @Header(value = KafkaHeaders.RECEIVED_TIMESTAMP, required = false) Long timestamp, // 🎓 When produced
            Acknowledgment acknowledgment) { // 🎓 Manual acknowledgment control
        
        long startTime = System.currentTimeMillis();
        String correlationId = event.getCorrelationId();
        
        try {
            logger.info("🎯 Processing notification event: {} | Topic: {} | Partition: {} | Offset: {} | CorrelationId: {}", 
                       event.getEventType(), topic, partition, offset, correlationId);
            
            // 🎓 Validate event before processing
            if (event.getEventType() == null || event.getEventType().trim().isEmpty()) {
                throw new IllegalArgumentException("Event type is required");
            }
            
            if (event.getRecipientEmail() == null && event.getRecipientPhone() == null) {
                throw new IllegalArgumentException("At least one recipient (email or phone) is required");
            }
            
            // 🎓 Process the notification through business service
            notificationService.processNotification(event);
            
            // 🎓 Acknowledge successful processing
            acknowledgment.acknowledge();
            
            long processingTime = System.currentTimeMillis() - startTime;
            logger.info("✅ Successfully processed notification event: {} | Processing time: {}ms | CorrelationId: {}", 
                       event.getEventType(), processingTime, correlationId);
            
        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            logger.error("❌ Error processing notification event: {} | Processing time: {}ms | CorrelationId: {} | Error: {}", 
                        event.getEventType(), processingTime, correlationId, e.getMessage(), e);
            
            // 🎓 Don't acknowledge - message will be retried by error handler
            // The DefaultErrorHandler we configured will manage retry logic
            throw e; // Re-throw to trigger retry mechanism
        }
    }
    
    /**
     * 🎓 Dead Letter Topic Handler
     * Handles messages that failed after all retry attempts
     */
    @KafkaListener(topics = "notification-events.DLT", groupId = "notification-service-dlt")
    public void handleDeadLetterEvent(
            @Payload NotificationEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment acknowledgment) {
        
        logger.error("💀 Dead letter event received: {} from topic: {}", event.getEventType(), topic);
        
        try {
            // 🎓 Handle dead letter logic
            // - Log for manual investigation
            // - Send alert to operations team
            // - Store in database for analysis
            
            logger.error("Dead letter event details: {}", event);
            
            // Always acknowledge dead letter messages to prevent infinite loops
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            logger.error("Error handling dead letter event: {}", event, e);
            acknowledgment.acknowledge(); // Still acknowledge to prevent loops
        }
    }
}
```

### **🎓 Listener Pattern Benefits:**

#### **Header Information Uses:**
- **Debugging**: Track message flow through system
- **Monitoring**: Measure processing latency and throughput
- **Auditing**: Log message lifecycle for compliance
- **Routing**: Make decisions based on topic/partition

#### **Acknowledgment Strategy:**
- **Success**: Acknowledge immediately after processing
- **Failure**: Don't acknowledge to trigger retry
- **Timeout**: Configure session timeout to detect stuck consumers
- **Dead Letter**: Handle permanently failed messages

#### **Error Handling Patterns:**
- **Transient Errors**: Network issues, temporary service unavailability
- **Poison Messages**: Invalid data that will never process successfully  
- **Resource Exhaustion**: Database connection issues, memory problems
- **Business Logic Errors**: Validation failures, business rule violations

---

### **2.5 Core Notification Service Deep Dive**

### **🎓 Learning: Service Layer Pattern**

**Service Layer Responsibilities:**
- **Business Logic**: Orchestrate notification processing
- **Template Selection**: Choose appropriate email/SMS templates  
- **External Integration**: Coordinate with email/SMS providers
- **Error Handling**: Implement retry and fallback strategies
- **Monitoring**: Track success rates and performance metrics

```java
package com.practo.notification.service;

import org.springframework.stereotype.Service;

import com.practo.notification.dto.NotificationEvent;
import com.practo.notification.service.email.EmailService;
import com.practo.notification.service.sms.SmsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final EmailService emailService;
    private final SmsService smsService;
    
    public void processNotification(NotificationEvent event) {
        log.info("Processing notification event: {} of type: {}", event.getEventId(), event.getEventType());
        
        switch (event.getEventType()) {
            case "APPOINTMENT_CONFIRMED":
                handleAppointmentConfirmation(event);
                break;
            case "APPOINTMENT_CANCELLED":
                handleAppointmentCancellation(event);
                break;
            case "PAYMENT_RECEIVED":
                handlePaymentReceived(event);
                break;
            default:
                log.warn("Unknown event type: {}", event.getEventType());
        }
    }
    
    private void handleAppointmentConfirmation(NotificationEvent event) {
        try {
            // Send email notification
            if (event.getRecipientEmail() != null) {
                emailService.sendAppointmentConfirmationEmail(event);
            }
            
            // Send SMS notification
            if (event.getRecipientPhone() != null) {
                smsService.sendAppointmentConfirmationSms(event);
            }
            
        } catch (Exception e) {
            log.error("Failed to send appointment confirmation notifications for event: {}", 
                    event.getEventId(), e);
            throw e; // Re-throw to trigger Kafka retry
        }
    }
    
    private void handleAppointmentCancellation(NotificationEvent event) {
        // Implementation for cancellation notifications
        log.info("Handling appointment cancellation for event: {}", event.getEventId());
    }
    
    private void handlePaymentReceived(NotificationEvent event) {
        // Implementation for payment notifications
        log.info("Handling payment received notification for event: {}", event.getEventId());
    }
}
```

### **2.6 Email Service with Templates**

```java
package com.practo.notification.service.email;

import java.util.HashMap;
import java.util.Map;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.practo.notification.dto.NotificationEvent;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    public void sendAppointmentConfirmationEmail(NotificationEvent event) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(event.getRecipientEmail());
            helper.setSubject("New Appointment Booking - " + event.getPatientName());
            helper.setFrom("noreply@practo.com");
            
            // Prepare template context
            Context context = new Context();
            context.setVariable("doctorName", event.getDoctorName());
            context.setVariable("patientName", event.getPatientName());
            context.setVariable("appointmentTime", event.getAppointmentTime());
            context.setVariable("consultationFee", event.getConsultationFee());
            context.setVariable("appointmentId", event.getAppointmentId());
            
            // Add template data
            if (event.getTemplateData() != null) {
                event.getTemplateData().forEach(context::setVariable);
            }
            
            String htmlContent = templateEngine.process("appointment-confirmation", context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Appointment confirmation email sent to: {}", event.getRecipientEmail());
            
        } catch (Exception e) {
            log.error("Failed to send appointment confirmation email to: {}", 
                    event.getRecipientEmail(), e);
            throw new RuntimeException("Email sending failed", e);
        }
    }
}
```

### **2.7 SMS Service with Twilio**

```java
package com.practo.notification.service.sms;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.practo.notification.dto.NotificationEvent;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SmsService {
    
    @Value("${twilio.account-sid}")
    private String accountSid;
    
    @Value("${twilio.auth-token}")
    private String authToken;
    
    @Value("${twilio.phone-number}")
    private String fromPhoneNumber;
    
    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }
    
    public void sendAppointmentConfirmationSms(NotificationEvent event) {
        try {
            String messageBody = String.format(
                "Dear Dr. %s, New appointment booked by %s for %s. Fee: ₹%.2f. ID: %s",
                event.getDoctorName(),
                event.getPatientName(), 
                event.getAppointmentTime(),
                event.getConsultationFee(),
                event.getAppointmentId()
            );
            
            Message message = Message.creator(
                    new PhoneNumber(event.getRecipientPhone()),
                    new PhoneNumber(fromPhoneNumber),
                    messageBody)
                .create();
            
            log.info("SMS sent successfully. SID: {} to: {}", message.getSid(), event.getRecipientPhone());
            
        } catch (Exception e) {
            log.error("Failed to send SMS to: {}", event.getRecipientPhone(), e);
            throw new RuntimeException("SMS sending failed", e);
        }
    }
}
```

### **2.8 Email Template**

Create `src/main/resources/templates/appointment-confirmation.html`:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>New Appointment Booking</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #2c3e50; margin-bottom: 30px; }
        .booking-details { background: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #34495e; }
        .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 New Appointment Booking</h1>
        </div>
        
        <p>Dear Dr. <span th:text="${doctorName}">Doctor Name</span>,</p>
        
        <p>You have a new appointment booking from <strong th:text="${patientName}">Patient Name</strong>.</p>
        
        <div class="booking-details">
            <h3>📋 Booking Details</h3>
            <div class="detail-row">
                <span class="label">Patient Name:</span> <span th:text="${patientName}">Patient Name</span>
            </div>
            <div class="detail-row">
                <span class="label">Appointment Date:</span> <span th:text="${appointmentDate}">Date</span>
            </div>
            <div class="detail-row">
                <span class="label">Appointment Time:</span> <span th:text="${appointmentTime}">Time</span>
            </div>
            <div class="detail-row">
                <span class="label">Consultation Fee:</span> <span th:text="${formattedFee}">Fee</span>
            </div>
            <div class="detail-row">
                <span class="label">Booking ID:</span> <span th:text="${appointmentId}">ID</span>
            </div>
        </div>
        
        <p>💰 <strong>Payment Status:</strong> ✅ Confirmed</p>
        
        <p>Please be prepared for the appointment at the scheduled time.</p>
        
        <div class="footer">
            <p>This is an automated notification from Practo Appointment System</p>
            <p>© 2024 Practo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

---

## 🐳 **Part 3: Setup & Testing Guide**

### **3.1 Setup Kafka (Using Docker)**

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

**Start Kafka:**
```bash
docker-compose up -d
```

### **3.2 Create Kafka Topic**

```bash
docker exec -it <kafka-container-id> kafka-topics --create \
  --topic appointment-notifications \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### **3.3 Testing the Complete Flow**

1. **Start both applications:**
   - Main Practo App: `http://localhost:8080`
   - Notification Service: `http://localhost:8081`

2. **Make a test appointment booking and payment**

3. **Check logs in Notification Service:**
   ```
   INFO - Received notification event: abc-123 from topic: appointment-notifications
   INFO - Processing notification event: abc-123 of type: APPOINTMENT_CONFIRMED
   INFO - Appointment confirmation email sent to: doctor@example.com
   INFO - SMS sent successfully. SID: SM123 to: +1234567890
   ```

4. **Verify notifications:**
   - Check doctor's email inbox
   - Check SMS delivery

---

## 🔧 **Part 4: Advanced Features**

### **4.1 Retry Logic with Dead Letter Queue**

```java
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 5000),
    dltStrategy = DltStrategy.FAIL_ON_ERROR
)
@KafkaListener(topics = "appointment-notifications")
public void handleNotificationEventWithRetry(NotificationEvent event) {
    // Processing logic
}
```

### **4.2 Notification Status Tracking**

Create a notification audit table to track delivery status:

```java
@Entity
public class NotificationAudit {
    @Id
    private String notificationId;
    private String eventId;
    private String channel; // EMAIL, SMS, PUSH
    private String status;  // SENT, FAILED, DELIVERED
    private LocalDateTime createdAt;
    private String errorMessage;
}
```

### **4.3 Template Management**

Create a database-driven template system for dynamic content management.

### **4.4 Multi-Channel Priority**

Implement fallback logic: Email fails → Try SMS → Try Push notification

---

## 🚀 **Deployment Considerations**

### **Production Setup:**
1. **Kafka Cluster**: Use multiple brokers for high availability
2. **Email Provider**: Use professional email services (SendGrid, AWS SES)
3. **SMS Provider**: Configure Twilio with proper rate limiting
4. **Monitoring**: Add metrics and health checks
5. **Security**: Implement proper authentication between services

### **Scaling:**
- Multiple notification service instances
- Kafka partitioning for parallel processing
- Database connection pooling
- Async email/SMS queues for bulk notifications

---

## ✅ **Summary**

This implementation provides:

🎯 **Reliable Messaging**: Kafka ensures no lost notifications  
📧 **Multi-Channel**: Email + SMS notifications  
🔄 **Retry Logic**: Automatic retry on failures  
📊 **Monitoring**: Comprehensive logging and tracking  
🏗️ **Scalable**: Microservice architecture  
🎨 **Professional**: HTML email templates  

Your notification system will automatically send beautifully formatted emails and SMS messages to doctors whenever appointments are confirmed, creating a professional and reliable communication flow!
