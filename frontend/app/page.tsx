'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, RefreshCw, Telescope, Wallet, History,
  BrainCircuit, AlertCircle, ArrowUpRight, ArrowDownRight, Monitor
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MONITORED_SYMBOLS = ["NVDA", "AAPL", "TSLA", "AMD", "MSFT"];

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
  const [chartData, setChartData] = useState([{ name: 'Init', value: 10000 }]);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error("Backend unreachable");
      const data = await res.json();
      setStatus(data);
      
      if (data.cash) {
        setChartData(prev => {
          const newPoint = { 
            name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            value: parseFloat(data.cash) 
          };
          const lastPoint = prev[prev.length - 1];
          if (lastPoint && lastPoint.value === newPoint.value) return prev;
          return [...prev.slice(-15), newPoint];
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
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <Activity className="animate-pulse text-blue-500" size={40} />
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Neural Engine Syncing</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-zinc-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-900">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Autonomous Terminal v2.2</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Market Intelligence</h1>
          </div>
          
          <div className="flex gap-3">
            <button onClick={fetchStatus} disabled={isRefreshing} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-5 py-2.5 rounded-xl transition-all text-xs font-bold uppercase">
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> Sync
            </button>
          </div>
        </header>

        {/* --- TOP ROW: CHART & PERFORMANCE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={16} className="text-blue-500" />
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Neural Watchlist</h3>
              </div>
              <div className="flex gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                {MONITORED_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSymbol(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedSymbol === s ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <StockChartPane symbol={selectedSymbol} />
          </section>

          <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-6 h-full border-l-blue-500/20 border-l-2">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-8">
                <TrendingUp size={16} className="text-blue-500" /> Portfolio Equity
              </h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                    <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-3 mt-8">
                <StatCard title="Available Cash" value={`$${status.cash}`} trend="up" />
                <StatCard title="Active Signals" value={Object.keys(status.positions).length} trend="neutral" />
                <StatCard title="System Trades" value={status.trades.length} trend="up" />
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM ROW: RISK & LOG --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* OPEN RISK / POSITIONS */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Wallet size={14} /> Open Risk
            </h3>
            <div className="space-y-3">
              {Object.keys(status.positions).length > 0 ? (
                Object.keys(status.positions).map((symbol) => {
                  const pos = status.positions[symbol];
                  const entry = parseFloat(pos.entryPrice || 0);
                  const amount = pos.amount || 1;
                  return (
                    <div key={symbol} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex justify-between items-center hover:bg-zinc-900/60 transition-all border-l-4 border-l-blue-500/40">
                      <div>
                        <p className="font-black text-white text-xl tracking-tighter">{symbol}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                          {amount} Shares @ ${entry.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-md font-mono font-bold text-blue-400">${(amount * entry).toFixed(2)}</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-black">Hold Value</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center bg-zinc-900/10">
                  <Telescope className="mx-auto text-zinc-700 mb-3" size={30} />
                  <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Awaiting Entry Signals</p>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVITY JOURNAL */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={14} /> Order Journal
            </h3>
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl overflow-hidden backdrop-blur-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/60 text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-900/50">
                    <th className="p-5 font-bold">Asset / Qty</th>
                    <th className="p-5 font-bold">Action</th>
                    <th className="p-5 font-bold">AI Confidence</th>
                    <th className="p-5 font-bold text-right">P/L Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {status.trades.slice().reverse().slice(0, 10).map((trade: any, idx: number) => {
                    // Safe numeric conversion for UI
                    const rawConf = parseFloat(trade.confidence);
                    const confPercent = isNaN(rawConf) ? 0 : Math.round(rawConf * 100);
                    
                    return (
                      <tr key={idx} className="hover:bg-blue-500/[0.03] transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-white tracking-tighter text-sm">{trade.symbol}</div>
                          <div className="text-[9px] text-zinc-500 font-bold uppercase">{trade.amount || 1} Shares</div>
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                            trade.action === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            {trade.action}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-700" 
                                style={{ width: `${confPercent}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">{confPercent}%</span>
                          </div>
                        </td>
                        <td className={`p-5 text-right font-mono font-bold text-sm ${trade.profit > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {trade.profit !== undefined ? `${trade.profit >= 0 ? '+' : ''}${parseFloat(trade.profit).toFixed(2)}` : '--'}
                        </td>
                      </tr>
                    );
                  })}
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
    <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-white tracking-tight">{value}</h4>
        {trend === 'up' ? <ArrowUpRight size={16} className="text-emerald-500" /> : <Activity size={16} className="text-zinc-700 shadow-sm" />}
      </div>
    </div>
  );
}