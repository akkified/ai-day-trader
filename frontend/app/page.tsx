'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Telescope, 
  Wallet,
  ArrowUpRight,
  History
} from 'lucide-react';

// Use the Render URL from Vercel environment variables, fallback to local for dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TradingDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("❌ Failed to fetch from:", API_BASE_URL);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={48} />
        <p className="animate-pulse">WAKING UP NEURAL ENGINE...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-400">
              FishyStock AI
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              STATUS: <span className="text-emerald-500">AUTONOMOUS_TRADING_ACTIVE</span>
            </p>
          </div>
          <button 
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span className="text-sm font-bold">FORCE SYNC</span>
          </button>
        </header>

        {/* --- KEY STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Portfolio Balance" 
            value={`$${status.cash.toLocaleString()}`} 
            icon={<Wallet className="text-blue-400" />} 
          />
          <StatCard 
            title="Open Positions" 
            value={Object.keys(status.positions).length} 
            icon={<Activity className="text-emerald-400" />} 
          />
          <StatCard 
            title="Total Trades" 
            value={status.trades.length} 
            icon={<History className="text-purple-400" />} 
          />
        </div>

        {/* --- DEEP SCAN DISCOVERY --- */}
        <section className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Telescope size={28} className="text-indigo-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest uppercase">Autonomous Hunter Active</h3>
              <p className="text-[10px] text-slate-500 font-mono">Live Gainers from Render Backend</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {status.trades.length > 0 ? (
              // Displaying the last 4 symbols the bot interacted with
              [...new Set(status.trades.map((t: any) => t.symbol))].slice(-4).map((symbol: any, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-xs font-bold text-white uppercase">{symbol}</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-600 italic">Scanning Market...</span>
            )}
          </div>
        </section>

        {/* --- ACTIVE TRADES TABLE --- */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" /> 
              TRADE LOG (REAL-TIME)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Symbol</th>
                  <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Action</th>
                  <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Price</th>
                  <th className="p-4 font-medium uppercase tracking-wider text-[10px]">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {status.trades.slice().reverse().map((trade: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold">{trade.symbol}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black ${
                        trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">${trade.price}</td>
                    <td className="p-4 text-xs text-slate-500">{trade.reason || 'Technical Entry'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl group hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold mt-1 text-white">{value}</p>
        </div>
        <div className="p-2 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
    </div>
  );
}