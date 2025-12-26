const fs = require("fs");
const runTradingCycle = require("./trader");

const STATE_FILE = "./state.json";
const INTERVAL = 15 * 60 * 1000; // 15 minutes

function loadState() {
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function startScheduler(broker) {
  console.log("Starting persistent scheduler...");

  let state = loadState();
  const now = Date.now();

  // If never run or overdue, run immediately
  if (!state.lastRun || now - state.lastRun >= INTERVAL) {
    console.log("Running missed trading cycle...");
    runTradingCycle(broker);
    state.lastRun = Date.now();
    saveState(state);
  }

  // Schedule future runs
  setInterval(() => {
    console.log("Running scheduled trading cycle...");
    runTradingCycle(broker);
    state.lastRun = Date.now();
    saveState(state);
  }, INTERVAL);
}

module.exports = startScheduler;
