module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  API_PREFIX: '/api',
  JWT_SECRET: process.env.JWT_SECRET || 'edu-attendance-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
};
