'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Activity, RefreshCw, Telescope, Wallet, History,
  BrainCircuit, AlertCircle, ArrowUpRight, ArrowDownRight, Monitor, PieChart as PieChartIcon
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
const MONITORED_SYMBOLS = ["NVDA", "AAPL", "TSLA", "AMD", "MSFT"];

function StockChartPane({ symbol }: { symbol: string }) {
  return (
    <div className="h-full w-full overflow-hidden">
      <iframe
        title={`Chart for ${symbol}`}
        width="100%"
        height="100%"
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d4d&symbol=${symbol}&interval=5&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=1e1e2d&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%231e1e2d%22%2C%22paneProperties.vertGridProperties.color%22%3A%22%2327272a%22%2C%22paneProperties.horzGridProperties.color%22%3A%22%2327272a%22%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
        frameBorder="0"
        scrolling="no"
      ></iframe>
    </div>
  );
}

export default function TradingDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(MONITORED_SYMBOLS[0]);
  const [chartData, setChartData] = useState([{ name: 'Init', value: 10000 }]);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error("Backend unreachable");
      const data = await res.json();
      setStatus(data);

      // TRACKING TOTAL VALUE: Now the chart shows Net Worth, not just cash
      if (data.totalValue) {
        setChartData(prev => {
          const newPoint = {
            name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: parseFloat(data.totalValue)
          };
          const lastPoint = prev[prev.length - 1];
          // Prevent duplicate points if price hasn't moved
          if (lastPoint && lastPoint.value === newPoint.value) return prev;
          return [...prev.slice(-20), newPoint];
        });
      }
    } catch (err) {
      console.error("❌ Connection Error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Switched to 10s for snappier updates
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <Activity className="text-blue-500" size={40} />
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.3em]">System Syncing</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#13131a] text-zinc-200 p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-900/50">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Alpaca</h1>
          </div>
        </header>

        {/* --- TOP ROW: CHART & TOTAL EQUITY --- */}
        {/* --- TOP ROW: SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Equity */}
          <div className="bg-[#1e1e2d] p-5 rounded-xl border border-zinc-800/50 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Total Equity</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">${status.totalValue}</span>
              <span className={`text-xs font-bold mb-1 ${parseFloat(status.totalProfit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {parseFloat(status.totalProfit) >= 0 ? '+' : ''}{status.totalProfit}
              </span>
            </div>
          </div>

          {/* Card 2: Cash Balance */}
          <div className="bg-[#1e1e2d] p-5 rounded-xl border border-zinc-800/50 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Cash Balance</h3>
            </div>
            <div className="text-2xl font-bold text-white">${parseFloat(status.cash).toFixed(2)}</div>
          </div>

          {/* Card 3: Daily P&L */}
          <div className="bg-[#1e1e2d] p-5 rounded-xl border border-zinc-800/50 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Daily P&L</h3>
            </div>
            <div className={`text-2xl font-bold ${parseFloat(status.totalProfit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {parseFloat(status.totalProfit) >= 0 ? '+' : ''}{status.totalProfit}
            </div>
          </div>

          {/* Card 4: Active Positions */}
          <div className="bg-[#1e1e2d] p-5 rounded-xl border border-zinc-800/50 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Active Positions</h3>
            </div>
            <div className="text-2xl font-bold text-white">{Object.keys(status.positions).length}</div>
          </div>
        </div>

        {/* --- MIDDLE ROW: MAIN CHART & PIE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Section */}
          <section className="lg:col-span-2 bg-[#1e1e2d] rounded-xl border border-zinc-800/50 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white">{selectedSymbol} Historical</h3>
              </div>

              <div className="flex gap-1 bg-[#13131a] p-1 rounded-lg">
                {MONITORED_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSymbol(s)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${selectedSymbol === s ? 'bg-[#2b2b40] text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[350px] w-full">
              <StockChartPane symbol={selectedSymbol} />
            </div>
          </section>

          {/* Pie Chart Section */}
          <div className="bg-[#1e1e2d] rounded-xl border border-zinc-800/50 p-6 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-white">Investment Summary</h3>
            </div>
            <div className="h-[280px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(() => {
                      const cash = parseFloat(status.cash);
                      const totalValue = parseFloat(status.totalValue);
                      const stocksValue = totalValue - cash;

                      const pieData = [];
                      if (cash > 0) pieData.push({ name: 'Liquid Cash', value: cash });

                      Object.keys(status.positions).forEach((symbol) => {
                        const pos = status.positions[symbol];
                        const entry = parseFloat(pos.entryPrice || 0);
                        const amount = pos.amount || 1;
                        const currentVal = amount * entry;
                        if (currentVal > 0) pieData.push({ name: symbol, value: currentVal });
                      });

                      return pieData;
                    })()}
                    cx="50%"
                    cy="45%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => percent ? `${(percent * 100).toFixed(1)}%` : ''}
                    labelLine={false}
                  >
                    {(() => {
                      const cash = parseFloat(status.cash);
                      const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                      const pieData = [];
                      if (cash > 0) pieData.push({ name: 'Liquid Cash', value: cash });
                      Object.keys(status.positions).forEach((symbol) => {
                        const pos = status.positions[symbol];
                        const entry = parseFloat(pos.entryPrice || 0);
                        const amount = pos.amount || 1;
                        const currentVal = amount * entry;
                        if (currentVal > 0) pieData.push({ name: symbol, value: currentVal });
                      });
                      return pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ));
                    })()}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {(() => {
                const cash = parseFloat(status.cash);
                const totalValue = parseFloat(status.totalValue);
                const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                const pieData = [];

                if (cash > 0) pieData.push({ name: 'Liquid Cash', value: cash });
                Object.keys(status.positions).forEach((symbol) => {
                  const pos = status.positions[symbol];
                  const entry = parseFloat(pos.entryPrice || 0);
                  const amount = pos.amount || 1;
                  const currentVal = amount * entry;
                  if (currentVal > 0) pieData.push({ name: symbol, value: currentVal });
                });

                return pieData.map((item, index) => {
                  const percentage = ((item.value / totalValue) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-auto">
                        {percentage}%
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>


        <div className="bg-[#1e1e2d] rounded-xl border border-zinc-800/50 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Transaction Details</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/50 text-zinc-400 bg-[#242436]">
                  <th className="p-4 font-medium">Asset</th>
                  <th className="p-4 font-medium">Side</th>
                  <th className="p-4 font-medium">Signal Strength</th>
                  <th className="p-4 font-medium text-right">Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {status.trades.slice().reverse().slice(0, 8).map((trade: any, idx: number) => {
                  const rawConf = parseFloat(trade.confidence);
                  const confPercent = isNaN(rawConf) ? 0 : Math.round(rawConf * 100);

                  return (
                    <tr key={idx} className="hover:bg-blue-500/[0.05] transition-colors group">
                      <td className="p-5">
                        <div className="font-black text-white tracking-tighter text-sm group-hover:text-blue-400 transition-colors">{trade.symbol}</div>
                        <div className="text-[9px] text-zinc-600 font-bold uppercase">{trade.amount || 1} Units</div>
                      </td>
                      <td className="p-5">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-md border ${trade.action === 'BUY' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' : 'border-zinc-700 text-zinc-500'
                          }`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${confPercent}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">{confPercent}%</span>
                        </div>
                      </td>
                      <td className={`p-5 text-right font-mono font-bold text-sm ${trade.profit > 0 ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {trade.profit !== undefined ? `${trade.profit >= 0 ? '+$' : '-$'}${Math.abs(parseFloat(trade.profit)).toFixed(2)}` : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}