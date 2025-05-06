let activeMode = null;
let isCharging = false;
let interval = null;

let batteryVoltage = 45;
let batteryCurrent = 8;
let timeElapsed = 0;

const socArr = [], sohArr = [], voltArr = [], currArr = [], tempArr = [], timeArr = [];

// Chart Initialization
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

// Toggle charge/discharge
function toggleRelay(action) {
  if (activeMode) return; // Prevent discharge when a mode is active
  stopCharging();
  if (action === 'discharge') startDischarging();
}

// Start charging simulation
function startCharging() {
  isCharging = true;
  stopCharging(); // Clear existing interval
  interval = setInterval(updateChargingValues, 1000);
}

// Stop any updates
function stopCharging() {
  if (interval) clearInterval(interval);
  interval = null;
  isCharging = false;
}

// Discharge mode
function startDischarging() {
  stopCharging();
  interval = setInterval(updateDischargeValues, 1000);
}

// Charging logic with incremental update
function updateChargingValues() {
  timeElapsed++;

  if (batteryVoltage < 52) batteryVoltage += 0.2; // Increase voltage during charging
  if (batteryCurrent < 15) batteryCurrent += 0.2; // Increase current during charging

  const soc = randomBetween(50, 100); // Simulate random SOC (State of Charge)
  const soh = randomBetween(90, 100); // Simulate random SOH (State of Health)
  const temp = randomBetween(30, 45); // Simulate random temperature

  // Update grid and charger data (Randomized values for UI)
  document.getElementById("grid-voltage").textContent = randomBetween(210, 230) + "V";
  document.getElementById("grid-current").textContent = randomBetween(5, 7) + "A";
  document.getElementById("grid-frequency").textContent = "50Hz";
  document.getElementById("grid-power").textContent = randomBetween(1.2, 1.5) + "kW";

  document.getElementById("charger-voltage").textContent = (batteryVoltage + 1).toFixed(2) + "V";
  document.getElementById("charger-current").textContent = (batteryCurrent + 1).toFixed(2) + "A";
  document.getElementById("charger-power").textContent = randomBetween(0.5, 1.5) + "kW";

  document.getElementById("battery-voltage").textContent = batteryVoltage.toFixed(2) + "V";
  document.getElementById("battery-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("battery-power").textContent = ((batteryVoltage * batteryCurrent) / 1000).toFixed(2) + "kW";
  document.getElementById("battery-soc").textContent = soc;
  document.getElementById("battery-soh").textContent = soh;
  document.getElementById("battery-cycles").textContent = Math.floor(randomBetween(100, 400));
  document.getElementById("battery-status").textContent = "Charging";
  document.getElementById("battery-time").textContent = `${Math.floor(timeElapsed / 60)}m ${timeElapsed % 60}s`;
  document.getElementById("battery-temp").textContent = temp;

  // Update graph with the latest data
  updateGraph(timeElapsed, soc, soh, batteryVoltage, batteryCurrent, temp);
}

// Discharge logic (0.01 decrement per second)
function updateDischargeValues() {
  batteryVoltage = Math.max(45, batteryVoltage - 0.01); // Prevent voltage from going below 45V
  batteryCurrent = Math.max(8, batteryCurrent - 0.01); // Prevent current from going below 8A
  const power = (batteryVoltage * batteryCurrent) / 1000;

  document.getElementById("battery-voltage").textContent = batteryVoltage.toFixed(2) + "V";
  document.getElementById("battery-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("battery-power").textContent = power.toFixed(2) + "kW";
}

// Update chart values
function updateGraph(time, soc, soh, voltage, current, temp) {
  timeArr.push(time);
  socArr.push(soc);
  sohArr.push(soh);
  voltArr.push(voltage.toFixed(2));
  currArr.push(current.toFixed(2));
  tempArr.push(temp);

  // Keep the array size limited to 100
  if (timeArr.length > 100) {
    timeArr.shift(); socArr.shift(); sohArr.shift();
    voltArr.shift(); currArr.shift(); tempArr.shift();
  }

  batteryChart.update();
}

// Select mode and start charging
function selectMode(modeId) {
  const body = document.body;
  const dischargeButton = document.querySelector('.controls button');

  if (activeMode === modeId) {
    activeMode = null;
    body.className = ''; // Reset body class (remove mode styling)
    stopCharging();
    dischargeButton.classList.remove('hidden'); // Show discharge button
    document.querySelectorAll('.mode-buttons button').forEach(btn => {
      btn.style.display = "inline-block";
      btn.classList.remove("active-mode"); // Remove active state
    });
  } else {
    activeMode = modeId;
    body.className = `mode-${modeId}`; // Apply mode-specific background and styling
    dischargeButton.classList.add('hidden'); // Hide discharge button
    document.querySelectorAll('.mode-buttons button').forEach(btn => {
      if (btn.textContent.includes(modeId)) {
        btn.classList.add("active-mode"); // Highlight active mode button
      } else {
        btn.style.display = "none"; // Hide non-active mode buttons
      }
    });
    startCharging(); // Start charging on mode selection
  }
}

// Utility for random float values
function randomBetween(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Initial display setup
updateChargingValues();
