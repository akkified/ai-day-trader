const axios = require("axios");

/**
 * Scans a list of stocks plus the SPY index for market sentiment context.
 * Returns an object with individual stock data and the overall market move.
 */
async function scanMarket() {
  // We include SPY to gauge the "mood" of the overall market
  const symbols = ["SPY", "NVDA", "AAPL", "TSLA", "AMD", "MSFT"];
  const results = [];
  const API_KEY = process.env.ALPHA_VANTAGE_KEY;

  if (!API_KEY) {
    console.error("❌ ERROR: ALPHA_VANTAGE_KEY is missing.");
    throw new Error("Missing API Key");
  }

  for (const symbol of symbols) {
    try {
      console.log(`🔍 Scanning ${symbol}...`);
      
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const response = await axios.get(url);
      
      // Handle Rate Limits (Free tier is strict)
      if (response.data["Note"]) {
        console.warn(`⏳ Rate limit hit for ${symbol}. Waiting for next cycle.`);
        continue;
      }

      const quote = response.data["Global Quote"];
      
      if (quote && quote["05. price"]) {
        // Clean the percentage string into a raw number for the AI
        const rawChangePercent = quote["10. change percent"] || "0%";
        const numericChangePercent = parseFloat(rawChangePercent.replace('%', ''));

        results.push({
          symbol: symbol,
          price: parseFloat(quote["05. price"]),
          change: parseFloat(quote["09. change"]),
          changePercent: numericChangePercent,
          volume: parseInt(quote["06. volume"]),
          time: new Date()
        });
        
        console.log(`✅ ${symbol}: $${quote["05. price"]} (${numericChangePercent}%)`);
      }

      // 2-second delay to safely stay under the 5 calls/min limit
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Scan Failed for ${symbol}:`, error.message);
    }
  }

  // --- MARKET SENTIMENT LOGIC ---
  // Find SPY in our results to act as the "Market Sentiment"
  const spyData = results.find(r => r.symbol === "SPY");
  const marketSentiment = spyData ? spyData.changePercent : 0;

  // Return the stocks (excluding SPY) and the sentiment baseline
  return {
    stocks: results.filter(r => r.symbol !== "SPY"),
    marketSentiment: marketSentiment
  };
}

module.exports = scanMarket;