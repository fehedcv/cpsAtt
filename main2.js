// Student data store
let students = {
    1: "ADITHYA PRAVEEN  P",
    2: "ABHIJITH  C",
    3: "ABHIN DAS  M",
    4: "AKIL FAHAD  P",
    5: "ALPHIN MARTIN  C",
    6: "AMAL KRISHNA  T",
    7: "AMNA  PARAMBAT",
    8: "ANAND  C K",
    9: "ANUSH  K K",
    10: "ARIF KHAN  C K",
    11: "ARJUN KRISHNA  C",
    12: "ASHIAH  JINAN  T P",
    13: "ASWIN RAJ  C",
    14: "ATHUL  S",
    15: "ATHUL KRISHNAN  K",
    16: "BIJEESH  K C",
    17: "DHANANJAY  M",
    18: "FAHMIDA  P K",
    19: "FATHIMA MINSHA  P",
    20: "FATHIMA SHAMLA  K P",
    21: "HUMAID MOHAMED  C N",
    22: "IRFAN JAFFAR",
    23: "JASEENA  M",
    24: "JINU BASITH  A",
    25: "MIFZAL  K",
    26: "MISAL  P",
    27: "MITHUL  K",
    28: "MOHAMED SIYAN  C P",
    29: "MOHAMMAD NAHAL  P",
    30: "MOHAMMED AL SABITH",
    31: "MOHAMMED FAYIZ  N V",
    32: "MOHAMMED SABEEH  P P",
    33: "MOHAMMED SINAN",
    34: "MUHAMED RADHIN  P K",
    35: "MUHAMED SHAHIL  K",
    36: "MUHAMMED AJMAL ROSHAN  K K",
    37: "MUHAMMED ANSHID  K",
    38: "MUHAMMED FADIZ  V",
    39: "MUHAMMED HISHAM  A",
    40: "MUHAMMED LABEEB  P K",
    41: "NAHAN  T P",
    42: "NEHA NASRIN  P",
    43: "RIZHAN MOHAMMED  M",
    44: "SABARINADH  K",
    45: "SAYANTH  O",
    46: "SHIBILI RAHMAN  K",
    47: "SNEHA  K P",
    48: "SREEHARI",
    49: "SREYAS  E T",
    50: "ABHAY  K M",
    51: "ARUN  P",
    52: "MUFEEDA MOIDEENKUTTY",
    53: "MUHAMMED ZAKIY  K",
    54: "SUHAIB MALIK  T",
    55: "ABDUL AHAD",
    56: "AKSHAY  P",
    57: "ASNA SHERIN  M T",
    58: "AZMEEL MURADH  P",
    59: "FADWA  K",
    60: "FARHANA RAMLA  N",
    61: "JUNAID  M",
    62: "MOHAMMED SHEFIN  M K",
    63: "MUHAMMAD JASIL  C V",
    64: "PRARTH  P",
    65: "SAMEERA BEEVI  A",
    66: "FATHIMA MUZAINA",
    67: "RAHDIL AMAN"
};

document.getElementById("dict-select").addEventListener("change", function () {
  if (this.value === "cps3") {
    window.location.href = "index.html";
  }
});

// Application state
let absentees = [];
let currentTab = 'attendance';
let searchQuery = '';

