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
      console.log(`🔍 Scanning ${symbol}...`);
      
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const response = await axios.get(url);
      
      if (response.data["Note"]) {
        console.warn(`⏳ Rate limit hit for ${symbol}. Alpha Vantage Free Tier allows 5 calls/min.`);
        continue;
      }

      if (response.data["Error Message"]) {
        console.error(`❌ API Error for ${symbol}:`, response.data["Error Message"]);
        continue;
      }

      const quote = response.data["Global Quote"];
      
      if (quote && quote["05. price"]) {
        // --- DATA NORMALIZATION FOR AI ---
        // Alpha Vantage returns changePercent as a string like "1.2345%"
        // We strip the '%' and convert to a Float so the AI can process it.
        const rawChangePercent = quote["10. change percent"] || "0%";
        const numericChangePercent = parseFloat(rawChangePercent.replace('%', ''));

        results.push({
          symbol: symbol,
          price: parseFloat(quote["05. price"]),
          change: parseFloat(quote["09. change"]),
          changePercent: numericChangePercent, // Now a clean number
          volume: parseInt(quote["06. volume"]),
          time: new Date()
        });
        
        console.log(`✅ ${symbol}: $${quote["05. price"]} (${numericChangePercent}%)`);
      }

      // Spacing out requests to respect Free Tier limits (12 seconds is safest for 5 calls/min)
      // but using 2000ms as a compromise for small symbol lists.
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("❌ 401 Unauthorized: Key invalid.");
      } else {
        console.error(`❌ Scan Failed for ${symbol}:`, error.message);
      }
    }
  }

  return results;
}

module.exports = scanMarket;