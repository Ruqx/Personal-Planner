// script.js (full)
// -----------------
const canvas = document.getElementById("clockCanvas");
const ctx = canvas.getContext("2d");

let cx = 0,
  cy = 0,
  SCALE = 1; // updated on resize

// ===== Data =====
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dates = Array.from({
  length: 31
}, (_, i) => (i + 1).toString());
const hours = Array.from({
  length: 24
}, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({
  length: 60
}, (_, i) => i.toString().padStart(2, '0'));
const seconds = minutes;
const years = Array.from({
  length: 21
}, (_, i) => (2020 + i).toString());

const rings = [{
  data: days,
  radius: 80,
  font: "18px monospace",
  ringPadding: 50
}, {
  data: months,
  radius: 150,
  font: "16px monospace",
  ringPadding: 20
}, {
  data: dates,
  radius: 190,
  font: "16px monospace",
  ringPadding: 16
}, {
  data: hours,
  radius: 225,
  font: "14px monospace",
  ringPadding: 16
}, {
  data: minutes,
  radius: 260,
  font: "14px monospace",
  ringPadding: 16
}, {
  data: seconds,
  radius: 295,
  font: "12px monospace",
  ringPadding: 16
}, {
  data: years,
  radius: 338,
  font: "14px monospace",
  ringPadding: 18
}, ];

// compute the "design" max outer radius once (radius + its ringPadding)
const DESIGN_MAX_OUTER = Math.max(...rings.map(r => r.radius + r.ringPadding));

// ===== Colors (brown + pink pastel) =====
const COLOR_RING = "rgba(244, 166, 184, 0.3)"; // pastel pink outlines
const COLOR_ACTIVE_BOX = "#F4A6B8"; // dusty pastel pink
const COLOR_ACTIVE_TEXT = "#4B2E2E"; // rich chocolate brown
const COLOR_INACTIVE_TEXT = "rgba(75, 46, 46, 0.4)"; // soft brown
const COLOR_GLOW = "rgba(244, 166, 184, 0.6)";

// ===== Responsive canvas + scale =====
function resizeCanvas() {
  const marginV = 60; // vertical margin
  const marginH = 40; // horizontal margin
  const sizeByHeight = Math.max(200, window.innerHeight - marginV);
  const sizeByWidth = Math.max(200, window.innerWidth - marginH);
  const size = Math.min(sizeByHeight, sizeByWidth);

  canvas.width = size;
  canvas.height = size;

  cx = canvas.width / 2;
  cy = canvas.height / 2;

  const innerMargin = 12;
  SCALE = ((Math.min(canvas.width, canvas.height) / 2) - innerMargin) / DESIGN_MAX_OUTER;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ===== Helpers =====
function scaledPxFromFont(fontStr) {
  const m = fontStr.match(/^\s*([\d.]+)\s*px\s+(.+)$/i);
  if (!m) return fontStr;
  const basePx = parseFloat(m[1]);
  const fam = m[2];
  const scaled = Math.max(10, basePx * SCALE);
  return `${scaled}px ${fam}`;
}

function drawRingCircle(radiusPx) {
  ctx.beginPath();
  ctx.arc(cx, cy, radiusPx, 0, 2 * Math.PI);
  ctx.strokeStyle = COLOR_RING;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawRoundedRect(x, y, w, h, r, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
  ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
  ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
  ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
  ctx.closePath();
  ctx.fillStyle = COLOR_ACTIVE_BOX;
  ctx.shadowBlur = 12 * SCALE;
  ctx.shadowColor = COLOR_GLOW;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawRotatingRing(data, baseRadius, baseFont, currentValue, rotateOutward = false) {
  const radius = baseRadius * SCALE;
  const font = scaledPxFromFont(baseFont);
  const angleStep = (2 * Math.PI) / data.length;
  const indexOffset = data.indexOf(currentValue);

  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    const angle = (i - indexOffset) * angleStep;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(x, y);
    if (rotateOutward) ctx.rotate(angle);

    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (value === currentValue) {
      const paddingX = 8 * SCALE;
      const paddingY = 6 * SCALE;
      const r = 6 * SCALE;

      const textWidth = ctx.measureText(value).width;
      const boxW = textWidth + paddingX * 2;
      const boxH = Math.max(18 * SCALE, parseFloat(font) + paddingY * 2);

      drawRoundedRect(0, 0, boxW, boxH, r, rotateOutward ? 0 : angle);
      ctx.fillStyle = COLOR_ACTIVE_TEXT;
    } else {
      ctx.fillStyle = COLOR_INACTIVE_TEXT;
    }

    ctx.fillText(value, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// ===== Goals integration variables =====
let clickableDots = []; // stores { x, y, goal }
let hoveredDot = null; // currently hovered dot object {x,y,goal}
let goalsData = []; // loaded goals list (from preload or localStorage)

// Helper: load goals (supports Electron preload API, otherwise localStorage)
function loadGoals() {
  return new Promise((resolve) => {
    // Prefer preload API (Electron) if present
    if (window.goalsAPI && typeof window.goalsAPI.readGoals === "function") {
      try {
        const res = window.goalsAPI.readGoals();
        if (res && typeof res.then === "function") {
          res.then(data => resolve(Array.isArray(data) ? data : [])).catch(() => resolve([]));
        } else {
          resolve(Array.isArray(res) ? res : []);
        }
      } catch (e) {
        console.error("goalsAPI.readGoals() error:", e);
        resolve([]);
      }
    } else {
      // fallback to localStorage
      try {
        const ls = JSON.parse(localStorage.getItem("goals"));
        resolve(Array.isArray(ls) ? ls : []);
      } catch (e) {
        resolve([]);
      }
    }
  });
}

// Draw goal dots around the clock (call each frame)
function drawGoalDots(ctx, cx, cy) {
  clickableDots = []; // reset each frame
  if (!Array.isArray(goalsData)) return;

  const monthsRing = rings.find(ring => ring.data === months);
  if (!monthsRing) return;

  const r = monthsRing.radius * SCALE;
  const angleStep = (2 * Math.PI) / months.length;

  // IMPORTANT: match drawRotatingRing's offset for months
  const now = new Date();
  const currentMonthIndex = now.getMonth();

  goalsData.forEach(goal => {
    if (!goal || !goal.date) return;
    const goalDate = new Date(goal.date + 'T00:00:00');
    if (isNaN(goalDate)) return;

    const monthIndex = goalDate.getMonth();

    // Same positioning as drawRotatingRing:
    // label angle = (i - indexOffset) * angleStep
    // so dot angle should be (goalMonth - currentMonth) * angleStep
    const angle = (monthIndex - currentMonthIndex) * angleStep;

    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    // soft halo
    ctx.beginPath();
    ctx.arc(x, y, 8 * SCALE, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(244,166,184,0.12)";
    ctx.fill();

    // core dot
    ctx.beginPath();
    ctx.arc(x, y, 6 * SCALE, 0, 2 * Math.PI);
    ctx.fillStyle = "#a6def4ff";
    ctx.fill();

    clickableDots.push({ x, y, goal });
  });
}

// ===== Animation (modified to include goals and tooltip) =====
function drawClock() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const now = new Date();
  const values = [
    days[now.getDay()],
    months[now.getMonth()],
    now.getDate().toString(),
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
    now.getFullYear().toString(),
  ];

  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    const rotateOutward = (i === 0 || i === 1);

    drawRingCircle((ring.radius + ring.ringPadding) * SCALE);
    drawRotatingRing(ring.data, ring.radius, ring.font, values[i], rotateOutward);
  }

  // ... inside drawClock() ...

  // Draw goal dots on the month ring
  drawGoalDots(ctx, cx, cy);

  // Draw tooltip for hovered dot (so it persists during animation)
  if (hoveredDot) {
    const text = hoveredDot.goal.title || "(untitled)";
    
    ctx.save();
    
    // Set font and style for background calculation
    ctx.font = `${12 * Math.max(1, SCALE)}px Arial`;
    const padding = 6 * SCALE;
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = (12 * SCALE);

    const tx = hoveredDot.x + 10 * SCALE;
    const ty = hoveredDot.y - 10 * SCALE;

    // 1. Draw the rounded background box
    ctx.fillStyle = "rgba(255,241,241,0.95)";
    ctx.strokeStyle = "rgba(214,138,138,0.9)";
    ctx.lineWidth = 1;
    roundRect(ctx, tx, ty - th, tw + padding * 2, th + padding, 6 * SCALE, true, true);

    // 2. Draw the text on top of the box
    ctx.fillStyle = "#4B2E2E";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, tx + padding, ty - th / 2);
    
    ctx.restore();
  }

  requestAnimationFrame(drawClock);
}

// small helper to draw a rounded rect with optional fill/stroke
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ===== Side Panel Toggle =====
const sidePanel = document.getElementById("sidePanel");
const toggleBtn = document.getElementById("toggleBtn");

if (sidePanel && toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const opening = !sidePanel.classList.contains("open");
    sidePanel.classList.toggle("open", opening);

    // accessibility
    toggleBtn.setAttribute("aria-expanded", String(opening));
    toggleBtn.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
  });

  // close on ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidePanel.classList.contains("open")) {
      sidePanel.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "Open menu");
    }
  });
}

