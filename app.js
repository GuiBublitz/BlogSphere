require('dotenv').config();
const express = require('express');
const pool = require('./database/connection');
const logger = require('./config/logger');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.render("home");
});

app.use((req, res, next) => {
    res.status(404).render("404");
});

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));