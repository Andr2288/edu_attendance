const express = require('express');
const { pool } = require('../db/pool');
const {
  requireAuth,
  requireRole,
} = require('../middleware/auth.middleware');

const router = express.Router();

function toDiscipline(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

router.get(
  '/disciplines',
  requireAuth,
  requireRole('admin', 'teacher'),
  async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, created_at
         FROM disciplines
         ORDER BY name`
      );
      return res.json({
        ok: true,
        disciplines: rows.map(toDiscipline),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося завантажити дисципліни',
      });
    }
  }
);

router.post(
  '/disciplines',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: 'Потрібна назва дисципліни',
      });
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO disciplines (name) VALUES (?)`,
        [name]
      );

      const [rows] = await pool.query(
        `SELECT id, name, created_at FROM disciplines WHERE id = ?`,
        [result.insertId]
      );

      return res.status(201).json({
        ok: true,
        discipline: toDiscipline(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'Дисципліна з такою назвою вже існує',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося створити дисципліну',
      });
    }
  }
);

router.put(
  '/disciplines/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const id = Number(req.params.id);
    const name = String(req.body.name || '').trim();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Невірний id дисципліни',
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: 'Потрібна назва дисципліни',
      });
    }

    try {
      const [result] = await pool.query(
        `UPDATE disciplines SET name = ? WHERE id = ?`,
        [name, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Дисципліну не знайдено',
        });
      }

      const [rows] = await pool.query(
        `SELECT id, name, created_at FROM disciplines WHERE id = ?`,
        [id]
      );

      return res.json({
        ok: true,
        discipline: toDiscipline(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'Дисципліна з такою назвою вже існує',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося оновити дисципліну',
      });
    }
  }
);

router.delete(
  '/disciplines/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Невірний id дисципліни',
      });
    }

    try {
      const [blockingLessons] = await pool.query(
        `SELECT
           l.id,
           l.lesson_date,
           l.location_name,
           l.is_archived,
           u.full_name AS teacher_name
         FROM lessons l
         JOIN users u ON u.id = l.teacher_id
         WHERE l.discipline_id = ?
         ORDER BY l.id`,
        [id]
      );

      if (blockingLessons.length > 0) {
        const details = blockingLessons
          .map((lesson) => {
            const archived = Number(lesson.is_archived) === 1 ? ', архів' : '';
            return `#${lesson.id} (${lesson.lesson_date}, ${lesson.teacher_name}${archived})`;
          })
          .join('; ');

        return res.status(409).json({
          ok: false,
          message: `Неможливо видалити дисципліну. Повʼязані заняття: ${details}`,
          blockingLessons: blockingLessons.map((lesson) => ({
            id: lesson.id,
            lessonDate: lesson.lesson_date,
            locationName: lesson.location_name,
            isArchived: Boolean(lesson.is_archived),
            teacherName: lesson.teacher_name,
          })),
        });
      }

      const [result] = await pool.query(
        `DELETE FROM disciplines WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Дисципліну не знайдено',
        });
      }

      return res.json({
        ok: true,
        message: 'Дисципліну видалено',
      });
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          ok: false,
          message:
            'Неможливо видалити дисципліну: вона використовується в заняттях',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося видалити дисципліну',
      });
    }
  }
);

module.exports = router;
