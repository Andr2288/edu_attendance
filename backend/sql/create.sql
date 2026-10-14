-- Схема БД системи обліку відвідуваності (QR + геолокація)
-- База даних має бути вже створена і вибрана скриптом db_setup.js

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS attendances;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS disciplines;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS study_groups;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE study_groups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_study_groups_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role ENUM('admin', 'teacher', 'student') NOT NULL,
  group_id INT UNSIGNED NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_group_id (group_id),
  CONSTRAINT fk_users_group
    FOREIGN KEY (group_id) REFERENCES study_groups (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE disciplines (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_disciplines_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lessons (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  discipline_id INT UNSIGNED NOT NULL,
  group_id INT UNSIGNED NOT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_name VARCHAR(200) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  radius_meters INT UNSIGNED NOT NULL DEFAULT 100,
  qr_token VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lessons_qr_token (qr_token),
  KEY idx_lessons_teacher_id (teacher_id),
  KEY idx_lessons_group_id (group_id),
  KEY idx_lessons_discipline_id (discipline_id),
  KEY idx_lessons_date (lesson_date),
  CONSTRAINT fk_lessons_discipline
    FOREIGN KEY (discipline_id) REFERENCES disciplines (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_lessons_group
    FOREIGN KEY (group_id) REFERENCES study_groups (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_lessons_teacher
    FOREIGN KEY (teacher_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendances (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lesson_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendances_lesson_student (lesson_id, student_id),
  KEY idx_attendances_student_id (student_id),
  CONSTRAINT fk_attendances_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_attendances_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
