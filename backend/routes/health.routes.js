const express = require('express');
const { checkConnection } = require('../db/pool');
const { DB_NAME } = require('../config/db.constants');

const router = express.Router();

router.get('/health', async (_req, res) => {
  try {
    await checkConnection();
    res.json({
      ok: true,
      db: 'up',
      database: DB_NAME,
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      db: 'down',
      database: DB_NAME,
      message: error.message,
    });
  }
});

module.exports = router;
