const BookingModel = require("../models/bookingModel");
const db = require("../config/db");
const { calculateEndTime } = require("../utils/helpers");
const { logAction } = require("../services/auditService");

exports.checkBookings = (req, res) => {
    const { type, item_id, date } = req.body;
    
    // --- Logic A: Trainer ---
    if (type === 'trainer') {
        const sqlTrainer = "SELECT start_time, user_id FROM trainer_schedule WHERE trainer_id = ? AND schedule_date = ?";
        db.query(sqlTrainer, [item_id, date], (err, results) => {
            if (err) return res.json({ success: false });
            
            const myBookings = [];
            const occupiedBookings = [];
            results.forEach(row => {
                const time = row.start_time.substring(0, 5);
                if (row.user_id === req.userId) myBookings.push(time);
                else occupiedBookings.push(time); 
            });

            const sqlMyTrainers = "SELECT start_time, trainer_id FROM trainer_schedule WHERE user_id = ? AND schedule_date = ?";
            const sqlMyEquip = "SELECT start_time FROM equipment_schedule WHERE user_id = ? AND schedule_date = ?";

            db.query(sqlMyTrainers, [req.userId, date], (err, trainerRes) => {
                if (err) return res.json({ success: false });
                db.query(sqlMyEquip, [req.userId, date], (err, equipRes) => {
                    if (err) return res.json({ success: false });
                    const userConflicts = [];
                    trainerRes.forEach(row => { if (row.trainer_id != item_id) userConflicts.push(row.start_time.substring(0, 5)); });
                    equipRes.forEach(row => { userConflicts.push(row.start_time.substring(0, 5)); });
                    res.json({ success: true, myBookings, occupiedBookings, userConflicts });
                });
            });
        });
        return;
    }

    // --- Logic B: Equipment ---
    if (type === 'equipment') {
        const sqlThisMachine = "SELECT start_time, user_id FROM equipment_schedule WHERE equipment_id = ? AND schedule_date = ?";
        db.query(sqlThisMachine, [item_id, date], (err, results) => {
            if (err) return res.json({ success: false });
            
            const myBookings = [];
            const timeCounts = {}; 
            results.forEach(row => {
                const time = row.start_time.substring(0, 5);
                if (row.user_id === req.userId) myBookings.push(time);
                if (!timeCounts[time]) timeCounts[time] = 0;
                timeCounts[time]++;
            });

            db.query("SELECT equipment_number FROM equipment WHERE equipment_id = ?", [item_id], (err, equipData) => {
                if (err || equipData.length === 0) return res.json({ success: false });
                const maxCapacity = equipData[0].equipment_number;
                const occupiedBookings = [];
                for (const [time, count] of Object.entries(timeCounts)) {
                    if (count >= maxCapacity && !myBookings.includes(time)) occupiedBookings.push(time);
                }

                const sqlMyEquip = "SELECT start_time, equipment_id FROM equipment_schedule WHERE user_id = ? AND schedule_date = ?";
                const sqlMyTrainers = "SELECT start_time FROM trainer_schedule WHERE user_id = ? AND schedule_date = ?";

                db.query(sqlMyEquip, [req.userId, date], (err, equipRes) => {
                    if (err) return res.json({ success: false });
                    db.query(sqlMyTrainers, [req.userId, date], (err, trainerRes) => {
                        if (err) return res.json({ success: false });
                        const userConflicts = [];
                        equipRes.forEach(row => { if (row.equipment_id != item_id) userConflicts.push(row.start_time.substring(0, 5)); });
                        trainerRes.forEach(row => { userConflicts.push(row.start_time.substring(0, 5)); });
                        res.json({ success: true, myBookings, occupiedBookings, userConflicts });
                    });
                });
            });
        });
    }
};

