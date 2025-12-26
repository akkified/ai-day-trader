// trader.js
const scanMarket = require("./scanner");
const decideTrade = require("./ai");

async function runTradingCycle(broker) {
  const market = await scanMarket();

  market.forEach(stock => {
    broker.updateMarketPrice(stock.symbol, stock.price);

    const position = broker.positions[stock.symbol];
    const decision = decideTrade(stock, position);

    if (decision.action === "BUY" && !position) {
      broker.buy(stock.symbol, stock.price);
    } 
    else if (decision.action === "SELL") {
      broker.sell(stock.symbol, stock.price, decision.reason);
    }
  });
}

module.exports = runTradingCycle;