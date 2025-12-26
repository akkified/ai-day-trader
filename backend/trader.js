const scanMarket = require("./scanner");

/**
 * @param {Object} broker - The global broker instance
 * @param {Function} decideTrade - The AI decision function passed from index.js
 */
async function runTradingCycle(broker, decideTrade) {
  try {
    console.log("🔄 Running scheduled trading cycle...");
    
    const market = await scanMarket();
    if (!market || market.length === 0) {
      console.log("⚠️ No market data found in this cycle.");
      return;
    }

    for (const stock of market) {
      const currentPosition = broker.positions[stock.symbol];
      
      // Ensure decideTrade exists before calling it
      if (typeof decideTrade !== 'function') {
        throw new Error("decideTrade passed to trader is not a function. Check index.js imports.");
      }

      const decision = decideTrade(stock, currentPosition);

      if (decision.action === "BUY" && !currentPosition) {
        console.log(`📈 AI Signal: BUY ${stock.symbol} @ $${stock.price}`);
        // We pass the price and metadata for the broker to record
        broker.buy(stock.symbol, stock.price, 1); 
      } 
      else if (decision.action === "SELL" && currentPosition) {
        console.log(`📉 AI Signal: SELL ${stock.symbol} @ $${stock.price} (${decision.reason})`);
        broker.sell(stock.symbol, stock.price, decision.reason);
      }
    }
  } catch (error) {
    console.error("❌ Cycle Error:", error.message);
  }
}

module.exports = runTradingCycle;