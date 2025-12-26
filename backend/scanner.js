// scanner.js
async function scanMarket() {
  const results = [];
  
  // NEW: Fetch the top 5 most active stocks right now from Finnhub
  // Note: This requires a 'Market News' or 'Top Gainers' endpoint
  // For now, let's use a dynamic list of tech & crypto stocks
  const candidates = ["AAPL", "NVDA", "TSLA", "AMD", "MSFT", "COIN", "MARA", "RIOT"];

  for (const symbol of candidates) {
    const data = await getStockData(symbol);
    if (!data) continue;

    const changePercent = ((data.price - data.prevClose) / data.prevClose) * 100;

    // The "Choosing" Logic: Only send it to the AI if it's actually moving
    if (Math.abs(changePercent) > 1.5) { 
       const sentiment = await getSentimentData(symbol);
       results.push({ symbol, price: data.price, changePercent, sentiment });
    }
  }
  return results;
}