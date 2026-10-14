const express = require('express');
const { pool } = require('../db/pool');
const { distanceMeters } = require('../utils/geo');
const {
  requireAuth,
  requireRole,
} = require('../middleware/auth.middleware');

const router = express.Router();

function toAttendance(row) {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentEmail: row.student_email,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    checkedInAt: row.checked_in_at,
    lessonDate: row.lesson_date,
    startTime: row.start_time ? String(row.start_time).slice(0, 8) : undefined,
    endTime: row.end_time ? String(row.end_time).slice(0, 8) : undefined,
    locationName: row.location_name,
    disciplineName: row.discipline_name,
    groupName: row.group_name,
  };
}

router.post(
  '/attendance/check-in',
  requireAuth,
  requireRole('student'),
  async (req, res) => {
    const qrToken = String(req.body.qrToken || '').trim();
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    if (!qrToken) {
      return res.status(400).json({
        ok: false,
        message: 'QR code is required',
      });
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        ok: false,
        message: 'latitude and longitude are required',
      });
    }

    try {
      const [studentRows] = await pool.query(
        `SELECT id, full_name, group_id
         FROM users
         WHERE id = ? AND role = 'student'
         LIMIT 1`,
        [req.user.id]
      );

      if (studentRows.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Student not found',
        });
      }

      const student = studentRows[0];

      if (!student.group_id) {
        return res.status(400).json({
          ok: false,
          message: 'Student has no group assigned',
        });
      }

      const [lessonRows] = await pool.query(
        `SELECT
           id, group_id, latitude, longitude, radius_meters,
           lesson_date, location_name
         FROM lessons
         WHERE qr_token = ?
         LIMIT 1`,
        [qrToken]
      );

      if (lessonRows.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Invalid QR code for lesson',
        });
      }

      const lesson = lessonRows[0];

      if (Number(lesson.group_id) !== Number(student.group_id)) {
        return res.status(403).json({
          ok: false,
          message: 'This lesson is for another group',
        });
      }

      const [existingRows] = await pool.query(
        `SELECT id FROM attendances
         WHERE lesson_id = ? AND student_id = ?
         LIMIT 1`,
        [lesson.id, student.id]
      );

      if (existingRows.length > 0) {
        return res.status(409).json({
          ok: false,
          message: 'Attendance already registered for this lesson',
        });
      }

      const distance = distanceMeters(
        Number(lesson.latitude),
        Number(lesson.longitude),
        latitude,
        longitude
      );

      if (distance > Number(lesson.radius_meters)) {
        return res.status(403).json({
          ok: false,
          message: 'You are too far from the lesson location',
          distanceMeters: Math.round(distance),
          allowedRadiusMeters: Number(lesson.radius_meters),
        });
      }

      const [result] = await pool.query(
        `INSERT INTO attendances (lesson_id, student_id, latitude, longitude)
         VALUES (?, ?, ?, ?)`,
        [lesson.id, student.id, latitude, longitude]
      );

      const [rows] = await pool.query(
        `SELECT
           a.id, a.lesson_id, a.student_id, a.latitude, a.longitude, a.checked_in_at,
           l.lesson_date, l.start_time, l.end_time, l.location_name,
           d.name AS discipline_name,
           g.name AS group_name,
           u.full_name AS student_name,
           u.email AS student_email
         FROM attendances a
         JOIN lessons l ON l.id = a.lesson_id
         JOIN disciplines d ON d.id = l.discipline_id
         JOIN study_groups g ON g.id = l.group_id
         JOIN users u ON u.id = a.student_id
         WHERE a.id = ?`,
        [result.insertId]
      );

      return res.status(201).json({
        ok: true,
        message: 'Attendance registered successfully',
        attendance: toAttendance(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'Attendance already registered for this lesson',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to register attendance',
      });
    }
  }
);

router.get(
  '/attendance/me',
  requireAuth,
  requireRole('student'),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           a.id, a.lesson_id, a.student_id, a.latitude, a.longitude, a.checked_in_at,
           l.lesson_date, l.start_time, l.end_time, l.location_name,
           d.name AS discipline_name,
           g.name AS group_name,
           u.full_name AS student_name,
           u.email AS student_email
         FROM attendances a
         JOIN lessons l ON l.id = a.lesson_id
         JOIN disciplines d ON d.id = l.discipline_id
         JOIN study_groups g ON g.id = l.group_id
         JOIN users u ON u.id = a.student_id
         WHERE a.student_id = ?
         ORDER BY l.lesson_date DESC, l.start_time DESC`,
        [req.user.id]
      );

      return res.json({
        ok: true,
        attendances: rows.map(toAttendance),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load attendance history',
      });
    }
  }
);

router.get(
  '/lessons/:id/attendances',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const lessonId = Number(req.params.id);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid lesson id',
      });
    }

    try {
      const [lessonRows] = await pool.query(
        `SELECT id, teacher_id FROM lessons WHERE id = ? LIMIT 1`,
        [lessonId]
      );

      if (lessonRows.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Lesson not found',
        });
      }

      if (Number(lessonRows[0].teacher_id) !== Number(req.user.id)) {
        return res.status(403).json({
          ok: false,
          message: 'Access denied for this lesson',
        });
      }

      const [rows] = await pool.query(
        `SELECT
           a.id, a.lesson_id, a.student_id, a.latitude, a.longitude, a.checked_in_at,
           u.full_name AS student_name,
           u.email AS student_email
         FROM attendances a
         JOIN users u ON u.id = a.student_id
         WHERE a.lesson_id = ?
         ORDER BY a.checked_in_at`,
        [lessonId]
      );

      return res.json({
        ok: true,
        lessonId,
        attendances: rows.map(toAttendance),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load lesson attendances',
      });
    }
  }
);

router.get(
  '/attendance/stats',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           u.id AS student_id,
           u.full_name AS student_name,
           u.email AS student_email,
           g.id AS group_id,
           g.name AS group_name,
           COUNT(DISTINCT l.id) AS total_lessons,
           COUNT(DISTINCT a.id) AS present_count
         FROM lessons l
         JOIN study_groups g ON g.id = l.group_id
         JOIN users u ON u.group_id = l.group_id AND u.role = 'student'
         LEFT JOIN attendances a
           ON a.lesson_id = l.id AND a.student_id = u.id
         WHERE l.teacher_id = ?
         GROUP BY u.id, u.full_name, u.email, g.id, g.name
         ORDER BY g.name, u.full_name`,
        [req.user.id]
      );

      const stats = rows.map((row) => {
        const totalLessons = Number(row.total_lessons);
        const presentCount = Number(row.present_count);
        const percent =
          totalLessons === 0
            ? 0
            : Math.round((presentCount / totalLessons) * 100);

        return {
          studentId: row.student_id,
          studentName: row.student_name,
          studentEmail: row.student_email,
          groupId: row.group_id,
          groupName: row.group_name,
          totalLessons,
          presentCount,
          percent,
        };
      });

      return res.json({
        ok: true,
        stats,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load attendance stats',
      });
    }
  }
);

module.exports = router;
