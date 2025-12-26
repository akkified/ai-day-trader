require("dotenv").config();
const mongoose = require("mongoose");

// Use the same schema as your ai.js and broker.js
const TradeSchema = new mongoose.Schema({
  input: {
    sentiment: Number,
    change: Number
  },
  output: {
    buy: Number
  },
  details: {
    symbol: String,
    price: Number,
    profit: Number,
    time: { type: Date, default: Date.now }
  }
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

async function injectSimulatedData() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("🧹 Clearing old flatlined data...");
    await TradeHistory.deleteMany({});

    const data = [];
    const symbols = ["NVDA", "AAPL", "TSLA", "AMD", "MSFT"];

    console.log("🧪 Generating 1,000 simulated lessons...");

    for (let i = 0; i < 1000; i++) {
      // Generate a random market sentiment between -3% and +3%
      const marketSentiment = (Math.random() * 6) - 3;
      
      // Generate a random stock change between -5% and +5%
      const stockChange = (Math.random() * 10) - 5;

      let isWin = 0;

      // --- LOGIC PATTERN: RELATIVE STRENGTH ---
      // 1. If stock is UP while market is DOWN = High Probability Win
      if (stockChange > 0.5 && marketSentiment < -0.5) {
        isWin = 1; 
      }
      // 2. If both are UP, but stock is significantly stronger = Win
      else if (stockChange > 1.5 && marketSentiment > 0 && stockChange > marketSentiment) {
        isWin = 1;
      }
      // 3. If stock is DOWN while market is UP = High Probability Loss
      else if (stockChange < -0.5 && marketSentiment > 0.5) {
        isWin = 0;
      }
      // 4. Random noise for the remaining (to make the AI work for it)
      else {
        isWin = stockChange > marketSentiment ? 1 : 0;
      }

      data.push({
        input: { 
          sentiment: parseFloat(marketSentiment.toFixed(2)), 
          change: parseFloat(stockChange.toFixed(2)) 
        },
        output: { 
          buy: isWin 
        },
        details: {
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          price: Math.random() * 500 + 100,
          profit: isWin ? (Math.random() * 50) : -(Math.random() * 50),
          time: new Date()
        }
      });
    }

    await TradeHistory.insertMany(data);
    console.log("✅ Successfully injected 1,000 lessons with clear patterns!");
    process.exit();

  } catch (err) {
    console.error("❌ Injection Failed:", err);
    process.exit(1);
  }
}

injectSimulatedData();