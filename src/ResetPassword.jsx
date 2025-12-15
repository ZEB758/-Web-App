import React, { useState } from "react";
import axios from "./axios";
import { useParams, useNavigate } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
    const { token } = useParams(); // Get token from URL
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            const res = await axios.post("/reset-password", { token, newPassword: password });
            if (res.data.success) {
                setSuccess(true);
                setMessage("Password Reset Successful!");
                setTimeout(() => navigate("/"), 3000);
            } else {
                setMessage(res.data.message);
            }
        } catch (err) {
            setMessage("Invalid or expired token.");
        }
    };

    return (
        <div className="contaner" style={{ marginTop: '100px' }}>
            <h2 className="wellcome">New Password</h2>
            
            {success ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <h3 style={{color:'green'}}>Success!</h3>
                    <p>Redirecting to login...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="hed">
                        <div className="inputboxx" style={{ marginTop: '20px' }}>
                            <input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="inputboxx" style={{ marginTop: '10px' }}>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                        </div>

                        {message && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{message}</p>}

                        <div className="subbmit">
                            <button type="subbmit">Update Password</button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ResetPassword;