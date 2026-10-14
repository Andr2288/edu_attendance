const express = require('express');
const { pool } = require('../db/pool');
const {
  requireAuth,
  requireRole,
} = require('../middleware/auth.middleware');

const router = express.Router();

function toGroup(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

router.get(
  '/groups',
  requireAuth,
  requireRole('admin', 'teacher'),
  async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, created_at
         FROM study_groups
         ORDER BY name`
      );
      return res.json({ ok: true, groups: rows.map(toGroup) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося завантажити групи',
      });
    }
  }
);

router.post(
  '/groups',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: 'Потрібна назва групи',
      });
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO study_groups (name) VALUES (?)`,
        [name]
      );

      const [rows] = await pool.query(
        `SELECT id, name, created_at FROM study_groups WHERE id = ?`,
        [result.insertId]
      );

      return res.status(201).json({
        ok: true,
        group: toGroup(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'Група з такою назвою вже існує',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося створити групу',
      });
    }
  }
);

router.put(
  '/groups/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const id = Number(req.params.id);
    const name = String(req.body.name || '').trim();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Невірний id групи',
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: 'Потрібна назва групи',
      });
    }

    try {
      const [result] = await pool.query(
        `UPDATE study_groups SET name = ? WHERE id = ?`,
        [name, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Групу не знайдено',
        });
      }

      const [rows] = await pool.query(
        `SELECT id, name, created_at FROM study_groups WHERE id = ?`,
        [id]
      );

      return res.json({
        ok: true,
        group: toGroup(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'Група з такою назвою вже існує',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося оновити групу',
      });
    }
  }
);

router.delete(
  '/groups/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Невірний id групи',
      });
    }

    try {
      const [blockingUsers] = await pool.query(
        `SELECT id, full_name, email, role
         FROM users
         WHERE group_id = ?
         ORDER BY id`,
        [id]
      );

      const [blockingLessons] = await pool.query(
        `SELECT
           l.id,
           l.lesson_date,
           l.is_archived,
           u.full_name AS teacher_name
         FROM lessons l
         JOIN users u ON u.id = l.teacher_id
         WHERE l.group_id = ?
         ORDER BY l.id`,
        [id]
      );

      if (blockingUsers.length > 0 || blockingLessons.length > 0) {
        const parts = [];

        if (blockingUsers.length > 0) {
          const usersText = blockingUsers
            .map((user) => `${user.full_name} (${user.role})`)
            .join('; ');
          parts.push(`користувачі: ${usersText}`);
        }

        if (blockingLessons.length > 0) {
          const lessonsText = blockingLessons
            .map((lesson) => {
              const archived =
                Number(lesson.is_archived) === 1 ? ', архів' : '';
              return `#${lesson.id} (${lesson.lesson_date}, ${lesson.teacher_name}${archived})`;
            })
            .join('; ');
          parts.push(`заняття: ${lessonsText}`);
        }

        return res.status(409).json({
          ok: false,
          message: `Неможливо видалити групу. ${parts.join(' | ')}`,
        });
      }

      const [result] = await pool.query(
        `DELETE FROM study_groups WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Групу не знайдено',
        });
      }

      return res.json({
        ok: true,
        message: 'Групу видалено',
      });
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          ok: false,
          message:
            'Неможливо видалити групу: вона використовується користувачами або заняттями',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Не вдалося видалити групу',
      });
    }
  }
);

module.exports = router;
