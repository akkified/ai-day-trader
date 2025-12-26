const axios = require('axios');
const fs = require('fs');

async function downloadHistory(symbol) {
  const API_KEY = "93LpHbY2RX3gu4d5U4tzZEZf564x4Ex4"; // Financial Modeling Prep
  const url = `https://financialmodelingprep.com/api/v3/historical-chart/1hour/${symbol}?apikey=${API_KEY}`;
  
  const res = await axios.get(url);
  const data = res.data; 

  const lessons = [];
  for (let i = 0; i < data.length - 10; i++) {
    const current = data[i+5]; // Past point
    const future = data[i];   // Future point relative to "current"
    
    lessons.push({
      input: {
        sentiment: Math.random(), // We don't have historical sentiment easily, so we simulate or use 0.5
        change: Math.min(((current.close - current.open)/current.open) * 10, 1)
      },
      output: {
        buy: future.close > current.close ? 1 : 0
      }
    });
  }
  fs.writeFileSync('./bulk_training.json', JSON.stringify(lessons));
  console.log("Bulk data ready!");
}
downloadHistory("NVDA");