import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate, Link } from 'react-router-dom';
import { faCheck, faTimes, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from './axios'; // Ensure this points to your configured Axios instance
import './Login.css';

import user_icon from './Assets/userf.png';
import password_icon from './Assets/login_signup.jpg';
import welcome_icon from './Assets/user_full.png';

const USER_REGEX = /^[A-Za-z][A-Za-z0-9!@#$%^&*()=+?/_-]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()/?-_=+]).{8,24}$/;

const LoginScreen = () => {
    const navigate = useNavigate();

    const userRef = useRef(null);
    const errRef = useRef(null);

    const [username, setUsername] = useState('');
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);

    const [password, setPassword] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        userRef.current?.focus();
    }, []);

    useEffect(() => {
        setValidName(USER_REGEX.test(username));
    }, [username]);

    useEffect(() => {
        setValidPwd(PWD_REGEX.test(password));
    }, [password]);

    useEffect(() => {
        setErrMsg('');
    }, [username, password]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const v1 = USER_REGEX.test(username);
        const v2 = PWD_REGEX.test(password);

        if (!v1 || !v2) {
            setErrMsg("Invalid Entry or Missing Fields");
            return;
        }

        setLoading(true);
        setErrMsg('');

        try {
            // 1. REAL API CALL
            // Sends username and password to your Node backend
            const response = await axios.post('/login', { 
                username: username, 
                password: password 
            });

            // 2. CHECK RESPONSE
            // Assuming your server returns: { success: true, user: { user_id: 1, username: "..." } }
            if (response.data.success) {
                const { user, token } = response.data;

                // 1. Save Token to LocalStorage
                localStorage.setItem("token", token);
                
                // 2. Save User Info to LocalStorage
                localStorage.setItem("user", JSON.stringify(user));

                console.log("Login Successful. Token saved.");
                
                setSuccess(true);
                navigate('/dashboard', { replace: true });
            } else {
                setErrMsg(response.data.message || "Login Failed");
            }

        } catch (err) {
            // ... existing error handling ...
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else if (err.response?.status === 401) {
                setErrMsg('Invalid Username or Password');
            } else {
                setErrMsg('Login Failed');
            }
            errRef.current?.focus();
        } finally {
            setLoading(false);
        }
    }

    return (
        <section>
            {success ? (
                <section>
                    <h1>Success!</h1>
                    <p><Link to="/">Go to Home</Link></p>
                </section>
            ) : (
                <div className="container">
                    <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"}>{errMsg}</p>
                    
                    <div className="welcome">
                        <img src={welcome_icon} alt="" style={{ width: '35px', height: '40px', marginLeft: '-39px'}}/>
                        <div>WELCOME Back</div>               
                    </div>
                    
                    <div className="createaccount" style={{ width: '300px', marginLeft:'110px'}}>Sign in to your account</div>
                    <div className="underline"></div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="head">

                            {/* USERNAME */}
                            <div className="text" style={{marginLeft: '-68px'}}>
                                User Name
                                <span className={validName ? "valid" : "hide"}><FontAwesomeIcon icon={faCheck} /></span>
                                <span className={validName || !username ? "hide" : "invalid"}><FontAwesomeIcon icon={faTimes} /></span>
                            </div>

                            <div className="inputbox">
                                <img src={user_icon} alt="" style={{ width: '18px', height: '20px' }}/>
                                <div className="box" style={{marginLeft: '12px'}}/>
                                <input
                                    type="text"
                                    id="username"
                                    ref={userRef}
                                    autoComplete="off"
                                    onChange={(e) => setUsername(e.target.value)}
                                    value={username}
                                    required
                                    aria-invalid={validName ? "false" : "true"}
                                    aria-describedby="uidnote"
                                    onFocus={() => setUserFocus(true)}
                                    onBlur={() => setUserFocus(false)}
                                />
                                </div>
                                <p id="uidnote" className={userFocus && username && !validName ? "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} /> 4-24 characters. Must begin with a letter.
                                </p>
                            

                            {/* PASSWORD */}
                            <div className="text" style={{marginLeft: '-75px'}}>
                                Password
                                <span className={validPwd ? "valid" : "hide"}><FontAwesomeIcon icon={faCheck} /></span>
                                <span className={validPwd || !password ? "hide" : "invalid"}><FontAwesomeIcon icon={faTimes} /></span>
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
                                </div>
                                <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} /> 8–24 chars, uppercase, lowercase, number, special character.
                                </p>
                            

                           

                            {/* LOGIN BUTTON */}
                            <div className="submit">
                            <button disabled={!validName || !validPwd || loading} type="submit">
                                {loading ? 'Logging In...' : 'Login'}
                            </button>
                            </div>
                                
<div style={{ textAlign: "center", marginTop: "10px" }}>
    <Link to="/forgot-password" style={{ fontSize: "12px", color: "#333", textDecoration: "none" }}>
        Forgot Password?
    </Link>
</div>

  

                        </div>
                         {/* Sign Up Link */}
                            <Link to="/register" className="signup">Sign up</Link> 
                    </form>
                </div>
            )}
        </section>
    );
}

export default LoginScreen;