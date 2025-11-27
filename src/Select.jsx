import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "./axios"; 
import "./Select.css"; 

const Select = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Get Date from Dashboard
  const { date } = location.state || {};

  // 2. State Management
  const [user, setUser] = useState(null);
  const [bookingType, setBookingType] = useState("equipment"); 
  const [listData, setListData] = useState([]); 
  const [selectedItem, setSelectedItem] = useState(""); 
  
  // CHANGED: selectedTimes is now an Array to hold multiple slots
  const [selectedTimes, setSelectedTimes] = useState([]); 
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper: Format Date
  const getFriendlyDate = (dateString) => {
      if (!dateString) return "";
      const dateObj = new Date(dateString + 'T00:00:00'); 
      return dateObj.toLocaleDateString('en-US', {
          weekday: 'long', 
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });
  };

  const friendlyDate = getFriendlyDate(date);

  // 3. Generate Time Slots
  const generateTimeSlots = () => {
    const slots = [];
    let hour = 8;
    let minute = 0;
    while (hour < 22) {
      const formatted = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(formatted);
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  // 4. On Mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(storedUser));

    if (!date) {
      navigate("/dashboard");
      return;
    }

    fetchData(bookingType);
  }, [date, bookingType, navigate]);

  // 5. Fetch Data
  const fetchData = async (type) => {
    setLoading(true);
    setSelectedItem(""); 
    setSelectedTimes([]); // Clear times when switching types
    setMessage("");
    try {
      const endpoint = type === "equipment" ? "/api/equipment" : "/api/trainers";
      const res = await axios.get(endpoint);
      setListData(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Tab Change
  const handleTabChange = (type) => {
      setBookingType(type);
      setIsSidebarOpen(false); 
  };

  // NEW: Handle Multiple Time Selection
  const handleTimeClick = (time) => {
      if (selectedTimes.includes(time)) {
          // If already selected, remove it
          setSelectedTimes(prev => prev.filter(t => t !== time));
      } else {
          // If not selected, add it
          setSelectedTimes(prev => [...prev, time].sort());
      }
  };

  // 6. Handle Booking (Updated for Multiple Slots)
  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedItem) {
      setMessage("Please select an Item (Machine or Trainer).");
      return;
    }

    if (selectedTimes.length === 0) {
      setMessage("Please select at least one time slot.");
      return;
    }

    const endpoint = bookingType === "equipment" ? "/api/book/equipment" : "/api/book/trainer";
    
    // Create an array of promises (one request per time slot)
    const bookingPromises = selectedTimes.map(time => {
        const payload = {
            user_id: user.user_id,
            date: date, 
            start_time: time,
            ...(bookingType === "equipment" ? { equipment_id: selectedItem } : { trainer_id: selectedItem })
        };
        return axios.post(endpoint, payload);
    });

    try {
      // Execute all requests
      const responses = await Promise.all(bookingPromises);
      
      // Analyze results
      const successes = [];
      const failures = [];

      responses.forEach((res, index) => {
          if (res.data.success) {
              successes.push(selectedTimes[index]);
          } else {
              failures.push(`${selectedTimes[index]} (${res.data.message})`);
          }
      });

      if (failures.length === 0) {
          // All good
          alert(`Success! Booked ${successes.length} slot(s) for ${friendlyDate}.`);
          navigate("/dashboard");
      } else if (successes.length === 0) {
          // All failed
          setMessage(`Booking failed: ${failures.join(", ")}`);
      } else {
          // Mixed results
          alert(`Partial Success.\nBooked: ${successes.join(", ")}\nFailed: ${failures.join(", ")}`);
          navigate("/dashboard");
      }

    } catch (err) {
      console.error(err);
      setMessage("Server Error during booking process.");
    }
  };

  if (!user || !date) return <div>Loading...</div>;

  return (
    <div className="page-wrapper">
      
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      <header className="top-header">
          <div className="header-left">
             <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                ☰
             </button>

             <div className="user-greeting">
                  <h1 className="user-name">{user.username}</h1>
                  <p className="selected-date">{friendlyDate}</p>
             </div>
          </div>
      </header>

      <nav className={`selection-navbar ${isSidebarOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>×</div>

          <div 
            className={`nav-item ${bookingType === "equipment" ? "active" : ""}`}
            onClick={() => handleTabChange("equipment")}
          >
            Equipment
          </div>
          <div 
            className={`nav-item ${bookingType === "trainer" ? "active" : ""}`}
            onClick={() => handleTabChange("trainer")}
          >
            Trainers
          </div>
      </nav>

      <div className="content-container">
          <form onSubmit={handleBooking} className="booking-form">
            
            <div className="dropdown-section">
                <label>Select {bookingType === "equipment" ? "Machine" : "Trainer"}:</label>
                <select 
                  value={selectedItem} 
                  onChange={(e) => setSelectedItem(e.target.value)}
                  required
                  disabled={loading}
                  className="main-dropdown"
                >
                  <option value="">-- Choose Option --</option>
                  {listData.map((item) => (
                    <option 
                      key={bookingType === "equipment" ? item.equipment_id : item.trainer_id} 
                      value={bookingType === "equipment" ? item.equipment_id : item.trainer_id}
                    >
                      {bookingType === "equipment" ? item.equipment_name : `${item.trainer_name} (${item.training_type})`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                    * You can select multiple time slots for this item.
                </small>
            </div>

            <label className="time-label">Select Time Slot(s):</label>
            <div className="time-grid">
              {timeSlots.map((time) => (
                <div 
                  key={time} 
                  /* CHECK IF TIME IS IN ARRAY */
                  className={`time-slot ${selectedTimes.includes(time) ? "selected" : ""}`}
                  /* TOGGLE FUNCTION */
                  onClick={() => handleTimeClick(time)}
                >
                  {time}
                </div>
              ))}
            </div>

            {message && <div className="error-msg">{message}</div>}

            <div className="actions">
              <button type="button" className="cancel-btn" onClick={() => navigate("/dashboard")}>
                Cancel
              </button>
              <button type="submit" className="confirm-btn">
                Confirm Booking ({selectedTimes.length})
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default Select;