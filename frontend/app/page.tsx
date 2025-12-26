"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  TrendingUp, 
  Wallet, 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Activity,
  Package,
  CircleDollarSign,
  BarChart3,
  FlaskConical,
  Telescope,
  Zap
} from "lucide-react";

/* ===== Types ===== */
type Position = {
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  unrealizedPl?: number;
  plPercent?: number;
};

type Trade = {
  action: "BUY" | "SELL";
  symbol: string;
  price: number;
  amount: number;
  profit?: number;
  reason?: string;
  time: string;
};

type Status = {
  cash: number;
  portfolioValue: number;
  positions: Record<string, Position>;
  trades: Trade[];
};

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [equityHistory, setEquityHistory] = useState<number[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Load Live Status
  async function loadStatus() {
    setIsRefreshing(true);
    try {
      const res = await fetch("http://localhost:4000/status");
      const data: Status = await res.json();
      setStatus(data);
      
      // Update Equity History for the Graph (keep last 30 points)
      setEquityHistory(prev => {
        const newHistory = [...prev, data.portfolioValue];
        return newHistory.slice(-30);
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }

  // Phase 3: Trigger Backtest Simulation
  async function runBacktest() {
    setIsBacktesting(true);
    const mockHistory = [
      { symbol: "AAPL", price: 150, changePercent: 0.5, sentiment: 0.2 },
      { symbol: "NVDA", price: 480, changePercent: 2.1, sentiment: 0.8 },
      { symbol: "AAPL", price: 158, changePercent: 5.3, sentiment: 0.9 },
      { symbol: "TSLA", price: 210, changePercent: -1.5, sentiment: -0.2 },
      { symbol: "AAPL", price: 154, changePercent: -2.1, sentiment: -0.4 },
      { symbol: "NVDA", price: 510, changePercent: 6.2, sentiment: 0.95 },
    ];

    try {
      const res = await fetch("http://localhost:4000/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyData: mockHistory }),
      });
      const data = await res.json();
      setStatus(data);
      // Reset history to show simulation jump
      setEquityHistory([1000, data.portfolioValue]);
    } catch (error) {
      console.error("Backtest failed:", error);
    } finally {
      setIsBacktesting(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // SVG Graph Path Calculation
  const graphPath = useMemo(() => {
    if (equityHistory.length < 2) return "";
    const min = Math.min(...equityHistory);
    const max = Math.max(...equityHistory);
    const range = max - min || 1;
    const width = 200;
    const height = 40;
    
    return equityHistory.map((val, i) => {
      const x = (i / (equityHistory.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  }, [equityHistory]);

  if (!status) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400 font-mono">
      <Activity className="h-6 w-6 animate-spin text-blue-500 mr-3" />
      <p className="tracking-widest">CONNECTING TO NODE...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-100 font-sans">
      
      {/* --- HEADER & ANALYTICS --- */}
      <header className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Zap className="text-yellow-400 fill-yellow-400" size={24} /> 
            QUANT_OS <span className="text-blue-500 text-[10px] font-mono px-2 py-0.5 border border-blue-500/30 rounded bg-blue-500/10">AUTONOMOUS V3</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">
            Last Pulse: {lastUpdated.toLocaleTimeString()} • Signal: <span className="text-emerald-500">Active</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Equity Curve Graph */}
          <div className="hidden xl:block bg-slate-900/50 p-2 rounded-lg border border-slate-800">
            <p className="text-[8px] uppercase text-slate-500 mb-1 font-bold">Equity Curve</p>
            <svg width="200" height="40" className="overflow-visible">
              <path d={graphPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>

          <button 
            onClick={runBacktest}
            disabled={isBacktesting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <FlaskConical className={isBacktesting ? "animate-spin" : ""} size={16} />
            {isBacktesting ? "SIMULATING..." : "RUN BACKTEST"}
          </button>

          <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl">
            <BarChart3 className="text-blue-500 h-5 w-5" />
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-bold leading-none mb-1">Net Worth</p>
              <p className="text-xl font-mono font-bold">${status.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- DISCOVERY SCANNER (How it chooses stocks) --- */}
        <section className="lg:col-span-12 bg-blue-600/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
              <Telescope size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Deep Scan Discovery</h3>
              <p className="text-xs text-slate-400">The bot is currently monitoring volatility across 10+ assets to identify high-confidence entries.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {["AAPL", "NVDA", "TSLA", "AMD", "COIN"].map(s => (
              <span key={s} className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">{s}</span>
            ))}
          </div>
        </section>

        {/* --- POSITIONS --- */}
        <section className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-xs tracking-widest text-slate-400 uppercase">
              <Package size={14} className="text-blue-400" /> Active Exposure
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {Object.keys(status.positions).length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center opacity-20">
                <CircleDollarSign size={48} className="mb-4" />
                <p className="text-sm font-mono uppercase">Liquidity Profile: 100% Cash</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-slate-500 bg-slate-900/30">
                  <tr>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4 text-center">Units</th>
                    <th className="px-6 py-4 text-right">Market Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(status.positions).map(([symbol, pos]) => {
                    const isProfit = (pos.unrealizedPl ?? 0) >= 0;
                    return (
                      <tr key={symbol} className="hover:bg-blue-500/5 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-black text-blue-400">{symbol}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Entry: ${pos.entryPrice.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-5 text-center font-mono font-bold">{pos.amount}</td>
                        <td className="px-6 py-5 text-right font-mono">
                          <div className="text-white font-bold">${pos.currentPrice?.toFixed(2)}</div>
                          <div className={`text-[10px] font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isProfit ? '▲' : '▼'} {pos.plPercent?.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* --- EXECUTION LOG --- */}
        <section className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80">
            <h2 className="flex items-center gap-2 font-bold text-xs tracking-widest text-slate-400 uppercase">
              <History size={14} className="text-purple-400" /> Neural Logs
            </h2>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {status.trades.length === 0 ? (
              <p className="p-12 text-center text-slate-700 font-mono text-xs uppercase">No trade events recorded.</p>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {[...status.trades].reverse().map((trade, i) => (
                  <div key={i} className="p-4 hover:bg-slate-800/40 transition-all border-l-2 border-transparent hover:border-blue-500 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${trade.action === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                        {trade.action === "BUY" ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{trade.symbol}</p>
                          {trade.reason && (
                            <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {trade.reason}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 font-mono">{trade.amount} @ ${trade.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-slate-500 font-mono">{new Date(trade.time).toLocaleTimeString()}</p>
                       {trade.profit !== undefined && (
                        <p className={`text-[10px] font-bold ${trade.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}