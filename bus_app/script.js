const readyCountEl = document.getElementById('readyCount');
const incrementBtn = document.getElementById('increment');
const decrementBtn = document.getElementById('decrement');
const statusMessage = document.getElementById('statusMessage');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminPanel = document.getElementById('adminPanel');
const thresholdInput = document.getElementById('thresholdInput');
const setThresholdBtn = document.getElementById('setThresholdBtn');
const resetBtn = document.getElementById('resetBtn');
const lockToggle = document.getElementById('lockToggle');

let THRESHOLD = 5;
let readyCount = 0;
let locked = false;
let updating = false;
let isAdmin = false;

function updateUI() {
  readyCountEl.textContent = readyCount;
  decrementBtn.disabled = updating || readyCount === 0 || locked;
  incrementBtn.disabled = updating || readyCount === THRESHOLD || locked;

  if (readyCount >= THRESHOLD) {
    statusMessage.textContent = 'The bus will depart! 🚌✨';
    statusMessage.classList.add('depart');
  } else if (locked) {
    statusMessage.textContent = 'Counter is locked by admin.';
    statusMessage.classList.remove('depart');
  } else {
    statusMessage.textContent = '';
    statusMessage.classList.remove('depart');
  }

  // Admin panel controls
  if (isAdmin) {
    thresholdInput.value = THRESHOLD;
    lockToggle.checked = locked;
  }
}

// Listen for changes in the database
firebase.database().ref('readyCount').on('value', (snapshot) => {
  const val = snapshot.val();
  readyCount = typeof val === 'number' ? val : 0;
  updating = false;
  updateUI();
});
firebase.database().ref('threshold').on('value', (snapshot) => {
  const val = snapshot.val();
  THRESHOLD = typeof val === 'number' ? val : 5;
  updateUI();
});
firebase.database().ref('locked').on('value', (snapshot) => {
  const val = snapshot.val();
  locked = !!val;
  updateUI();
});

incrementBtn.addEventListener('click', () => {
  if (readyCount < THRESHOLD && !updating && !locked) {
    updating = true;
    updateUI();
    firebase.database().ref('readyCount').transaction(current => {
      return (typeof current === 'number' ? current : 0) + 1;
    });
  }
});

decrementBtn.addEventListener('click', () => {
  if (readyCount > 0 && !updating && !locked) {
    updating = true;
    updateUI();
    firebase.database().ref('readyCount').transaction(current => {
      return (typeof current === 'number' && current > 0) ? current - 1 : 0;
    });
  }
});

// Admin login logic
adminLoginBtn.addEventListener('click', () => {
  const pw = prompt('Enter admin password:');
  if (pw === 'admin123') {
    isAdmin = true;
    adminPanel.style.display = 'block';
    adminLoginBtn.style.display = 'none';
    updateUI();
  } else if (pw !== null) {
    alert('Incorrect password.');
  }
});

// Set threshold
setThresholdBtn.addEventListener('click', () => {
  const val = parseInt(thresholdInput.value, 10);
  if (!isNaN(val) && val > 0) {
    firebase.database().ref('threshold').set(val);
    // Optionally reset counter if new threshold is lower than current count
    if (readyCount > val) {
      firebase.database().ref('readyCount').set(0);
    }
  }
});

// Reset counter
resetBtn.addEventListener('click', () => {
  firebase.database().ref('readyCount').set(0);
});

// Lock/unlock counter
lockToggle.addEventListener('change', () => {
  firebase.database().ref('locked').set(lockToggle.checked);
});

// Initial UI
updateUI(); 