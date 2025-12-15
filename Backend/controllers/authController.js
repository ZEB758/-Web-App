const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db"); // Using direct DB for auth specific generic queries
const transporter = require("../config/email");
const { logAction } = require("../services/auditService");
const UserModel = require("../models/userModel");
require("dotenv").config();

exports.register = async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) return res.status(400).json({ message: "Missing fields" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await UserModel.createUser(username, hashedPassword, email);
        
        transporter.sendMail({
            from: process.env.EMAIL_USER, 
            to: email, subject: "Welcome to GERA Gym", 
            html: `<h2>Hi ${username}</h2><p>Thank you for registering.</p>`
        }).catch(e => console.log("Email error", e));

        return res.status(201).json({ message: "User registered", user_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: "User taken" });
        return res.status(500).json({ message: "Server error" });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    
    // Check Email or Username
    db.query("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1", [username, username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
        logAction(user.user_id, user.username, "Login", token);
        
        res.json({ 
            success: true, 
            token, 
            user: { user_id: user.user_id, username: user.username, gender: user.gender } 
        });
    });
};

exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    UserModel.findByEmail(email).then(user => {
        if (!user) return res.json({ success: true, message: "If that email exists, a link has been sent." });

        const token = crypto.randomBytes(20).toString('hex');
        const expireDate = new Date(Date.now() + 3600000); 

        db.query("UPDATE users SET reset_token = ?, reset_expires = ? WHERE user_id = ?", [token, expireDate, user.user_id], (err) => {
            if (err) return res.status(500).json({ message: "DB Error" });
            const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
            
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Password Reset Request",
                html: `<h3>Password Reset</h3><p>Click below to reset:</p><a href="${resetLink}">Reset Password</a>`
            });
            res.json({ success: true, message: "Check your email for the reset link." });
        });
    });
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    const sql = "SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()";
    db.query(sql, [token], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ success: false, message: "Invalid or expired token." });

        const user = results[0];
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.query("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE user_id = ?", 
            [hashedPassword, user.user_id], (err) => {
                if (err) return res.status(500).json({ message: "DB Error" });
                res.json({ success: true, message: "Password updated successfully!" });
            });
        } catch (hashErr) { res.status(500).json({ message: "Encryption Error" }); }
    });
};