// ===== Todo Sticky Note =====
const todoNote = document.getElementById("todoNote");
const todoHeader = todoNote.querySelector(".todo-header");
const todoList = document.getElementById("todoList");
const todoInput = document.getElementById("todoInput");
const resizer = todoNote.querySelector(".resizer");
const closeTodo = document.getElementById("closeTodo");

// Helper: create a task element
function createTask(text) {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const span = document.createElement("span");
  span.textContent = text;

  // Editing on double-click
  span.addEventListener("dblclick", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = span.textContent;
    input.style.flex = "1";
    li.replaceChild(input, span);
    input.focus();

    input.addEventListener("blur", () => {
      span.textContent = input.value.trim() || "Untitled task";
      li.replaceChild(span, input);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
  });

  // Delete button
  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑️";
  delBtn.style.border = "none";
  delBtn.style.background = "transparent";
  delBtn.style.cursor = "pointer";
  delBtn.style.marginLeft = "auto";
  delBtn.addEventListener("click", () => {
    li.remove();
  });

  // Checkbox completion
  checkbox.addEventListener("change", () => {
    li.classList.toggle("completed", checkbox.checked);
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  return li;
}

// Add task on Enter
todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && todoInput.value.trim() !== "") {
    e.preventDefault();
    const li = createTask(todoInput.value.trim());
    todoList.appendChild(li);
    todoInput.value = "";
  }
});

