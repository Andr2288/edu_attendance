const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
} = require('../config/app.constants');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    groupId: row.group_id,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      groupId: user.groupId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

router.post('/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Email and password are required',
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, email, password_hash, full_name, role, group_id
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email or password',
      });
    }

    const row = rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      row.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email or password',
      });
    }

    const user = toPublicUser(row);
    const token = createToken(user);

    return res.json({
      ok: true,
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Login failed',
    });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, full_name, role, group_id
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'User not found',
      });
    }

    return res.json({
      ok: true,
      user: toPublicUser(rows[0]),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Failed to load current user',
    });
  }
});

module.exports = router;
