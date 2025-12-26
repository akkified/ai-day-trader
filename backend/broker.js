const mongoose = require('mongoose');

// 1. Define the Schema for AI training lessons
// This allows the AI to learn which market conditions lead to profitable trades
const TradeSchema = new mongoose.Schema({
  input: {
    sentiment: Number, // SPY % change at time of buy
    change: Number     // Stock % change at time of buy
  },
  output: {
    buy: Number        // 1 if successful profit, 0 if loss
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
    this.initialCash = 10000;
    this.cash = 10000;
    this.positions = {}; // Stores active holdings
    this.trades = [];    // Stores history for the Activity Journal
    this.trailPercent = 0.02; // 2% Trailing Stop Loss
    
    // Database Connection
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("📦 Broker: MongoDB Connected"))
        .catch(err => console.error("❌ Broker: DB Connection Error:", err));
    }
  }

  /**
   * Calculates "Total Equity" (Cash + Current Market Value of all stocks)
   * This is used for position sizing and dashboard reporting.
   */
  getTotalValue(currentMarketPrices = {}) {
    let positionsValue = 0;
    
    Object.keys(this.positions).forEach(symbol => {
      const pos = this.positions[symbol];
      // Use live price if provided by the loop, otherwise fallback to entry price
      const livePrice = currentMarketPrices[symbol] || pos.entryPrice;
      positionsValue += (pos.amount * livePrice);
    });

    return parseFloat(this.cash) + positionsValue;
  }

  /**
   * Executes a Buy order using a 20% position sizing rule
   */
  buy(symbol, price, sentiment, change, confidence) {
    // Prevent double-buying the same stock
    if (this.positions[symbol]) return; 

    // --- POSITION SIZING ---
    // Instead of going all-in, we calculate 20% of our total net worth
    const totalEquity = this.getTotalValue();
    const allocation = totalEquity * 0.20; 

    let amount = Math.floor(allocation / price);

    // Safety: Ensure we don't try to spend more cash than we actually have
    if ((amount * price) > this.cash) {
      amount = Math.floor(this.cash / price);
    }

    if (amount > 0) {
      this.cash -= (amount * price);
      
      this.positions[symbol] = { 
        amount, 
        entryPrice: price, 
        highPrice: price, // For trailing stop tracking
        entrySentiment: sentiment, 
        entryChange: change,
        confidence: confidence 
      };

      // Record trade for Frontend Journal
      const tradeRecord = { 
        action: "BUY", 
        symbol, 
        price, 
        amount, 
        confidence, 
        time: new Date() 
      };
      
      this.trades.push(tradeRecord);
      console.log(`[BROKER] 🛒 BUY ${symbol} | Qty: ${amount} | Cost: $${(amount * price).toFixed(2)} | Cash Left: $${this.cash.toFixed(2)}`);
    } else {
      console.log(`[BROKER] ⚠️ Signal for ${symbol} ignored: Insufficient Liquidity.`);
    }
  }

  /**
   * Executes a Sell order and saves the trade data to MongoDB for AI retraining
   */
  async sell(symbol, price, reason) {
    const pos = this.positions[symbol];
    if (!pos) return;

    const profit = (price - pos.entryPrice) * pos.amount;
    
    // Save lesson to DB so AI learns from this outcome
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
    
    // Record trade for Frontend Journal
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
    
    console.log(`[BROKER] 💰 SELL ${symbol} @ $${price.toFixed(2)} | Profit: $${profit.toFixed(2)} | Reason: ${reason}`);
  }

  /**
   * Moves the trailing stop up if the stock hits a new high
   */
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
   * Compiles the data for the Frontend API
   */
  getStatus(currentMarketPrices = {}) {
    const totalVal = this.getTotalValue(currentMarketPrices);
    return {
      cash: parseFloat(this.cash).toFixed(2),
      totalValue: totalVal.toFixed(2), // Net Worth (Cash + Stocks)
      totalProfit: (totalVal - this.initialCash).toFixed(2),
      positions: this.positions,
      trades: this.trades 
    };
  }
}

module.exports = Broker;