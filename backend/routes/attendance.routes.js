const express = require('express');
const { pool } = require('../db/pool');
const { isWithinRadius } = require('../utils/geo');
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
        message: 'Потрібен QR-код',
      });
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        ok: false,
        message: 'Потрібні широта і довгота',
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
          message: 'Студента не знайдено',
        });
      }

      const student = studentRows[0];

      if (!student.group_id) {
        return res.status(400).json({
          ok: false,
          message: 'Студенту не призначено групу',
        });
      }

      const [lessonRows] = await pool.query(
        `SELECT
           id, group_id, latitude, longitude, radius_meters,
           lesson_date, location_name, is_archived
         FROM lessons
         WHERE qr_token = ?
         LIMIT 1`,
        [qrToken]
      );

      if (lessonRows.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Невірний QR-код заняття',
        });
      }

      const lesson = lessonRows[0];

      if (Number(lesson.is_archived) === 1) {
        return res.status(403).json({
          ok: false,
          message: 'Це заняття в архіві',
        });
      }

      if (Number(lesson.group_id) !== Number(student.group_id)) {
        return res.status(403).json({
          ok: false,
          message: 'Це заняття для іншої групи',
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
          message: 'Присутність на цьому занятті вже зареєстровано',
        });
      }

      const geoCheck = isWithinRadius(
        Number(lesson.latitude),
        Number(lesson.longitude),
        latitude,
        longitude,
        Number(lesson.radius_meters)
      );

      if (!geoCheck.ok) {
        return res.status(403).json({
          ok: false,
          message: 'Ви занадто далеко від місця заняття',
          distanceMeters: Math.round(geoCheck.distanceMeters),
          allowedRadiusMeters: geoCheck.allowedRadiusMeters,
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
        message: 'Присутність успішно зареєстровано',
        attendance: toAttendance(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'Присутність на цьому занятті вже зареєстровано',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося зареєструвати присутність',
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
        message: 'Не вдалося завантажити історію відвідувань',
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
        message: 'Невірний id заняття',
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
          message: 'Заняття не знайдено',
        });
      }

      if (Number(lessonRows[0].teacher_id) !== Number(req.user.id)) {
        return res.status(403).json({
          ok: false,
          message: 'Немає доступу до цього заняття',
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
        message: 'Не вдалося завантажити список присутніх',
      });
    }
  }
);

router.get(
  '/attendance/stats',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const disciplineIdRaw = req.query.disciplineId;
    const disciplineId =
      disciplineIdRaw === undefined || disciplineIdRaw === ''
        ? null
        : Number(disciplineIdRaw);

    if (
      disciplineIdRaw !== undefined &&
      disciplineIdRaw !== '' &&
      (!Number.isInteger(disciplineId) || disciplineId <= 0)
    ) {
      return res.status(400).json({
        ok: false,
        message: 'Невірний id дисципліни',
      });
    }

    try {
      const params = [req.user.id];
      let disciplineFilter = '';

      if (disciplineId !== null) {
        disciplineFilter = ' AND l.discipline_id = ?';
        params.push(disciplineId);
      }

      const [rows] = await pool.query(
        `SELECT
           d.id AS discipline_id,
           d.name AS discipline_name,
           u.id AS student_id,
           u.full_name AS student_name,
           u.email AS student_email,
           g.id AS group_id,
           g.name AS group_name,
           COUNT(DISTINCT l.id) AS total_lessons,
           COUNT(DISTINCT a.id) AS present_count
         FROM lessons l
         JOIN disciplines d ON d.id = l.discipline_id
         JOIN study_groups g ON g.id = l.group_id
         JOIN users u ON u.group_id = l.group_id AND u.role = 'student'
         LEFT JOIN attendances a
           ON a.lesson_id = l.id AND a.student_id = u.id
         WHERE l.teacher_id = ?${disciplineFilter}
         GROUP BY
           d.id, d.name,
           u.id, u.full_name, u.email,
           g.id, g.name
         ORDER BY d.name, g.name, u.full_name`,
        params
      );

      const stats = rows.map((row) => {
        const totalLessons = Number(row.total_lessons);
        const presentCount = Number(row.present_count);
        const percent =
          totalLessons === 0
            ? 0
            : Math.round((presentCount / totalLessons) * 100);

        return {
          disciplineId: row.discipline_id,
          disciplineName: row.discipline_name,
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
        message: 'Не вдалося завантажити статистику',
      });
    }
  }
);

module.exports = router;
