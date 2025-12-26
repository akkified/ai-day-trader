// ai.js

function decideTrade(stock, position) {
  const { symbol, price, changePercent, sentiment } = stock;

  // --- EXIT STRATEGY (Same as Phase 1) ---
  if (position) {
    const gain = (price - position.entryPrice) / position.entryPrice;
    if (gain >= 0.02) return { symbol, action: "SELL", reason: "TAKE_PROFIT" };
    if (gain <= -0.01) return { symbol, action: "SELL", reason: "STOP_LOSS" };
    
    // NEW: Sell if news sentiment turns extremely toxic
    if (sentiment < -0.8) return { symbol, action: "SELL", reason: "BAD_NEWS_EMERGENCY" };
    
    return { symbol, action: "HOLD" };
  }

  // --- ENTRY STRATEGY WITH SENTIMENT ---
  let confidence = 0;

  if (changePercent > 0) confidence += 0.3;
  if (sentiment > 0.3) confidence += 0.4;  // News is positive
  if (sentiment < -0.2) confidence -= 0.5; // News is negative (Penalty)

  if (confidence >= 0.6) {
    return { symbol, action: "BUY" };
  }

  return { symbol, action: "DO_NOTHING" };
}

// ... (your decideTrade function logic)

module.exports = decideTrade; // Export the function directly