import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Dashboard.css";
import axios from "./axios"; 

// Icons
import userIcon from "./Assets/user_full.png";
import girlicon from "./Assets/user-icon-girl.png";
import notificationIcon from "./Assets/Notification_2.png";
import settingsIcon from "./Assets/setting_icon1.png";
import recentIcon from "./Assets/recent_icon.png";
import calendarIcon from "./Assets/calendar-icon.png";
import favoriteIcon from "./Assets/favorite-icon.jpg";

// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faUserTie, faClock, faTimes, faSignOutAlt, faBell } from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
  const navigate = useNavigate();
  const today = new Date();
  
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [errorMessage, setErrorMessage] = useState("");
  const [dates, setDates] = useState([]);
  const [user, setUser] = useState(null);
  const [userGender, setUserGender] = useState(""); 

  // Schedule Modal State
  const [showSchedule, setShowSchedule] = useState(false);
  const [mySchedule, setMySchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // --- NEW: NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState([]); // Stores today's bookings
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // Load User & Calendar & Check Notifications
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
// 2. Fetch latest profile data to be sure (handles fresh logins)
      axios.get(`/profile/${parsedUser.user_id}`)
        .then(res => {
            if (res.data.success && res.data.data.gender) {
                setUserGender(res.data.data.gender);
                // Optional: Update local storage to sync
                const updated = { ...parsedUser, gender: res.data.data.gender };
                localStorage.setItem("user", JSON.stringify(updated));
            }
        })
        .catch(err => console.log("Profile load error", err));

      // Fetch notifications immediately
      checkTodayBookings(parsedUser.user_id);
    }
    renderCalendar(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  // --- NEW: FETCH TODAY'S BOOKINGS ---
  const checkTodayBookings = async (userId) => {
    try {
        const res = await axios.get(`/api/my-schedule/${userId}`);
        if (res.data.success) {
            const allBookings = res.data.data;
            
            // Get local YYYY-MM-DD for today
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const localTodayStr = `${year}-${month}-${day}`;

            // Filter for bookings happening TODAY
            const todays = allBookings.filter(item => {
                // Ensure we compare strings properly (MySQL dates often come as ISO or YYYY-MM-DD)
                // We take the first 10 chars to be safe
                const itemDate = item.schedule_date.substring(0, 10);
                return itemDate === localTodayStr;
            });
            
            setNotifications(todays);
        }
    } catch (err) {
        console.error("Error checking notifications", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  // Fetch Full Schedule (For bottom modal)
  const fetchMySchedule = async () => {
      if (!user) return;
      setLoadingSchedule(true);
      try {
          const res = await axios.get(`/api/my-schedule/${user.user_id}`);
          if (res.data.success) {
              setMySchedule(res.data.data);
          }
      } catch (err) {
          console.error("Error loading schedule", err);
      } finally {
          setLoadingSchedule(false);
      }
  };

  const toggleScheduleModal = () => {
      if (!showSchedule) fetchMySchedule();
      setShowSchedule(!showSchedule);
  };

  const renderCalendar = (month, year) => {
    let days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: "", disabled: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, disabled: false });
    }
    setDates(days);
    setErrorMessage("");
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const selected = new Date(currentYear, currentMonth, day);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (selected < todayMidnight) {
      setErrorMessage("Error: You cannot select a past date!");
      return;
    }
    if (selected.getDay() === 6) {
        setErrorMessage("The Gym is closed on Saturdays.");
        return;
    }

    const formattedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    navigate("/select", { state: { date: formattedDate } });
  };

  const formatDate = (dateString) => {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="main-body">
    <div className="container dashboard-container">
      
      <div className="header-grid">
          <div className="header-left">
               <img 
                src={userGender === "Female" ? girlicon : userIcon} 
                alt="User" 
              />
          </div>

          <div className="header-center">
              <span className="welcome-sub">WELCOME BACK</span>
              <span className="welcome-name">{user ? user.username : "Guest"}</span>
          </div>

          <div className="header-right">
              
              {/* --- MODIFIED NOTIFICATION ICON --- */}
              <div 
                className="notification-wrapper" 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                  <img src={notificationIcon} alt="Notification" />
                  {/* RED BADGE if bookings exist */}
                  {notifications.length > 0 && (
                      <span className="notification-badge">{notifications.length}</span>
                  )}

                  {/* DROPDOWN POPUP */}
                  {showNotifDropdown && (
                      <div className="notification-dropdown">
                          <div className="notif-header">Today's Schedule</div>
                          {notifications.length === 0 ? (
                              <div className="notif-empty">No bookings today.</div>
                          ) : (
                              notifications.map((n, idx) => (
                                  <div key={idx} className="notif-item">
                                      <FontAwesomeIcon icon={faClock} className="notif-icon-small"/>
                                      <div>
                                          <strong>{n.start_time.substring(0,5)}</strong>
                                          <span> - {n.name}</span>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  )}
              </div>
              
              <Link to="/profile">
                  <img src={settingsIcon} alt="Settings" />
              </Link>

              <div 
                onClick={handleLogout} 
                style={{ cursor: 'pointer', marginLeft: '8px', display: 'flex', alignItems: 'center' }} 
                title="Sign Out"
              >
                 <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: '22px', color: '#555' }} />
              </div>
          </div>
      </div>

      {/* Calendar Section */}
      <div className="createaccount">Select your date</div>
      
      {errorMessage && (
        <div className="error-banner">{errorMessage}</div>
      )}

      <div className="calendar">
        <div className="calendar-header">
          <button onClick={() => {
            setCurrentMonth(prev => prev - 1 < 0 ? 11 : prev - 1);
            if (currentMonth === 0) setCurrentYear(y => y - 1);
          }}>&lt;</button>

          <div className="month-year">{months[currentMonth]} {currentYear}</div>

          <button onClick={() => {
            setCurrentMonth(prev => prev + 1 > 11 ? 0 : prev + 1);
            if (currentMonth === 11) setCurrentYear(y => y + 1);
          }}>&gt;</button>
        </div>

        <div className="days">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div style={{color:'red'}}>Sat</div>
        </div>

        <div className="dates">
          {dates.map((item, idx) => {
            const isToday = item.day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const currentDayOfWeek = new Date(currentYear, currentMonth, item.day).getDay();
            const isSaturday = item.day && currentDayOfWeek === 6;

            return (
              <div
                key={idx}
                className={isToday ? "today" : ""}
                onClick={() => !item.disabled && handleDateClick(item.day)}
                style={{ 
                    cursor: (item.disabled || isSaturday) ? "default" : "pointer",
                    opacity: isSaturday ? 0.3 : 1
                }}
              >
                {item.day}
              </div>
            );
          })}
        </div>
      </div>

      <div className="footer">
          <div className="footer-item">
               <img src={recentIcon} alt="Recent" className="footer-icon"/>
          </div>
          
          <div className="footer-item" onClick={toggleScheduleModal}>
               <div className="icon-wrapper">
                  <img src={calendarIcon} alt="Schedule" className="active-icon" />
               </div>
          </div>

          <div className="footer-item">
               <img src={favoriteIcon} alt="Favorite" className="footer-icon" />
          </div>
      </div>

      {showSchedule && (
        <div className="modal-overlay">
          <div className="modal-content slide-up">
            <div className="modal-header">
                <h2>My Schedule</h2>
                <button className="close-btn" onClick={() => setShowSchedule(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            
            <div className="modal-body">
                {loadingSchedule ? (
                    <p>Loading bookings...</p>
                ) : mySchedule.length === 0 ? (
                    <div className="empty-state">
                        <p>No upcoming bookings.</p>
                    </div>
                ) : (
                    <div className="schedule-list">
                        {mySchedule.map((item, index) => (
                            <div key={index} className={`schedule-card ${item.type.toLowerCase()}-card`}>
                                <div className="card-icon">
                                    <FontAwesomeIcon icon={item.type === 'Equipment' ? faDumbbell : faUserTie} />
                                </div>
                                <div className="card-info">
                                    <span className="card-title">{item.name}</span>
                                    <span className="card-date">{formatDate(item.schedule_date)}</span>
                                </div>
                                <div className="card-time">
                                    <FontAwesomeIcon icon={faClock} style={{marginRight:'5px'}}/>
                                    {item.start_time.substring(0,5)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
};

export default Dashboard;