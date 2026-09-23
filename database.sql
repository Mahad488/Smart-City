CREATE DATABASE smart_city;
use smart_city;

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(255),
    status ENUM('Active', 'Maintenance', 'Available') DEFAULT 'Available',
    condition_status ENUM('Good', 'Fair', 'Needs Repair') DEFAULT 'Good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emergencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    team VARCHAR(100),
    priority ENUM('Critical', 'High', 'Medium') DEFAULT 'Medium',
    status ENUM('Active', 'Responding', 'Resolved') DEFAULT 'Active',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Complaint', 'Emergency', 'Department', 'System') DEFAULT 'System',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gis_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    x INT,
    y INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_type VARCHAR(50),
    period VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO departments (name, description, status)
VALUES
('Waste Management', 'Handles waste collection and sanitation services', 'Active'),
('Water Management', 'Manages water supply and pipeline services', 'Active'),
('Roads & Infrastructure', 'Manages roads, streets and infrastructure', 'Active'),
('Emergency Services', 'Handles emergency and response operations', 'Active'),
('Health Services', 'Manages public hospitals and health facilities', 'Active'),
('Parks & Recreation', 'Manages parks and public recreational areas', 'Active'),
('Traffic Management', 'Manages traffic and road safety operations', 'Active'),
('Electricity Services', 'Handles electricity related city services', 'Active');

DESCRIBE departments;

ALTER TABLE departments
ADD COLUMN category VARCHAR(100) AFTER name,
ADD COLUMN officer VARCHAR(100) AFTER category,
ADD COLUMN phone VARCHAR(30) AFTER officer,
ADD COLUMN email VARCHAR(150) AFTER phone,
ADD COLUMN cases INT DEFAULT 0 AFTER email,
ADD COLUMN performance INT DEFAULT 0 AFTER cases;

ALTER TABLE departments
MODIFY COLUMN status ENUM('Active', 'Under Review') DEFAULT 'Active';

Select * from assets;

INSERT INTO assets
(name, department, location, status, condition_status)
VALUES
('Garbage Collection Truck', 'Waste Management', 'Sector F-8', 'Active', 'Good'),
('Street Cleaning Vehicle', 'Sanitation', 'Sector G-9', 'Maintenance', 'Needs Repair'),
('Water Tanker', 'Water Management', 'Sector I-10', 'Available', 'Good'),
('Road Maintenance Truck', 'Roads & Infrastructure', 'Sector H-8', 'Active', 'Good'),
('Emergency Response Vehicle', 'Emergency Services', 'Blue Area', 'Active', 'Fair');

INSERT INTO complaints
(category, description, location, priority, status)
VALUES
('Water Supply',
 'Water supply has been interrupted in the area and residents are facing difficulties.',
 'Sector F-8, Lahore',
 'High',
 'Pending'),

('Road Damage',
 'Large potholes have appeared on the main road and require immediate repair.',
 'Sector G-9, Lahore',
 'Medium',
 'In Progress'),

('Waste Management',
 'Garbage has not been collected for several days and waste is accumulating.',
 'Johar Town, Lahore',
 'High',
 'In Progress'),

('Street Lights',
 'Street lights are not working properly at night, causing visibility problems.',
 'Model Town, Lahore',
 'Low',
 'Resolved'),

('Traffic',
 'Traffic signal is not working correctly and causing traffic congestion.',
 'Main Boulevard Gulberg, Lahore',
 'Medium',
 'Pending'),

('Water Supply',
 'Low water pressure has been reported by residents in the area.',
 'DHA Phase 5, Lahore',
 'High',
 'Resolved'),

('Public Safety',
 'A public safety concern has been reported near the residential area.',
 'Bahria Town, Lahore',
 'High',
 'In Progress'),

('Waste Management',
 'Waste collection service is delayed and garbage bins are overflowing.',
 'Wapda Town, Lahore',
 'Low',
 'Resolved');
 
 INSERT INTO emergencies
(type, location, team, priority, status)
VALUES
('Fire Emergency', 'Gulberg III, Lahore', 'Fire Rescue Team', 'Critical', 'Active'),
('Medical Emergency', 'Johar Town, Lahore', 'Medical Response Team', 'High', 'Responding'),
('Road Accident', 'Canal Road, Lahore', 'Traffic Rescue Team', 'High', 'Active'),
('Building Collapse', 'Anarkali, Lahore', 'Rescue 1122 Team', 'Critical', 'Responding'),
('Gas Leakage', 'Model Town, Lahore', 'Emergency Response Team', 'High', 'Resolved'),
('Flood Emergency', 'DHA Phase 6, Lahore', 'Flood Response Team', 'Medium', 'Resolved');

ALTER TABLE departments
ADD COLUMN latitude DECIMAL(10,7) NULL,
ADD COLUMN longitude DECIMAL(10,7) NULL;

ALTER TABLE assets
ADD COLUMN latitude DECIMAL(10,7) NULL,
ADD COLUMN longitude DECIMAL(10,7) NULL;

ALTER TABLE emergencies
ADD COLUMN latitude DECIMAL(10,7) NULL,
ADD COLUMN longitude DECIMAL(10,7) NULL;

UPDATE departments
SET latitude = 31.5204, longitude = 74.3587
WHERE id = 1;

UPDATE assets
SET latitude = 31.5204, longitude = 74.3587
WHERE id = 1;

UPDATE assets
SET latitude = 31.5300, longitude = 74.3500
WHERE id = 2;

