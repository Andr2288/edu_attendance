const express = require('express');
const cors = require('cors');
const { PORT, API_PREFIX } = require('./config/app.constants');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const groupsRoutes = require('./routes/groups.routes');
const disciplinesRoutes = require('./routes/disciplines.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(API_PREFIX, healthRoutes);
app.use(API_PREFIX, authRoutes);
app.use(API_PREFIX, groupsRoutes);
app.use(API_PREFIX, disciplinesRoutes);
app.use(API_PREFIX, usersRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    ok: false,
    message: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}${API_PREFIX}`);
});
