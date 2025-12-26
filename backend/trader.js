const scanMarket = require("./scanner");

/**
 * @param {Object} broker - The global broker instance
 * @param {Function} decideTrade - AI logic (expects stock, sentiment, position)
 */
async function runTradingCycle(broker, decideTrade) {
  try {
    console.log("🔄 --- Starting Trading Cycle ---");
    
    // 1. Get Market Data (including SPY sentiment)
    const { stocks, marketSentiment } = await scanMarket();

    if (!stocks || stocks.length === 0) {
      console.log("⚠️ Cycle aborted: No stock data.");
      return;
    }

    console.log(`🌍 Global Market Mood (SPY): ${marketSentiment.toFixed(2)}%`);

    for (const stock of stocks) {
      const currentPosition = broker.positions[stock.symbol];
      
      // 2. Safety First: Check Trailing Stop Loss if we already own it
      if (currentPosition) {
        const isStopHit = broker.checkTrailingStop(stock.symbol, stock.price);
        if (isStopHit) {
          await broker.sell(stock.symbol, stock.price, "Trailing Stop Loss");
          continue; // Skip AI check for this stock since we already sold
        }
      }

      // 3. Ask AI for opinion
      // Note: decideTrade now expects (stock, marketSentiment, currentPosition)
      const decision = decideTrade(stock, marketSentiment, currentPosition);

      // 4. Execute Actions based on AI confidence
      if (decision.action === "BUY" && !currentPosition) {
        // AI sees a breakout opportunity
        broker.buy(stock.symbol, stock.price, marketSentiment, stock.changePercent);
      } 
      else if (decision.action === "SELL" && currentPosition) {
        // AI predicts a trend reversal
        await broker.sell(stock.symbol, stock.price, decision.reason || "AI Sell Signal");
      }
    }
    
    console.log("✅ --- Cycle Complete ---");
    console.log("Current Portfolio Status:", broker.getStatus());

  } catch (error) {
    console.error("❌ Critical Trader Error:", error.message);
  }
}

module.exports = runTradingCycle;