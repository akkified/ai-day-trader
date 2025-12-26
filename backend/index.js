require("dotenv").config(); // Essential first line

const cors = require("cors");
const express = require("express");

// Logic Imports
const Broker = require("./broker");
const scanMarket = require("./scanner");
const { decideTrade, trainAI } = require("./ai"); 
const runTradingCycle = require("./trader");
const startScheduler = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 10000; 

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the global broker
const broker = new Broker();

/* --- API ROUTES --- */

app.get("/", (req, res) => res.send("AI Quant Backend is Active"));

app.get("/status", (req, res) => res.json(broker.getStatus()));

// Manual AI Retrain
app.post("/retrain", async (req, res) => {
  try {
    console.log("🚀 Manual Retrain Triggered...");
    await trainAI(); 
    res.json({ message: "Neural Network successfully retrained." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trading Operations
app.post("/buy", (req, res) => {
  const { symbol, price, amount } = req.body;
  broker.buy(symbol, price, amount || 1);
  res.json(broker.getStatus());
});

app.post("/sell", (req, res) => {
  const { symbol, price } = req.body;
  broker.sell(symbol, price, "MANUAL_EXIT");
  res.json(broker.getStatus());
});

/* --- MARKET DATA & AI LOGIC --- */

app.get("/scan", async (req, res) => {
  try {
    const results = await scanMarket();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Scan failed", details: error.message });
  }
});

// Helper route to see what the AI thinks right now
app.get("/decide", async (req, res) => {
  try {
    const scanResults = await scanMarket();
    const decisions = scanResults.map(stock => ({
      symbol: stock.symbol,
      decision: decideTrade(stock, broker.positions[stock.symbol])
    }));
    res.json(decisions);
  } catch (error) {
    res.status(500).json({ error: "AI Decision failed" });
  }
});

/* --- AUTOMATION CONTROL --- */

app.post("/run", async (req, res) => {
  try {
    // We pass the broker AND the ai functions to avoid circular requires in trader.js
    await runTradingCycle(broker, decideTrade);
    res.json(broker.getStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize Automation
startScheduler(broker);

app.listen(PORT, () => {
  console.log(`🚀 AI Quant Server running on port ${PORT}`);
  console.log(`AUTH CHECK: ALPHA_VANTAGE_KEY is ${process.env.ALPHA_VANTAGE_KEY ? 'Present' : 'MISSING'}`);
});