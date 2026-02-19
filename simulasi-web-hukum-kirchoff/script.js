/**
 * Simulasi Sirkuit Mesh Analysis - Mobile & Desktop Support
 */

// 1. State & Global Variables
let state = {
  v1: true, v2: false,
  r1: true, r2: false, r3: true
};

let touchType = null;
let touchSourceId = null;
let ghostElement = null;

// Elemen DOM
const draggables = document.querySelectorAll('.draggable');
const dropZones = document.querySelectorAll('.drop-zone');
const btnGenerate = document.getElementById('btn-generate');
const circuitStatusIndicator = document.getElementById('circuit-status-indicator');
const statusDot = circuitStatusIndicator.querySelector('.status-dot');
const statusText = circuitStatusIndicator.querySelector('.status-text');

const v1Input = document.getElementById('v1-in'), v1Slider = document.getElementById('v1-slider');
const v2Input = document.getElementById('v2-in'), v2Slider = document.getElementById('v2-slider');
const r1Input = document.getElementById('r1-in'), r1Slider = document.getElementById('r1-slider');
const r2Input = document.getElementById('r2-in'), r2Slider = document.getElementById('r2-slider');
const r3Input = document.getElementById('r3-in'), r3Slider = document.getElementById('r3-slider');

const iDisplay = document.getElementById('i-display');

// 2. Fungsi Utama Penempatan (Gabungan Desktop & Mobile)
function handlePlacement(zone, type, sourceId) {
  if (type === zone.dataset.type && !zone.classList.contains('filled')) {
    const sourceElement = document.getElementById(sourceId);
    const clone = sourceElement.querySelector('svg').cloneNode(true);

    // Rotasi komponen saat diletakkan agar sesuai jalur sirkuit
    if (type === 'battery' || type === 'resistor') {
      clone.style.transform = 'rotate(90deg)';
    }

    zone.innerHTML = '';
    zone.appendChild(clone);
    zone.classList.add('filled');

    const key = zone.id.split('-')[1]; // Mengambil 'v2' atau 'r2' dari id 'slot-v2'
    state[key] = true;

    // Tampilkan label komponen (V2 atau R2)
    const label = document.getElementById(`label-${key}`);
    if (label) label.classList.remove('hidden');

    updateCircuitStatus();
    resetDisplay();
    
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    return true;
  }
  return false;
}

// 3. Logika Drag & Drop DESKTOP (Mouse)
draggables.forEach(item => {
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', item.dataset.type);
    e.dataTransfer.setData('id', item.id);
    item.style.opacity = '0.4';
  });
  item.addEventListener('dragend', () => item.style.opacity = '1');
});

dropZones.forEach(zone => {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = '#FF5722';
    zone.style.transform = 'scale(1.05)';
  });
  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = '#bbb';
    zone.style.transform = 'scale(1)';
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = '#bbb';
    zone.style.transform = 'scale(1)';
    const type = e.dataTransfer.getData('type');
    const id = e.dataTransfer.getData('id');
    handlePlacement(zone, type, id);
  });
});

// 4. TOUCH SUPPORT (MOBILE)
draggables.forEach(item => {
  item.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchType = item.dataset.type;
    touchSourceId = item.id;
    
    ghostElement = item.querySelector('svg').cloneNode(true);
    ghostElement.style.position = 'fixed';
    ghostElement.style.width = '50px';
    ghostElement.style.height = '50px';
    ghostElement.style.opacity = '0.7';
    ghostElement.style.pointerEvents = 'none';
    ghostElement.style.zIndex = '1000';
    ghostElement.style.left = touch.clientX - 25 + 'px';
    ghostElement.style.top = touch.clientY - 25 + 'px';
    document.body.appendChild(ghostElement);
    
    item.style.opacity = '0.4';
  }, { passive: false });

  item.addEventListener('touchmove', (e) => {
    if (!ghostElement) return;
    const touch = e.touches[0];
    ghostElement.style.left = touch.clientX - 25 + 'px';
    ghostElement.style.top = touch.clientY - 25 + 'px';
    e.preventDefault(); 
  }, { passive: false });

  item.addEventListener('touchend', (e) => {
    if (!ghostElement) return;
    const touch = e.changedTouches[0];
    
    dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      if (
        touch.clientX >= rect.left && touch.clientX <= rect.right &&
        touch.clientY >= rect.top && touch.clientY <= rect.bottom
      ) {
        handlePlacement(zone, touchType, touchSourceId);
      }
    });

    ghostElement.remove();
    ghostElement = null;
    item.style.opacity = '1';
  });
});

// 5. Update Status Sirkuit
function updateCircuitStatus() {
  const isComplete = state.v2 && state.r2;
  
  if (isComplete) {
    statusDot.style.background = '#4CAF50';
    statusText.textContent = 'Sirkuit Siap!';
    statusText.style.color = '#2E7D32';
    circuitStatusIndicator.style.background = '#E8F5E9';
    statusDot.style.animation = 'none';
  } else {
    statusDot.style.background = '#F44336';
    statusText.textContent = 'Sirkuit Tidak Lengkap';
    statusText.style.color = '#D32F2F';
    circuitStatusIndicator.style.background = '#FFEBEE';
    statusDot.style.animation = 'pulse 2s infinite';
  }
  
  // Status individual
  const statusV2 = document.getElementById('status-v2');
  const statusR2 = document.getElementById('status-r2');
  
  if(statusV2) statusV2.className = state.v2 ? 'status-indicator active' : 'status-indicator';
  if(statusR2) statusR2.className = state.r2 ? 'status-indicator active' : 'status-indicator';
  if(statusV2) statusV2.textContent = state.v2 ? '✓ Terpasang' : '❌ Belum';
  if(statusR2) statusR2.textContent = state.r2 ? '✓ Terpasang' : '❌ Belum';
}

// 6. Logika Perhitungan (Mesh Analysis)
function calculateAndDisplay() {
  if (!state.v2 || !state.r2) return;

  const v1 = parseFloat(v1Input.value);
  const v2 = parseFloat(v2Input.value);
  const r1 = parseFloat(r1Input.value);
  const r2 = parseFloat(r2Input.value);
  const r3 = parseFloat(r3Input.value);
  
  if ([v1, v2, r1, r2, r3].some(val => isNaN(val) || val <= 0)) return;

  // Rumus Mesh Analysis (Hukum Kirchhoff 2 pada Loop)
  const det = (r1 + r3) * (r2 + r3) - r3 * r3;
  const i3 = (v1 * r2 + v2 * r1) / det;

  iDisplay.textContent = Math.abs(i3).toFixed(4);
}

// 7. Sinkronisasi Input & Slider
function setupInputSync(input, slider) {
  if (!input || !slider) return;
  input.addEventListener('input', function() {
    let val = parseFloat(this.value);
    if (val < this.min) this.value = this.min;
    if (val > this.max) this.value = this.max;
    slider.value = this.value;
    resetDisplay();
  });
  slider.addEventListener('input', function() {
    input.value = this.value;
    resetDisplay();
  });
}

function resetDisplay() {
  iDisplay.textContent = '0.000';
}

// Setup Sinkronisasi
setupInputSync(v1Input, v1Slider);
setupInputSync(v2Input, v2Slider);
setupInputSync(r1Input, r1Slider);
setupInputSync(r2Input, r2Slider);
setupInputSync(r3Input, r3Slider);

btnGenerate.addEventListener('click', calculateAndDisplay);

document.addEventListener('DOMContentLoaded', () => {
  resetDisplay();
  updateCircuitStatus();
});