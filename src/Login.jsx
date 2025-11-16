// Login.jsx (Rewritten for Username OR Email Login)

import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate, Link } from 'react-router-dom';
import { faCheck, faTimes, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './Login.css'; // Using the correct CSS file
import axios from './axios';

// Asset Imports
import user_icon from './Assets/userf.png'; 
import password_icon from './Assets/login_signup.jpg';
import welcome_icon from './Assets/user_full.png';

// REGEX Constants
const USER_REGEX = /^[A-Za-z][A-Za-z0-9!@#$%^&*()=+?/_-]{3,23}$/; // Reintroduced
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()/?-_=+]).{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const LoginScreen = () => {
    const navigate = useNavigate();

    // Refs
    const identifierRef = useRef(null); // Combined ref
    const errRef = useRef(null);

    // State for Combined Identifier (Username OR Email)
    const [identifier, setIdentifier] = useState(''); 
    const [isValidIdentifier, setIsValidIdentifier] = useState(false); 
    const [identifierFocus, setIdentifierFocus] = useState(false); 
    const [isEmail, setIsEmail] = useState(false); // New state to track if input looks like an email

    // State for Password (Unchanged)
    const [password, setPassword] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    // General State (Unchanged)
    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false); 
    const [loading, setLoading] = useState(false);

    // Effect to set focus on the first input on load
    useEffect(() => {
        identifierRef.current?.focus(); 
    }, []);

    // Effect for Combined Validation (Username OR Email)
    useEffect(() => {
        const isEmailFormat = EMAIL_REGEX.test(identifier);
        const isUsernameFormat = USER_REGEX.test(identifier);
        
        // Identifier is valid if it passes EITHER email or username format
        setIsValidIdentifier(isEmailFormat || isUsernameFormat);
        
        // Track if it's an email format for API payload logic
        setIsEmail(isEmailFormat);

    }, [identifier]);

    // Effect to validate Password (Unchanged)
    useEffect(() => {
        const result = PWD_REGEX.test(password);
        setValidPwd(result);
    }, [password]);

    // Effect to clear error message when inputs change
    useEffect(() => {
        setErrMsg('');
    }, [identifier, password]); 

    // Handle Form Submission 
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final combined validation
        if (!isValidIdentifier || !validPwd) {
            setErrMsg("Invalid Identifier or Password Format");
            return;
        }

        setLoading(true);
        setErrMsg('');
        const LOGIN_URL = '/login'; // API endpoint for login

        // Determine the payload based on the identifier format
        let payload;
        if (isEmail) {
            payload = { email: identifier, password }; // Send as 'email'
        } else {
            payload = { username: identifier, password }; // Send as 'username'
        }

        try {
            const response = await axios.post(
                LOGIN_URL,
                payload, // <== CRITICAL CHANGE: Dynamic payload
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true,
                }
            );
            
            setSuccess(true);
            navigate('/dashboard', { replace: true }); 

        } catch (error) {
            if (!error?.response) {
                setErrMsg('No Server Response');
            } else if (error.response?.status === 401) {
                setErrMsg('Invalid Credentials'); 
            } else {
                setErrMsg('Login Failed');
            }
            errRef.current?.focus();
        } finally {
            setLoading(false);
        }
    }
    
    // Helper to generate instructions text dynamically
    const getInstructions = () => {
        if (isEmail) {
            return "Must be a valid email address format (e.g., user@domain.com).";
        } else {
            return "4 to 24 characters and begins with a letter (for username).";
        }
    }


    return (
        <section>
            {success ? (
                <section>
                    <h1>Success!</h1>
                    <p>Redirecting to dashboard...<Link to="/">Go to Home</Link></p>
                </section>
            ) : (
                <div className="container">
                    {/* Error message section */}
                    <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                    
                    <div className="welcome">
                        <img src={welcome_icon} alt="" style={{ width: '35px', height: '40px' }}/>
                        <div>WELCOME Back</div>               
                    </div>
                    
                    <div className="createaccount">Sign in to your account</div>
                    <div className="underline"></div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="header">
                            {/* IDENTIFIER INPUT (Username OR Email) */}
                            <div className="text" style={{marginLeft: '-68px'}}>
                                Email or Username {/* <== CHANGED LABEL */}
                                <span className={isValidIdentifier ? "valid" : "hide"}> {/* <== Used combined valid state */}
                                    <FontAwesomeIcon icon={faCheck} />
                                </span>
                                <span className={isValidIdentifier || !identifier ? "hide" : "invalid"}> {/* <== Used combined valid state */}
                                    <FontAwesomeIcon icon={faTimes} />
                                </span>
                            </div>
                            <div className="inputbox">
                                <img src={user_icon} alt="" style={{ width: '18px', height: '20px' }}/>
                                <div className="box" style={{marginLeft: '12px'}}/>
                                <input
                                    type="text" // Kept as 'text' for flexibility
                                    id="identifier" // <== CHANGED ID
                                    ref={identifierRef} 
                                    autoComplete="username" // General autocomplete
                                    onChange={(e) => setIdentifier(e.target.value)} // <== Used setIdentifier
                                    value={identifier} // <== Used identifier state
                                    required
                                    aria-invalid={isValidIdentifier ? "false" : "true"} // <== Used isValidIdentifier
                                    aria-describedby="identifiernote" 
                                    onFocus={() => setIdentifierFocus(true)} // <== Used new focus setter
                                    onBlur={() => setIdentifierFocus(false)} 
                                    placeholder="Username or Email Address"
                                />
                                <p id="identifiernote" className={identifierFocus && identifier && !isValidIdentifier ? 
                                    "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} />{getInstructions()} {/* <== DYNAMIC INSTRUCTIONS */}
                                </p>
                            </div>
                            
                            {/* PASSWORD INPUT (Unchanged) */}
                            <div className="text" style={{marginLeft: '-75px'}}>
                                Password
                                <span className={validPwd ? "valid" : "hide"}>
                                    <FontAwesomeIcon icon={faCheck} />
                                </span>
                                <span className={validPwd || !password ? "hide" : "invalid"}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </span>
                            </div>
                            <div className="inputbox">
                                <img src={password_icon} alt="" style={{ width: '15px', height: '20px' }}/>
                                <div className="box" style={{marginLeft: '13px'}}/>
                                <input
                                    type="password"
                                    id="password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    required
                                    aria-invalid={validPwd ? "false" : "true"}
                                    aria-describedby="pwdnote"
                                    onFocus={() => setPwdFocus(true)}
                                    onBlur={()=>setPwdFocus(false)}
                                /> 
                                <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} />8 to 24 characters. Must include: uppercase, lowercase, number and special character.
                                </p>
                            </div>

                            {/* NEW: Link to Register/Sign up */}
                            <Link to="/register" className="signup">Sign up</Link> 

                            {/* Login Button */}
                            <button 
                                disabled={!isValidIdentifier || !validPwd || loading} // <== Used combined valid state
                                type="submit"
                            >
                                {loading ? 'Logging In...' : 'Login'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    )
}
export default LoginScreen;