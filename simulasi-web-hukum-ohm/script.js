/**
 * ElectroLab - Script Pro (Support Desktop & Mobile)
 */

// 1. State & Global Variables
let state = { resistor: false, led: false, battery: true };
let touchType = null;
let touchSourceId = null;
let ghostElement = null; // Elemen bayangan untuk mobile

// Elemen DOM
const draggables = document.querySelectorAll('.draggable');
const dropZones = document.querySelectorAll('.drop-zone');
const btnGenerate = document.getElementById('btn-generate');
const vInput = document.getElementById('v-input');
const rInput = document.getElementById('r-input');
const pDisplay = document.getElementById('i-display'); // Output Daya (Watt)

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

// 3. EVENT DESKTOP (Mouse)
draggables.forEach(item => {
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', item.dataset.type);
    e.dataTransfer.setData('sourceId', item.id);
    item.style.opacity = '0.4';
  });
  item.addEventListener('dragend', () => item.style.opacity = '1');
});

dropZones.forEach(zone => {
  zone.addEventListener('dragover', (e) => e.preventDefault());
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const sourceId = e.dataTransfer.getData('sourceId');
    handlePlacement(zone, type, sourceId);
  });
});

// 4. EVENT TOUCH (Mobile) - Versi Ghost Drag
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

// 5. Logika Simulasi & UI
function updateCircuitStatus() {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  const circuitStatus = document.getElementById('circuit-status');
  const isComplete = state.resistor && state.led;
  
  if (isComplete) {
    statusDot.style.background = '#4CAF50';
    statusText.textContent = 'Sirkuit Siap!';
    statusText.style.color = '#2E7D32';
    circuitStatus.style.background = '#E8F5E9';
    statusDot.style.animation = 'none';
  } else {
    statusDot.style.background = '#F44336';
    statusText.textContent = 'Sirkuit Tidak Lengkap';
    statusText.style.color = '#D32F2F';
    circuitStatus.style.background = '#FFEBEE';
    statusDot.style.animation = 'pulse 2s infinite';
  }
}

function calculateAndDisplay() {
  if (!state.resistor || !state.led) return;
  const V = parseFloat(vInput.value);
  const R = parseFloat(rInput.value);
  if (isNaN(V) || isNaN(R) || R <= 0) return;

  // HITUNG DAYA (P = V^2 / R)
  const P_Watt = (V * V) / R;
  pDisplay.textContent = P_Watt.toFixed(2);

  // Arus tetap dihitung untuk visual LED (I = V / R)
  const I_mA = (V / R) * 1000;
  updateLEDColor(I_mA);
}

function updateLEDColor(I_mA) {
  // PENTING: Cari LED yang ada di dalam sirkuit, bukan yang di sidebar
  const activeLED = document.querySelector('#slot-led .led-bulb');
  if (!activeLED) return;

  let color = "#ffffff";
  if (I_mA > 0 && I_mA < 50) color = "#fffc5f";
  else if (I_mA >= 50 && I_mA < 150) color = "#fc9653";
  else if (I_mA >= 150 && I_mA <= 200) color = "#ff3c01";
  else if (I_mA > 200) {
    color = "#000000";
    activeLED.style.animation = 'blink 0.5s infinite alternate';
  } else {
    activeLED.style.animation = 'none';
  }
  
  activeLED.setAttribute('fill', color);
  activeLED.style.transition = "fill 0.5s ease";
}

function resetDisplay() {
  pDisplay.textContent = '0.00';
  const activeLED = document.querySelector('#slot-led .led-bulb');
  if (activeLED) {
    activeLED.setAttribute('fill', '#FFFFFF');
    activeLED.style.animation = 'none';
  }
}

// Event Listeners Input
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