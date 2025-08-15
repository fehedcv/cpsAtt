// Student data store
let students = {
  1: "Aadhinath", 2: "Abhimanyu", 3: "Abhinav Krishna", 4: "Abhishek KB", 5: "Abhinav A",
  6: "Adhil Chandra", 7: "Adityanarayanan", 8: "Akshay", 9: "Aleena Fathima", 10: "Aman",
  11: "Anandhakrishnan", 12: "Anaswara", 13: "Anusree", 14: "Asif Kamal", 15: "Aswin Das",
  16: "Athul Krishna", 17: "Danish Ahmed", 18: "Dilshad OK", 19: "Fahad Mohammed Kabeer", 21: "Fathima Minha", 22: "Fathima Thehsina", 23: "Fidha P",
  24: "Gopika KT", 25: "Hari", 27: "Hiba A", 28: "Hikka", 29: "Krishnapriya", 30: "Lamisha",
  31: "Mohammed Abile", 33: "Mruduldev", 34: "Diyan", 35: "Anas", 36: "Hisham", 37: "Hisham AK",
  39: "Shahad", 40: "Shinadh", 41: "Swalih", 43: "Nurul Ameen", 44: "Praveen MT", 45: "Ridhwan",
  46: "Rilwan", 47: "Rinsha", 48: "Risham", 49: "Shifana", 50: "Shimna", 51: "Sudeep", 52: "Suhair",
  53: "Thazmeen", 54: "Vishnu", 55: "Vivek", 56: "Jumana Janiya", 57: "Anfas Roshan", 58: "Prarthana",
  59: "Deva Manas", 60: "Fidha C", 64: "Amna Rasvin", 65: "Hisham M", 66: "Fathima Majidha",
  67: "Hashir Mohammed",68: "Sakeeb Arsalan", 72: "Hamad", 73: "Advaith", 75: "Sarang"
};

document.getElementById("dict-select").addEventListener("change", function () {
  if (this.value === "cps5") {
    window.location.href = "index2.html";
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
