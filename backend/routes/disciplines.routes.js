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
        message: 'Failed to load disciplines',
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
        message: 'Discipline name is required',
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
          message: 'Discipline with this name already exists',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to create discipline',
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
        message: 'Invalid discipline id',
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: 'Discipline name is required',
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
          message: 'Discipline not found',
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
          message: 'Discipline with this name already exists',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to update discipline',
      });
    }
  }
);

module.exports = router;
