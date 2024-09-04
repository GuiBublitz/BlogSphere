require('dotenv').config();
const express = require('express');
const logger = require('../config/logger');
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'src/views');
app.use(express.static('./public'));

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/admin", (req, res) => {
    res.render("admin");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.use((req, res, next) => {
    logger.warn(`404 - Not Found - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(404).render("404");
});

app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(500).send('Something went wrong!');
});


const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));