// Close button
closeTodo.addEventListener("click", () => {
  todoNote.style.display = "none";
});

// ===== Dragging =====
let isDragging = false,
  offsetX, offsetY;

todoHeader.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - todoNote.offsetLeft;
  offsetY = e.clientY - todoNote.offsetTop;
  document.body.style.userSelect = "none";
});

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    todoNote.style.left = `${e.clientX - offsetX}px`;
    todoNote.style.top = `${e.clientY - offsetY}px`;
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  document.body.style.userSelect = "auto";
});

// ===== Resizing =====
let isResizing = false,
  startX, startY, startW, startH;

resizer.addEventListener("mousedown", (e) => {
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;
  startW = todoNote.offsetWidth;
  startH = todoNote.offsetHeight;
  e.preventDefault();
});

window.addEventListener("mousemove", (e) => {
  if (isResizing) {
    const newW = startW + (e.clientX - startX);
    const newH = startH + (e.clientY - startY);
    todoNote.style.width = `${Math.max(180, newW)}px`;
    todoNote.style.height = `${Math.max(150, newH)}px`;
  }
});

window.addEventListener("mouseup", () => {
  isResizing = false;
});
const openTodo = document.getElementById("openTodo");

// Close button hides note, shows open button
closeTodo.addEventListener("click", () => {
  todoNote.style.display = "none";
  openTodo.style.display = "block";
});

// Open button shows note, hides itself
openTodo.addEventListener("click", () => {
  todoNote.style.display = "flex";
  openTodo.style.display = "none";
});

// ===== Canvas interactions for goal dots (hover + click) =====
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const found = clickableDots.find(dot =>
    Math.hypot(dot.x - mouseX, dot.y - mouseY) < (10 * Math.max(1, SCALE))
  );

  if (found) {
    hoveredDot = found;
    canvas.style.cursor = "pointer";
  } else {
    hoveredDot = null;
    canvas.style.cursor = "default";
  }
});

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const found = clickableDots.find(dot =>
    Math.hypot(dot.x - mouseX, dot.y - mouseY) < (10 * Math.max(1, SCALE))
  );

  if (found && found.goal && found.goal.id) {
    // Navigate to goals page and include hash for scrolling to the goal note
    window.location.href = `goals/goals.html#${found.goal.id}`;
  }
});

// ===== Start: load goals then begin animation =====
loadGoals().then((loaded) => {
  goalsData = Array.isArray(loaded) ? loaded : [];
  // If the user stores goals in localStorage only (older), ensure we pick that up too
  if ((!goalsData || goalsData.length === 0) && localStorage.getItem("goals")) {
    try {
      const ls = JSON.parse(localStorage.getItem("goals"));
      if (Array.isArray(ls) && ls.length > 0) goalsData = ls;
    } catch (e) { /* ignore */ }
  }
  drawClock();
}).catch((err) => {
  console.error("Error loading goals:", err);
  drawClock(); // still run the clock even if goals fail to load
});