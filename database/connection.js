require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function checkDatabaseConnection() {
  try {
      const { rows } = await pool.query('SELECT NOW()');
      console.log('Database connection is OK:', rows[0].now);
  } catch (err) {
      console.error('Database connectivity error:', err.message);
  }
}
checkDatabaseConnection();

module.exports = pool;