const brain = require('brain.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Define the Schema for MongoDB (so we can find it even if it's defined elsewhere)
const TradeSchema = new mongoose.Schema({
  input: { sentiment: Number, change: Number },
  output: { buy: Number },
  details: { 
    symbol: String, 
    profit: Number, 
    time: { type: Date, default: Date.now } 
  }
});

// Ensure the model is only compiled once
const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

// 2. Initialize the Neural Network (v1.2.2 Syntax)
// We use a simple Feed-Forward network which is perfect for CPU-based trading
let net = new brain.NeuralNetwork({
  hiddenLayers: [4, 4] 
});

/**
 * Trains the AI using both local bulk data and cloud trade history
 */
async function trainAI() {
  try {
    console.log("🧠 Starting AI Training Sequence...");

    // Fetch live trade results from MongoDB
    const cloudHistory = await TradeHistory.find({}).lean();
    const formattedHistory = cloudHistory.map(item => ({
      input: item.input,
      output: item.output
    }));

    // Load Foundation Data (bulk_training.json) from local disk
    const bulkPath = path.join(__dirname, 'bulk_training.json');
    let bulkData = [];
    if (fs.existsSync(bulkPath)) {
      bulkData = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));
      console.log(`📚 Loaded ${bulkData.length} lessons from bulk_training.json`);
    }

    // Combine both datasets
    const trainingSet = [...bulkData, ...formattedHistory];

    // If no data exists yet, provide a tiny "starter" set so it doesn't crash
    const finalSet = trainingSet.length > 0 
      ? trainingSet 
      : [{ input: { sentiment: 0.5, change: 0.5 }, output: { buy: 1 } }];

    // Train the network
    net.train(finalSet, {
      iterations: 2000,    // How many times to loop over the data
      errorThresh: 0.005,  // Stop once error is low enough
      log: true,           // See progress in Render logs
      logPeriod: 500
    });

    console.log(`✅ AI Training Complete. Total lessons learned: ${finalSet.length}`);
  } catch (err) {
    console.error("❌ AI Training Error:", err.message);
  }
}

/**
 * Makes a decision based on current market data
 * @param {Object} stock - The stock data (sentiment, changePercent)
 * @param {Object} position - The current position if held
 */
function decideTrade(stock, position) {
  // Normalize inputs to be between 0 and 1
  const input = {
    sentiment: (stock.sentiment + 1) / 2, // Maps -1..1 to 0..1
    change: Math.min(stock.changePercent / 10, 1) // Caps 10% pump at 1.0
  };

  // Run the data through the Neural Network
  const result = net.run(input);
  const confidence = result.buy;

  // Decision Logic
  if (confidence > 0.75 && !position) {
    return { action: "BUY", confidence, reason: `AI Confidence: ${(confidence * 100).toFixed(1)}%` };
  } 
  
  if (confidence < 0.30 && position) {
    return { action: "SELL", confidence, reason: `AI Weak Signal: ${(confidence * 100).toFixed(1)}%` };
  }

  return { action: "HOLD", confidence, reason: "Neutral" };
}

// Initial train on startup
trainAI();

module.exports = { decideTrade, trainAI };