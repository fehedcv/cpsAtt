import { db, auth, adminLogin, adminLogout, onAuth } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// DOM references
const loginBtn = document.getElementById("admin-login-btn");
const logoutBtn = document.getElementById("admin-logout-btn");
const attendanceTab = document.getElementById("attendance-tab");
const manageTab = document.getElementById("manage-tab");
const rollInputEl = document.getElementById("roll-input");
const addBtnEl = document.getElementById("add-btn");
const dateInputEl = document.getElementById("attendance-date");

// Hide panel until login
attendanceTab.style.display = "none";
manageTab.style.display = "none";

loginBtn.onclick = adminLogin;
logoutBtn.onclick = adminLogout;

let students = {};
let absentees = [];
let selectedTime = "";
let hourSelections = {}; 

// Set default date to today
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
dateInputEl.value = `${yyyy}-${mm}-${dd}`;

// Authentication state handling
onAuth(user => {
  if (!user) {
    showLogin();
    return;
  }

  const allowedAdmins = [
    "fahadsheza0@gmail.com",
    "rafipoly@gmail.com",
    "teacher@school.com",
    "amna207rasvin@gmail.com",
  ];

  if (!allowedAdmins.includes(user.email)) {
    alert("You are NOT allowed to access this admin panel.");
    adminLogout();
    window.location.href = "/";
    return;
  }

  showAdminPanel();
});

// Load students from Firestore (studentscps2 collection)
async function loadStudents() {
  students = {};
  const snap = await getDocs(collection(db, "studentscps2"));
  snap.forEach(doc => {
    students[doc.id] = doc.data().name;
  });

  renderStudents();
  updateStats();
}
window.loadStudents = loadStudents;

// Add roll number validation and marking as absent
const addBtn = document.getElementById("add-btn");
addBtn.addEventListener("click", (e) => {
  e.preventDefault();
  addRoll();
});

rollInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addRoll();
  }
});

function addRoll() {
  const raw = rollInputEl.value;

  if (!raw && raw !== 0) {
    alert("Please enter a roll number");
    rollInputEl.focus();
    return;
  }

  const val = parseInt(String(raw).trim(), 10);

  if (isNaN(val)) {
    alert("Please enter a valid roll number");
    rollInputEl.value = "";
    rollInputEl.focus();
    return;
  }

  if (!students[String(val)]) {
    alert("Roll not found");
    rollInputEl.value = "";
    rollInputEl.focus();
    return;
  }

  // Add if new
  if (!absentees.includes(val)) {
    absentees.push(val);
  }

  // Auto-select hours ONLY when FN/AN already chosen
  if (selectedTime) {
    hourSelections[val] =
      selectedTime === "FORENOON" ? [1, 2, 3] : [4, 5, 6];
  }

  renderAbsentees();
  alert(`${students[String(val)]} marked as absent`);

  rollInputEl.value = "";
  rollInputEl.focus();
}

// Remove absentee
window.removeAbsentee = function (roll) {
  absentees = absentees.filter(x => x !== roll);
  delete hourSelections[roll];
  renderAbsentees();
};

// Time selection handlers
document.getElementById("afternoon").onchange = () => {
  selectedTime = "AFTERNOON";
  renderAbsentees();
};
document.getElementById("forenoon").onchange = () => {
  selectedTime = "FORENOON";
  renderAbsentees();
};

// Hour button click handler
function enableHourSelectors() {
  document.querySelectorAll(".hour-btn").forEach(btn => {
    btn.onclick = () => {
      const roll = btn.dataset.roll;
      const hour = parseInt(btn.dataset.hour);

      if (!hourSelections[roll]) hourSelections[roll] = [];

      if (hourSelections[roll].includes(hour)) {
        hourSelections[roll] = hourSelections[roll].filter(h => h !== hour);
        btn.classList.remove("active");
      } else {
        hourSelections[roll].push(hour);
        btn.classList.add("active");
      }
    };
  });
}

