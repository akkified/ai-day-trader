'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, RefreshCw, Telescope, Wallet, History,
  BrainCircuit, AlertCircle, ArrowUpRight, ArrowDownRight, Monitor, ChevronDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MONITORED_SYMBOLS = ["NVDA", "AAPL", "TSLA", "AMD", "MSFT"];

// --- REFINED COMPONENT: TRADINGVIEW CHART ---
function StockChartPane({ symbol }: { symbol: string }) {
  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-zinc-800/50 bg-black">
      <iframe
        title={`Chart for ${symbol}`}
        width="100%"
        height="100%"
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d4d&symbol=${symbol}&interval=5&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=0a0a0b&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%22paneProperties.background%22%3A%22%230a0a0b%22%2C%22paneProperties.vertGridProperties.color%22%3A%22%23111111%22%2C%22paneProperties.horzGridProperties.color%22%3A%22%23111111%22%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
        frameBorder="0"
        allowTransparency={true}
        scrolling="no"
      ></iframe>
    </div>
  );
}

export default function TradingDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(MONITORED_SYMBOLS[0]);

  const [chartData, setChartData] = useState([
    { name: '00:00', value: 10000 },
    { name: '08:00', value: 10150 },
    { name: '16:00', value: 10300 },
  ]);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error("Backend unreachable");
      const data = await res.json();
      setStatus(data);
      
      if (data.cash) {
        setChartData(prev => {
          const newPoint = { name: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), value: parseFloat(data.cash) };
          const lastPoint = prev[prev.length - 1];
          if (lastPoint && lastPoint.value === newPoint.value) return prev;
          return [...prev.slice(-12), newPoint];
        });
      }
    } catch (err) {
      console.error("❌ Connection Error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRetrain = async () => {
    setIsTraining(true);
    try {
      const res = await fetch(`${API_BASE_URL}/retrain`, { method: 'POST' });
      const data = await res.json();
      alert(`System Update: ${data.message}`);
      await fetchStatus();
    } catch (err) {
      alert("Retraining failed.");
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Activity className="animate-pulse text-blue-500" size={32} />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Neural Engine Initializing</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-zinc-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Autonomous Terminal v2.1</span>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">System Overview</h1>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleRetrain} disabled={isTraining} className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-xs font-bold uppercase tracking-wider">
              <BrainCircuit size={14} /> {isTraining ? "Recalibrating..." : "Retrain"}
            </button>
            <button onClick={fetchStatus} disabled={isRefreshing} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-wider">
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> Sync
            </button>
          </div>
        </header>

        {/* --- DUAL PANE: CHART SELECTOR & EQUITY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANE: ENHANCED CHART VIEW */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={14} className="text-blue-500" />
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Neural Watchlist</h3>
              </div>
              {/* SELECTOR PILLS */}
              <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                {MONITORED_SYMBOLS.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                      selectedSymbol === symbol 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
            <StockChartPane symbol={selectedSymbol} />
          </section>

          {/* RIGHT PANE: EQUITY & STATS */}
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                  <TrendingUp size={14} className="text-blue-500" /> Performance
                </h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                      <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-4 mt-6">
                <StatCard title="Liquidity" value={`$${status.cash}`} trend="up" />
                <StatCard title="Active Risk" value={Object.keys(status.positions).length} trend="neutral" />
                <StatCard title="Total Trades" value={status.trades.length} trend="up" />
              </div>
            </div>
          </div>
        </div>

        {/* --- JOURNAL & EXPOSURE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Open Risk</h3>
            <div className="space-y-3">
              {Object.keys(status.positions).length > 0 ? (
                Object.keys(status.positions).map((symbol) => (
                  <div key={symbol} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                    <div>
                      <p className="font-bold text-white text-lg tracking-tight">{symbol}</p>
                      <p className="text-[9px] text-zinc-500 font-bold">SHARES: {status.positions[symbol].amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-emerald-500">${status.positions[symbol].entryPrice}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-tighter font-bold">Entry Price</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 border border-dashed border-zinc-800 rounded-xl text-center bg-zinc-900/20">
                  <Telescope className="mx-auto text-zinc-700 mb-2" size={24} />
                  <p className="text-[10px] font-bold text-zinc-600 uppercase">Scanning Alpha...</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Activity Journal</h3>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[9px] text-zinc-500 uppercase tracking-widest bg-zinc-900/50">
                    <th className="p-4 font-bold">Asset</th>
                    <th className="p-4 font-bold">Side</th>
                    <th className="p-4 font-bold">Confidence</th>
                    <th className="p-4 font-bold text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {status.trades.slice().reverse().slice(0, 8).map((trade: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-500/5 transition-colors">
                      <td className="p-4 font-bold text-white tracking-tighter">{trade.symbol}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${
                          trade.action === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'
                        }`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(trade.confidence || 0.5) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">{(trade.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={`p-4 text-right font-mono font-bold ${trade.profit >= 0 ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {trade.profit !== undefined ? `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, trend }: { title: string, value: string | number, trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors">
      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold text-white tracking-tight">{value}</h4>
        {trend === 'up' ? <ArrowUpRight size={14} className="text-emerald-500" /> : <Activity size={14} className="text-zinc-700" />}
      </div>
    </div>
  );
}