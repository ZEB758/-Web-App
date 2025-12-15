const db = require("../config/db");

const findByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
        });
    });
};

const findByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
        });
    });
};

const createUser = (username, hash, email) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)", 
        [username, hash, email], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

const findById = (id) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT user_id, username, email, date_of_birth, gender, address, membership_status FROM users WHERE user_id = ?", 
        [id], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
        });
    });
};

const updateProfile = (id, dob, gender, address) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE users SET date_of_birth = ?, gender = ?, address = ? WHERE user_id = ?", 
        [dob, gender, address, id], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

module.exports = { findByEmail, findByUsername, createUser, findById, updateProfile };