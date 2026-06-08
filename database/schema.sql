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

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin (password: Admin@123)
INSERT IGNORE INTO Admin (full_name, email, password_hash)
VALUES ('System Administrator', 'admin@schooladmin.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG');

-- Sample Teachers (password: Teacher@123)
INSERT IGNORE INTO Teacher (teacher_number, first_name, last_name, email, password_hash, phone, department, specialization, status)
VALUES
('TCH2024001', 'Ibrahim', 'Koroma',  'i.koroma@schooladmin.edu',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '+23276123456', 'Computing', 'Software Engineering', 'active'),
('TCH2024002', 'Fatima',  'Bangura', 'f.bangura@schooladmin.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '+23276234567', 'Computing', 'Database Systems', 'active'),
('TCH2024003', 'Mohamed', 'Conteh',  'm.conteh@schooladmin.edu',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '+23276345678', 'Business',  'Management Information Systems', 'active'),
('TCH2024004', 'Aminata', 'Kamara',  'a.kamara@schooladmin.edu',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '+23276456789', 'Science',   'Data Analytics', 'active');

-- Sample Students (password: Student@123)
INSERT IGNORE INTO Student (student_number, first_name, last_name, email, password_hash, date_of_birth, gender, phone, nationality, consent_gdpr, status)
VALUES
('SAS20240001', 'Abdul',    'Sesay',   'a.sesay@student.schooladmin.edu',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2002-03-15', 'male',   '+23278123456', 'Sierra Leonean', 1, 'active'),
('SAS20240002', 'Mariama',  'Turay',   'm.turay@student.schooladmin.edu',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2001-07-22', 'female', '+23278234567', 'Sierra Leonean', 1, 'active'),
('SAS20240003', 'Osman',    'Jalloh',  'o.jalloh@student.schooladmin.edu',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2003-01-10', 'male',   '+23278345678', 'Sierra Leonean', 1, 'active'),
('SAS20240004', 'Adama',    'Fofanah', 'a.fofanah@student.schooladmin.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2002-11-05', 'male',   '+23278456789', 'Sierra Leonean', 1, 'active'),
('SAS20240005', 'Isatu',    'Mansaray','i.mansaray@student.schooladmin.edu','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2001-09-18', 'female', '+23278567890', 'Sierra Leonean', 1, 'active'),
('SAS20240006', 'Samuel',   'Kanu',    's.kanu@student.schooladmin.edu',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2002-04-30', 'male',   '+23278678901', 'Sierra Leonean', 1, 'active'),
('SAS20240007', 'Kadiatu',  'Diallo',  'k.diallo@student.schooladmin.edu',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2003-06-14', 'female', '+23278789012', 'Sierra Leonean', 1, 'active'),
('SAS20240008', 'Foday',    'Bah',     'f.bah@student.schooladmin.edu',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0nDvVKQiJG', '2001-12-01', 'male',   '+23278890123', 'Sierra Leonean', 1, 'pending');

-- Classes
INSERT IGNORE INTO Class (class_name, class_code, teacher_id, program, credit_hours, semester, schedule)
VALUES
('Introduction to Programming',      'CS101', 1, 'BIT',  3, '2024-Sem1', 'Mon/Wed 08:00-10:00'),
('Database Management Systems',      'CS201', 2, 'BIT',  3, '2024-Sem1', 'Tue/Thu 10:00-12:00'),
('Software Engineering Fundamentals','CS301', 1, 'BSEM', 3, '2024-Sem1', 'Mon/Wed 14:00-16:00'),
('Business Information Systems',     'BI101', 3, 'BBIT', 3, '2024-Sem1', 'Tue/Thu 14:00-16:00'),
('Data Analytics & Visualization',   'DA101', 4, 'DAT',  3, '2024-Sem1', 'Fri 08:00-12:00'),
('ICT Project Management',           'IT301', 3, 'BICT', 3, '2024-Sem1', 'Mon 14:00-18:00'),
('Computer Networks',                'CS401', 1, 'BIT',  3, '2024-Sem2', 'Mon/Wed 08:00-10:00'),
('Advanced Database',                'CS501', 2, 'BBIT', 3, '2024-Sem2', 'Tue/Thu 10:00-12:00');

-- Registrations
INSERT IGNORE INTO Registration (student_id, program, year_of_study, status, reviewed_by, reviewed_at, submitted_at)
VALUES
(1, 'BIT',  1, 'approved', 1, '2024-01-10 09:00:00', '2024-01-08 10:00:00'),
(2, 'BBIT', 1, 'approved', 1, '2024-01-10 09:15:00', '2024-01-08 11:00:00'),
(3, 'BSEM', 2, 'approved', 1, '2024-01-10 09:30:00', '2024-01-08 12:00:00'),
(4, 'BICT', 1, 'approved', 1, '2024-01-10 09:45:00', '2024-01-08 13:00:00'),
(5, 'DAT',  1, 'approved', 1, '2024-01-10 10:00:00', '2024-01-08 14:00:00'),
(6, 'BIT',  2, 'approved', 1, '2024-01-10 10:15:00', '2024-01-08 15:00:00'),
(7, 'BBIT', 2, 'approved', 1, '2024-01-10 10:30:00', '2024-01-08 16:00:00'),
(8, 'BSEM', 1, 'pending',  NULL, NULL,                '2024-06-01 10:00:00');

-- Enrolments (StudentClass)
INSERT IGNORE INTO StudentClass (student_id, class_id) VALUES
(1,1),(1,2),(1,7),(2,4),(2,8),(3,3),(3,1),(4,6),(4,4),(5,5),(5,2),(6,1),(6,7),(7,4),(7,8);

-- Payments
INSERT IGNORE INTO Payment (student_id, amount_paid, amount_due, payment_date, payment_method, reference, semester, status, verified_by, verified_at)
VALUES
(1, 1500000, 1500000, '2024-01-15', 'Bank Transfer', 'TXN-001-2024', '2024-Sem1', 'verified', 1, '2024-01-16 10:00:00'),
(2, 1500000, 1500000, '2024-01-16', 'Mobile Money',  'TXN-002-2024', '2024-Sem1', 'verified', 1, '2024-01-17 10:00:00'),
(3, 1500000, 1500000, '2024-01-17', 'Bank Transfer', 'TXN-003-2024', '2024-Sem1', 'verified', 1, '2024-01-18 10:00:00'),
(4, 1200000, 1500000, '2024-01-18', 'Cash',          'TXN-004-2024', '2024-Sem1', 'verified', 1, '2024-01-19 10:00:00'),
(5, 1500000, 1500000, '2024-01-20', 'Mobile Money',  'TXN-005-2024', '2024-Sem1', 'verified', 1, '2024-01-21 10:00:00'),
(6, 1500000, 1500000, '2024-01-22', 'Bank Transfer', 'TXN-006-2024', '2024-Sem1', 'verified', 1, '2024-01-23 10:00:00'),
(7, 750000,  1500000, '2024-01-25', 'Mobile Money',  'TXN-007-2024', '2024-Sem1', 'pending',  NULL, NULL);

-- Attendance (sample records)
INSERT IGNORE INTO Attendance (student_id, class_id, date, status, recorded_by)
VALUES
(1,1,'2024-02-05','present',1),(1,1,'2024-02-07','present',1),(1,1,'2024-02-12','absent',1),
(2,4,'2024-02-05','present',3),(2,4,'2024-02-07','present',3),(2,4,'2024-02-12','present',3),
(3,3,'2024-02-05','present',1),(3,3,'2024-02-07','absent',1),(3,3,'2024-02-12','present',1),
(4,6,'2024-02-05','present',3),(4,6,'2024-02-07','present',3),(4,6,'2024-02-12','present',3),
(5,5,'2024-02-05','absent',4),(5,5,'2024-02-07','present',4),(5,5,'2024-02-12','present',4),
(6,1,'2024-02-05','present',1),(6,1,'2024-02-07','present',1),(6,1,'2024-02-12','late',1);

-- ReportCards
INSERT IGNORE INTO ReportCard (student_id, class_id, semester, grade, score, comments, entered_by)
VALUES
(1,1,'2024-Sem1','A',  92.5, 'Excellent work in programming fundamentals', 1),
(1,2,'2024-Sem1','B+', 87.0, 'Good understanding of database concepts', 2),
(2,4,'2024-Sem1','A-', 90.0, 'Strong analytical skills demonstrated', 3),
(3,3,'2024-Sem1','B',  83.5, 'Good progress in software engineering', 1),
(3,1,'2024-Sem1','A',  94.0, 'Outstanding performance', 1),
(4,6,'2024-Sem1','B-', 76.0, 'Needs improvement in project planning', 3),
(5,5,'2024-Sem1','A',  95.5, 'Exceptional data analysis skills', 4),
(6,1,'2024-Sem1','C+', 72.5, 'Adequate understanding; more practice needed', 1);

-- Payroll
INSERT IGNORE INTO Payroll (teacher_id, salary_amount, allowances, deductions, net_pay, pay_period, status, approved_by, approved_at, created_by)
VALUES
(1, 5000000, 500000, 350000, 5150000, '2024-05-01', 'approved', 1, '2024-05-28 10:00:00', 1),
(2, 4500000, 400000, 315000, 4585000, '2024-05-01', 'approved', 1, '2024-05-28 10:05:00', 1),
(3, 4800000, 450000, 336000, 4914000, '2024-05-01', 'approved', 1, '2024-05-28 10:10:00', 1),
(4, 4200000, 380000, 294000, 4286000, '2024-05-01', 'approved', 1, '2024-05-28 10:15:00', 1),
(1, 5000000, 500000, 350000, 5150000, '2024-06-01', 'pending',  NULL, NULL, 1),
(2, 4500000, 400000, 315000, 4585000, '2024-06-01', 'pending',  NULL, NULL, 1);

-- Audit Log
INSERT IGNORE INTO AuditLog (user_id, user_role, action, entity_type, entity_id, notes)
VALUES
(1, 'admin', 'APPROVE_REGISTRATION', 'Registration', 1, 'Abdul Sesay - BIT Year 1'),
(1, 'admin', 'APPROVE_REGISTRATION', 'Registration', 2, 'Mariama Turay - BBIT Year 1'),
(1, 'admin', 'APPROVE_PAYROLL',      'Payroll',      1, 'May 2024 payroll - Ibrahim Koroma');
