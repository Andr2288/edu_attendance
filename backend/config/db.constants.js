module.exports = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'edu_attendance',

  TABLES: [
    'users',
    'study_groups',
    'disciplines',
    'lessons',
    'attendances',
  ],
};
