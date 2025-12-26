const mongoose = require('mongoose');

class Broker {
  constructor() {
    this.cash = 10000;
    this.positions = {};
    this.trades = [];
    mongoose.connect(process.env.MONGO_URI).catch(err => console.error("DB Error:", err));
  }

  buy(symbol, price, sentiment, change) {
    const amount = Math.floor(this.cash / price);
    if (amount > 0) {
      this.cash -= (amount * price);
      this.positions[symbol] = { amount, entryPrice: price, entrySentiment: sentiment, entryChange: change };
      this.trades.push({ action: "BUY", symbol, price, time: new Date() });
    }
  }

  async sell(symbol, price, reason) {
    const pos = this.positions[symbol];
    if (!pos) return;

    const profit = (price - pos.entryPrice) * pos.amount;
    const TradeHistory = mongoose.model('TradeHistory');

    await TradeHistory.create({
      input: { sentiment: (pos.entrySentiment + 1) / 2, change: Math.min(pos.entryChange / 10, 1) },
      output: { buy: profit > 0 ? 1 : 0 },
      details: { symbol, profit }
    });

    this.cash += (pos.amount * price);
    delete this.positions[symbol];
    this.trades.push({ action: "SELL", symbol, price, profit, reason, time: new Date() });
  }

  getStatus() { return { cash: this.cash, positions: this.positions, trades: this.trades }; }
}

module.exports = Broker;