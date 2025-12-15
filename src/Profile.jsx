import React, { useState, useEffect } from "react";
import axios from "./axios"; 
import { useNavigate } from "react-router-dom";
import "./Profile.css"; 

import userIcon from "./Assets/user_full.png";       
import girlicon from "./Assets/user-icon-girl.png";  

const Profile = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        user_id: "",
        username: "", 
        email: "",    
        date_of_birth: "",
        gender: "",
        address: "",
        membership_status: "" 
    });

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/"); 
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        const activeUserId = parsedUser.user_id || parsedUser.id; 

        if (!activeUserId) {
            setMessage("Error: User ID missing from session.");
            setLoading(false);
            return;
        }

        axios.get(`/profile/${activeUserId}`)
            .then((res) => {
                if (res.data.success) {
                    const data = res.data.data;
                    let formattedDate = "";
                    if (data.date_of_birth) {
                        const d = new Date(data.date_of_birth);
                        formattedDate = d.toISOString().split('T')[0];
                    }

                    setFormData({
                        user_id: data.user_id,
                        username: data.username, 
                        email: data.email,       
                        date_of_birth: formattedDate,
                        gender: data.gender || "",
                        address: data.address || "",
                        membership_status: data.membership_status || "Standard"
                    });
                } else {
                    setMessage("Failed to load user data.");
                }
            })
            .catch((err) => {
                console.error("Axios Error:", err);
                setMessage("Server error.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const res = await axios.post("/profile/update", {
                user_id: formData.user_id,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                address: formData.address
            });

            if (res.data.success) {
                // --- NEW: Update LocalStorage so Dashboard sees the change immediately ---
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const updatedUser = { ...storedUser, gender: formData.gender };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                // -----------------------------------------------------------------------

                setMessage("Profile saved successfully!");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setMessage("Failed to save: " + res.data.message);
            }
        } catch (err) {
            console.error(err);
            setMessage("Error connecting to server.");
        }
    };

    if (loading) return <div className="loading-screen">Loading Profile...</div>;

    return (
        <div className="container profile-container">
            <div className="welcome">
                <div className="welcome-left">
                    <img 
                        src={formData.gender === "Female" ? girlicon : userIcon} 
                        alt="user" 
                        style={{ width: 35, height: 40 }} 
                    />
                    <div>My Profile</div>
                </div>
                <button onClick={() => navigate("/dashboard")} className="bac-btn">
                    Back to Dashboard
                </button>
            </div>

            {message && (
                <div className={`alert ${message.includes("Success") ? "success-msg" : "error-msg"}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                
                <div className="section-header">Account Information</div>
                
                <div className="input-group">
                    <label>User ID</label>
                    <input type="text" value={formData.user_id} disabled className="read-only" />
                </div>

                <div className="input-group">
                    <label>Username</label>
                    <input type="text" value={formData.username} disabled className="read-only" />
                </div>

                <div className="input-group">
                    <label>Email</label>
                    <input type="text" value={formData.email} disabled className="read-only" />
                </div>

                <hr className="divider" />

                <div className="section-header">Personal Details</div>
                
                <div className="input-group">
                    <label>Date of Birth</label>
                    <input 
                        type="date" 
                        name="date_of_birth" 
                        value={formData.date_of_birth} 
                        onChange={handleChange} 
                    />
                </div>

                <div className="input-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>Address</label>
                    <input 
                        type="text" 
                        name="address" 
                        placeholder="Enter your address"
                        value={formData.address} 
                        onChange={handleChange} 
                    />
                </div>

                <button type="submit" className="save-btn">SAVE CHANGES</button>
            </form>
        </div>
    );
};

export default Profile;