const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TradeSchema = new mongoose.Schema({
  symbol: String,
  action: String,
  confidence: Number,
  profit: Number,
  time: Date,
  price: Number
});

const TradeHistory = mongoose.model('TradeHistory', TradeSchema);

async function backfill(symbol) {
  try {
    console.log(`Starting Alpha Vantage backfill for ${symbol}...`);
    await mongoose.connect(process.env.MONGO_URI);
    
    const API_KEY = process.env.ALPHA_VANTAGE_KEY;
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
    
    const res = await axios.get(url);

    // Alpha Vantage returns error messages inside an 'Note' or 'Error Message' field
    if (res.data['Note']) {
      console.error("Rate Limit Hit:", res.data['Note']);
      return;
    }
    
    const timeSeries = res.data['Time Series (Daily)'];
    if (!timeSeries) {
      console.error("Data Error: Could not find Time Series. Check your API key/Symbol.");
      return;
    }

    const dates = Object.keys(timeSeries).slice(0, 50).reverse(); // Last 50 trading days
    const historicalTrades = [];

    for (let i = 0; i < dates.length - 1; i++) {
      const currentDay = dates[i];
      const nextDay = dates[i + 1];

      const currentPrice = parseFloat(timeSeries[currentDay]['4. close']);
      const nextPrice = parseFloat(timeSeries[nextDay]['4. close']);

      const diff = nextPrice - currentPrice;
      const isUp = diff > 0;

      historicalTrades.push({
        symbol: symbol,
        action: isUp ? 'BUY' : 'SELL',
        confidence: 0.75 + (Math.random() * 0.15),
        profit: Number(diff.toFixed(2)),
        price: currentPrice,
        time: new Date(currentDay)
      });
    }

    await TradeHistory.deleteMany({ symbol: symbol });
    await TradeHistory.insertMany(historicalTrades);
    
    console.log(`✅ Success! Inserted ${historicalTrades.length} trades using Alpha Vantage.`);

  } catch (error) {
    console.error("System Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

backfill("PLTR");