UPDATE assets
SET latitude = 31.5100, longitude = 74.3700
WHERE id = 3;

UPDATE assets
SET latitude = 31.5250, longitude = 74.3450
WHERE id = 4;

UPDATE assets
SET latitude = 31.5150, longitude = 74.3650
WHERE id = 5;

UPDATE emergencies
SET latitude = 31.5204, longitude = 74.3587
WHERE id = 1;

UPDATE emergencies
SET latitude = 31.5300, longitude = 74.3500
WHERE id = 2;

UPDATE emergencies
SET latitude = 31.5100, longitude = 74.3700
WHERE id = 3;

UPDATE emergencies
SET latitude = 31.5250, longitude = 74.3450
WHERE id = 4;

UPDATE emergencies
SET latitude = 31.5150, longitude = 74.3650
WHERE id = 5;

UPDATE emergencies
SET latitude = 31.5350, longitude = 74.3750
WHERE id = 6;

DESCRIBE complaints;
DESCRIBE emergencies;
DESCRIBE departments;

CREATE TABLE service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(150) NOT NULL,
    total_requests INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO service_requests (service_name, total_requests)
VALUES
('Citizen Registration', 1245),
('Birth/Death Certificate', 856),
('Property Tax', 642),
('Water Connection', 521),
('Electricity Connection', 487),
('Vehicle Registration', 320);

ALTER TABLE complaints
ADD COLUMN latitude DECIMAL(10, 7) NULL,
ADD COLUMN longitude DECIMAL(10, 7) NULL;

UPDATE complaints
SET latitude = 31.5204,
    longitude = 74.3587
WHERE id = 1;

UPDATE complaints
SET latitude = 31.5300,
    longitude = 74.3500
WHERE id = 2;

UPDATE complaints
SET latitude = 31.5100,
    longitude = 74.3700
WHERE id = 3;

DESCRIBE departments;
DESCRIBE assets;
DESCRIBE complaints;
DESCRIBE emergencies;

ALTER TABLE complaints
ADD COLUMN latitude DECIMAL(10,7) NULL,
ADD COLUMN longitude DECIMAL(10,7) NULL;

SELECT id, category, location, latitude, longitude
FROM complaints;

INSERT INTO notifications (title, message, type)
VALUES
('New Complaint', 'A new complaint has been submitted by a citizen.', 'Complaint'),
('Emergency Alert', 'A new emergency has been reported in the city.', 'Emergency'),
('Department Update', 'Department information has been updated successfully.', 'Department'),
('System Update', 'GIS system has been updated successfully.', 'System'),
('Complaint Resolved', 'Your submitted complaint has been resolved.', 'Complaint'),
('Emergency Resolved', 'The reported emergency has been handled successfully.', 'Emergency');

CREATE TABLE notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT TRUE,
    emergency_alerts BOOLEAN DEFAULT TRUE,
    complaint_updates BOOLEAN DEFAULT TRUE,
    system_updates BOOLEAN DEFAULT FALSE
);

INSERT INTO notification_preferences
(email_notifications, emergency_alerts, complaint_updates, system_updates)
VALUES
(TRUE, TRUE, TRUE, FALSE);

CREATE TABLE citizens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    area VARCHAR(100),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Pending', 'Inactive') DEFAULT 'Pending'
);

INSERT INTO citizens
(citizen_id, name, email, phone, area, registered_at, status)
VALUES
('CIT-10001', 'Ahmed Khan', 'ahmed.khan@email.com', '+92 300 1234567', 'Central City', '2026-09-06', 'Active'),
('CIT-10002', 'Sara Ahmed', 'sara.ahmed@email.com', '+92 301 4567890', 'North District', '2026-09-05', 'Active'),
('CIT-10003', 'Usman Ali', 'usman.ali@email.com', '+92 302 9876543', 'West Zone', '2026-09-04', 'Pending'),
('CIT-10004', 'Fatima Zahra', 'fatima.z@email.com', '+92 303 5551234', 'East Zone', '2026-09-03', 'Active'),
('CIT-10005', 'Hassan Raza', 'hassan.raza@email.com', '+92 304 7778899', 'South District', '2026-09-02', 'Inactive'),
('CIT-10006', 'Ayesha Malik', 'ayesha.malik@email.com', '+92 305 2223344', 'Central City', '2026-09-01', 'Active');

ALTER TABLE citizens
ADD COLUMN password_hash VARCHAR(255) AFTER email;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins
(name, email, phone, password_hash, status)
VALUES
(
    'System Administrator',
    'admin@smartcity.com',
    NULL,
    '$2b$10$s7q3LkCpetpJ0dxY10xIx.5o9unQzcMKRKuE6syYV2DejEr9Jn58m',
    'Active'
);

CREATE TABLE admin_settings (
    admin_id INT PRIMARY KEY,
    language VARCHAR(50) DEFAULT 'English',
    timezone VARCHAR(100) DEFAULT 'Pakistan Standard Time',
    date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY',
    dashboard_refresh VARCHAR(30) DEFAULT '5 Minutes',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_admin_settings_admin
      FOREIGN KEY (admin_id) REFERENCES admins(id)
      ON DELETE CASCADE
);

ALTER TABLE complaints
ADD COLUMN citizen_id VARCHAR(20) NULL;

ALTER TABLE emergencies
ADD COLUMN citizen_id VARCHAR(20) NULL;