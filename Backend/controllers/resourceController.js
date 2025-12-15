const db = require("../config/db");

exports.getEquipment = (req, res) => {
    const sql = "SELECT equipment_id, equipment_name, equipment_number, equipment_status, equipment_image FROM equipment";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "DB Error" });
        res.json(results);
    });
};

exports.getTrainers = (req, res) => {
    const sql = "SELECT trainer_id, trainer_name, training_type, status FROM trainers";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "DB Error" });
        res.json(results);
    });
};