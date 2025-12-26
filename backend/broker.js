const mongoose = require('mongoose');

// 1. Define the Schema for AI training lessons
const TradeSchema = new mongoose.Schema({
  input: {
    sentiment: Number, 
    change: Number     
  },
  output: {
    buy: Number        
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
    this.trailPercent = 0.02; // 2% Trailing Stop Loss
    
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("📦 Broker: MongoDB Connected"))
        .catch(err => console.error("❌ Broker: DB Connection Error:", err));
    }
  }

  /**
   * Executes a Buy order
   * UPDATED: Now accepts 'confidence' to pass to the frontend journal
   */
  buy(symbol, price, sentiment, change, confidence) {
    if (this.positions[symbol]) return; 

    const amount = Math.floor(this.cash / price);
    if (amount > 0) {
      this.cash -= (amount * price);
      
      this.positions[symbol] = { 
        amount, 
        entryPrice: price, 
        highPrice: price, 
        entrySentiment: sentiment, 
        entryChange: change,
        confidence: confidence // Store for sell reference
      };

      // UPDATED: Added amount and confidence for the Frontend Journal
      const tradeRecord = { 
        action: "BUY", 
        symbol, 
        price, 
        amount, 
        confidence, 
        time: new Date() 
      };
      
      this.trades.push(tradeRecord);
      
      console.log(`[BROKER] 🛒 BUY ${symbol} @ $${price.toFixed(2)} | Qty: ${amount} | Conf: ${(confidence * 100).toFixed(1)}%`);
    }
  }

  /**
   * Executes a Sell order
   */
  async sell(symbol, price, reason) {
    const pos = this.positions[symbol];
    if (!pos) return;

    const profit = (price - pos.entryPrice) * pos.amount;
    
    try {
      await TradeHistory.create({
        input: { sentiment: pos.entrySentiment, change: pos.entryChange },
        output: { buy: profit > 0 ? 1 : 0 },
        details: { symbol, price, profit }
      });
    } catch (err) {
      console.error("❌ Broker: Failed to save lesson:", err.message);
    }

    this.cash += (pos.amount * price);
    
    // UPDATED: Added amount and profit for the Frontend Journal
    const tradeRecord = { 
      action: "SELL", 
      symbol, 
      price, 
      amount: pos.amount,
      profit, 
      reason, 
      time: new Date() 
    };
    
    this.trades.push(tradeRecord);
    delete this.positions[symbol];
    
    console.log(`[BROKER] 💰 SELL ${symbol} @ $${price.toFixed(2)} | Profit: $${profit.toFixed(2)}`);
  }

  checkTrailingStop(symbol, currentPrice) {
    const pos = this.positions[symbol];
    if (!pos) return false;

    if (currentPrice > pos.highPrice) {
      pos.highPrice = currentPrice;
      console.log(`[TRAIL] 🛡️ ${symbol} new peak: $${currentPrice.toFixed(2)}`);
    }

    const dropPercentage = (pos.highPrice - currentPrice) / pos.highPrice;
    return dropPercentage >= this.trailPercent;
  }

  /**
   * UPDATED: Returns detailed position objects so "Open Risk" 
   * can show share counts and entry prices.
   */
  getStatus() {
    return {
      cash: this.cash.toFixed(2),
      positions: this.positions, // Now returns the full object { NVDA: { amount: 10, ... } }
      trades: this.trades 
    };
  }
}

module.exports = Broker;