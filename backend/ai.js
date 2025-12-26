const brain = require('brain.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Define the Schema for MongoDB
// Updated to match the "price" and "profit" fields used in your backfill
const TradeSchema = new mongoose.Schema({
  symbol: String,
  action: String,
  confidence: Number,
  profit: Number,
  time: Date,
  price: Number
});

// Ensure the model is only compiled once
const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

// 2. Initialize the Neural Network
// Using a slightly larger layer for better pattern recognition
let net = new brain.NeuralNetwork({
  hiddenLayers: [10, 10] 
});

/**
 * Trains the AI using both local bulk data and cloud trade history
 */
async function trainAI() {
  try {
    console.log("🧠 Starting AI Training Sequence...");

    // Fetch live trade results from MongoDB
    const cloudHistory = await TradeHistory.find({}).lean();
    
    // Find the max price in history to normalize data between 0 and 1
    const maxPriceInHistory = cloudHistory.length > 0 
      ? Math.max(...cloudHistory.map(h => h.price || 1)) 
      : 1000;

    const formattedHistory = cloudHistory.map(item => ({
      input: { price: (item.price || 0) / maxPriceInHistory },
      output: { buy: item.profit > 0 ? 1 : 0 }
    }));

    // Load Foundation Data (bulk_training.json) if exists
    const bulkPath = path.join(__dirname, 'bulk_training.json');
    let bulkData = [];
    if (fs.existsSync(bulkPath)) {
      bulkData = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));
      console.log(`📚 Loaded ${bulkData.length} lessons from bulk_training.json`);
    }

    // Combine datasets
    const trainingSet = [...bulkData, ...formattedHistory];

    // If no data exists, use a fallback starter
    const finalSet = trainingSet.length > 0 
      ? trainingSet 
      : [{ input: { price: 0.5 }, output: { buy: 1 } }];

    // Train the network
    // Normalization prevents the "NaN" error you saw in logs
    net.train(finalSet, {
      iterations: 2000,
      errorThresh: 0.005,
      log: true,
      logPeriod: 500
    });

    console.log(`✅ AI Training Complete. Total lessons learned: ${finalSet.length}`);
  } catch (err) {
    console.error("❌ AI Training Error:", err.message);
  }
}

/**
 * Makes a decision based on current market data
 */
function decideTrade(stock, position) {
  // Normalize current price (assuming a max possible price of 2000 for stocks like NVDA)
  const normalizedPrice = Math.min((stock.price || 0) / 2000, 1);
  
  const input = {
    price: normalizedPrice
  };

  // Run the data through the Neural Network
  const result = net.run(input);
  const confidence = result.buy || 0;

  console.log(`🤖 AI Analysis for ${stock.symbol}: Confidence ${(confidence * 100).toFixed(1)}%`);

  // Decision Logic
  if (confidence > 0.70 && !position) {
    return { action: "BUY", confidence, reason: "High AI Confidence" };
  } 
  
  if (confidence < 0.30 && position) {
    return { action: "SELL", confidence, reason: "Trend Reversal Predicted" };
  }

  return { action: "HOLD", confidence, reason: "Neutral" };
}

// Initial train on startup
trainAI();

// EXPORT BOTH FUNCTIONS (Crucial for index.js)
module.exports = { decideTrade, trainAI };