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
        message: 'Failed to load groups',
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
        message: 'Group name is required',
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
          message: 'Group with this name already exists',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to create group',
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
        message: 'Invalid group id',
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        message: 'Group name is required',
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
          message: 'Group not found',
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
          message: 'Group with this name already exists',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to update group',
      });
    }
  }
);

module.exports = router;
