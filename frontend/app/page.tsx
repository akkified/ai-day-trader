'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  Telescope, 
  Wallet,
  History,
  BrainCircuit,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TradingDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Mock data for the graph - in a real app, this would come from your trade history
  const [chartData, setChartData] = useState([
    { name: '00:00', value: 10000 },
    { name: '04:00', value: 10200 },
    { name: '08:00', value: 10150 },
    { name: '12:00', value: 10400 },
    { name: '16:00', value: 10300 },
    { name: '20:00', value: 10550 },
  ]);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error("Backend unreachable");
      const data = await res.json();
      setStatus(data);
      
      // Update chart with live balance if available
      if (data.cash) {
        setChartData(prev => [...prev.slice(-5), { name: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), value: data.cash }]);
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
      alert("Retraining failed. Check connection.");
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
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Waking up the engine...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-zinc-200 p-4 md:p-8 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- MINIMALIST HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Terminal</span>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Quant Trading Dashboard
            </h1>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleRetrain}
              disabled={isTraining}
              className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-5 py-2 rounded-lg transition-all disabled:opacity-50 font-medium text-sm"
            >
              <BrainCircuit size={16} />
              {isTraining ? "Recalibrating..." : "Retrain Model"}
            </button>
            <button 
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-5 py-2 rounded-lg transition-all"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              <span className="text-sm font-medium">Sync</span>
            </button>
          </div>
        </header>

        {/* --- PERFORMANCE GRAPH --- */}
        <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              Equity Curve (USD)
            </h3>
            <span className="text-xs text-zinc-500">Real-time performance tracking</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* --- CORE METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Liquidity" value={`$${status.cash.toLocaleString()}`} change="+2.4%" trend="up" />
          <StatCard title="Open Positions" value={Object.keys(status.positions).length} change="No Risk" trend="neutral" />
          <StatCard title="Total Executions" value={status.trades.length} change="Live" trend="up" />
        </div>

        {/* --- ACTIVE WATCHLIST --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Active Exposure</h3>
            <div className="space-y-3">
              {Object.keys(status.positions).length > 0 ? (
                Object.keys(status.positions).map((symbol) => (
                  <div key={symbol} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white text-lg tracking-tight">{symbol}</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-medium">Standard Lot</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-emerald-500">${status.positions[symbol].entryPrice}</p>
                      <p className="text-[10px] text-zinc-500">Entry Basis</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center">
                  <p className="text-xs text-zinc-500">Waiting for market entry signals...</p>
                </div>
              )}
            </div>
          </div>

          {/* --- ACTIVITY LOG --- */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Order Journal</h3>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
                    <th className="p-4 font-semibold">Asset</th>
                    <th className="p-4 font-semibold">Side</th>
                    <th className="p-4 font-semibold text-center">AI Confidence</th>
                    <th className="p-4 font-semibold text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {status.trades.slice().reverse().map((trade: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 font-medium text-white">{trade.symbol}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                          trade.action === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'
                        }`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-20 h-1 bg-zinc-800 rounded-full">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(trade.confidence || 0.5) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">{(trade.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={`p-4 text-right font-mono font-medium ${
                        trade.profit >= 0 ? 'text-emerald-500' : 'text-zinc-500'
                      }`}>
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

function StatCard({ title, value, change, trend }: { title: string, value: string | number, change: string, trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-semibold text-white tracking-tight">{value}</h4>
        <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md ${
          trend === 'up' ? 'text-emerald-500 bg-emerald-500/5' : 
          trend === 'down' ? 'text-rose-500 bg-rose-500/5' : 
          'text-zinc-500 bg-zinc-500/5'
        }`}>
          {trend === 'up' && <ArrowUpRight size={12} />}
          {trend === 'down' && <ArrowDownRight size={12} />}
          {change}
        </div>
      </div>
    </div>
  );
}