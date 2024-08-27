require('dotenv').config();
const express = require('express');
const pool = require('./database/connection');
const app = express();

async function checkDatabaseConnection() {
    try {
        const { rows } = await pool.query('SELECT NOW()');
        console.log('Database connection is OK:', rows[0].now);
    } catch (err) {
        console.error('Database connectivity error:', err.message);
    }
}
checkDatabaseConnection();

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
