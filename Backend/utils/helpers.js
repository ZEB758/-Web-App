const calculateEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    let endH = hours;
    let endM = minutes + 30;

    if (endM >= 60) {
        endH = (endH + 1) % 24; 
        endM -= 60;
    }
    return `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}:00`;
};

module.exports = { calculateEndTime };