// Render absentees with hour buttons
function renderAbsentees() {
  const container = document.getElementById("absentees-list");
  container.innerHTML = "";

  if (absentees.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>All present so far!</p>
        <span>Add roll numbers to mark absentees</span>
      </div>`;
    return;
  }

  if (!selectedTime) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Rolls added. Now select Forenoon or Afternoon.</p>
      </div>`;
    return;
  }

  const hours = selectedTime === "FORENOON" ? [1,2,3] : [4,5,6];

  absentees.sort((a, b) => a - b).forEach(roll => {
    const div = document.createElement("div");
    div.className = "absentee-card";

    let hourButtons = hours.map(h =>
      `<button class="hour-btn ${hourSelections[roll]?.includes(h) ? "active" : ""}" 
               data-roll="${roll}" data-hour="${h}">
          H${h}
       </button>`
    ).join("");

    div.innerHTML = `
      <div class="absentee-info">
        <div class="roll-number">${roll}</div>
        <div class="student-name">${students[roll]}</div>
      </div>
      <div class="hour-row">${hourButtons}</div>
      <button onclick="removeAbsentee(${roll})" class="remove-btn">X</button>
    `;

    container.appendChild(div);
  });

  enableHourSelectors();
  updateStats();
}

// Save and send WhatsApp
async function saveAndSendWhatsApp() {
  // Validation
  if (!selectedTime) return alert("Select Forenoon or Afternoon first");
  if (absentees.length === 0) return alert("No absentees to send");

  const rawDate = dateInputEl.value; 
  if (!rawDate) return alert("Please select a date");

  const [year, month, day] = rawDate.split("-");
  const formattedDate = `${day}-${month}-${year}`;

  const dateObj = new Date(rawDate);
  const dayStr = dateObj.toLocaleDateString("en-GB", { weekday: "long" });

  // Database saving for CPS2
  const attendanceCollectionName = `attendance_studentscps2`;
  const ref = doc(db, attendanceCollectionName, rawDate);
  let record = { hours: {1:[],2:[],3:[],4:[],5:[],6:[]} };

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) record = snap.data();

    // Update DB record based on selections
    Object.keys(hourSelections).forEach(roll => {
      hourSelections[roll].forEach(h => {
        if (!record.hours[h].includes(parseInt(roll))) {
          record.hours[h].push(parseInt(roll));
        }
      });
    });

    await setDoc(ref, record);
  } catch (error) {
    console.error("Error saving to DB:", error);
    alert("Error saving data, but generating WhatsApp message...");
  }

  // WhatsApp message construction
  let msg = `*CPS 2 Attendance*\n`;
  msg += `${formattedDate} \n${dayStr}\n`;
  msg += `${selectedTime}\n`; 
  msg += `-----------------------\n`;

  // Sort absentees numerically
  absentees.sort((a, b) => a - b).forEach(roll => {
    msg += `${roll} - ${students[roll]}\n`;
  });

  // Open WhatsApp
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

document.getElementById("send-btn").onclick = saveAndSendWhatsApp;

// Render students
function renderStudents() {
  const container = document.getElementById("students-list");
  container.innerHTML = "";

  Object.entries(students)
    .sort(([a],[b]) => a - b)
    .forEach(([roll, name]) => {
      const div = document.createElement("div");
      div.className = "student-card";
      div.innerHTML = `
        <div class="student-info">
          <div class="roll-number">${roll}</div>
          <div class="student-name">${name}</div>
        </div>
      `;
      container.appendChild(div);
    });

  document.getElementById("students-count").textContent =
    `All Students (${Object.keys(students).length})`;
}

// Update statistics
function updateStats() {
  document.getElementById("absentees-count").textContent = absentees.length;
  document.getElementById("total-students").textContent = Object.keys(students).length;
  document.getElementById("present-count").textContent =
    Object.keys(students).length - absentees.length;
}

// UI visibility functions
function showLogin() {
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  attendanceTab.style.display = "none";
  manageTab.style.display = "none";
}

function showAdminPanel() {
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  attendanceTab.style.display = "block";
  manageTab.style.display = "block";
  loadStudents();
}
