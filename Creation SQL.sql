-- Use the database
CREATE DATABASE IF NOT EXISTS practo_project;
USE practo_project;

-- 1. Person (Users: Patient / Doctor / Admin)
CREATE TABLE Person (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL,
    location VARCHAR(255)
);

-- 2. Doctor (Extra info for doctors only)
CREATE TABLE Doctor (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    speciality VARCHAR(100) NOT NULL,
    experience_years INT DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES Person(user_id)
);

-- 3. Availability (Doctor slots)
CREATE TABLE Doctor_Availability (
    availability_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id)
);

-- 4. Appointment (Patient books a slot)
CREATE TABLE Appointment (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    availability_id INT NOT NULL,
    booked_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('WAITING','ACCEPTED','CANCELLED') DEFAULT 'WAITING',
    FOREIGN KEY (patient_id) REFERENCES Person(user_id),
    FOREIGN KEY (availability_id) REFERENCES Doctor_Availability(availability_id)
);

-- 5. Payments 
CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'PENDING',
    paid_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gateway_order_id VARCHAR(255) DEFAULT NULL,
    gateway_payment_id VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id)
);
