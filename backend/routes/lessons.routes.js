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
    isArchived: Boolean(row.is_archived),
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
    l.is_archived,
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

function parseLessonBody(body) {
  const disciplineId = Number(body.disciplineId);
  const groupId = Number(body.groupId);
  const lessonDate = String(body.lessonDate || '').trim();
  const startTimeRaw = String(body.startTime || '').trim();
  const endTimeRaw = String(body.endTime || '').trim();
  const locationName = String(body.locationName || '').trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const radiusMeters =
    body.radiusMeters === undefined || body.radiusMeters === null
      ? 100
      : Number(body.radiusMeters);

  if (!Number.isInteger(disciplineId) || disciplineId <= 0) {
    return { error: 'Потрібно обрати дисципліну' };
  }

  if (!Number.isInteger(groupId) || groupId <= 0) {
    return { error: 'Потрібно обрати групу' };
  }

  if (!isValidDate(lessonDate)) {
    return { error: 'Дата має бути у форматі РРРР-ММ-ДД' };
  }

  if (!isValidTime(startTimeRaw) || !isValidTime(endTimeRaw)) {
    return { error: 'Час має бути у форматі ГГ:ХХ' };
  }

  if (!locationName) {
    return { error: 'Потрібна назва місця' };
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: 'Потрібні широта і довгота' };
  }

  if (!Number.isInteger(radiusMeters) || radiusMeters <= 0) {
    return { error: 'Радіус має бути додатним цілим числом' };
  }

  const startTime = normalizeTime(startTimeRaw);
  const endTime = normalizeTime(endTimeRaw);

  if (endTime <= startTime) {
    return { error: 'Час кінця має бути пізніше за час початку' };
  }

  return {
    disciplineId,
    groupId,
    lessonDate,
    startTime,
    endTime,
    locationName,
    latitude,
    longitude,
    radiusMeters,
  };
}

async function findById(id) {
  const [rows] = await pool.query(
    `${LESSON_SELECT} WHERE l.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function assertOwnedLesson(req, res, id) {
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      ok: false,
      message: 'Невірний id заняття',
    });
    return null;
  }

  const row = await findById(id);

  if (!row) {
    res.status(404).json({
      ok: false,
      message: 'Заняття не знайдено',
    });
    return null;
  }

  if (Number(row.teacher_id) !== Number(req.user.id)) {
    res.status(403).json({
      ok: false,
      message: 'Немає доступу до цього заняття',
    });
    return null;
  }

  return row;
}

router.get(
  '/lessons',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const archivedParam = String(req.query.archived || '0');
    const wantArchived = archivedParam === '1' || archivedParam === 'true';

    try {
      const [rows] = await pool.query(
        `${LESSON_SELECT}
         WHERE l.teacher_id = ? AND l.is_archived = ?
         ORDER BY l.lesson_date DESC, l.start_time DESC`,
        [req.user.id, wantArchived ? 1 : 0]
      );

      return res.json({
        ok: true,
        lessons: rows.map(toLesson),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося завантажити заняття',
      });
    }
  }
);

router.get(
  '/lessons/:id',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const row = await assertOwnedLesson(req, res, Number(req.params.id));
      if (!row) return;

      return res.json({
        ok: true,
        lesson: toLesson(row),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося завантажити заняття',
      });
    }
  }
);

router.get(
  '/lessons/:id/qr',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const row = await assertOwnedLesson(req, res, Number(req.params.id));
      if (!row) return;

      return res.json({
        ok: true,
        lessonId: row.id,
        qrToken: row.qr_token,
        isArchived: Boolean(row.is_archived),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося завантажити QR-код',
      });
    }
  }
);

router.post(
  '/lessons',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const parsed = parseLessonBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ ok: false, message: parsed.error });
    }

    try {
      const [disciplineRows] = await pool.query(
        `SELECT id FROM disciplines WHERE id = ? LIMIT 1`,
        [parsed.disciplineId]
      );
      if (disciplineRows.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'Дисципліну не знайдено',
        });
      }

      const [groupRows] = await pool.query(
        `SELECT id FROM study_groups WHERE id = ? LIMIT 1`,
        [parsed.groupId]
      );
      if (groupRows.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'Групу не знайдено',
        });
      }

      const qrToken = createQrToken();

      const [result] = await pool.query(
        `INSERT INTO lessons (
           discipline_id, group_id, teacher_id,
           lesson_date, start_time, end_time,
           location_name, latitude, longitude, radius_meters, qr_token, is_archived
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          parsed.disciplineId,
          parsed.groupId,
          req.user.id,
          parsed.lessonDate,
          parsed.startTime,
          parsed.endTime,
          parsed.locationName,
          parsed.latitude,
          parsed.longitude,
          parsed.radiusMeters,
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
        message: 'Не вдалося створити заняття',
      });
    }
  }
);

