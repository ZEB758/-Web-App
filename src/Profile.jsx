import React, { useState, useEffect } from "react";
import axios from "./axios"; // Your custom axios instance
import { useNavigate } from "react-router-dom";
import "./Profile.css"; 

// Import both icons
import userIcon from "./Assets/user_full.png";       // Male / Default icon
import girlicon from "./Assets/user-icon-girl.png";  // Female icon

const Profile = () => {
    const navigate = useNavigate();
    
    // State covers both Read-Only (Auth) and Editable (Profile) data
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
        // 1. Check LocalStorage for logged-in user
        const storedUser = localStorage.getItem("user");
        
        if (!storedUser) {
            navigate("/"); // Redirect to login
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        const activeUserId = parsedUser.user_id || parsedUser.id; 

        if (!activeUserId) {
            setMessage("Error: User ID missing from session.");
            setLoading(false);
            return;
        }

        // 2. Fetch Data from Database
        axios.get(`/profile/${activeUserId}`)
            .then((res) => {
                if (res.data.success) {
                    const data = res.data.data;

                    // Format Date for HTML input (YYYY-MM-DD)
                    let formattedDate = "";
                    if (data.date_of_birth) {
                        formattedDate = new Date(data.date_of_birth).toISOString().split('T')[0];
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
                    setMessage("Failed to load user data from database.");
                }
            })
            .catch((err) => {
                console.error("Axios Error:", err);
                setMessage("Server error. Is the backend running?");
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
                    {/* --- DYNAMIC ICON LOGIC HERE --- */}
                    <img 
                        src={formData.gender === "Female" ? girlicon : userIcon} 
                        alt="user" 
                        style={{ width: 35, height: 40 }} 
                    />
                    <div>MY PROFILE</div>
                </div>
                <button onClick={() => navigate("/dashboard")} className="back-btn">
                    Back to Dashboard
                </button>
            </div>

            {message && (
                <div className={`alert ${message.includes("Success") ? "success-msg" : "error-msg"}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                
                {/* 1. READ ONLY FIELDS */}
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

                {/* 2. EDITABLE FIELDS */}
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
                    {/* The icon changes immediately when this select is changed */}
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
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