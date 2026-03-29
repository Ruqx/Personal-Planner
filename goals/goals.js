const goalBoard = document.getElementById("goalBoard");
const addGoalBtn = document.getElementById("addGoalBtn");

let goals = [];

const savedGoals = localStorage.getItem("goals");
goals = savedGoals ? JSON.parse(savedGoals) : [];

// ==========================================================
// NEW: Define Pin Options
// ==========================================================
const PINS = [
    { id: 'pin-default', name: 'Bear', url: 'pins/bear.png' },
    { id: 'pin-star',    name: 'Bow',  url: 'pins/bow.png' },
    { id: 'pin-heart',   name: 'Flower', url: 'pins/flower.png' }
    // Add more pins here!
];

// ==========================================================
// NEW: Create the Pin Selector Pop-up
// ==========================================================
let pinSelector; // To hold the pop-up element

function createPinSelector() {
    pinSelector = document.createElement('div');
    pinSelector.className = 'pin-selector';

    PINS.forEach(pin => {
        const option = document.createElement('div');
        option.className = 'pin-option';
        option.style.backgroundImage = `url('${pin.url}')`;
        option.dataset.pinClass = pin.id; // e.g., 'pin-default'
        option.title = pin.name;
        pinSelector.appendChild(option);
    });

    document.body.appendChild(pinSelector);

    // Add event listener to handle clicks on the options
    pinSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('pin-option')) {
            const targetNote = pinSelector.currentTargetNote;
            if (targetNote) {
                const newPinClass = e.target.dataset.pinClass;
                
                // Remove any old pin-* class
                targetNote.classList.forEach(className => {
                    if (className.startsWith('pin-')) {
                        targetNote.classList.remove(className);
                    }
                });

                // Add the new class and save
                targetNote.classList.add(newPinClass);
                saveGoal(targetNote);
            }
            // Hide the selector
            pinSelector.style.display = 'none';
        }
    });
}

// NEW: Hide the selector if the user clicks elsewhere
window.addEventListener('click', (e) => {
    if (pinSelector && !pinSelector.contains(e.target) && !e.target.classList.contains('change-pin-btn')) {
        pinSelector.style.display = 'none';
    }
});


// ==========================================================
// Smart Position Finding Logic (No changes here)
// ==========================================================
function findNextAvailablePosition() {
    const NOTE_WIDTH = 250, NOTE_HEIGHT = 180, MARGIN = 20, START_X = 40, START_Y = 40;
    const boardRect = goalBoard.getBoundingClientRect();
    const existingNotes = goalBoard.querySelectorAll('.goal-note');

    for (let y = START_Y; y + NOTE_HEIGHT <= boardRect.height; y += NOTE_HEIGHT + MARGIN) {
        for (let x = START_X; x + NOTE_WIDTH <= boardRect.width; x += NOTE_WIDTH + MARGIN) {
            let isOccupied = false;
            for (const noteElement of existingNotes) {
                const noteRect = noteElement.getBoundingClientRect();
                const existingLeft = noteRect.left - boardRect.left, existingTop = noteRect.top - boardRect.top;
                const existingWidth = noteRect.width, existingHeight = noteRect.height;
                if (x < existingLeft + existingWidth && x + NOTE_WIDTH > existingLeft && y < existingTop + existingHeight && y + NOTE_HEIGHT > existingTop) {
                    isOccupied = true;
                    break;
                }
            }
            if (!isOccupied) return { top: `${y}px`, left: `${x}px` };
        }
    }
    return { top: `${START_Y}px`, left: `${START_X}px` };
}

// ===== Render All Goals =====
function renderGoals() {
  goalBoard.innerHTML = "";
  goals.forEach(goal => {
    createGoalElement(goal);
  });
}

// ===== Create Goal Note Element =====
function createGoalElement(goal) {
  const note = document.createElement("div");
  note.className = `goal-note ${goal.pin || 'pin-default'} ${goal.completed ? 'completed' : ''}`;
  note.style.top = goal.top || "40px";
  note.style.left = goal.left || "40px";
  note.style.width = goal.width || "250px";
  note.style.height = goal.height || "180px";
  note.dataset.id = goal.id;

  // MODIFIED: Added a change-pin-btn
  note.innerHTML = `
    <div class="note-header">
      <input type="checkbox" class="is-complete" title="Mark as complete" ${goal.completed ? 'checked' : ''}>
      <input type="text" class="title" placeholder="Goal Title" value="${goal.title || ""}">
      <button class="change-pin-btn" title="Change Pin">📌</button> 
      <button class="delete-btn" title="Delete goal">❌</button>
    </div>
    <textarea class="description" placeholder="Goal Description...">${goal.description || ""}</textarea>
    <input type="date" value="${goal.date || ""}">
    <div class="resizer"></div>
  `;

  goalBoard.appendChild(note);

  makeDraggable(note);
  makeResizable(note);

  const titleInput = note.querySelector(".title");
  const descInput = note.querySelector(".description");
  const dateInput = note.querySelector('input[type="date"]');
  const deleteBtn = note.querySelector(".delete-btn");
  const completeCheck = note.querySelector(".is-complete");
  const changePinBtn = note.querySelector('.change-pin-btn'); // NEW

  titleInput.addEventListener("input", () => saveGoal(note));
  descInput.addEventListener("input", () => saveGoal(note));
  dateInput.addEventListener("change", () => saveGoal(note));
  deleteBtn.addEventListener("click", () => deleteGoal(note));
  completeCheck.addEventListener("change", () => {
    note.classList.toggle('completed', completeCheck.checked);
    saveGoal(note);
  });

  // NEW: Event listener for the change pin button
  changePinBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevents window click listener from firing immediately
      const noteRect = note.getBoundingClientRect();
      pinSelector.style.display = 'flex';
      pinSelector.style.top = `${noteRect.top - 50}px`; // Position above the note
      pinSelector.style.left = `${noteRect.left}px`;
      pinSelector.currentTargetNote = note; // Tell the selector which note we're editing
  });
}