router.put(
  '/lessons/:id',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    const parsed = parseLessonBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ ok: false, message: parsed.error });
    }

    try {
      const existing = await assertOwnedLesson(
        req,
        res,
        Number(req.params.id)
      );
      if (!existing) return;

      const [disciplineRows] = await pool.query(
        `SELECT id FROM disciplines WHERE id = ? LIMIT 1`,
        [parsed.disciplineId]
      );
      if (disciplineRows.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'Дисципліну не знайдено',
        });
      }

      const [groupRows] = await pool.query(
        `SELECT id FROM study_groups WHERE id = ? LIMIT 1`,
        [parsed.groupId]
      );
      if (groupRows.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'Групу не знайдено',
        });
      }

      await pool.query(
        `UPDATE lessons
         SET discipline_id = ?, group_id = ?,
             lesson_date = ?, start_time = ?, end_time = ?,
             location_name = ?, latitude = ?, longitude = ?, radius_meters = ?
         WHERE id = ? AND teacher_id = ?`,
        [
          parsed.disciplineId,
          parsed.groupId,
          parsed.lessonDate,
          parsed.startTime,
          parsed.endTime,
          parsed.locationName,
          parsed.latitude,
          parsed.longitude,
          parsed.radiusMeters,
          existing.id,
          req.user.id,
        ]
      );

      const row = await findById(existing.id);

      return res.json({
        ok: true,
        lesson: toLesson(row),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося оновити заняття',
      });
    }
  }
);

router.post(
  '/lessons/:id/archive',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const existing = await assertOwnedLesson(
        req,
        res,
        Number(req.params.id)
      );
      if (!existing) return;

      await pool.query(
        `UPDATE lessons SET is_archived = 1 WHERE id = ? AND teacher_id = ?`,
        [existing.id, req.user.id]
      );

      const row = await findById(existing.id);

      return res.json({
        ok: true,
        message: 'Заняття переміщено в архів',
        lesson: toLesson(row),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося архівувати заняття',
      });
    }
  }
);

router.post(
  '/lessons/:id/unarchive',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const existing = await assertOwnedLesson(
        req,
        res,
        Number(req.params.id)
      );
      if (!existing) return;

      await pool.query(
        `UPDATE lessons SET is_archived = 0 WHERE id = ? AND teacher_id = ?`,
        [existing.id, req.user.id]
      );

      const row = await findById(existing.id);

      return res.json({
        ok: true,
        message: 'Заняття повернуто з архіву',
        lesson: toLesson(row),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося повернути заняття з архіву',
      });
    }
  }
);

router.delete(
  '/lessons/:id',
  requireAuth,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const existing = await assertOwnedLesson(
        req,
        res,
        Number(req.params.id)
      );
      if (!existing) return;

      await pool.query(
        `DELETE FROM lessons WHERE id = ? AND teacher_id = ?`,
        [existing.id, req.user.id]
      );

      return res.json({
        ok: true,
        message: 'Заняття видалено назавжди',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося видалити заняття',
      });
    }
  }
);

module.exports = router;
