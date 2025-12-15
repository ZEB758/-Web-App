import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginScreen from './Login'; 
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Select from './Select';
import ForgotPassword from './ForgotPassword'; 
import ResetPassword from './ResetPassword';   

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<Register />} />
        
        {/* NEW ROUTES */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/select" element={<Select />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;