// DOM elements
const rollInput = document.getElementById('roll-input');
const addBtn = document.getElementById('add-btn');
const absenteesList = document.getElementById('absentees-list');
const sendBtn = document.getElementById('send-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const newRollInput = document.getElementById('new-roll');
const newNameInput = document.getElementById('new-name');
const addStudentBtn = document.getElementById('add-student-btn');
const searchInput = document.getElementById('search-input');
const studentsList = document.getElementById('students-list');

// Utility functions
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

function formatRollNumber(num) {
  return num <= 9 ? `0${num}` : `${num}`;
}

function updateStats() {
  const uniqueAbsentees = [...new Set(absentees)];
  const totalStudents = Object.keys(students).length;
  const presentCount = totalStudents - uniqueAbsentees.length;
  
  document.getElementById('absentees-count').textContent = uniqueAbsentees.length;
  document.getElementById('total-students').textContent = totalStudents;
  document.getElementById('present-count').textContent = presentCount;
  document.getElementById('students-count').textContent = `All Students (${totalStudents})`;
}

function renderAbsentees() {
  const uniqueAbsentees = [...new Set(absentees)].sort((a, b) => a - b);
  
  if (uniqueAbsentees.length === 0) {
    absenteesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-text">No absentees marked</div>
        <div class="empty-subtext">Add roll numbers to track attendance</div>
      </div>
    `;
    clearAllBtn.style.display = 'none';
    sendBtn.classList.add('disabled');
  } else {
    absenteesList.innerHTML = uniqueAbsentees.map(rollNum => `
      <div class="absentee-card">
        <div class="absentee-info">
          <div class="roll-number">${formatRollNumber(rollNum)}</div>
          <div class="student-name">${students[rollNum] || "Unknown"}</div>
        </div>
        <button class="remove-btn" onclick="removeAbsentee(${rollNum})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');
    clearAllBtn.style.display = 'block';
    sendBtn.classList.remove('disabled');
  }
  
  updateStats();
}

function renderStudents() {
  const filteredStudents = Object.entries(students).filter(([rollNum, name]) => {
    const searchLower = searchQuery.toLowerCase();
    return rollNum.includes(searchQuery) || name.toLowerCase().includes(searchLower);
  });
  
  const sortedStudents = filteredStudents.sort(([a], [b]) => parseInt(a) - parseInt(b));
  
  if (sortedStudents.length === 0) {
    const emptyText = searchQuery ? 'No students found' : 'No students added yet';
    const emptySubtext = searchQuery ? 'Try a different search term' : 'Add students to get started';
    
    studentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-text">${emptyText}</div>
        <div class="empty-subtext">${emptySubtext}</div>
      </div>
    `;
  } else {
    studentsList.innerHTML = sortedStudents.map(([rollNum, name]) => `
      <div class="student-card">
        <div class="student-info">
          <div class="roll-number">${formatRollNumber(parseInt(rollNum))}</div>
          <div class="student-name">${name}</div>
        </div>
        <button class="remove-btn" onclick="removeStudent(${rollNum}, '${name}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </button>
      </div>
    `).join('');
  }
  
  updateStats();
}

// Attendance functions
function addRoll() {
  const num = parseInt(rollInput.value.trim());
  
  if (isNaN(num)) {
    showNotification('Please enter a valid roll number', 'error');
    return;
  }
  
  if (!students[num]) {
    showNotification('Roll number not found in student list', 'error');
    return;
  }
  
  if (absentees.includes(num)) {
    showNotification('Student already marked as absent', 'error');
    return;
  }
  
  absentees.push(num);
  rollInput.value = '';
  renderAbsentees();
  showNotification(`${students[num]} marked as absent`);
}

function removeAbsentee(rollNum) {
  absentees = absentees.filter(num => num !== rollNum);
  renderAbsentees();
  showNotification(`${students[rollNum]} removed from absentees`);
}

function clearAllAbsentees() {
  if (confirm('Are you sure you want to clear all absentees?')) {
    absentees = [];
    renderAbsentees();
    showNotification('All absentees cleared');
  }
}
let time = "";

const afternoonRadio = document.getElementById("afternoon");
const forenoonRadio = document.getElementById("forenoon");

afternoonRadio.addEventListener("change", function () {
  if (this.checked) {
    time = this.value;
    console.log("Selected:", time);
  }
});

forenoonRadio.addEventListener("change", function () {
  if (this.checked) {
    time = this.value;
    console.log("Selected:", time);
  }
});
function generateMessage() {
  if (absentees.length === 0) {
    showNotification('Please add some absentees first', 'error');
    return;
  }
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const dayStr = now.toLocaleDateString('en-GB', { weekday: 'long' });
  
  let message = `ABSENTEES CPS3 ${dateStr}\n${dayStr}\n------------------------------------\n\n*${time}*\n`;
  
  const unique = [...new Set(absentees)];
  unique.sort((a, b) => a - b);
  
  unique.forEach(num => {
    const name = students[num];
    if (name) {
      message += `${formatRollNumber(num)} : ${name}\n`;
    }
  });
  
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}

// Student management functions
function addStudent() {
  const rollNum = parseInt(newRollInput.value.trim());
  const name = newNameInput.value.trim();
  
  if (!name) {
    showNotification('Please enter a student name', 'error');
    return;
  }
  
  if (isNaN(rollNum) || rollNum <= 0) {
    showNotification('Please enter a valid roll number', 'error');
    return;
  }
  
  if (students[rollNum]) {
    showNotification('Roll number already exists', 'error');
    return;
  }
  
  students[rollNum] = name;
  newRollInput.value = '';
  newNameInput.value = '';
  renderStudents();
  showNotification('Student added successfully');
}

function removeStudent(rollNum, name) {
  if (confirm(`Are you sure you want to remove ${name} (Roll: ${rollNum})?`)) {
    delete students[rollNum];
    // Also remove from absentees if present
    absentees = absentees.filter(num => num !== rollNum);
    renderStudents();
    renderAbsentees();
    showNotification('Student removed successfully');
  }
}

// Tab switching
function switchTab(tabName) {
  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  currentTab = tabName;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Attendance tab events
  addBtn.addEventListener('click', addRoll);
  rollInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addRoll();
  });
  
  sendBtn.addEventListener('click', () => {
    if (!sendBtn.classList.contains('disabled')) {
      generateMessage();
    }
  });
  
  clearAllBtn.addEventListener('click', clearAllAbsentees);
  
  // Manage students tab events
  addStudentBtn.addEventListener('click', addStudent);
  newRollInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') newNameInput.focus();
  });
  newNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addStudent();
  });
  
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderStudents();
  });
  
  // Initial render
  renderAbsentees();
  renderStudents();
});

// Global functions for onclick handlers
window.removeAbsentee = removeAbsentee;
window.removeStudent = removeStudent;
