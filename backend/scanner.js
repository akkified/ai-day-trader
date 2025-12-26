const axios = require("axios");

async function scanMarket() {
  const symbols = ["NVDA", "AAPL", "TSLA", "AMD", "MSFT"];
  const results = [];
  const API_KEY = process.env.ALPHA_VANTAGE_KEY;

  if (!API_KEY) {
    console.error("❌ ERROR: ALPHA_VANTAGE_KEY is missing from environment variables.");
    throw new Error("Missing API Key");
  }

  for (const symbol of symbols) {
    try {
      // Using Global Quote for current price data
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      
      const response = await axios.get(url);
      
      // Alpha Vantage sometimes returns a 200 OK but with an error message in the body
      if (response.data["Error Message"] || response.data["Note"]) {
        console.error(`⚠️ API Warning for ${symbol}:`, response.data["Error Message"] || response.data["Note"]);
        continue;
      }

      const quote = response.data["Global Quote"];
      if (quote && quote["05. price"]) {
        results.push({
          symbol: symbol,
          price: parseFloat(quote["05. price"]),
          change: parseFloat(quote["09. change"]),
          changePercent: quote["10. change percent"],
          volume: parseInt(quote["06. volume"]),
          time: new Date()
        });
      }

      // Add a small delay to avoid hitting free-tier rate limits (5 calls/min or 25/day)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("❌ 401 Unauthorized: Your API key is invalid or not being passed correctly.");
      } else {
        console.error(`❌ Scan Failed for ${symbol}:`, error.message);
      }
    }
  }

  return results;
}

module.exports = scanMarket;