// server.js
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());

// ------------------ DATABASE ------------------
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Harrisun_758",
    database: "gym_app",
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Database connected successfully");
    }
});

// ------------------ EMAIL SETUP ------------------
// Replace with your real Gmail + App password (or other SMTP)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your_email@gmail.com",
        pass: "your_app_password"
    }
});

// ------------------ RESET PASSWORD VERIFY ------------------
app.post("/reset-password-verify", (req, res) => {
    const { identifier } = req.body;

    if (!identifier) {
        return res.json({ success: false, message: "Missing identifier" });
    }

    const sql = `
        SELECT user_id
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
    `;

    db.query(sql, [identifier, identifier], (err, results) => {
        if (err) {
            console.error("reset-password-verify error:", err);
            return res.json({ success: false, message: "DB error" });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, user_id: results[0].user_id });
    });
});

// ------------------ RESET PASSWORD UPDATE ------------------
app.post("/reset-password-update", async (req, res) => {
    const { user_id, newPassword } = req.body;

    if (!user_id || !newPassword) {
        return res.json({ success: false, message: "Missing fields" });
    }

    try {
        const hashed = await bcrypt.hash(newPassword, 10);

        const sql = `UPDATE users SET password_hash = ? WHERE user_id = ?`;

        db.query(sql, [hashed, user_id], (err, result) => {
            if (err) {
                console.error("reset-password-update error:", err);
                return res.json({ success: false, message: "DB error" });
            }

            return res.json({ success: true, message: "Password updated" });
        });
    } catch (err) {
        console.error("reset-password-update bcrypt error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

// ------------------ REGISTER ------------------
app.post('/gym_app', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)";
        const values = [username, hashedPassword, email];

        db.query(sql, values, async (err, data) => {
            if (err) {
                console.error("Register SQL ERROR:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: "Username or Email already taken" });
                }
                return res.status(500).json({ message: "Database Error" });
            }

            // optional: create empty profile row
            const userId = data.insertId;
            db.query("INSERT IGNORE INTO user_profiles (user_id) VALUES (?)", [userId], (pErr) => {
                if (pErr) console.error("profile insert error:", pErr);
            });

            // send welcome email (best effort, not blocking)
            const mailOptions = {
                from: "your_email@gmail.com",
                to: email,
                subject: "Welcome to GERA Gym",
                html: `
                    <h2>Welcome, ${username}!</h2>
                    <p>Thank you for registering at GERA Gym App.</p>
                    <p>Your account has been created successfully.</p>
                `
            };

            transporter.sendMail(mailOptions).catch((emailErr) => {
                console.error("Email sending failed:", emailErr);
            });

            return res.status(201).json({
                message: "User registered & email sent",
                user_id: userId
            });
        });

    } catch (err) {
        console.error("Register server error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

// ------------------ LOGIN ------------------
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const sql = `SELECT user_id, username, password_hash, email FROM users WHERE username = ? OR email = ? LIMIT 1`;

    db.query(sql, [username, username], async (err, results) => {
        if (err) {
            console.error("Login DB error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = results[0];
        try {
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ success: false, message: "Invalid Username or Password" });
            }

            // success: return minimal user info (frontend should save to localStorage)
            return res.json({
                success: true,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (compareErr) {
            console.error("bcrypt compare error:", compareErr);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    });
});

// ------------------ 1. GET PROFILE DATA ------------------
app.get("/profile/:id", (req, res) => {
    const userId = req.params.id;

    // We use LEFT JOIN so we get the Username/Email from 'users' table
    // even if the 'user_profiles' table is empty.
    const sql = `
        SELECT 
            u.user_id, 
            u.username, 
            u.email, 
            p.date_of_birth, 
            p.gender, 
            p.address, 
            p.membership_status
        FROM users u
        LEFT JOIN user_profiles p ON u.user_id = p.user_id
        WHERE u.user_id = ?
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Profile Fetch Error:", err);
            return res.json({ success: false, message: "Database error" });
        }
        
        if (result.length > 0) {
            return res.json({ success: true, data: result[0] });
        } else {
            return res.json({ success: false, message: "User not found" });
        }
    });
});

// ------------------ 2. UPDATE/SAVE PROFILE ------------------
app.post("/profile/update", (req, res) => {
    const { user_id, date_of_birth, gender, address } = req.body;

    // Handle empty date string to prevent SQL error
    const dob = date_of_birth === "" ? null : date_of_birth;

    // UPSERT: Insert into user_profiles, but if user_id exists, UPDATE instead.
    const sql = `
        INSERT INTO user_profiles (user_id, date_of_birth, gender, address)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            date_of_birth = VALUES(date_of_birth),
            gender = VALUES(gender),
            address = VALUES(address)
    `;

    db.query(sql, [user_id, dob, gender, address], (err, result) => {
        if (err) {
            console.error("Profile Update Error:", err);
            return res.json({ success: false, message: "Failed to update profile" });
        }
        return res.json({ success: true, message: "Profile updated successfully" });
    });

    // ------------------ GET USER SCHEDULE ------------------
app.get("/api/my-schedule/:id", (req, res) => {
    const userId = req.params.id;

    const sql = `
        SELECT 
            'Equipment' AS type,
            e.equipment_name AS name,
            s.schedule_date,
            s.start_time,
            s.end_time
        FROM equipment_schedule s
        JOIN equipment e ON s.equipment_id = e.equipment_id
        WHERE s.user_id = ?

        UNION ALL

        SELECT 
            'Trainer' AS type,
            t.trainer_name AS name,
            s.schedule_date,
            s.start_time,
            s.end_time
        FROM trainer_schedule s
        JOIN trainers t ON s.trainer_id = t.trainer_id
        WHERE s.user_id = ?

        ORDER BY schedule_date DESC, start_time ASC
    `;

    db.query(sql, [userId, userId], (err, results) => {
        if (err) {
            console.error("Schedule Fetch Error:", err);
            return res.status(500).json({ success: false, message: "DB Error" });
        }
        res.json({ success: true, data: results });
    });
});

});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});