exports.bookEquipment = (req, res) => {
    const { equipment_id, date, start_time } = req.body;
    const dayOfWeek = new Date(date).getUTCDay(); 
    if (dayOfWeek === 6) return res.json({ success: false, message: "Gym is closed on Saturdays." });

    const checkBusySql = `SELECT start_time FROM equipment_schedule WHERE user_id = ? AND schedule_date = ? AND start_time = ? UNION SELECT start_time FROM trainer_schedule WHERE user_id = ? AND schedule_date = ? AND start_time = ?`;

    db.query(checkBusySql, [req.userId, date, start_time, req.userId, date, start_time], (err, busyRes) => {
        if (err) return res.json({ success: false, message: "DB Error" });
        if (busyRes.length > 0) return res.json({ success: false, message: "You are already busy at this time." });

        const countSql = "SELECT COUNT(*) as count FROM equipment_schedule WHERE equipment_id = ? AND schedule_date = ? AND start_time = ?";
        db.query(countSql, [equipment_id, date, start_time], (err, countResult) => {
            if (err) return res.json({ success: false, message: "DB Error" });
            
            db.query("SELECT equipment_number FROM equipment WHERE equipment_id = ?", [equipment_id], (err, equipResult) => {
                if (currentCount >= equipResult[0].equipment_number) return res.json({ success: false, message: "Fully Booked." });

                const end_time = calculateEndTime(start_time); 
                const insertSql = `INSERT INTO equipment_schedule (user_id, equipment_id, schedule_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)`;

                db.query(insertSql, [req.userId, equipment_id, date, start_time, end_time], (err) => {
                    if (err) return res.json({ success: false, message: "Booking Failed or Duplicate." });
                    logAction(req.userId, req.username, `Booked Equipment ${equipment_id}`, req.token);
                    res.json({ success: true, message: "Booked!" });
                });
            });
            const currentCount = countResult[0].count; // Moved definition up in logic logic actually but node ignores
        });
    });
};

exports.bookTrainer = (req, res) => {
    const { trainer_id, date, start_time } = req.body;
    const dayOfWeek = new Date(date).getUTCDay();
    if (dayOfWeek === 6) return res.json({ success: false, message: "Gym is closed on Saturdays." });

    const checkBusySql = `SELECT start_time FROM equipment_schedule WHERE user_id = ? AND schedule_date = ? AND start_time = ? UNION SELECT start_time FROM trainer_schedule WHERE user_id = ? AND schedule_date = ? AND start_time = ?`;

    db.query(checkBusySql, [req.userId, date, start_time, req.userId, date, start_time], (err, busyRes) => {
        if (err) return res.json({ success: false, message: "DB Error" });
        if (busyRes.length > 0) return res.json({ success: false, message: "You are already busy at this time." });

        const end_time = calculateEndTime(start_time);
        const sql = `INSERT INTO trainer_schedule (user_id, trainer_id, schedule_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)`;

        db.query(sql, [req.userId, trainer_id, date, start_time, end_time], (err) => {
            if (err) return res.json({ success: false, message: "Booking Failed or Duplicate." });
            logAction(req.userId, req.username, `Booked Trainer ${trainer_id}`, req.token);
            res.json({ success: true, message: "Booked!" });
        });
    });
};

exports.deleteBooking = (req, res) => {
    const { type, item_id, date, start_time } = req.body;
    let sql = type === "equipment" 
        ? "DELETE FROM equipment_schedule WHERE user_id = ? AND equipment_id = ? AND schedule_date = ? AND start_time = ?"
        : "DELETE FROM trainer_schedule WHERE user_id = ? AND trainer_id = ? AND schedule_date = ? AND start_time = ?";
    
    const dbTime = start_time.length === 5 ? start_time + ":00" : start_time;
    db.query(sql, [req.userId, item_id, date, dbTime], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, message: "Booking removed" });
    });
};

exports.getMySchedule = (req, res) => {
    const sql = `
        SELECT 'Equipment' AS type, e.equipment_name AS name, s.schedule_date, s.start_time 
        FROM equipment_schedule s JOIN equipment e ON s.equipment_id = e.equipment_id WHERE s.user_id = ?
        UNION ALL
        SELECT 'Trainer' AS type, t.trainer_name AS name, s.schedule_date, s.start_time 
        FROM trainer_schedule s JOIN trainers t ON s.trainer_id = t.trainer_id WHERE s.user_id = ?
        ORDER BY schedule_date DESC, start_time ASC`;
    db.query(sql, [req.params.id, req.params.id], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: results });
    });
};