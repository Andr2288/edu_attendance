-- Тестові дані (MVP) — по 5 записів у кожній таблиці
-- Пароль для всіх користувачів: password123
-- bcrypt hash: $2b$10$IzeSnJulCS8vLZZXu0CoxuhpUdga8lEmjENN.jHTImpxnFuCt5pUC

SET NAMES utf8mb4;

INSERT INTO study_groups (id, name) VALUES
  (1, 'КН-21'),
  (2, 'КН-22'),
  (3, 'ПІ-21'),
  (4, 'ПІ-22'),
  (5, 'ІС-21');

INSERT INTO users (id, email, password_hash, full_name, role, group_id) VALUES
  (1, 'admin@edu.local', '$2b$10$IzeSnJulCS8vLZZXu0CoxuhpUdga8lEmjENN.jHTImpxnFuCt5pUC', 'Олена Адміненко', 'admin', NULL),
  (2, 'teacher1@edu.local', '$2b$10$IzeSnJulCS8vLZZXu0CoxuhpUdga8lEmjENN.jHTImpxnFuCt5pUC', 'Іван Викладаченко', 'teacher', NULL),
  (3, 'teacher2@edu.local', '$2b$10$IzeSnJulCS8vLZZXu0CoxuhpUdga8lEmjENN.jHTImpxnFuCt5pUC', 'Марія Петренко', 'teacher', NULL),
  (4, 'student1@edu.local', '$2b$10$IzeSnJulCS8vLZZXu0CoxuhpUdga8lEmjENN.jHTImpxnFuCt5pUC', 'Андрій Студентенко', 'student', 1),
  (5, 'student2@edu.local', '$2b$10$IzeSnJulCS8vLZZXu0CoxuhpUdga8lEmjENN.jHTImpxnFuCt5pUC', 'Катерина Коваленко', 'student', 2);

INSERT INTO disciplines (id, name) VALUES
  (1, 'Програмування'),
  (2, 'Бази даних'),
  (3, 'Веб-технології'),
  (4, 'Операційні системи'),
  (5, 'Алгоритми та структури даних');

-- Координати: орієнтир — центр Києва (для тестової геолокації)
INSERT INTO lessons (
  id, discipline_id, group_id, teacher_id,
  lesson_date, start_time, end_time,
  location_name, latitude, longitude, radius_meters, qr_token
) VALUES
  (1, 1, 1, 2, '2026-10-14', '09:00:00', '10:20:00', 'Аудиторія 301', 50.4501000, 30.5234000, 100, 'qr-lesson-001-prog-kn21'),
  (2, 2, 1, 2, '2026-10-14', '10:40:00', '12:00:00', 'Аудиторія 215', 50.4501000, 30.5234000, 100, 'qr-lesson-002-db-kn21'),
  (3, 3, 2, 3, '2026-10-15', '09:00:00', '10:20:00', 'Комп''ютерний клас 1', 50.4501000, 30.5234000, 150, 'qr-lesson-003-web-kn22'),
  (4, 4, 2, 3, '2026-10-15', '12:20:00', '13:40:00', 'Аудиторія 110', 50.4501000, 30.5234000, 100, 'qr-lesson-004-os-kn22'),
  (5, 5, 1, 2, '2026-10-16', '09:00:00', '10:20:00', 'Аудиторія 301', 50.4501000, 30.5234000, 100, 'qr-lesson-005-algo-kn21');

INSERT INTO attendances (id, lesson_id, student_id, latitude, longitude, checked_in_at) VALUES
  (1, 1, 4, 50.4501500, 30.5234500, '2026-10-14 09:05:00'),
  (2, 2, 4, 50.4501200, 30.5234100, '2026-10-14 10:45:00'),
  (3, 5, 4, 50.4500800, 30.5233800, '2026-10-16 09:04:00'),
  (4, 3, 5, 50.4502000, 30.5235000, '2026-10-15 09:03:00'),
  (5, 4, 5, 50.4500500, 30.5233500, '2026-10-15 12:25:00');
