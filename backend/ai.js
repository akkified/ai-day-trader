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
  time: { type: Date, default: Date.now },
  price: Number,
  changePercent: Number 
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

// 2. Initialize the Neural Network with a deeper architecture
let net = new brain.NeuralNetwork({
  hiddenLayers: [12, 12, 12] // Added a third layer for better pattern extraction
});

/**
 * High-Contrast Training: 
 * Uses a steeper slope for normalization to force the AI to see small moves.
 */
async function trainAI() {
  try {
    console.log("🧠 Training High-Contrast Momentum Model...");

    const cloudHistory = await TradeHistory.find({}).lean();
    
    const trainingSet = cloudHistory.map(item => ({
      // STRETCH: We map a -5% to +5% move into the 0-1 range.
      // Anything beyond 5% is capped at 0 or 1.
      // Formula: ((Change / 5) + 1) / 2
      input: { 
        change: Math.max(0, Math.min(1, ((item.changePercent || 0) / 5 + 1) / 2)) 
      },
      output: { buy: item.profit > 0 ? 1 : 0 }
    }));

    // Foundation Data from local disk
    const bulkPath = path.join(__dirname, 'bulk_training.json');
    let bulkData = [];
    if (fs.existsSync(bulkPath)) {
      bulkData = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));
    }

    const finalSet = [...bulkData, ...trainingSet];

    // Fallback if no data
    if (finalSet.length === 0) {
      finalSet.push({ input: { change: 0.8 }, output: { buy: 1 } });
      finalSet.push({ input: { change: 0.2 }, output: { buy: 0 } });
    }

    // Train with a higher learning rate to break the 0.25 plateau
    net.train(finalSet, {
      iterations: 5000,
      errorThresh: 0.001,
      log: true,
      logPeriod: 1000,
      learningRate: 0.3, 
      momentum: 0.1
    });

    console.log(`✅ AI Refined. Error should now fluctuate below 0.25. Lessons: ${finalSet.length}`);
  } catch (err) {
    console.error("❌ AI Training Error:", err.message);
  }
}

/**
 * Makes a decision using the High-Contrast formula
 */
function decideTrade(stock, position) {
  // Use the same stretch formula: maps -5%...+5% to 0...1
  const normalizedChange = Math.max(0, Math.min(1, ((stock.changePercent || 0) / 5 + 1) / 2));
  
  const result = net.run({ change: normalizedChange });
  const confidence = result.buy || 0;

  console.log(`🤖 AI Analysis for ${stock.symbol}: ${(confidence * 100).toFixed(1)}% Confidence | Move: ${stock.changePercent}%`);

  // DYNAMIC THRESHOLDS
  // Buy if confidence is > 62% AND the stock is actually green (> 0.1%)
  if (confidence > 0.62 && stock.changePercent > 0.1 && !position) {
    return { action: "BUY", confidence, reason: "Momentum Breakout" };
  } 
  
  // Sell if confidence drops below 45% or the stock starts tanking (< -1%)
  if (position && (confidence < 0.45 || stock.changePercent < -1.5)) {
    return { action: "SELL", confidence, reason: "Signal Decay / Stop Loss" };
  }

  return { action: "HOLD", confidence, reason: "Neutral" };
}

// Initial train on startup
trainAI();

module.exports = { decideTrade, trainAI };