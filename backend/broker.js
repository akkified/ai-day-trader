const mongoose = require('mongoose');

// 1. Define the Schema for AI training lessons
// This matches the format the AI expects to "learn" from your trades
const TradeSchema = new mongoose.Schema({
  input: {
    sentiment: Number, // The SPY % change at time of buy
    change: Number     // The Stock % change at time of buy
  },
  output: {
    buy: Number        // 1 if profit > 0 (Success), 0 if profit <= 0 (Failure)
  },
  details: {
    symbol: String,
    price: Number,
    profit: Number,
    time: { type: Date, default: Date.now }
  }
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

class Broker {
  constructor() {
    this.cash = 10000;
    this.positions = {};
    this.trades = []; // Array of trade objects
    this.trailPercent = 0.02; // 2% Trailing Stop Loss
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("📦 Broker: MongoDB Connected"))
        .catch(err => console.error("❌ Broker: DB Connection Error:", err));
    }
  }

  /**
   * Executes a Buy order and tracks the entry conditions
   */
  buy(symbol, price, sentiment, change) {
    if (this.positions[symbol]) return; 

    const amount = Math.floor(this.cash / price);
    if (amount > 0) {
      this.cash -= (amount * price);
      
      // We store highPrice to track the "Peak" for the trailing stop
      this.positions[symbol] = { 
        amount, 
        entryPrice: price, 
        highPrice: price, // Starts at entry price
        entrySentiment: sentiment, 
        entryChange: change 
      };

      const tradeRecord = { action: "BUY", symbol, price, time: new Date() };
      this.trades.push(tradeRecord);
      
      console.log(`[BROKER] 🛒 BUY ${symbol} @ $${price.toFixed(2)} (Mkt: ${sentiment}%)`);
    }
  }

  /**
   * Executes a Sell order and saves the result as a "Lesson" for the AI
   */
  async sell(symbol, price, reason) {
    const pos = this.positions[symbol];
    if (!pos) return;

    const profit = (price - pos.entryPrice) * pos.amount;
    
    // Save the outcome to MongoDB so the AI can learn from this trade
    try {
      await TradeHistory.create({
        input: { sentiment: pos.entrySentiment, change: pos.entryChange },
        output: { buy: profit > 0 ? 1 : 0 },
        details: { symbol, price, profit }
      });
      console.log(`[BROKER] 📝 AI Lesson saved for ${symbol}. Profit: $${profit.toFixed(2)}`);
    } catch (err) {
      console.error("❌ Broker: Failed to save lesson to DB:", err.message);
    }

    this.cash += (pos.amount * price);
    
    const tradeRecord = { 
      action: "SELL", 
      symbol, 
      price, 
      profit, 
      reason, 
      time: new Date() 
    };
    
    this.trades.push(tradeRecord);
    delete this.positions[symbol];
    
    console.log(`[BROKER] 💰 SELL ${symbol} @ $${price.toFixed(2)} | Reason: ${reason}`);
  }

  /**
   * Updates the highPrice and checks if the current price has dropped 
   * below the trailing stop threshold.
   */
  checkTrailingStop(symbol, currentPrice) {
    const pos = this.positions[symbol];
    if (!pos) return false;

    // If stock hits a new high, move the trailing stop up
    if (currentPrice > pos.highPrice) {
      pos.highPrice = currentPrice;
      console.log(`[TRAIL] 🛡️ ${symbol} new peak: $${currentPrice.toFixed(2)}`);
    }

    const dropPercentage = (pos.highPrice - currentPrice) / pos.highPrice;
    
    // Returns true if the drop is 2% or more from the peak
    return dropPercentage >= this.trailPercent;
  }

  /**
   * Returns the status for the Frontend.
   * FIX: Returns 'trades' as an array to avoid .slice() errors.
   */
  getStatus() {
    return {
      cash: this.cash.toFixed(2),
      positions: Object.keys(this.positions),
      trades: this.trades // This MUST be the array for the frontend to work
    };
  }
}

module.exports = Broker;