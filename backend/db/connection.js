const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'movielingo',
  user: process.env.DB_USER || 'movielingo',
  password: process.env.DB_PASSWORD || 'movielingo_dev',
});

module.exports = pool;
