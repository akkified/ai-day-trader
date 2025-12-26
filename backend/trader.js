const scanMarket = require("./scanner");
const decideTrade = require("./ai");

async function runTradingCycle(broker) {
  try {
    const market = await scanMarket();
    if (!market || market.length === 0) return;

    for (const stock of market) {
      const currentPosition = broker.positions[stock.symbol];
      const decision = decideTrade(stock, currentPosition);

      if (decision.action === "BUY" && !currentPosition) {
        // Pass sentiment and change so broker can save them for history
        broker.buy(stock.symbol, stock.price, stock.sentiment, stock.changePercent);
      } else if (decision.action === "SELL" && currentPosition) {
        broker.sell(stock.symbol, stock.price, decision.reason);
      }
    }
  } catch (error) {
    console.error("Cycle Error:", error.message);
  }
}

module.exports = runTradingCycle;