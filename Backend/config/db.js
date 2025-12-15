const mysql = require("mysql");
require("dotenv").config();

const db = mysql.createConnection({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306
});

db.connect((err) => {
    if (err) console.log("❌ DB Connection Failed:", err);
    else console.log("✅ Database Connected Successfully");
});

module.exports = db;