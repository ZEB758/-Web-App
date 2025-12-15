import React, { useState } from "react";
import axios from "./axios";
import { Link } from "react-router-dom";
import "./ForgotPassword.css"

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await axios.post("/forgot-password", { email });
            setMessage(res.data.message);
        } catch (err) {
            setMessage("Error sending request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contaner" style={{ marginTop: '100px' }}>
            <h2 className="wellcome">Reset Password</h2>
            <div className="createaccount">Enter your email to receive a reset link.</div>
            <div className="underline"></div>

            <form onSubmit={handleSubmit}>
                <div className="hed">
                    <div className="inputboxx" style={{ marginTop: '20px' }}>
                        <div className="boxx">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px' }}
                            />
                        </div>
                    </div>

                    {message && <p style={{ color: 'blue', textAlign: 'center', marginTop: '10px' }}>{message}</p>}

                    <div className="subbmit">
                        <button type="subbmit" disabled={loading}>
                            {loading ? "Sending..." : "Send Link"}
                        </button>
                    </div>
                </div>
            </form>
            <div style={{ textAlign: "center", marginTop: "15px" }}>
                <Link to="/" style={{ fontSize: "14px" }}>Back to Login</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;