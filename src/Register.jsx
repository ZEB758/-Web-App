import React, { useState, useEffect, useRef } from "react";
import { faCheck, faTimes, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from './axios';
import './Register.css';

// Asset Imports
import user_icon from './Assets/userf.png';
import password_icon from './Assets/login_signup.jpg';
import email_icon from './Assets/email_icon.jpg';
import welcome_icon from './Assets/user_full.png';

// REGEX Constants
const USER_REGEX = /^[A-Za-z][A-Za-z0-9!@#$%^&*()=+?/_-]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()/?-_=+]).{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const RegisterScreen = () => {

    const userRef = useRef();
    const errRef = useRef();

    const [username, setUsername] = useState('');
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);

    const [password, setPassword] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);

    const [email, setEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    // Focus username on mount
    useEffect(() => {
        userRef.current?.focus();
    }, []);

    // Validate fields
    useEffect(() => {
        setValidName(USER_REGEX.test(username));
    }, [username]);

    useEffect(() => {
        setValidEmail(EMAIL_REGEX.test(email));
    }, [email]);

    useEffect(() => {
        setValidPwd(PWD_REGEX.test(password));
        setValidMatch(password === matchPwd);
    }, [password, matchPwd]);

    useEffect(() => {
        setErrMsg('');
    }, [username, password, matchPwd, email]);

    // SUBMIT HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validName || !validPwd || !validMatch || !validEmail) {
            setErrMsg("Invalid Entry or Missing Fields");
            return;
        }

        try {
            const response = await axios.post(
                '/gym_app',  // Correct URL (using axios.js baseURL)
                { username, password, email },
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );

            console.log(response.data);
            setSuccess(true);

        } catch (error) {
            console.log("Axios error:", error);  // ADD THIS
            if (!error?.response) {
                setErrMsg('No Server Response');
            } else if (error.response?.status === 409) {
                setErrMsg('Username or Email already taken');
            } else {
                setErrMsg('Registration Failed');
            }
            errRef.current.focus();
        }
    };

    return (
        <div>
            <div className="container">
                <div className="welcome">
                    <img src={welcome_icon} alt="" style={{ width: '35px', height: '40px' }} />
                    <div>WELCOME TO GERA</div>
                </div>
                <div className="createaccount">Create your account</div>
                <div className="underline"></div>

                {success ? (
                    <section style={{ textAlign: 'center', padding: '20px' }}>
                        <h1>Registration Successful!</h1>
                        <p>A verification link has been sent to <b>{email}</b>. Please check your inbox.</p>
                        <p style={{ marginTop: '20px' }}>
                            <a href="/">Go to Login</a>
                        </p>
                    </section>
                ) : (
                    <section>
                        <p
                            ref={errRef}
                            className={errMsg ? "errmsg" : "offscreen"}
                            aria-live="assertive"
                        >
                            {errMsg}
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="head">

                                {/* USERNAME */}
                                <div className="text" style={{ marginLeft: '-68px' }}>
                                    User Name
                                    <span className={validName ? "valid" : "hide"}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </span>
                                    <span className={!validName && username ? "invalid" : "hide"}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </span>
                                </div>

                                <div className="inputbox">
                                    <img src={user_icon} alt="" style={{ width: '18px', height: '20px' }} />
                                    <div className="box" style={{ marginLeft: '12px' }}>
                                        <input
                                            type="text"
                                            id="username"
                                            ref={userRef}
                                            autoComplete="off"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            aria-invalid={validName ? "false" : "true"}
                                            aria-describedby="uidnote"
                                            onFocus={() => setUserFocus(true)}
                                            onBlur={() => setUserFocus(false)}
                                        />
                                    </div>
                                </div>

                                <p id="uidnote"
                                   className={userFocus && username && !validName ? "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} /> 4 to 24 characters, must start with a letter.
                                </p>

                                {/* PASSWORD */}
                                <div className="text" style={{ marginLeft: '-75px' }}>
                                    Password
                                    <span className={validPwd ? "valid" : "hide"}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </span>
                                    <span className={!validPwd && password ? "invalid" : "hide"}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </span>
                                </div>

                                <div className="inputbox">
                                    <img src={password_icon} alt="" style={{ width: '15px', height: '20px' }} />
                                    <div className="box" style={{ marginLeft: '13px' }}>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            aria-invalid={validPwd ? "false" : "true"}
                                            aria-describedby="pwdnote"
                                            onFocus={() => setPwdFocus(true)}
                                            onBlur={() => setPwdFocus(false)}
                                        />
                                    </div>
                                </div>

                                <p id="pwdnote"
                                   className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} /> 8–24 characters, must include uppercase,
                                    lowercase, a number, and a special character.
                                </p>

                                {/* CONFIRM PASSWORD */}
                                <div className="text" style={{ marginLeft: '-30px' }}>
                                    Re-type Password
                                    <span className={validMatch && matchPwd ? "valid" : "hide"}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </span>
                                    <span className={!validMatch && matchPwd ? "invalid" : "hide"}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </span>
                                </div>

                                <div className="inputbox">
                                    <img src={password_icon} alt="" style={{ width: '15px', height: '20px' }} />
                                    <div className="box" style={{ marginLeft: '15px' }}>
                                        <input
                                            type="password"
                                            id="confirm_pwd"
                                            value={matchPwd}
                                            onChange={(e) => setMatchPwd(e.target.value)}
                                            required
                                            aria-invalid={validMatch ? "false" : "true"}
                                            aria-describedby="confirmnote"
                                            onFocus={() => setMatchFocus(true)}
                                            onBlur={() => setMatchFocus(false)}
                                        />
                                    </div>
                                </div>

                                <p id="confirmnote"
                                   className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} /> Passwords must match.
                                </p>

                                {/* EMAIL */}
                                <div className="text" style={{ marginLeft: '-50px' }}>
                                    Email Address
                                    <span className={validEmail ? "valid" : "hide"}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </span>
                                    <span className={!validEmail && email ? "invalid" : "hide"}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </span>
                                </div>

                                <div className="inputbox">
                                    <img src={email_icon} alt="" style={{ width: '25px', height: '20px' }} />
                                    <div className="box" style={{ marginLeft: '5px' }}>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            aria-invalid={validEmail ? "false" : "true"}
                                            aria-describedby="emailnote"
                                            onFocus={() => setEmailFocus(true)}
                                            onBlur={() => setEmailFocus(false)}
                                        />
                                    </div>
                                </div>

                                <p id="emailnote"
                                   className={emailFocus && !validEmail ? "instructions" : "offscreen"}>
                                    <FontAwesomeIcon icon={faInfoCircle} /> Must be a valid email format.
                                </p>

                                <div className="submit">
                                    <button
                                        disabled={!validName || !validPwd || !validMatch || !validEmail}
                                        type="submit"
                                    >
                                        Create
                                    </button>
                                </div>

                            </div>
                            
                        </form>
                        <a href="/" className="login">Back to login page</a>
                    </section>
                )}
            </div>
        </div>
    );
};

export default RegisterScreen;