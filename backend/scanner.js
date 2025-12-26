const axios = require("axios");
const { getStockData, getSentimentData } = require("./marketData");

// Get your key from Financial Modeling Prep
const FMP_KEY = process.env.FMP_API_KEY; 

async function scanMarket() {
  try {
    const gainerUrl = `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${FMP_KEY}`;
    const response = await axios.get(gainerUrl);
    const topFive = response.data.slice(0, 5);
    
    const results = [];
    for (const stock of topFive) {
      const sentiment = await getSentimentData(stock.symbol);
      results.push({
        symbol: stock.symbol,
        price: stock.price,
        changePercent: Number(stock.changesPercentage.toFixed(2)),
        sentiment: sentiment,
      });
    }
    return results;
  } catch (error) {
    console.error("Discovery Scan Failed:", error.message);
    return [];
  }
}

// FIX: Export the function directly
module.exports = scanMarket;