// broker.js

class Broker {
  constructor() {
    this.cash = 1000;
    this.positions = {};
    this.tradeHistory = [];
    this.maxRiskPerTrade = 0.20; // Max 20% of total cash per stock
  }

  updateMarketPrice(symbol, currentPrice) {
    if (this.positions[symbol]) {
      const pos = this.positions[symbol];
      pos.currentPrice = currentPrice;
      pos.unrealizedPl = (currentPrice - pos.entryPrice) * pos.amount;
      pos.plPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
    }
  }

  getStatus() {
    const totalStockValue = Object.values(this.positions).reduce((sum, pos) => {
      return sum + ((pos.currentPrice || pos.entryPrice) * pos.amount);
    }, 0);

    return {
      cash: this.cash,
      portfolioValue: this.cash + totalStockValue,
      positions: this.positions,
      trades: this.tradeHistory
    };
  }

  buy(symbol, price) {
    // RISK MANAGEMENT: Calculate "Portion" size
    // We don't want to buy just 1 share; we want to buy "X dollars worth"
    const targetInvestment = this.cash * this.maxRiskPerTrade;
    const amountToBuy = Math.floor(targetInvestment / price);

    if (amountToBuy < 1) {
      console.log(`⚠️ Skip ${symbol}: Not enough cash for a meaningful position.`);
      return;
    }

    const cost = price * amountToBuy;
    this.cash -= cost;
    
    this.positions[symbol] = {
      amount: amountToBuy,
      entryPrice: price,
      currentPrice: price,
      unrealizedPl: 0,
      plPercent: 0
    };

    this.tradeHistory.push({
      symbol,
      action: "BUY",
      price,
      amount: amountToBuy,
      time: new Date()
    });

    console.log(`🚀 RISK EXECUTION: Bought ${amountToBuy} ${symbol} at $${price}`);
  }

  sell(symbol, price, reason = "EXIT") {
    const position = this.positions[symbol];
    if (!position) return;

    const proceeds = price * position.amount;
    const profit = (price - position.entryPrice) * position.amount;

    this.cash += proceeds;
    delete this.positions[symbol];

    this.tradeHistory.push({
      symbol,
      action: "SELL",
      price,
      amount: position.amount,
      profit,
      reason, // Logging why we exited (Stop Loss vs Take Profit)
      time: new Date()
    });

    console.log(`💰 ${reason}: Sold ${symbol} at $${price} | Net: $${profit.toFixed(2)}`);
  }
}

module.exports = Broker;