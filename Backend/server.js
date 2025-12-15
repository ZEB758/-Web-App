const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// Use Routes
app.use(authRoutes);     // Registers /gym_app, /login, etc
app.use(userRoutes);     // Registers /profile...
app.use(resourceRoutes); // Registers /api/equipment...
app.use(bookingRoutes);  // Registers /api/book...

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`🚀 Server running on Port ${PORT}`);
});