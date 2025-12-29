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
    console.error("ERROR: FINNHUB_KEY is missing.");
    throw new Error("Missing API Key");
  }

  // We use Promise.all to scan all symbols concurrently (faster)
  const scanPromises = symbols.map(async (symbol) => {
    try {
      // console.log(`🔍 Scanning ${symbol}...`);

      // Get Quote (Current Price)
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
      const quoteRes = await axios.get(quoteUrl);
      const quoteData = quoteRes.data;

      // Get Candles (Historical for RSI)
      // Resolution 'D' (Daily), last 60 days
      const to = Math.floor(Date.now() / 1000);
      const from = to - (60 * 24 * 60 * 60);
      const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${API_KEY}`;
      const candleRes = await axios.get(candleUrl);
      const candleData = candleRes.data;

      // Calculate RSI if we have candle data
      let rsi = 50; // Default neutral
      if (candleData.c && candleData.c.length > 14) {
        rsi = calculateRSI(candleData.c);
      }

      // Finnhub Response Keys:
      // c: Current price, d: Change, dp: Percent change
      if (quoteData.c && quoteData.c !== 0) {
        return {
          symbol: symbol,
          price: quoteData.c,
          change: quoteData.d,
          changePercent: quoteData.dp,
          rsi: rsi, // Added RSI
          time: new Date()
        };
      }
    } catch (error) {
      console.error(`Scan Failed for ${symbol}:`, error.message);
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
    console.log(`${r.symbol}: $${r.price.toFixed(2)} (${r.changePercent.toFixed(2)}%)`);
  });

  return {
    stocks: resultsFiltered.filter(r => r.symbol !== "SPY"),
    marketSentiment: marketSentiment
  };
}

/**
 * Calculates RSI (Relative Strength Index)
 * @param {Array} closes - Array of closing prices (newest last)
 * @param {number} period - RSI period (default 14)
 * @returns {number} RSI value (0-100)
 */
function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50; // Not enough data

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smooth with subsequent values
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

module.exports = scanMarket;