-- ============================================================
-- School Administration System - MySQL Database Schema
-- Version: 1.0.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS school_admin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_admin_db;

-- Admin Table
CREATE TABLE IF NOT EXISTS Admin (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status        ENUM('active','inactive') DEFAULT 'active',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- Teacher Table
CREATE TABLE IF NOT EXISTS Teacher (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  teacher_number   VARCHAR(20) UNIQUE NOT NULL,
  first_name       VARCHAR(80) NOT NULL,
  last_name        VARCHAR(80) NOT NULL,
  email            VARCHAR(150) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  phone            VARCHAR(30),
  department       VARCHAR(100),
  specialization   VARCHAR(150),
  status           ENUM('active','inactive','on_leave') DEFAULT 'active',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- Student Table
CREATE TABLE IF NOT EXISTS Student (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  student_number            VARCHAR(20) UNIQUE NOT NULL,
  first_name                VARCHAR(80) NOT NULL,
  last_name                 VARCHAR(80) NOT NULL,
  email                     VARCHAR(150) UNIQUE NOT NULL,
  password_hash             VARCHAR(255) NOT NULL,
  date_of_birth             DATE,
  gender                    ENUM('male','female','other','prefer_not_to_say'),
  phone                     VARCHAR(30),
  address                   TEXT,
  nationality               VARCHAR(80) DEFAULT 'Sierra Leonean',
  emergency_contact_name    VARCHAR(100),
  emergency_contact_phone   VARCHAR(30),
  consent_gdpr              TINYINT(1) DEFAULT 0,
  status                    ENUM('pending','active','suspended','graduated') DEFAULT 'pending',
  created_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- Class Table
CREATE TABLE IF NOT EXISTS Class (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  class_name   VARCHAR(150) NOT NULL,
  class_code   VARCHAR(20) UNIQUE,
  teacher_id   INT,
  program      VARCHAR(50),
  credit_hours TINYINT DEFAULT 3,
  semester     VARCHAR(30),
  schedule     VARCHAR(200),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES Teacher(id) ON DELETE SET NULL
);

-- Student Class Enrollment Join Table
CREATE TABLE IF NOT EXISTS StudentClass (
  student_id  INT NOT NULL,
  class_id    INT NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, class_id),
  FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES Class(id)   ON DELETE CASCADE
);

-- Registration Table
CREATE TABLE IF NOT EXISTS Registration (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_id       INT NOT NULL,
  program          VARCHAR(50) NOT NULL,
  year_of_study    TINYINT DEFAULT 1,
  status           ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by      INT,
  reviewed_at      DATETIME,
  rejection_reason TEXT,
  submitted_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES Admin(id)   ON DELETE SET NULL
);

-- Payment Table
CREATE TABLE IF NOT EXISTS Payment (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  amount_paid    DECIMAL(12,2) NOT NULL,
  amount_due     DECIMAL(12,2) NOT NULL,
  payment_date   DATE NOT NULL,
  payment_method VARCHAR(50),
  reference      VARCHAR(100),
  semester       VARCHAR(30),
  status         ENUM('pending','verified','rejected') DEFAULT 'pending',
  verified_by    INT,
  verified_at    DATETIME,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES Admin(id)   ON DELETE SET NULL
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS Attendance (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  class_id     INT NOT NULL,
  date         DATE NOT NULL,
  status       ENUM('present','absent','late','excused') NOT NULL,
  recorded_by  INT,
  recorded_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (student_id, class_id, date),
  FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES Class(id)   ON DELETE CASCADE
);

-- ReportCard Table
CREATE TABLE IF NOT EXISTS ReportCard (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  class_id    INT NOT NULL,
  semester    VARCHAR(30) NOT NULL,
  grade       VARCHAR(5),
  score       DECIMAL(5,2),
  comments    TEXT,
  entered_by  INT,
  entered_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_grade (student_id, class_id, semester),
  FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES Class(id)   ON DELETE CASCADE
);

-- Transcript Table
CREATE TABLE IF NOT EXISTS Transcript (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_id       INT NOT NULL,
  status           ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by      INT,
  approved_at      DATETIME,
  rejection_reason TEXT,
  requested_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES Admin(id)  ON DELETE SET NULL
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS Payroll (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id       INT NOT NULL,
  salary_amount    DECIMAL(12,2) NOT NULL,
  allowances       DECIMAL(12,2) DEFAULT 0.00,
  deductions       DECIMAL(12,2) DEFAULT 0.00,
  net_pay          DECIMAL(12,2) NOT NULL,
  pay_period       DATE NOT NULL,
  status           ENUM('pending','approved','rejected','disbursed') DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by      INT,
  approved_at      DATETIME,
  created_by       INT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES Teacher(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES Admin(id)  ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES Admin(id)  ON DELETE SET NULL
);

-- AuditLog Table
CREATE TABLE IF NOT EXISTS AuditLog (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  user_role   VARCHAR(20),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INT,
  notes       TEXT,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default Admin (password: Admin@123)
INSERT IGNORE INTO Admin (full_name, email, password_hash)
VALUES ('System Administrator', 'admin@schooladmin.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG');
