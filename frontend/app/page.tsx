'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, RefreshCw, Telescope, Wallet, History,
  BrainCircuit, AlertCircle, ArrowUpRight, ArrowDownRight, Monitor, PieChart
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MONITORED_SYMBOLS = ["NVDA", "AAPL", "TSLA", "AMD", "MSFT"];

function StockChartPane({ symbol }: { symbol: string }) {
  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-zinc-800/50 bg-black shadow-2xl">
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
        <Activity className="animate-pulse text-blue-500" size={40} />
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Neural Engine Syncing</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-zinc-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-900/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Autonomous Terminal v2.3</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">NEURAL<span className="text-blue-500">OPS</span></h1>
          </div>
          
          <div className="flex gap-3">
            <div className="hidden md:flex flex-col items-end justify-center px-4 border-r border-zinc-800">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Server Status</span>
              <span className="text-xs font-mono text-emerald-500">OPERATIONAL</span>
            </div>
            <button onClick={fetchStatus} disabled={isRefreshing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl transition-all text-xs font-black uppercase shadow-lg shadow-blue-500/20">
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? "Syncing..." : "Manual Sync"}
            </button>
          </div>
        </header>

        {/* --- TOP ROW: CHART & TOTAL EQUITY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/20 p-2 rounded-2xl">
              <div className="flex items-center gap-2 px-2">
                <Monitor size={16} className="text-blue-500" />
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Live Market Feed</h3>
              </div>
              <div className="flex gap-1 bg-black p-1 rounded-xl border border-zinc-800/50">
                {MONITORED_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSymbol(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      selectedSymbol === s ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:text-zinc-400'
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
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-6 h-full flex flex-col border-t-4 border-t-blue-500 shadow-xl">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-8">
                <TrendingUp size={16} className="text-blue-500" /> Net Worth Performance
              </h3>
              
              <div className="mb-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Current Total Equity</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-black text-white tracking-tighter">${status.totalValue}</h2>
                    <span className={`text-xs font-bold ${parseFloat(status.totalProfit) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {parseFloat(status.totalProfit) >= 0 ? '▲' : '▼'} ${Math.abs(status.totalProfit)}
                    </span>
                </div>
              </div>

              <div className="h-[180px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                    <Area type="stepAfter" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 mt-8">
                <StatCard title="Liquid Cash" value={`$${status.cash}`} trend="neutral" />
                <StatCard title="Total Trades" value={status.trades.length} trend="up" />
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM ROW: ASSET ALLOCATION & JOURNAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* OPEN RISK / ALLOCATION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <PieChart size={14} className="text-blue-500" /> Allocation
                </h3>
                <span className="text-[10px] font-mono text-zinc-600">{Object.keys(status.positions).length} Active</span>
            </div>
            
            <div className="space-y-3">
              {Object.keys(status.positions).length > 0 ? (
                Object.keys(status.positions).map((symbol) => {
                  const pos = status.positions[symbol];
                  const entry = parseFloat(pos.entryPrice || 0);
                  const amount = pos.amount || 1;
                  const currentVal = (amount * entry);
                  const weight = ((currentVal / parseFloat(status.totalValue)) * 100).toFixed(1);

                  return (
                    <div key={symbol} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl group hover:border-blue-500/50 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="font-black text-white text-xl tracking-tighter leading-none">{symbol}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{amount} Units @ ${entry.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-1 rounded-md">
                            {weight}% Weight
                        </div>
                      </div>
                      {/* Allocation Bar */}
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${weight}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-center bg-zinc-900/10">
                  <Telescope className="mx-auto text-zinc-800 mb-3" size={30} />
                  <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest leading-loose">Liquidity at 100%<br/>Searching for Entry...</p>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVITY JOURNAL */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={14} className="text-blue-500" /> Intelligence Log
            </h3>
            <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl overflow-hidden backdrop-blur-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/60 text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-900/50">
                    <th className="p-5 font-bold">Execution</th>
                    <th className="p-5 font-bold">Side</th>
                    <th className="p-5 font-bold">Neural Confidence</th>
                    <th className="p-5 font-bold text-right">Profit/Loss</th>
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
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-md border ${
                            trade.action === 'BUY' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' : 'border-zinc-700 text-zinc-500'
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
      </div>
    </main>
  );
}

function StatCard({ title, value, trend }: { title: string, value: string | number, trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl hover:bg-zinc-900/60 transition-all group">
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 group-hover:text-zinc-400">{title}</p>
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-black text-white tracking-tighter">{value}</h4>
        {trend === 'up' ? <ArrowUpRight size={16} className="text-emerald-500" /> : <Activity size={16} className="text-zinc-800 group-hover:text-blue-500 transition-colors" />}
      </div>
    </div>
  );
}