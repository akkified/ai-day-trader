const scanMarket = require("./scanner");

/**
 * Runs the trading cycle by fetching market data and passing it to the AI.
 * @param {Object} broker - The global broker instance
 * @param {Function} decideTrade - AI logic (expects stock, marketSentiment, and position)
 */
async function runTradingCycle(broker, decideTrade) {
  try {
    console.log("🔄 Running context-aware trading cycle...");
    
    // Destructure the new object format from scanner.js
    const { stocks, marketSentiment } = await scanMarket();

    if (!stocks || stocks.length === 0) {
      console.log("⚠️ No stock data found in this cycle.");
      return;
    }

    console.log(`🌍 Market Sentiment (SPY): ${marketSentiment.toFixed(2)}%`);

    for (const stock of stocks) {
      const currentPosition = broker.positions[stock.symbol];
      
      if (typeof decideTrade !== 'function') {
        throw new Error("decideTrade is not a function. Check index.js imports.");
      }

      // PASS BOTH: The specific stock AND the global market context
      const decision = decideTrade(stock, marketSentiment, currentPosition);

      if (decision.action === "BUY" && !currentPosition) {
        console.log(`📈 BUY SIGNAL [${stock.symbol}]: Confidence ${(decision.confidence * 100).toFixed(1)}%`);
        
        // Ensure broker records the market context for future AI training
        broker.buy(stock.symbol, stock.price, 1, {
          changePercent: stock.changePercent,
          marketSentiment: marketSentiment
        }); 
      } 
      else if (decision.action === "SELL" && currentPosition) {
        console.log(`📉 SELL SIGNAL [${stock.symbol}]: ${decision.reason}`);
        broker.sell(stock.symbol, stock.price, decision.reason);
      }
    }
  } catch (error) {
    console.error("❌ Cycle Error:", error.message);
  }
}

module.exports = runTradingCycle;