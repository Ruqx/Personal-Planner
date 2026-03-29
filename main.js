// preload.js
const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

const goalsPath = path.join(__dirname, "goals.json");

contextBridge.exposeInMainWorld("goalsAPI", {
  readGoals: () => {
    try {
      if (!fs.existsSync(goalsPath)) {
        fs.writeFileSync(goalsPath, "[]");
      }
      let data = fs.readFileSync(goalsPath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading goals:", err);
      return [];
    }
  },
  saveGoals: (goals) => {
    try {
      fs.writeFileSync(goalsPath, JSON.stringify(goals, null, 2));
    } catch (err) {
      console.error("Error saving goals:", err);
    }
  }
});
