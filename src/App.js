import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginScreen from './Login'; 
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Select from './Select';   // ← IMPORT THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login is the default page */}
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* NEW: DailySchedule route */}
        <Route path="/select" element={<Select userName="John Doe" userId="12345" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;