const brain = require('brain.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Define the Schema for MongoDB
const TradeSchema = new mongoose.Schema({
  symbol: String,
  action: String,
  confidence: Number,
  profit: Number,
  time: Date,
  price: Number,
  changePercent: Number // Ensure this is captured to feed the AI better data
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

// 2. Initialize the Neural Network
let net = new brain.NeuralNetwork({
  hiddenLayers: [10, 10] 
});

/**
 * Trains the AI using Price Change instead of raw Price.
 * This identifies "Momentum" which is much easier for AI to learn.
 */
async function trainAI() {
  try {
    console.log("🧠 Starting Momentum-Based AI Training...");

    const cloudHistory = await TradeHistory.find({}).lean();
    
    // Normalize ChangePercent: A 10% move is huge, so we divide by 10.
    // This maps a -10% to +10% range roughly into a usable 0 to 1 space for Brain.js
    const formattedHistory = cloudHistory.map(item => ({
      input: { change: ((item.changePercent || 0) + 10) / 20 }, // Maps -10...+10 to 0...1
      output: { buy: item.profit > 0 ? 1 : 0 }
    }));

    // Load Foundation Data if exists
    const bulkPath = path.join(__dirname, 'bulk_training.json');
    let bulkData = [];
    if (fs.existsSync(bulkPath)) {
      bulkData = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));
      console.log(`📚 Loaded ${bulkData.length} lessons from bulk_training.json`);
    }

    const trainingSet = [...bulkData, ...formattedHistory];

    // Fallback starter data if database is empty
    const finalSet = trainingSet.length > 5 
      ? trainingSet 
      : [
          { input: { change: 0.7 }, output: { buy: 1 } }, // Simulation: High growth = Buy
          { input: { change: 0.3 }, output: { buy: 0 } }  // Simulation: Drop = Don't Buy
        ];

    net.train(finalSet, {
      iterations: 3000,   // Increased iterations for better convergence
      errorThresh: 0.01,
      log: true,
      logPeriod: 500
    });

    console.log(`✅ AI Refined. Total lessons processed: ${finalSet.length}`);
  } catch (err) {
    console.error("❌ AI Training Error:", err.message);
  }
}

/**
 * Makes a decision based on momentum (changePercent)
 */
function decideTrade(stock, position) {
  // We use changePercent (e.g. 1.5 for 1.5%) instead of price
  // We map it using the same formula used in training
  const normalizedChange = ((stock.changePercent || 0) + 10) / 20;
  
  const result = net.run({ change: normalizedChange });
  const confidence = result.buy || 0;

  console.log(`🤖 AI Analysis for ${stock.symbol}: Confidence ${(confidence * 100).toFixed(1)}% | Change: ${stock.changePercent}%`);

  // Optimized thresholds:
  // Buying requires 65% confidence. 
  // Selling happens if confidence drops below 40%.
  if (confidence > 0.65 && !position) {
    return { action: "BUY", confidence, reason: "Bullish Momentum Detected" };
  } 
  
  if (confidence < 0.40 && position) {
    return { action: "SELL", confidence, reason: "Momentum Fading" };
  }

  return { action: "HOLD", confidence, reason: "Neutral / Insufficient Signal" };
}

// Initial train on startup
trainAI();

module.exports = { decideTrade, trainAI };