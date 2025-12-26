const mongoose = require('mongoose');

// 1. Define the Schema once to ensure consistency
const TradeSchema = new mongoose.Schema({
  input: {
    sentiment: Number, // Raw SPY % change
    change: Number     // Raw Stock % change
  },
  output: {
    buy: Number        // 1 if profitable, 0 if not
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
    this.trades = [];
    
    // Check if already connected to prevent duplicate connections
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("📦 MongoDB Connected"))
        .catch(err => console.error("❌ DB Error:", err));
    }
  }

  /**
   * @param {string} symbol 
   * @param {number} price 
   * @param {number} sentiment - The raw % change of SPY
   * @param {number} change - The raw % change of the stock
   */
  buy(symbol, price, sentiment, change) {
    if (this.positions[symbol]) return; // Prevent double-buying

    const amount = Math.floor(this.cash / price);
    if (amount > 0) {
      this.cash -= (amount * price);
      
      // Store the exact market conditions at the moment of entry
      this.positions[symbol] = { 
        amount, 
        entryPrice: price, 
        entrySentiment: sentiment, 
        entryChange: change 
      };

      this.trades.push({ action: "BUY", symbol, price, time: new Date() });
      console.log(`[BROKER] 🛒 Bought ${symbol} at $${price} (Market: ${sentiment}%)`);
    }
  }

  async sell(symbol, price, reason) {
    const pos = this.positions[symbol];
    if (!pos) return;

    const profit = (price - pos.entryPrice) * pos.amount;
    
    // SAVE LESSON TO AI:
    // We store the raw data now. Let the AI model handle normalization.
    try {
      await TradeHistory.create({
        input: { 
          sentiment: pos.entrySentiment, 
          change: pos.entryChange 
        },
        output: { 
          buy: profit > 0 ? 1 : 0 
        },
        details: { 
          symbol, 
          price,
          profit 
        }
      });
      console.log(`[BROKER] 📝 Lesson saved for ${symbol}. Result: ${profit > 0 ? "WIN" : "LOSS"}`);
    } catch (err) {
      console.error("❌ Failed to save trade history:", err.message);
    }

    this.cash += (pos.amount * price);
    delete this.positions[symbol];
    this.trades.push({ action: "SELL", symbol, price, profit, reason, time: new Date() });
  }

  getStatus() { 
    return { 
      cash: this.cash.toFixed(2), 
      positions: Object.keys(this.positions), 
      trades: this.trades.length 
    }; 
  }
}

module.exports = Broker;