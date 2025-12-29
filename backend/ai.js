const brain = require('brain.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Unified Schema: Matches the structure used in broker.js and scanner.js
const TradeSchema = new mongoose.Schema({
  input: {
    sentiment: Number, // SPY % change
    change: Number     // Stock % change
  },
  output: {
    buy: Number        // 1 for profit, 0 for loss
  },
  details: {
    symbol: String,
    price: Number,
    profit: Number,
    time: { type: Date, default: Date.now }
  }
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);

// 2. Initialize Network
let net = new brain.NeuralNetwork({
  hiddenLayers: [15, 15]
});

let isTrained = false;

/**
 * Normalization helper: Standardizes values into the 0-1 range.
 * Stock change range: -5% to +5%
 * Market sentiment range: -3% to +3%
 */
const normalize = (val, min, max) => Math.max(0, Math.min(1, (val - min) / (max - min)));

async function trainAI() {
  try {
    console.log("AI: Starting Training Cycle...");

    let history = [];
    try {
      if (mongoose.connection.readyState === 1) {
        history = await TradeHistory.find({}).lean();
      }
    } catch (e) {
      console.log("DB not ready, skipping history.");
    }

    // Convert DB records into AI-readable format
    const trainingSet = history.map(item => ({
      input: {
        change: normalize(item.input.change || 0, -5, 5),
        market: normalize(item.input.sentiment || 0, -3, 3)
      },
      output: { buy: item.output.buy }
    }));

    // Optional: Load bulk data if you have a local JSON for pre-training
    const bulkPath = path.join(__dirname, 'bulk_training.json');
    let bulkData = [];
    if (fs.existsSync(bulkPath)) {
      bulkData = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));
    }

    const finalSet = [...bulkData, ...trainingSet];

    // Safety: Fallback data to ensure the network can initialize
    if (finalSet.length < 5) {
      console.log("AI: Insufficient data. Adding synthetic anchors.");
      finalSet.push({ input: { change: 0.8, market: 0.5 }, output: { buy: 1 } });
      finalSet.push({ input: { change: 0.5, market: 0.2 }, output: { buy: 0 } });
    }

    net.train(finalSet, {
      iterations: 3000,
      errorThresh: 0.01,
      log: false
    });

    isTrained = true;
    console.log(`AI: Training Complete. Lessons Processed: ${finalSet.length}`);
  } catch (err) {
    console.error("AI: Training Error:", err.message);
  }
}

/**
 * Makes a decision based on current momentum and market context.
 */
function decideTrade(stock, marketSentiment = 0, position) {
  // SAFETY: If the net isn't ready, don't try to access .buy
  if (!isTrained) {
    return { action: "HOLD", confidence: 0, reason: "AI Warming Up" };
  }

  const input = {
    change: normalize(stock.changePercent || 0, -5, 5),
    market: normalize(marketSentiment, -3, 3)
  };

  const result = net.run(input);

  // CRITICAL FIX: Handle potential null/undefined from net.run
  const confidence = (result && typeof result.buy !== 'undefined') ? result.buy : 0;

  console.log(`AI [${stock.symbol}]: ${(confidence * 100).toFixed(1)}% Confidence | Market: ${marketSentiment.toFixed(2)}%`);

  // --- Trading Logic ---

  const rsi = stock.rsi || 50;
  console.log(`Indicators [${stock.symbol}]: RSI ${rsi.toFixed(1)}`);

  // 1. STRONG BUY: RSI Oversold (< 30)
  if (rsi < 30 && !position) {
    return { action: "BUY", confidence, reason: "RSI Oversold (Buy Low)" };
  }

  // 2. STRONG SELL: RSI Overbought (> 70)
  if (position && rsi > 70) {
    return { action: "SELL", confidence, reason: "RSI Overbought (Sell High)" };
  }

  // 3. AI Standard BUY Condition
  if (confidence > 0.65 && marketSentiment > -1.5 && !position) {
    return { action: "BUY", confidence, reason: "AI Momentum" };
  }

  // 4. AI Standard SELL Condition (AI losing confidence OR macro crash)
  if (position && (confidence < 0.40 || marketSentiment < -2.5)) {
    return { action: "SELL", confidence, reason: "AI Signal Decay" };
  }

  return { action: "HOLD", confidence };
}

// Start initial training
trainAI();

module.exports = { decideTrade, trainAI };