// ===== Add New Goal =====
addGoalBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const position = findNextAvailablePosition();
  const newGoal = {
    id: Date.now(), title: "", description: "", date: "",
    top: position.top, left: position.left,
    width: "250px", height: "180px",
    completed: false, pin: 'pin-default'
  };
  goals.push(newGoal);
  saveAllGoals();
  createGoalElement(newGoal);
});

// ===== Save Single Goal =====
function saveGoal(note) {
  const id = Number(note.dataset.id);
  const goal = goals.find(g => g.id === id);
  if (!goal) return;

  goal.title = note.querySelector(".title").value;
  goal.description = note.querySelector(".description").value;
  goal.date = note.querySelector('input[type="date"]').value;
  goal.top = note.style.top;
  goal.left = note.style.left;
  goal.width = note.style.width;
  goal.height = note.style.height;
  goal.completed = note.querySelector(".is-complete").checked;
  // MODIFIED: Find and save the current pin class
  const pinClass = Array.from(note.classList).find(c => c.startsWith('pin-'));
  goal.pin = pinClass || 'pin-default';
  
  saveAllGoals();
}

// ===== Delete Single Goal =====
function deleteGoal(note) {
  const id = Number(note.dataset.id);
  goals = goals.filter(g => g.id !== id);
  saveAllGoals();
  note.remove();
}

// ===== Save All Goals =====
function saveAllGoals() {
  localStorage.setItem("goals", JSON.stringify(goals));
}

// ===== Dragging & Resizing =====
function makeDraggable(note) {
    let isDragging = false, offsetX, offsetY;
    note.addEventListener("mousedown", (e) => {
        const isInteractive = e.target.matches('input, textarea, button, .resizer, .change-pin-btn');
        if (isInteractive) return;
        isDragging = true;
        offsetX = e.clientX - note.offsetLeft;
        offsetY = e.clientY - note.offsetTop;
        note.style.cursor = "grabbing";
        document.body.style.userSelect = 'none';
    });
    window.addEventListener("mousemove", (e) => {
        if (isDragging) {
            note.style.left = `${e.clientX - offsetX}px`;
            note.style.top = `${e.clientY - offsetY}px`;
        }
    });
    window.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            note.style.cursor = "grab";
            document.body.style.userSelect = '';
            saveGoal(note);
        }
    });
}

function makeResizable(note) {
    const resizer = note.querySelector(".resizer");
    let isResizing = false, startX, startY, startW, startH;
    resizer.addEventListener("mousedown", (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startW = note.offsetWidth;
        startH = note.offsetHeight;
        e.preventDefault();
        document.body.style.userSelect = 'none';
    });
    window.addEventListener("mousemove", (e) => {
        if (isResizing) {
            const newW = startW + (e.clientX - startX);
            const newH = startH + (e.clientY - startY);
            note.style.width = `${Math.max(200, newW)}px`;
            note.style.height = `${Math.max(180, newH)}px`;
        }
    });
    window.addEventListener("mouseup", () => {
        if(isResizing) {
            isResizing = false;
            document.body.style.userSelect = '';
            saveGoal(note);
        }
    });
}

// ===== Side Panel Toggle =====
const sidePanel = document.getElementById("sidePanel");
const toggleBtn = document.getElementById("toggleBtn");

if (sidePanel && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const opening = !sidePanel.classList.contains("open");
        sidePanel.classList.toggle("open", opening);
        document.body.classList.toggle("side-panel-open", opening);
        toggleBtn.setAttribute("aria-expanded", String(opening));
        toggleBtn.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
    });
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidePanel.classList.contains("open")) {
            sidePanel.classList.remove("open");
            document.body.classList.remove("side-panel-open");
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleBtn.setAttribute("aria-label", "Open menu");
        }
    });
}

// ===== Initial Render & Setup =====
renderGoals();
createPinSelector(); // NEW: Create the pop-up when the app starts