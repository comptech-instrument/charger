let activeMode = null;
let isCharging = false;
let interval = null;

let batteryVoltage = 45;
let batteryCurrent = 8;
let batteryCapacity = 15; // in Ah
let chargeRate = 0.25; // default to 0.25C
let soc = 53; // start at 53% SOC
let timeElapsed = 0;
let previousTime = Date.now();

const socArr = [], sohArr = [], voltArr = [], currArr = [], tempArr = [], timeArr = [];

const ctx = document.getElementById('batteryChart').getContext('2d');
const batteryChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: timeArr,
    datasets: [
      { label: 'SOC (%)', data: socArr, borderColor: 'cyan', fill: false },
      { label: 'SOH (%)', data: sohArr, borderColor: 'lime', fill: false },
      { label: 'Voltage (V)', data: voltArr, borderColor: 'yellow', fill: false },
      { label: 'Current (A)', data: currArr, borderColor: 'orange', fill: false },
      { label: 'Temp (°C)', data: tempArr, borderColor: 'red', fill: false }
    ]
  },
  options: {
    scales: {
      x: { title: { display: true, text: 'Time (s)' } },
      y: { beginAtZero: true }
    }
  }
});

// Function to toggle relay actions (discharge or charging)
function toggleRelay(action) {
  if (activeMode) return; // Prevent toggle if mode is active
  stopCharging();
  if (action === 'discharge') startDischarging();
}

// Start charging with interval updates
function startCharging() {
  isCharging = true;
  stopCharging(); // Ensure previous charging is stopped
  interval = setInterval(updateChargingValues, 1000); // Update every second
}

// Stop charging and clear the interval
function stopCharging() {
  if (interval) clearInterval(interval);
  interval = null;
  isCharging = false;
}

// Start discharging and update values every second
function startDischarging() {
  stopCharging();
  interval = setInterval(updateDischargeValues, 1000); // Update every second
}

// Update charging values and display dynamic info
function updateChargingValues() {
  timeElapsed++;
  
  batteryCurrent = batteryCapacity * chargeRate;

  const soh = 90;
  const temp = randomBetween(30, 45); // Random temperature between 30 and 45°C

  let now = Date.now();
  let deltaTime = (now - previousTime) / 3600000;
  previousTime = now;

  let chargeAh = batteryCurrent * deltaTime;
  soc += (chargeAh / batteryCapacity) * 100;
  soc = Math.max(0, Math.min(100, soc)); // Ensure SOC is between 0 and 100

  batteryVoltage = 45 + (soc / 100) * (52 - 45); // Voltage increases with SOC

  // Update the grid info dynamically
  document.getElementById("grid-voltage").textContent = randomBetween(215, 220) + "V";
  document.getElementById("grid-current").textContent = randomBetween(7, 8) + "A";
  document.getElementById("grid-frequency").textContent = "50Hz";
  document.getElementById("grid-power").textContent = randomBetween(1.2, 1.5) + "kW";

  // Update the charger info dynamically
  document.getElementById("charger-voltage").textContent = randomBetween(55, 56) + "V";
  document.getElementById("charger-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("charger-power").textContent = randomBetween(0.5, 1.5) + "kW";

  // Update battery details dynamically
  document.getElementById("battery-voltage").textContent = batteryVoltage.toFixed(2) + "V";
  document.getElementById("battery-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("battery-power").textContent = ((batteryVoltage * batteryCurrent) / 1000).toFixed(2) + "kW";

  document.getElementById("battery-soc").textContent = soc.toFixed(2);
  document.getElementById("battery-soh").textContent = soh;
  document.getElementById("battery-cycles").textContent = 25; // Placeholder for cycles
  document.getElementById("battery-status").textContent = "Charging";
  document.getElementById("battery-time").textContent = `${Math.floor(timeElapsed / 60)}m ${timeElapsed % 60}s`;
  document.getElementById("battery-temp").textContent = temp;

  // Update graph dynamically
  updateGraph(timeElapsed, soc, soh, batteryVoltage, batteryCurrent, temp);
}

// Update discharge values
function updateDischargeValues() {
  batteryVoltage = Math.max(45, batteryVoltage - 0.001); // Ensure voltage doesn't go below 45V
  batteryCurrent = Math.max(8, batteryCurrent - 0.01); // Ensure current doesn't go below 8A
  const power = (batteryVoltage * batteryCurrent) / 1000; // Power in kW

  // Update battery info dynamically
  document.getElementById("battery-voltage").textContent = batteryVoltage.toFixed(2) + "V";
  document.getElementById("battery-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("battery-power").textContent = power.toFixed(2) + "kW";
}

// Update the graph with new values
function updateGraph(time, soc, soh, voltage, current, temp) {
  timeArr.push(time);
  socArr.push(soc);
  sohArr.push(soh);
  voltArr.push(voltage.toFixed(2));
  currArr.push(current.toFixed(2));
  tempArr.push(temp);

  // Maintain graph size (100 data points)
  if (timeArr.length > 100) {
    timeArr.shift(); socArr.shift(); sohArr.shift();
    voltArr.shift(); currArr.shift(); tempArr.shift();
  }

  batteryChart.update(); // Redraw the chart with updated data
}

// Function to select charging mode (MPC, KF, PID, DVS)
function selectMode(modeId) {
  const body = document.body;
  const dischargeButton = document.querySelector('.controls button');

  if (activeMode === modeId) {
    activeMode = null;
    body.className = ''; // Reset body class
    stopCharging();
    dischargeButton.classList.remove('hidden'); // Show discharge button
    document.querySelectorAll('.mode-buttons button').forEach(btn => {
      btn.style.display = "inline-block";
      btn.classList.remove("active-mode");
    });
  } else {
    activeMode = modeId;
    body.className = `mode-${modeId}`; // Set body class to active mode
    dischargeButton.classList.add('hidden'); // Hide discharge button
    document.querySelectorAll('.mode-buttons button').forEach(btn => {
      if (btn.textContent.includes(modeId)) {
        btn.classList.add("active-mode"); // Highlight active mode
      } else {
        btn.style.display = "none"; // Hide non-selected modes
      }
    });

    // Set charge rate based on selected mode
    switch (modeId) {
      case "MPC": chargeRate = 0.25; break;  // Model Predictive Control at 0.25C
      case "KF": chargeRate = 0.50; break;   // Kalman Filter at 0.50C
      case "PID": chargeRate = 0.75; break;  // Fuzzy Logic (PID) at 0.75C
      case "DVS": chargeRate = 1.0; break;   // Dynamic Voltage Scaling at 1.0C
      default: chargeRate = 0.25; // Default to 0.25C
    }

    // Update C-rate display
    document.getElementById("charger-c-rate").textContent = chargeRate.toFixed(2);

    startCharging(); // Start charging with updated rate
  }
}

// Helper function to generate random numbers between min and max
function randomBetween(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Initial display setup
updateChargingValues();
document.getElementById("charger-c-rate").textContent = chargeRate.toFixed(2); // Set initial value
