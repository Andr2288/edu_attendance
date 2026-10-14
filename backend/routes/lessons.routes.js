const crypto = require('crypto');
const express = require('express');
const { pool } = require('../db/pool');
const {
  requireAuth,
  requireRole,
} = require('../middleware/auth.middleware');

const router = express.Router();

function toLesson(row) {
  return {
    id: row.id,
    disciplineId: row.discipline_id,
    disciplineName: row.discipline_name,
    groupId: row.group_id,
    groupName: row.group_name,
    teacherId: row.teacher_id,
    lessonDate: row.lesson_date,
    startTime: String(row.start_time).slice(0, 8),
    endTime: String(row.end_time).slice(0, 8),
    locationName: row.location_name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radiusMeters: Number(row.radius_meters),
    qrToken: row.qr_token,
    createdAt: row.created_at,
  };
}

const LESSON_SELECT = `
  SELECT
    l.id,
    l.discipline_id,
    d.name AS discipline_name,
    l.group_id,
    g.name AS group_name,
    l.teacher_id,
    l.lesson_date,
    l.start_time,
    l.end_time,
    l.location_name,
    l.latitude,
    l.longitude,
    l.radius_meters,
    l.qr_token,
    l.created_at
  FROM lessons l
  JOIN disciplines d ON d.id = l.discipline_id
  JOIN study_groups g ON g.id = l.group_id
`;

function createQrToken() {
  return crypto.randomBytes(16).toString('hex');
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function normalizeTime(value) {
  return value.length === 5 ? `${value}:00` : value;
}

async function findById(id) {
  const [rows] = await pool.query(
    `${LESSON_SELECT} WHERE l.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

router.get(
  '/lessons',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `${LESSON_SELECT}
         WHERE l.teacher_id = ?
         ORDER BY l.lesson_date DESC, l.start_time DESC`,
        [req.user.id]
      );

      return res.json({
        ok: true,
        lessons: rows.map(toLesson),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load lessons',
      });
    }
  }
);

router.get(
  '/lessons/:id',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid lesson id',
      });
    }

    try {
      const row = await findById(id);

      if (!row) {
        return res.status(404).json({
          ok: false,
          message: 'Lesson not found',
        });
      }

      if (row.teacher_id !== req.user.id) {
        return res.status(403).json({
          ok: false,
          message: 'Access denied for this lesson',
        });
      }

      return res.json({
        ok: true,
        lesson: toLesson(row),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load lesson',
      });
    }
  }
);

router.get(
  '/lessons/:id/qr',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid lesson id',
      });
    }

    try {
      const row = await findById(id);

      if (!row) {
        return res.status(404).json({
          ok: false,
          message: 'Lesson not found',
        });
      }

      if (row.teacher_id !== req.user.id) {
        return res.status(403).json({
          ok: false,
          message: 'Access denied for this lesson',
        });
      }

      return res.json({
        ok: true,
        lessonId: row.id,
        qrToken: row.qr_token,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load QR code',
      });
    }
  }
);

router.post(
  '/lessons',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const disciplineId = Number(req.body.disciplineId);
    const groupId = Number(req.body.groupId);
    const lessonDate = String(req.body.lessonDate || '').trim();
    const startTimeRaw = String(req.body.startTime || '').trim();
    const endTimeRaw = String(req.body.endTime || '').trim();
    const locationName = String(req.body.locationName || '').trim();
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const radiusMeters =
      req.body.radiusMeters === undefined || req.body.radiusMeters === null
        ? 100
        : Number(req.body.radiusMeters);

    if (!Number.isInteger(disciplineId) || disciplineId <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Valid disciplineId is required',
      });
    }

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Valid groupId is required',
      });
    }

    if (!isValidDate(lessonDate)) {
      return res.status(400).json({
        ok: false,
        message: 'lessonDate must be YYYY-MM-DD',
      });
    }

    if (!isValidTime(startTimeRaw) || !isValidTime(endTimeRaw)) {
      return res.status(400).json({
        ok: false,
        message: 'startTime and endTime must be HH:MM or HH:MM:SS',
      });
    }

    if (!locationName) {
      return res.status(400).json({
        ok: false,
        message: 'locationName is required',
      });
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        ok: false,
        message: 'latitude and longitude are required',
      });
    }

    if (!Number.isInteger(radiusMeters) || radiusMeters <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'radiusMeters must be a positive integer',
      });
    }

    const startTime = normalizeTime(startTimeRaw);
    const endTime = normalizeTime(endTimeRaw);

    if (endTime <= startTime) {
      return res.status(400).json({
        ok: false,
        message: 'endTime must be after startTime',
      });
    }

    try {
      const [disciplineRows] = await pool.query(
        `SELECT id FROM disciplines WHERE id = ? LIMIT 1`,
        [disciplineId]
      );
      if (disciplineRows.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'Discipline not found',
        });
      }

      const [groupRows] = await pool.query(
        `SELECT id FROM study_groups WHERE id = ? LIMIT 1`,
        [groupId]
      );
      if (groupRows.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'Group not found',
        });
      }

      const qrToken = createQrToken();

      const [result] = await pool.query(
        `INSERT INTO lessons (
           discipline_id, group_id, teacher_id,
           lesson_date, start_time, end_time,
           location_name, latitude, longitude, radius_meters, qr_token
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          disciplineId,
          groupId,
          req.user.id,
          lessonDate,
          startTime,
          endTime,
          locationName,
          latitude,
          longitude,
          radiusMeters,
          qrToken,
        ]
      );

      const row = await findById(result.insertId);

      return res.status(201).json({
        ok: true,
        lesson: toLesson(row),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to create lesson',
      });
    }
  }
);

module.exports = router;
