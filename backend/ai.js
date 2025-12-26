const brain = require('brain.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Updated Schema to include marketSentiment
const TradeSchema = new mongoose.Schema({
  symbol: String,
  action: String,
  confidence: Number,
  profit: Number,
  time: { type: Date, default: Date.now },
  price: Number,
  changePercent: Number,
  marketSentiment: Number // NEW: Tracks SPY performance at time of trade
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

// 2. Initializing with a broader architecture to handle dual inputs
let net = new brain.NeuralNetwork({
  hiddenLayers: [15, 15] // Slightly wider layers for multi-variable patterns
});

/**
 * Dual-Input Training: 
 * Learns from both individual stock momentum AND general market mood.
 */
async function trainAI() {
  try {
    console.log("🧠 Training Dual-Input Momentum Model...");

    const cloudHistory = await TradeHistory.find({}).lean();
    
    const trainingSet = cloudHistory.map(item => ({
      input: { 
        // Normalize stock change (-5% to +5% range)
        change: Math.max(0, Math.min(1, ((item.changePercent || 0) / 5 + 1) / 2)),
        // Normalize market sentiment (-3% to +3% range for SPY)
        market: Math.max(0, Math.min(1, ((item.marketSentiment || 0) / 3 + 1) / 2))
      },
      output: { buy: item.profit > 0 ? 1 : 0 }
    }));

    // Foundation Data
    const bulkPath = path.join(__dirname, 'bulk_training.json');
    let bulkData = [];
    if (fs.existsSync(bulkPath)) {
      bulkData = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));
    }

    const finalSet = [...bulkData, ...trainingSet];

    // Fallback anchors for dual-input logic
    if (finalSet.length < 5) {
      finalSet.push({ input: { change: 0.8, market: 0.5 }, output: { buy: 1 } }); // Strong stock, neutral market
      finalSet.push({ input: { change: 0.5, market: 0.2 }, output: { buy: 0 } }); // Neutral stock, crashing market
    }

    net.train(finalSet, {
      iterations: 4000,
      errorThresh: 0.005,
      log: true,
      logPeriod: 1000,
      learningRate: 0.2
    });

    console.log(`✅ AI Refined with Market Context. Lessons: ${finalSet.length}`);
  } catch (err) {
    console.error("❌ AI Training Error:", err.message);
  }
}

/**
 * Makes a decision using both stock and market data
 * @param {Object} stock - Individual stock data
 * @param {Number} marketSentiment - The change percentage of SPY
 * @param {Object} position - Current held position
 */
function decideTrade(stock, marketSentiment = 0, position) {
  // Normalize Inputs
  const input = {
    change: Math.max(0, Math.min(1, ((stock.changePercent || 0) / 5 + 1) / 2)),
    market: Math.max(0, Math.min(1, (marketSentiment / 3 + 1) / 2))
  };
  
  const result = net.run(input);
  const confidence = result.buy || 0;

  console.log(`🤖 AI [${stock.symbol}]: ${(confidence * 100).toFixed(1)}% Confidence | Market Mood: ${marketSentiment}%`);

  // DYNAMIC LOGIC
  // 1. BUY: High confidence AND market isn't in a total meltdown
  if (confidence > 0.65 && marketSentiment > -1.5 && !position) {
    return { action: "BUY", confidence, reason: "Relative Strength / Bullish Context" };
  } 
  
  // 2. SELL: Confidence drops OR market sentiment becomes toxic (Macro exit)
  if (position && (confidence < 0.40 || marketSentiment < -2.5)) {
    return { action: "SELL", confidence, reason: "Market/Signal Deterioration" };
  }

  return { action: "HOLD", confidence, reason: "Neutral" };
}

// Initial train on startup
trainAI();

module.exports = { decideTrade, trainAI };