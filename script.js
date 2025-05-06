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

function toggleRelay(action) {
  if (activeMode) return;
  stopCharging();
  if (action === 'discharge') startDischarging();
}

function startCharging() {
  isCharging = true;
  stopCharging();
  interval = setInterval(updateChargingValues, 1000);
}

function stopCharging() {
  if (interval) clearInterval(interval);
  interval = null;
  isCharging = false;
}

function startDischarging() {
  stopCharging();
  interval = setInterval(updateDischargeValues, 1000);
}

function updateChargingValues() {
  timeElapsed++;

  batteryCurrent = batteryCapacity * chargeRate;

  const soh = 90;
  const temp = randomBetween(30, 45);

  let now = Date.now();
  let deltaTime = (now - previousTime) / 3600000;
  previousTime = now;

  let chargeAh = batteryCurrent * deltaTime;
  soc += (chargeAh / batteryCapacity) * 100;
  soc = Math.max(0, Math.min(100, soc));

  batteryVoltage = 45 + (soc / 100) * (52 - 45);

  document.getElementById("grid-voltage").textContent = randomBetween(215, 220) + "V";
  document.getElementById("grid-current").textContent = randomBetween(7, 8) + "A";
  document.getElementById("grid-frequency").textContent = "50Hz";
  document.getElementById("grid-power").textContent = randomBetween(1.2, 1.5) + "kW";

  document.getElementById("charger-voltage").textContent = randomBetween(55, 56) + "V";
  document.getElementById("charger-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("charger-power").textContent = randomBetween(0.5, 1.5) + "kW";

  document.getElementById("battery-voltage").textContent = batteryVoltage.toFixed(2) + "V";
  document.getElementById("battery-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("battery-power").textContent = ((batteryVoltage * batteryCurrent) / 1000).toFixed(2) + "kW";

  document.getElementById("battery-soc").textContent = soc.toFixed(2);
  document.getElementById("battery-soh").textContent = soh;
  document.getElementById("battery-cycles").textContent = 25;
  document.getElementById("battery-status").textContent = "Charging";
  document.getElementById("battery-time").textContent = `${Math.floor(timeElapsed / 60)}m ${timeElapsed % 60}s`;
  document.getElementById("battery-temp").textContent = temp;

  updateGraph(timeElapsed, soc, soh, batteryVoltage, batteryCurrent, temp);
}

function updateDischargeValues() {
  batteryVoltage = Math.max(45, batteryVoltage - 0.001);
  batteryCurrent = Math.max(8, batteryCurrent - 0.01);
  const power = (batteryVoltage * batteryCurrent) / 1000;

  document.getElementById("battery-voltage").textContent = batteryVoltage.toFixed(2) + "V";
  document.getElementById("battery-current").textContent = batteryCurrent.toFixed(2) + "A";
  document.getElementById("battery-power").textContent = power.toFixed(2) + "kW";
}

function updateGraph(time, soc, soh, voltage, current, temp) {
  timeArr.push(time);
  socArr.push(soc);
  sohArr.push(soh);
  voltArr.push(voltage.toFixed(2));
  currArr.push(current.toFixed(2));
  tempArr.push(temp);

  if (timeArr.length > 100) {
    timeArr.shift(); socArr.shift(); sohArr.shift();
    voltArr.shift(); currArr.shift(); tempArr.shift();
  }

  batteryChart.update();
}

function selectMode(modeId) {
  const body = document.body;
  const dischargeButton = document.querySelector('.controls button');

  if (activeMode === modeId) {
    activeMode = null;
    body.className = '';
    stopCharging();
    dischargeButton.classList.remove('hidden');
    document.querySelectorAll('.mode-buttons button').forEach(btn => {
      btn.style.display = "inline-block";
      btn.classList.remove("active-mode");
    });
  } else {
    activeMode = modeId;
    body.className = `mode-${modeId}`;
    dischargeButton.classList.add('hidden');
    document.querySelectorAll('.mode-buttons button').forEach(btn => {
      if (btn.textContent.includes(modeId)) {
        btn.classList.add("active-mode");
      } else {
        btn.style.display = "none";
      }
    });

    switch (modeId) {
      case "M1": chargeRate = 0.25; break;
      case "M2": chargeRate = 0.5; break;
      case "M3": chargeRate = 0.75; break;
      case "M4": chargeRate = 1.0; break;
      default: chargeRate = 0.25;
    }

    // ➕ Update the displayed C-rate
    document.getElementById("charger-c-rate").textContent = chargeRate.toFixed(2);

    startCharging();
  }
}

function randomBetween(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Initial display
updateChargingValues();
document.getElementById("charger-c-rate").textContent = chargeRate.toFixed(2); // ➕ Set initial value
