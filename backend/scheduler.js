const fs = require("fs");
const runTradingCycle = require("./trader");

const STATE_FILE = "./state.json";
const INTERVAL = 15 * 60 * 1000; // 15 minutes

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("⚠️ Could not read state file, starting fresh.");
  }
  return { lastRun: 0 }; // Default state
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save state:", err.message);
  }
}

/**
 * @param {Object} broker - The global broker instance
 * @param {Function} decideTrade - The AI decision function passed from index.js
 */
function startScheduler(broker, decideTrade) {
  console.log("⏰ Starting persistent scheduler...");

  let state = loadState();
  const now = Date.now();

  // 1. Initial Check: If never run or overdue, run immediately
  if (!state.lastRun || now - state.lastRun >= INTERVAL) {
    console.log("🏃 Running missed trading cycle...");
    // Pass decideTrade into the cycle
    runTradingCycle(broker, decideTrade); 
    state.lastRun = Date.now();
    saveState(state);
  } else {
    const minutesLeft = Math.round((INTERVAL - (now - state.lastRun)) / 60000);
    console.log(`⏳ Next cycle scheduled in ${minutesLeft} minutes.`);
  }

  // 2. Schedule future runs
  setInterval(() => {
    console.log("⏰ Running scheduled trading cycle...");
    // Pass decideTrade into the cycle
    runTradingCycle(broker, decideTrade);
    state.lastRun = Date.now();
    saveState(state);
  }, INTERVAL);
}

module.exports = startScheduler;