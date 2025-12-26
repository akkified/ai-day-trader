const brain = require('brain.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Schema for the 'Brain' to remember trades
const TradeSchema = new mongoose.Schema({
  input: { sentiment: Number, change: Number },
  output: { buy: Number }, // 1 for profit, 0 for loss
  details: { symbol: String, profit: Number, time: { type: Date, default: Date.now } }
});

const TradeHistory = mongoose.models.TradeHistory || mongoose.model('TradeHistory', TradeSchema);
const net = new brain.NeuralNetwork({ hiddenLayers: [4, 4] });

async function trainAI() {
  try {
    const cloudHistory = await TradeHistory.find({}).lean();
    const formattedHistory = cloudHistory.map(item => ({ input: item.input, output: item.output }));

    // Load Foundation Data if it exists
    const bulkPath = path.join(__dirname, 'bulk_training.json');
    let bulkData = [];
    if (fs.existsSync(bulkPath)) {
      bulkData = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));
    }

    const trainingSet = [...bulkData, ...formattedHistory];
    const finalSet = trainingSet.length > 0 ? trainingSet : [{ input: { sentiment: 0.5, change: 0.5 }, output: { buy: 1 } }];

    net.train(finalSet, { iterations: 2000, errorThresh: 0.005 });
    console.log(`🧠 AI Retrained on ${finalSet.length} samples.`);
  } catch (err) {
    console.error("Training Error:", err);
  }
}

function decideTrade(stock, position) {
  const input = {
    sentiment: (stock.sentiment + 1) / 2,
    change: Math.min(stock.changePercent / 10, 1)
  };
  const result = net.run(input);
  const confidence = result.buy;

  if (confidence > 0.75 && !position) return { action: "BUY", confidence };
  if (confidence < 0.30 && position) return { action: "SELL", confidence };
  return { action: "HOLD", confidence };
}

module.exports = { decideTrade, trainAI };