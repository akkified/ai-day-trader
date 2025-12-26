const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const TradeHistory = require('../models/TradeHistory');

async function updateToday(symbol) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const API_KEY = process.env.ALPHA_VANTAGE_KEY;

    // 1. Get the latest price (Global Quote)
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await axios.get(url);
    const quote = res.data['Global Quote'];

    if (!quote || !quote['05. price']) {
      throw new Error("Could not fetch latest quote.");
    }

    const currentPrice = parseFloat(quote['05. price']);
    const prevClose = parseFloat(quote['08. previous close']);
    const profit = currentPrice - prevClose;

    // 2. Save today's trade to the DB
    const dailyEntry = new TradeHistory({
      symbol: symbol.toUpperCase(),
      action: profit >= 0 ? 'BUY' : 'SELL',
      confidence: 0.8,
      profit: Number(profit.toFixed(2)),
      price: currentPrice,
      time: new Date() // Current date/time
    });

    await dailyEntry.save();
    console.log(`✅ Daily update for ${symbol} saved. Price: $${currentPrice}`);

  } catch (err) {
    console.error("Update Failed:", err.message);
  } finally {
    mongoose.connection.close();
  }
}

updateToday("NVDA");