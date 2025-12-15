const db = require("../config/db");

const logAction = (user_id, username, action, token) => {
    const sql = "INSERT INTO audit_log (user_id, username, action, token) VALUES (?, ?, ?, ?)";
    db.query(sql, [user_id, username, action, token], (err) => {
        if (err) console.error("Audit Log Error:", err);
    });
};

module.exports = { logAction };