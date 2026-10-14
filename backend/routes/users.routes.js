const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');
const {
  requireAuth,
  requireRole,
} = require('../middleware/auth.middleware');

const router = express.Router();
const ALLOWED_ROLES = ['admin', 'teacher', 'student'];

function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    groupId: row.group_id,
    createdAt: row.created_at,
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function groupExists(groupId) {
  const [rows] = await pool.query(
    `SELECT id FROM study_groups WHERE id = ? LIMIT 1`,
    [groupId]
  );
  return rows.length > 0;
}

function validateUserPayload(body, { requirePassword }) {
  const email = normalizeEmail(body.email);
  const fullName = String(body.fullName || '').trim();
  const role = String(body.role || '').trim();
  const password = body.password != null ? String(body.password) : '';
  const groupId =
    body.groupId === null || body.groupId === undefined || body.groupId === ''
      ? null
      : Number(body.groupId);

  if (!email || !fullName || !role) {
    return {
      error: 'Email, fullName and role are required',
    };
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return {
      error: 'Role must be admin, teacher or student',
    };
  }

  if (requirePassword && !password) {
    return {
      error: 'Password is required',
    };
  }

  if (password && password.length < 6) {
    return {
      error: 'Password must be at least 6 characters',
    };
  }

  if (role === 'student') {
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return {
        error: 'Student must have a valid groupId',
      };
    }
  } else if (groupId !== null) {
    return {
      error: 'Only students can have a groupId',
    };
  }

  return {
    email,
    fullName,
    role,
    password,
    groupId,
  };
}

router.get(
  '/users',
  requireAuth,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, email, full_name, role, group_id, created_at
         FROM users
         ORDER BY role, full_name`
      );
      return res.json({ ok: true, users: rows.map(toUser) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load users',
      });
    }
  }
);

router.get(
  '/users/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid user id',
      });
    }

    try {
      const [rows] = await pool.query(
        `SELECT id, email, full_name, role, group_id, created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'User not found',
        });
      }

      return res.json({ ok: true, user: toUser(rows[0]) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to load user',
      });
    }
  }
);

router.post(
  '/users',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const parsed = validateUserPayload(req.body, { requirePassword: true });

    if (parsed.error) {
      return res.status(400).json({
        ok: false,
        message: parsed.error,
      });
    }

    try {
      if (parsed.groupId !== null) {
        const exists = await groupExists(parsed.groupId);
        if (!exists) {
          return res.status(400).json({
            ok: false,
            message: 'Group not found',
          });
        }
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);
      const [result] = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, group_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          parsed.email,
          passwordHash,
          parsed.fullName,
          parsed.role,
          parsed.groupId,
        ]
      );

      const [rows] = await pool.query(
        `SELECT id, email, full_name, role, group_id, created_at
         FROM users
         WHERE id = ?`,
        [result.insertId]
      );

      return res.status(201).json({
        ok: true,
        user: toUser(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'User with this email already exists',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to create user',
      });
    }
  }
);

router.put(
  '/users/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid user id',
      });
    }

    const parsed = validateUserPayload(req.body, { requirePassword: false });

    if (parsed.error) {
      return res.status(400).json({
        ok: false,
        message: parsed.error,
      });
    }

    try {
      const [existingRows] = await pool.query(
        `SELECT id FROM users WHERE id = ? LIMIT 1`,
        [id]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'User not found',
        });
      }

      if (parsed.groupId !== null) {
        const exists = await groupExists(parsed.groupId);
        if (!exists) {
          return res.status(400).json({
            ok: false,
            message: 'Group not found',
          });
        }
      }

      if (parsed.password) {
        const passwordHash = await bcrypt.hash(parsed.password, 10);
        await pool.query(
          `UPDATE users
           SET email = ?, password_hash = ?, full_name = ?, role = ?, group_id = ?
           WHERE id = ?`,
          [
            parsed.email,
            passwordHash,
            parsed.fullName,
            parsed.role,
            parsed.groupId,
            id,
          ]
        );
      } else {
        await pool.query(
          `UPDATE users
           SET email = ?, full_name = ?, role = ?, group_id = ?
           WHERE id = ?`,
          [
            parsed.email,
            parsed.fullName,
            parsed.role,
            parsed.groupId,
            id,
          ]
        );
      }

      const [rows] = await pool.query(
        `SELECT id, email, full_name, role, group_id, created_at
         FROM users
         WHERE id = ?`,
        [id]
      );

      return res.json({
        ok: true,
        user: toUser(rows[0]),
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          ok: false,
          message: 'User with this email already exists',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to update user',
      });
    }
  }
);

router.delete(
  '/users/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid user id',
      });
    }

    if (req.user.id === id) {
      return res.status(400).json({
        ok: false,
        message: 'You cannot delete your own account',
      });
    }

    try {
      const [result] = await pool.query(
        `DELETE FROM users WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          message: 'User not found',
        });
      }

      return res.json({
        ok: true,
        message: 'User deleted',
      });
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          ok: false,
          message: 'User cannot be deleted because related records exist',
        });
      }
      console.error(error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to delete user',
      });
    }
  }
);

module.exports = router;
