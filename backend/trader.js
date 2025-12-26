const scanMarket = require("./scanner"); // FIX: No curly braces
const decideTrade = require("./ai");

async function runTradingCycle(broker) {
  try {
    console.log("🔍 Checking market for opportunities...");
    
    // This is line 6 where your error was occurring
    const market = await scanMarket(); 
    
    if (!market || market.length === 0) {
      console.log("High volatility not found. Standing by.");
      return;
    }

    market.forEach(stock => {
      const currentPosition = broker.positions[stock.symbol];
      const decision = decideTrade(stock, currentPosition);

      if (decision.action === "BUY" && !currentPosition) {
        broker.buy(stock.symbol, stock.price);
      } else if (decision.action === "SELL" && currentPosition) {
        broker.sell(stock.symbol, stock.price, decision.reason);
      }
    });
  } catch (error) {
    console.error("Trading Cycle Error:", error.message);
  }
}

module.exports = runTradingCycle;