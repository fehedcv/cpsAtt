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
const dateInputEl = document.getElementById("attendance-date"); // NEW REF

// Hide panel until login
attendanceTab.style.display = "none";
manageTab.style.display = "none";

loginBtn.onclick = adminLogin;
logoutBtn.onclick = adminLogout;

let students = {};
let absentees = [];
let selectedTime = "";
let hourSelections = {}; 
// Example: { "7": [1,2], "12":[4] }
let selectedClass = "students"; // Track current class


// ------------------------------------
// SET DEFAULT DATE TO TODAY (NEW)
// ------------------------------------
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
dateInputEl.value = `${yyyy}-${mm}-${dd}`; // Sets input value


// ------------------------------------
// CLASS SELECTION HANDLER
// ------------------------------------
const dictSelect = document.getElementById("dict-select");
dictSelect.addEventListener("change", (e) => {
  selectedClass = e.target.value;
  absentees = []; // Reset absentees when changing class
  hourSelections = {};
  renderAbsentees();
  loadStudents();
});


// ------------------------------------
// AUTH STATE HANDLING
// ------------------------------------
onAuth(user => {
  if (!user) {
    showLogin();
    return;
  }

  const allowedAdmins = [
    "fahadsheza0@gmail.com",
    "rafi.poly@gmail.com",
    "teacher@school.com",
    "amna207rasvin@gmail.com",
    "irfanasherin2025@gmail.com",
    "ajumusthafa1779@gmail.com",
  ];

  if (!allowedAdmins.includes(user.email)) {
    alert("You are NOT allowed to access this admin panel.");
    adminLogout();
    // redirect to student page
    window.location.href = "/";
    return;
  }

  showAdminPanel();
});


// ------------------------------------
// LOAD STUDENTS FROM FIRESTORE
// ------------------------------------
async function loadStudents() {
  students = {};
  const snap = await getDocs(collection(db, selectedClass));
  snap.forEach(doc => {
    students[doc.id] = doc.data().name;
  });

  renderStudents();
  updateStats();
}
window.loadStudents = loadStudents;

// ------------------------------------
// ADD STUDENT
// ------------------------------------
const addStudentBtn = document.getElementById("add-student-btn");
addStudentBtn.onclick = async () => {
  const roll = document.getElementById("new-roll").value.trim();
  const name = document.getElementById("new-name").value.trim();

  if (!roll || !name) {
    alert("Enter roll + name");
    return;
  }

  await setDoc(doc(db, "students", roll), {
    roll: parseInt(roll),
    name: name
  });

  await loadStudents();
  alert("Student added");
};

// ------------------------------------
// REMOVE STUDENT
// ------------------------------------
window.removeStudent = async function (roll) {
  if (!confirm("Delete student?")) return;

  await deleteDoc(doc(db, "students", roll));
  await loadStudents();
};


// --- ENABLE ADD BUTTON & ENTER KEY ---
addBtnEl.addEventListener("click", (e) => {
  e.preventDefault();
  addRoll();
});

rollInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addRoll();
  }
});


// --- FUNCTION TO ADD ROLL ---
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



// ------------------------------------
// REMOVE ABSENTEE
// ------------------------------------
window.removeAbsentee = function (roll) {
  absentees = absentees.filter(x => x !== roll);
  delete hourSelections[roll];
  renderAbsentees();
};

// ------------------------------------
// SELECT TIME
// ------------------------------------
document.getElementById("afternoon").onchange = () => {
  selectedTime = "AFTERNOON";
  renderAbsentees();
};
document.getElementById("forenoon").onchange = () => {
  selectedTime = "FORENOON";
  renderAbsentees();
};


// ------------------------------------
// HOUR BUTTON CLICK HANDLER
// ------------------------------------
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


// ------------------------------------
// RENDER ABSENTEES WITH HOUR BUTTONS
// ------------------------------------
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


// ------------------------------------
// SAVE + SEND WHATSAPP (UPDATED FORMAT)
// ------------------------------------
async function saveAndSendWhatsApp() {
  // 1. Validation
  if (!selectedTime) return alert("Select Forenoon or Afternoon first");
  if (absentees.length === 0) return alert("No absentees to send");

  // 2. Date Formatting
  const rawDate = dateInputEl.value; 
  if (!rawDate) return alert("Please select a date");

  const [year, month, day] = rawDate.split("-");
  const formattedDate = `${day}-${month}-${year}`; // DD-MM-YYYY

  const dateObj = new Date(rawDate);
  const dayStr = dateObj.toLocaleDateString("en-GB", { weekday: "long" }); // e.g., "Monday", "Tuesday"

  // 3. Database Saving (Keeps the detailed hours logic in the background)
  // Use class-specific attendance collection
  const attendanceCollectionName = `attendance_${selectedClass}`;
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

  // 4. WhatsApp Message Construction (New Format)
  // Logic: We use the existing 'selectedTime' variable (FORENOON/AFTERNOON)
  
  // Get class name from select element
  const classNameMap = {
    "students": "CPS 4",
    "cps5": "CPS 6",
    "studentscps2": "CPS 2"
  };
  const className = classNameMap[selectedClass] || "CPS";
  
  let msg = `*${className} Attendance*\n`;
  msg += `${formattedDate} \n${dayStr}\n`;
  msg += `${selectedTime}\n`; 
  msg += `-----------------------\n`;

  // Sort absentees numerically
  absentees.sort((a, b) => a - b).forEach(roll => {
    // Format: "12 - Name" (No hours included)
    msg += `${roll} - ${students[roll]}\n`;
  });

  // 5. Open WhatsApp
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

document.getElementById("send-btn").onclick = saveAndSendWhatsApp;

// ------------------------------------
// OTHER RENDER FUNCTIONS
// ------------------------------------
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
        <button onclick="removeStudent('${roll}')" class="remove-btn">X</button>
      `;
      container.appendChild(div);
    });

  document.getElementById("students-count").textContent =
    `All Students (${Object.keys(students).length})`;
}

function updateStats() {
  document.getElementById("absentees-count").textContent = absentees.length;
  document.getElementById("total-students").textContent = Object.keys(students).length;
  document.getElementById("present-count").textContent =
    Object.keys(students).length - absentees.length;
}


// ------------------------------------
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
