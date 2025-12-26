'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Telescope, 
  Wallet,
  History,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';

// Use Render URL from Vercel env, fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TradingDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error("Backend unreachable");
      const data = await res.json();
      setStatus(data);
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
      alert(`🧠 AI Update: ${data.message}`);
      await fetchStatus();
    } catch (err) {
      alert("Failed to trigger retraining. Check Render logs.");
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000); // Sync every 20s
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
           <RefreshCw className="animate-spin text-blue-500" size={48} />
           <BrainCircuit className="absolute inset-0 m-auto text-indigo-400" size={20} />
        </div>
        <p className="animate-pulse tracking-widest text-xs">INITIALIZING NEURAL NETWORKS...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              GEMINI QUANT v1.2
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              NODE_ENV: <span className="text-emerald-500 uppercase">production_stable</span> | 
              DATABASE: <span className="text-indigo-400 uppercase ml-1 text-[9px]">MongoDB_Atlas</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleRetrain}
              disabled={isTraining}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <BrainCircuit size={16} className={isTraining ? "animate-bounce" : ""} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isTraining ? "Learning..." : "Retrain AI"}
              </span>
            </button>
            <button 
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              <span className="text-xs font-bold uppercase tracking-wider">Sync</span>
            </button>
          </div>
        </header>

        {/* --- KEY STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Portfolio Balance" 
            value={`$${status.cash.toLocaleString()}`} 
            icon={<Wallet className="text-blue-400" />} 
          />
          <StatCard 
            title="Active Positions" 
            value={Object.keys(status.positions).length} 
            icon={<Activity className="text-emerald-400" />} 
          />
          <StatCard 
            title="Training Lessons" 
            value={status.trades.length} 
            icon={<History className="text-purple-400" />} 
          />
        </div>

        {/* --- AI SCANNER BOX --- */}
        <section className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <Telescope size={24} className="text-indigo-400" />
            <h3 className="text-xs font-black tracking-widest uppercase">Deep Scan Results</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.keys(status.positions).length > 0 ? (
              Object.keys(status.positions).map((symbol) => (
                <div key={symbol} className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                  <span className="text-sm font-bold">{symbol}</span>
                  <div className="h-4 w-[1px] bg-slate-700"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 uppercase">Entry</span>
                    <span className="text-xs font-mono text-emerald-400">${status.positions[symbol].entryPrice}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-slate-600 text-xs italic">
                <AlertCircle size={14} />
                Neural Engine standing by for market volatility...
              </div>
            )}
          </div>
        </section>

        {/* --- TRADE LOG --- */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-xs font-bold flex items-center gap-2 tracking-widest uppercase">
              <TrendingUp size={16} className="text-emerald-400" /> 
              Execution History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80">
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="p-4 font-bold text-[10px] uppercase tracking-wider">Asset</th>
                  <th className="p-4 font-bold text-[10px] uppercase tracking-wider">Type</th>
                  <th className="p-4 font-bold text-[10px] uppercase tracking-wider">Price</th>
                  <th className="p-4 font-bold text-[10px] uppercase tracking-wider">AI Confidence</th>
                  <th className="p-4 font-bold text-[10px] uppercase tracking-wider text-right">Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {status.trades.slice().reverse().map((trade: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-white">{trade.symbol}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter ${
                        trade.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">${trade.price}</td>
                    <td className="p-4">
                        {/* Confidence Meter */}
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500" 
                                    style={{ width: `${(trade.confidence || 0.5) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-300">
                                {trade.confidence ? (trade.confidence * 100).toFixed(0) : "50"}%
                            </span>
                        </div>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${
                      trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {trade.profit !== undefined ? `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}` : '--'}
                    </td>
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
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl group hover:border-slate-700 transition-all shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold mt-1 text-white tracking-tight">{value}</p>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
          {icon}
        </div>
      </div>
    </div>
  );
}