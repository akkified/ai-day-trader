// 1. MUST BE THE VERY FIRST LINE
require("dotenv").config(); 

const cors = require("cors");
const express = require("express");
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

/* --- PUBLIC ROUTES --- */

app.get("/", (req, res) => {
  res.send("AI Quant Backend is Active");
});

app.get("/status", (req, res) => {
  res.json(broker.getStatus());
});

/* --- AI & RETRAINING ROUTES --- */

app.post("/retrain", async (req, res) => {
  try {
    console.log("🚀 Manual Retrain Triggered...");
    // Pass broker if your training logic needs to check current balance/data
    await trainAI(); 
    res.json({ message: "Neural Network successfully retrained on cloud data." });
  } catch (error) {
    console.error("Retrain Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* --- MANUAL OVERRIDE ROUTES --- */

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

/* --- MARKET DATA & AI ROUTES --- */

app.get("/scan", async (req, res) => {
  try {
    const results = await scanMarket();
    res.json(results);
  } catch (error) {
    console.error("Scan Error:", error.message);
    res.status(500).json({ error: "Scan failed", details: error.message });
  }
});

app.get("/decide", async (req, res) => {
  try {
    const scanResults = await scanMarket();
    const decisions = scanResults.map(stock => {
      const currentPosition = broker.positions[stock.symbol];
      return decideTrade(stock, currentPosition);
    });
    res.json(decisions);
  } catch (error) {
    res.status(500).json({ error: "AI Decision failed" });
  }
});

/* --- BACKTESTING ENGINE --- */

app.post("/backtest", async (req, res) => {
  const { historyData } = req.body; 
  if (!historyData || !Array.isArray(historyData)) {
    return res.status(400).json({ error: "Invalid history data" });
  }

  const testBroker = new Broker(); 
  
  historyData.forEach(bar => {
    testBroker.updateMarketPrice?.(bar.symbol, bar.price);
    const position = testBroker.positions[bar.symbol];
    const decision = decideTrade(bar, position);

    if (decision.action === "BUY" && !position) {
      testBroker.buy(bar.symbol, bar.price);
    } else if (decision.action === "SELL") {
      testBroker.sell(bar.symbol, bar.price, `SIM_${decision.reason}`);
    }
  });

  res.json(testBroker.getStatus());
});

/* --- AUTOMATION CONTROL --- */

app.post("/run", async (req, res) => {
  try {
    await runTradingCycle(broker);
    res.json(broker.getStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the persistent scheduler
startScheduler(broker);

app.listen(PORT, () => {
  console.log(`🚀 AI Quant Server running on port ${PORT}`);
  // Verification log to ensure environment is loaded
  console.log(`Environment check: ALPHA_VANTAGE_KEY is ${process.env.ALPHA_VANTAGE_KEY ? 'Present' : 'MISSING'}`);
});