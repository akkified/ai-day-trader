const axios = require("axios");

/**
 * Scans a list of stocks plus the SPY index using Finnhub.
 * Finnhub is faster and better suited for real-time decision making.
 */
async function scanMarket() {
  const symbols = ["SPY", "NVDA", "AAPL", "TSLA", "AMD", "MSFT"];
  const results = [];
  const API_KEY = process.env.FINNHUB_KEY; // Using Finnhub Token

  if (!API_KEY) {
    console.error("❌ ERROR: FINNHUB_KEY is missing.");
    throw new Error("Missing API Key");
  }

  // We use Promise.all to scan all symbols concurrently (faster)
  const scanPromises = symbols.map(async (symbol) => {
    try {
      // console.log(`🔍 Scanning ${symbol}...`);
      
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
      const response = await axios.get(url);
      const data = response.data;

      // Finnhub Response Keys:
      // c: Current price, d: Change, dp: Percent change
      if (data.c && data.c !== 0) {
        return {
          symbol: symbol,
          price: data.c,
          change: data.d,
          changePercent: data.dp, // Already a number, no string cleaning needed
          time: new Date()
        };
      }
    } catch (error) {
      console.error(`❌ Scan Failed for ${symbol}:`, error.message);
    }
    return null;
  });

  const rawResults = await Promise.all(scanPromises);
  const resultsFiltered = rawResults.filter(r => r !== null);

  // --- MARKET SENTIMENT LOGIC ---
  const spyData = resultsFiltered.find(r => r.symbol === "SPY");
  const marketSentiment = spyData ? spyData.changePercent : 0;

  // Logging results for transparency
  resultsFiltered.forEach(r => {
    console.log(`✅ ${r.symbol}: $${r.price.toFixed(2)} (${r.changePercent.toFixed(2)}%)`);
  });

  return {
    stocks: resultsFiltered.filter(r => r.symbol !== "SPY"),
    marketSentiment: marketSentiment
  };
}

module.exports = scanMarket;