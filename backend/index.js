const cors = require("cors");
const express = require("express");
const Broker = require("./broker");
const scanMarket = require("./scanner");
const decideTrade = require("./ai");
const runTradingCycle = require("./trader");
const startScheduler = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the global broker (for live/simulated trading)
const broker = new Broker();

/* --- PUBLIC ROUTES --- */

app.get("/", (req, res) => {
  res.send("AI Quant Backend is Active");
});

// GET the current account status (Cash, Positions, Trades, Portfolio Value)
app.get("/status", (req, res) => {
  res.json(broker.getStatus());
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

// Perform a real-time scan of the watchlist
app.get("/scan", async (req, res) => {
  try {
    const results = await scanMarket();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Scan failed" });
  }
});

// Get AI decisions based on current market data
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

/* --- BACKTESTING ENGINE (Phase 3) --- */

app.post("/backtest", async (req, res) => {
  const { historyData } = req.body; 
  if (!historyData || !Array.isArray(historyData)) {
    return res.status(400).json({ error: "Invalid history data" });
  }

  // Use a fresh broker instance so we don't affect live cash
  const testBroker = new Broker(); 
  
  historyData.forEach(bar => {
    // 1. Sync price to the test broker
    testBroker.updateMarketPrice(bar.symbol, bar.price);

    // 2. Get AI decision based on the historical bar
    const position = testBroker.positions[bar.symbol];
    const decision = decideTrade(bar, position);

    // 3. Execute logic (using Phase 1 & 2 rules)
    if (decision.action === "BUY" && !position) {
      testBroker.buy(bar.symbol, bar.price);
    } else if (decision.action === "SELL") {
      testBroker.sell(bar.symbol, bar.price, `SIM_${decision.reason}`);
    }
  });

  res.json(testBroker.getStatus());
});

/* --- AUTOMATION CONTROL --- */

// Manually trigger a trading cycle
app.post("/run", async (req, res) => {
  await runTradingCycle(broker);
  res.json(broker.getStatus());
});

// Start the persistent 15-minute scheduler
startScheduler(broker);

app.listen(PORT, () => {
  console.log(`🚀 AI Quant Server running on port ${PORT}`);
});