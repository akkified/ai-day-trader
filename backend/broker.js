const mongoose = require('mongoose');

// 1. Define the Schema for AI training lessons
const TradeSchema = new mongoose.Schema({
  input: { sentiment: Number, change: Number },
  output: { buy: Number },
  details: { symbol: String, price: Number, profit: Number, time: { type: Date, default: Date.now } }
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

class Broker {
  constructor() {
    this.initialCash = 10000;
    this.cash = 10000;
    this.positions = {};
    this.trades = []; 
    this.trailPercent = 0.02; 
    
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("📦 Broker: MongoDB Connected"))
        .catch(err => console.error("❌ Broker: DB Connection Error:", err));
    }
  }

  /**
   * Calculates current total portfolio value (Cash + Market Value of Positions)
   */
  getTotalValue() {
    let positionsValue = 0;
    // Note: In a real app, you'd pass current market prices here. 
    // Using entryPrice as a fallback for sizing calculations.
    Object.values(this.positions).forEach(pos => {
      positionsValue += (pos.amount * pos.entryPrice);
    });
    return parseFloat(this.cash) + positionsValue;
  }

  buy(symbol, price, sentiment, change, confidence) {
    if (this.positions[symbol]) return; 

    // --- POSITION SIZING LOGIC ---
    // We want to risk only 20% of our TOTAL EQUITY per trade.
    const totalEquity = this.getTotalValue();
    const allocation = totalEquity * 0.20; 

    // Determine how many shares $2,000 (20% of 10k) can buy
    let amount = Math.floor(allocation / price);

    // Safety: If allocation is more than actual cash on hand, use remaining cash
    if ((amount * price) > this.cash) {
      amount = Math.floor(this.cash / price);
    }

    if (amount > 0) {
      this.cash -= (amount * price);
      
      this.positions[symbol] = { 
        amount, 
        entryPrice: price, 
        highPrice: price, 
        entrySentiment: sentiment, 
        entryChange: change,
        confidence: confidence 
      };

      const tradeRecord = { 
        action: "BUY", 
        symbol, 
        price, 
        amount, 
        confidence, 
        time: new Date() 
      };
      
      this.trades.push(tradeRecord);
      console.log(`[BROKER] 🛒 BUY ${symbol} | Qty: ${amount} ($${(amount * price).toFixed(2)}) | Remaining Cash: $${this.cash.toFixed(2)}`);
    } else {
      console.log(`[BROKER] ⚠️ Insufficient funds to open 20% position in ${symbol}`);
    }
  }

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

  getStatus() {
    return {
      cash: parseFloat(this.cash).toFixed(2),
      positions: this.positions,
      trades: this.trades 
    };
  }
}

module.exports = Broker;