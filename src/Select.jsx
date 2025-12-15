import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "./axios"; 
import "./Select.css"; 

// Icons
import userIcon from "./Assets/user_full.png";        
import girlicon from "./Assets/user-icon-girl.png";   

const Select = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { date } = location.state || {};

  const [user, setUser] = useState(null);
  const [userGender, setUserGender] = useState(""); 

  const [equipmentList, setEquipmentList] = useState([]);
  const [trainerList, setTrainerList] = useState([]);
  
  const [bookingType, setBookingType] = useState("equipment"); 
  const [selectedItem, setSelectedItem] = useState(""); 
  const [selectedName, setSelectedName] = useState(""); 
  
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [originalBookings, setOriginalBookings] = useState([]);
  const [occupiedTimes, setOccupiedTimes] = useState([]);
  const [conflictTimes, setConflictTimes] = useState([]);
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper to get image
  const getEquipmentImage = (imageName) => {
      if (!imageName) return "https://via.placeholder.com/50?text=No+Img";
      try { return require(`./Assets/${imageName}`); } catch (err) { return "https://via.placeholder.com/50?text=Missing"; }
  };

  const getFriendlyDate = (dateString) => {
      if (!dateString) return "";
      const dateObj = new Date(dateString + 'T00:00:00'); 
      return dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  const friendlyDate = getFriendlyDate(date);

  const generateTimeSlots = () => {
    if (!date) return [];
    const dayIndex = new Date(date).getUTCDay(); 
    const isSunday = dayIndex === 0;
    const endHour = isSunday ? 19 : 21; 
    const endMinute = isSunday ? 30 : 30;

    const slots = [];
    let hour = 8;
    let minute = 0;
    while (hour < endHour || (hour === endHour && minute <= endMinute)) { 
      const formatted = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(formatted);
      minute += 30;
      if (minute === 60) { minute = 0; hour++; }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) { navigate("/"); return; }
    
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    if (!date) { navigate("/dashboard"); return; }

    if (parsedUser.gender) {
        setUserGender(parsedUser.gender);
    }
    
    axios.get(`/profile/${parsedUser.user_id}`)
        .then(res => {
            if (res.data.success && res.data.data.gender) {
                setUserGender(res.data.data.gender);
            }
        })
        .catch(err => console.log(err));

    fetchAllData();
  }, [date, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [eqRes, trRes] = await Promise.all([ axios.get("/api/equipment"), axios.get("/api/trainers") ]);
      setEquipmentList(Array.isArray(eqRes.data) ? eqRes.data : []);
      setTrainerList(Array.isArray(trRes.data) ? trRes.data : []);
    } catch (err) { setMessage("Failed to load lists."); } finally { setLoading(false); }
  };

  const fetchUserBookings = async (type, id) => {
      try {
          const res = await axios.post("/api/check-bookings", { type: type, item_id: id, date: date });
          if (res.data.success) {
              setOriginalBookings(res.data.myBookings || []);   
              setSelectedTimes(res.data.myBookings || []);
              setOccupiedTimes(res.data.occupiedBookings || []); 
              setConflictTimes(res.data.userConflicts || []);
          } else {
              setOriginalBookings([]); setSelectedTimes([]); setOccupiedTimes([]); setConflictTimes([]);
          }
      } catch (err) { setOccupiedTimes([]); }
  };

  const handleSelection = (type, id, name) => {
      setBookingType(type); setSelectedItem(id); setSelectedName(name); setIsSidebarOpen(false); setMessage("");
      setSelectedTimes([]); setOriginalBookings([]); setOccupiedTimes([]); setConflictTimes([]);
      fetchUserBookings(type, id);
  };

  // --- NEW: CHECK IF TIME IS PAST ---
  const isTimePast = (timeStr) => {
      const now = new Date();
      // Create a Date object for the slot: Selected Date + Slot Time
      const slotDate = new Date(`${date}T${timeStr}:00`); 
      // Compare: If slot is older than now, return true
      return slotDate < now;
  };

  const handleTimeClick = (time) => {
    // 1. Check if past
    if (isTimePast(time)) {
        setMessage("Cannot book past time slots.");
        return;
    }

    if ((occupiedTimes || []).includes(time)) { setMessage("This slot is occupied by another member."); return; }
    if ((conflictTimes || []).includes(time)) { setMessage("You already have another booking at this time."); return; }
    
    if (selectedTimes.includes(time)) { setSelectedTimes(prev => prev.filter(t => t !== time)); } 
    else { setSelectedTimes(prev => [...prev, time].sort()); }
  };

  const handleBooking = async (e) => {
    e.preventDefault(); setMessage("");
    if (!selectedItem) { setMessage("Please open the menu (☰) and select a Trainer or Machine."); return; }
    
    const toBook = selectedTimes.filter(t => !originalBookings.includes(t));
    const toUnbook = originalBookings.filter(t => !selectedTimes.includes(t));
    if (toBook.length === 0 && toUnbook.length === 0) { setMessage("No changes made."); return; }

    try {
        const promises = [];
        const bookEndpoint = bookingType === "equipment" ? "/api/book/equipment" : "/api/book/trainer";
        toBook.forEach(time => {
            promises.push(axios.post(bookEndpoint, { user_id: user.user_id, date: date, start_time: time, ...(bookingType === "equipment" ? { equipment_id: selectedItem } : { trainer_id: selectedItem }) }));
        });
        toUnbook.forEach(time => {
            promises.push(axios.post("/api/book/delete", { type: bookingType, item_id: selectedItem, date: date, start_time: time }));
        });
        await Promise.all(promises);
        alert("Schedule Updated Successfully!");
        navigate("/dashboard");
    } catch (err) { setMessage("Error updating schedule. Some items may not have saved."); }
  };

  if (!user || !date) return <div>Loading...</div>;

  return (
    <div className="page-wrapper">
      <div className="content-container">
          <div className="inner-header">
              <div className="user-info-group">
                  <img 
                    src={userGender === "Female" ? girlicon : userIcon} 
                    alt="User" 
                    className="header-user-icon" 
                  />
                  <div className="header-text">
                      <h2 className="user-name">{user.username}</h2>
                      <p className="selected-date">{friendlyDate}</p>
                  </div>
              </div>
              <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
          </div>
          <hr className="divider"/>
          
          <div className={`right-drawer ${isSidebarOpen ? "open" : ""}`}>
              <button className="close-drawer-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
              <div className="drawer-columns">
                  <div className="drawer-col">
                      <h3>Trainers</h3>
                      <div className="scroll-list">
                        {trainerList.map(t => (
                            <div key={t.trainer_id} className={`drawer-item ${bookingType === 'trainer' && selectedItem === t.trainer_id ? 'active' : ''}`} onClick={() => handleSelection('trainer', t.trainer_id, t.trainer_name)}>
                                <div className="item-text"><span className="item-title">{t.trainer_name}</span><span className="item-sub">{t.training_type}</span></div>
                            </div>
                        ))}
                      </div>
                  </div>
                  <div className="drawer-col">
                      <h3>Equipment</h3>
                      <div className="scroll-list">
                        {equipmentList.map(e => (
                            <div key={e.equipment_id} className={`drawer-item ${bookingType === 'equipment' && selectedItem === e.equipment_id ? 'active' : ''}`} onClick={() => handleSelection('equipment', e.equipment_id, e.equipment_name)}>
                                <img src={getEquipmentImage(e.equipment_image)} alt={e.equipment_name} className="item-img"/>
                                <div className="item-text"><span className="item-title">{e.equipment_name}</span><span className="item-sub">{e.equipment_status}</span></div>
                            </div>
                        ))}
                      </div>
                  </div>
              </div>
          </div>
          {isSidebarOpen && <div className="drawer-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

          <form onSubmit={handleBooking} className="booking-form">
            <div className="selection-display">
                <label>Selected Item:</label>
                <div className="selected-box">
                    {selectedItem ? ( <><strong>{selectedName}</strong> <span className="type-badge">{bookingType.toUpperCase()}</span></> ) : ( <span style={{color: '#999'}}>Click the Menu (☰) to select...</span> )}
                </div>
            </div>

            <label className="time-label">Select Time Slot(s):</label>
            <div className="time-grid-container">
              <div className="time-grid">
                {timeSlots.map((time) => {
                    const isOccupied = (occupiedTimes || []).includes(time);
                    const isConflict = (conflictTimes || []).includes(time);
                    const isSelected = selectedTimes.includes(time);
                    
                    // --- NEW CHECK ---
                    const isPast = isTimePast(time);

                    let className = "time-slot";
                    
                    // Priority of styles: Past -> Selected -> Occupied -> Conflict -> Normal
                    if (isPast) className += " past";
                    else if (isSelected) className += " selected";
                    else if (isOccupied) className += " occupied";
                    else if (isConflict) className += " conflict";

                    // Determine Title
                    let title = "Available";
                    if (isPast) title = "Time has passed";
                    else if (isOccupied) title = "Fully Booked";
                    else if (isConflict) title = "You are busy elsewhere";

                    return (
                        <div key={time} className={className} onClick={() => handleTimeClick(time)} title={title}>
                            {time}
                            {/* Render label based on status */}
                            {!isPast && isOccupied && <span className="occupied-label"><br/>Full</span>}
                            {!isPast && isConflict && <span className="occupied-label"><br/>Busy</span>}
                        </div>
                    );
                })}
              </div>
            </div>
            {message && <div className="error-msg">{message}</div>}
            <div className="actions-footer">
                <button type="button" className="back-btn" onClick={() => navigate("/dashboard")}>&larr; Back</button>
                <button type="submit" className="confirm-btn">Update Schedule</button>
                <div style={{width: '60px'}}></div>
            </div>
          </form>
      </div>
    </div>
  );
};

export default Select;