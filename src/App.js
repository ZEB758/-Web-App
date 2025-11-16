// App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './Login';      // Assuming Login.jsx exports LoginScreen
import RegisterScreen from './Register'; 
// import './Register.css'; // Remove this if you haven't already

function App() {
  const LOGIN_PATH = "/login"; // The first page you want users to see

  return (
    <Router>
      <Routes>
        {/*
          This is the line that ensures the app starts on the login page.
          When a user navigates to the root path ("/") (which happens when the app loads),
          it immediately redirects them to the LOGIN_PATH ("/login").
        */}
        <Route path="/" element={<Navigate to={LOGIN_PATH} replace />} /> 

        {/* The actual login page route */}
        <Route path={LOGIN_PATH} element={<LoginScreen />} />
        
        {/* Other routes */}
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/dashboard" element={<h1>User Dashboard</h1>} /> 
      </Routes>
    </Router>
  );
}

export default App;