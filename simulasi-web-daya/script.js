/**
 * ElectroLab - Simulasi Daya (Watt)
 * Support: Desktop Drag & Drop & Mobile Touch Drag
 */

// 1. State & Global Variables
let state = {
  resistor: false,
  led: false,
  battery: true,
};

let touchType = null;
let touchSourceId = null;
let ghostElement = null;

// Elemen DOM
const draggables = document.querySelectorAll(".draggable");
const dropZones = document.querySelectorAll(".drop-zone");
const btnGenerate = document.getElementById("btn-generate");
const circuitStatus = document.getElementById("circuit-status");
const statusDot = circuitStatus.querySelector(".status-dot");
const statusText = circuitStatus.querySelector(".status-text");
const vInput = document.getElementById("v-input");
const rInput = document.getElementById("r-input");
const pDisplay = document.getElementById("p-display");

// 2. Fungsi Utama Penempatan (Desktop & Mobile)
function handlePlacement(zone, type, sourceId) {
  if (type === zone.dataset.type && !zone.classList.contains('filled')) {
    const sourceElement = document.getElementById(sourceId);
    const clone = sourceElement.querySelector('svg').cloneNode(true);
    
    zone.innerHTML = "";
    zone.appendChild(clone);
    zone.classList.add('filled');
    
    state[type] = true;
    updateCircuitStatus();
    resetDisplay();
    
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    return true;
  }
  return false;
}

// 3. Event Desktop (Mouse)
draggables.forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("type", item.dataset.type);
    e.dataTransfer.setData("sourceId", item.id);
    item.style.opacity = "0.4";
  });

  item.addEventListener("dragend", () => (item.style.opacity = "1"));
});

dropZones.forEach((zone) => {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.style.borderColor = "#00BCD4";
    zone.style.transform = "scale(1.05)";
  });

  zone.addEventListener("dragleave", () => {
    zone.style.borderColor = "#bbb";
    zone.style.transform = "scale(1)";
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.style.borderColor = "#bbb";
    zone.style.transform = "scale(1)";
    const type = e.dataTransfer.getData("type");
    const sourceId = e.dataTransfer.getData("sourceId");
    handlePlacement(zone, type, sourceId);
  });
});

// 4. Event Touch (Mobile Support)
draggables.forEach(item => {
  item.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchType = item.dataset.type;
    touchSourceId = item.id;
    
    // Buat bayangan komponen agar terlihat saat ditarik
    ghostElement = item.querySelector('svg').cloneNode(true);
    ghostElement.style.position = 'fixed';
    ghostElement.style.width = '60px';
    ghostElement.style.height = '60px';
    ghostElement.style.opacity = '0.7';
    ghostElement.style.pointerEvents = 'none';
    ghostElement.style.zIndex = '1000';
    ghostElement.style.left = touch.clientX - 30 + 'px';
    ghostElement.style.top = touch.clientY - 30 + 'px';
    document.body.appendChild(ghostElement);
    
    item.style.opacity = '0.4';
  }, { passive: false });

  item.addEventListener('touchmove', (e) => {
    if (!ghostElement) return;
    const touch = e.touches[0];
    // Gerakkan bayangan mengikuti jari
    ghostElement.style.left = touch.clientX - 30 + 'px';
    ghostElement.style.top = touch.clientY - 30 + 'px';
    e.preventDefault(); // Kunci layar agar tidak scroll saat narik
  }, { passive: false });

  item.addEventListener('touchend', (e) => {
    if (!ghostElement) return;
    
    const touch = e.changedTouches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Cek tabrakan dengan zona target
    dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      if (
        touchX >= rect.left && touchX <= rect.right &&
        touchY >= rect.top && touchY <= rect.bottom
      ) {
        handlePlacement(zone, touchType, touchSourceId);
      }
    });

    // Bersihkan bayangan
    if (ghostElement) {
      ghostElement.remove();
      ghostElement = null;
    }
    item.style.opacity = '1';
    touchType = null;
    touchSourceId = null;
  });
});

// 5. Fungsi UI & Status
function updateCircuitStatus() {
  const componentsNeeded = Object.keys(state).filter(
    (key) => key !== "battery" && !state[key],
  );

  if (componentsNeeded.length === 0) {
    statusDot.style.background = "#4CAF50";
    statusText.textContent = "Sirkuit Siap!";
    statusText.style.color = "#2E7D32";
    circuitStatus.style.background = "#E8F5E9";
    circuitStatus.style.borderColor = "#C8E6C9";
    statusDot.style.animation = "none";
  } else {
    statusDot.style.background = "#F44336";
    statusText.textContent = "Sirkuit Tidak Lengkap";
    statusText.style.color = "#D32F2F";
    circuitStatus.style.background = "#FFEBEE";
    circuitStatus.style.borderColor = "#FFCDD2";
    statusDot.style.animation = "pulse 2s infinite";
  }
}

function resetLED() {
  const ledSlot = document.querySelector("#slot-led");
  if (!ledSlot) return;
  const ledBulb = ledSlot.querySelector(".led-bulb");
  if (ledBulb) {
    ledBulb.setAttribute("fill", "#FFFFFF");
    ledBulb.style.animation = "none";
  }
}

function resetDisplay() {
  if (pDisplay) pDisplay.textContent = "0.00";
  resetLED();
}

function updateLEDColor(I_mA) {
  const ledSlot = document.querySelector("#slot-led");
  if (!ledSlot) return;
  const ledBulb = ledSlot.querySelector(".led-bulb");
  if (!ledBulb) return;

  let color = "#ffffff";
  if (I_mA > 0 && I_mA < 50) color = "#fffc5f";
  else if (I_mA >= 50 && I_mA < 150) color = "#fc9653";
  else if (I_mA >= 150 && I_mA <= 200) color = "#ff3c01";
  else if (I_mA > 200) {
    color = "#000000";
    ledBulb.style.animation = "blink 0.5s infinite alternate";
  }

  ledBulb.setAttribute("fill", color);
  ledBulb.style.transition = "fill 0.5s ease";
}

// 6. Logika Perhitungan (Daya P = V^2 / R)
function calculateAndDisplay() {
  if (!state.resistor || !state.led) return;

  const V = parseFloat(vInput.value);
  const R = parseFloat(rInput.value);

  if (isNaN(V) || V <= 0 || isNaN(R) || R <= 0) return;

  const I = V / R;
  const P_Watt = V * I;

  if (pDisplay) pDisplay.textContent = P_Watt.toFixed(2);

  const I_mA = I * 1000;
  updateLEDColor(I_mA);
}

// 7. Event Listeners
[vInput, rInput].forEach(input => {
  input.addEventListener('input', () => {
    resetDisplay();
  });
});

btnGenerate.addEventListener('click', () => {
  btnGenerate.classList.add('clicked');
  setTimeout(() => btnGenerate.classList.remove('clicked'), 300);
  calculateAndDisplay();
});

document.addEventListener('DOMContentLoaded', () => {
  updateCircuitStatus();
});