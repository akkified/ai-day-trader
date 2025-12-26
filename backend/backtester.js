// backtester.js
const Broker = require("./broker");
const decideTrade = require("./ai");
const fs = require("fs");

async function runBacktest(historyFile) {
  const history = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
  const broker = new Broker(); 
  
  console.log("🕒 Starting Backtest for: " + historyFile);

  // Loop through every historical price point (1-minute or 5-minute bars)
  for (const bar of history) {
    // 1. Update the broker's "Live" prices so stop-losses can trigger
    broker.updateMarketPrice(bar.symbol, bar.price);

    // 2. Ask the AI for a decision based on THIS historical moment
    const position = broker.positions[bar.symbol];
    const decision = decideTrade(bar, position);

    // 3. Execute trades immediately
    if (decision.action === "BUY" && !position) {
      broker.buy(bar.symbol, bar.price);
    } else if (decision.action === "SELL") {
      broker.sell(bar.symbol, bar.price, decision.reason);
    }
  }

  // Final Report
  const status = broker.getStatus();
  console.log("--- BACKTEST COMPLETE ---");
  console.log(`Final Portfolio Value: $${status.portfolioValue.toFixed(2)}`);
  console.log(`Total Trades: ${status.trades.length}`);
  console.log(`Profit/Loss: $${(status.portfolioValue - 1000).toFixed(2)}`);
}

runBacktest("./historical_data.json");