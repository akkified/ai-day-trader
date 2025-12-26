const axios = require("axios");

const API_KEY = "d4gisehr01qm5b35qpq0d4gisehr01qm5b35qpqg";
const BASE_URL = "https://finnhub.io/api/v1";

async function getStockData(symbol) {
  try {
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: { symbol, token: API_KEY }
    });
    const data = response.data;
    if (!data || data.c === 0) return null;

    return {
      symbol,
      price: data.c,
      prevClose: data.pc
    };
  } catch (err) {
    console.log(`❌ API error for ${symbol}`);
    return null;
  }
}

async function getSentimentData(symbol) {
  try {
    const response = await axios.get(`${BASE_URL}/news-sentiment`, {
      params: { symbol, token: API_KEY }
    });
    const sentiment = response.data.sentiment;
    if (!sentiment) return 0;

    // Returns a score between -1 and 1
    const netSentiment = sentiment.bullishPercent - sentiment.bearishPercent;
    return Number(netSentiment.toFixed(2));
  } catch (err) {
    return 0; // Neutral fallback
  }
}

module.exports = { getStockData, getSentimentData };