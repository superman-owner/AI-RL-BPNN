import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  generateLossData,
  FEATURE_IMPORTANCE,
} from '../../data/mockAnalytics';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';
import { fxforgeEngine } from '../../services/fxforgeEngine';

interface AnalyticsDrawerProps {
  logs: string[];
  isRunning: boolean;
  onClearLogs: () => void;
  rlTelemetry?: QuantTelemetry | null;
  latestStep?: RLEnvironmentStep | null;
}

//  Adaptive Automotive Radial Instrument Dial (Seamless Normal/Maximized Scaling)
interface MiniRadialGaugeProps {
  value: string | number;
  label: string;
  sublabel: string;
  percentage: number; // 0 to 100
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  isMaximized: boolean;
}

const MiniRadialGauge: React.FC<MiniRadialGaugeProps> = ({
  value,
  label,
  sublabel,
  percentage,
  color,
  glowColor,
  icon,
  isMaximized,
}) => {
  const radius = isMaximized ? 30 : 18;
  const circumference = 2 * Math.PI * radius;
  // 240 degree sweep
  const arcLength = (240 / 360) * circumference;
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  return (
    <div
      className={`bg-gradient-to-b from-[#161624]/95 to-[#0d0d14]/95 border border-white/[0.08] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.5)] min-h-0 transition-all duration-200 ${
        isMaximized ? 'rounded-3xl' : 'rounded-2xl'
      }`}
      style={{ padding: isMaximized ? '18px 16px' : '8px 10px' }}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute top-2 left-1/2 -translate-x-1/2 rounded-full blur-xl opacity-20 pointer-events-none ${
          isMaximized ? 'w-24 h-24' : 'w-14 h-14'
        }`}
        style={{ backgroundColor: color }}
      />

      {/*  Top Radial Gauge Dial (Adaptive Size: 44px normal / 74px maximized) */}
      <div
        className={`relative flex-shrink-0 flex items-center justify-center z-10 transition-all duration-200 ${
          isMaximized ? 'w-18 h-18' : 'w-11 h-11'
        }`}
      >
        <svg
          className="w-full h-full rotate-[150deg]"
          viewBox={isMaximized ? '0 0 74 74' : '0 0 48 48'}
        >
          {/* Background Track */}
          <circle
            cx={isMaximized ? '37' : '24'}
            cy={isMaximized ? '37' : '24'}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={isMaximized ? 4.5 : 3.5}
            strokeDasharray={arcLength}
            strokeDashoffset={0}
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <circle
            cx={isMaximized ? '37' : '24'}
            cy={isMaximized ? '37' : '24'}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={isMaximized ? 5.5 : 4}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white/90 z-20">
          {icon}
        </div>
      </div>

      {/*  Apple SF Pro Gauge Value & Label Cluster */}
      <div
        className={`font-black tracking-tight leading-tight z-10 transition-all ${
          isMaximized ? 'text-2xl mt-2 mb-0.5' : 'text-base mt-1.5 mb-0.5'
        }`}
        style={{ color, fontFamily: 'var(--font-sans)' }}
      >
        {value}
      </div>

      <div
        className={`font-bold uppercase tracking-wider text-[#86868b] z-10 leading-tight ${
          isMaximized ? 'text-xs mb-0.5' : 'text-[9px] mb-0.5'
        }`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </div>

      <div
        className={`font-medium text-[#636366] z-10 truncate max-w-full px-1 leading-tight ${
          isMaximized ? 'text-[11px]' : 'text-[9px]'
        }`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {sublabel}
      </div>
    </div>
  );
};

export const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({
  logs,
  isRunning,
  onClearLogs,
  rlTelemetry,
  latestStep,
}) => {
  const [activeTab, setActiveTab] = useState<'equity' | 'loss' | 'features' | 'logs'>('equity');
  const [isMinimized, setIsMinimized] = useState(true); // Default minimized so it never overlaps DAG canvas
  const isMaximized = false;
  const [rewardData, setRewardData] = useState(() => fxforgeEngine.getRewardHistory());
  const [lossData] = useState(generateLossData());
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'logs') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Sync real-time reward curve with BPNN & engine
  useEffect(() => {
    setRewardData(fxforgeEngine.getRewardHistory());
  }, [rlTelemetry, latestStep]);

  const currentTelemetry = rlTelemetry || fxforgeEngine.getTelemetry();
  const totalReturnPct =
    ((currentTelemetry.currentEquity - currentTelemetry.initialCapital) / currentTelemetry.initialCapital) * 100;
  const winRateVal = currentTelemetry.winRate;
  const sharpeVal = currentTelemetry.annualizedSharpe;
  const maxDdVal = currentTelemetry.maxDrawdown;
  const sortinoVal = currentTelemetry.annualizedSortino;
  const totalTradesVal = currentTelemetry.totalTrades;
  const totalRewardVal = currentTelemetry.totalReward;
  const profitFactorVal =
    currentTelemetry.losingTrades > 0
      ? ((currentTelemetry.winningTrades * 1.5) / currentTelemetry.losingTrades).toFixed(2)
      : currentTelemetry.winningTrades > 0
      ? '3.50'
      : '1.00';

  return (
    <div
      className={`border-t border-white/[0.08] bg-[#07070b] transition-all duration-200 flex flex-col z-20 ${
        isMinimized ? 'h-10' : isMaximized ? 'h-[580px]' : 'h-[350px]'
      }`}
    >
      {/*  Top Segmented HUD Navigation Bar (Seamless borderless glass) */}
      <div
        className="h-10 bg-[#07070b] flex items-center justify-between select-none flex-shrink-0 transition-all duration-200"
        style={{ paddingLeft: isMaximized ? '42px' : '36px', paddingRight: '24px' }}
      >
        <div className="flex items-center gap-6 h-full">
          <button
            onClick={() => {
              setActiveTab('equity');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-xs transition-all cursor-pointer ${
              activeTab === 'equity' && !isMinimized
                ? 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span>RL Reward Curve & Telemetry</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('loss');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-xs transition-all cursor-pointer ${
              activeTab === 'loss' && !isMinimized
                ? 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span>Model Convergence</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('features');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-xs transition-all cursor-pointer ${
              activeTab === 'features' && !isMinimized
                ? 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span>Signal Weight Matrix</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              setIsMinimized(false);
            }}
            className={`h-full flex items-center text-xs transition-all cursor-pointer ${
              activeTab === 'logs' && !isMinimized
                ? 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <span>MT5 Experts Journal ({logs.length})</span>
          </button>
        </div>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="text-[10px] font-mono text-emerald-400 mr-2 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              TELEMETRY ACTIVE
            </span>
          )}

          {activeTab === 'logs' && (
            <button
              onClick={onClearLogs}
              title="Clear Console"
              className="p-1 rounded-lg hover:bg-white/[0.08] text-[#86868b] hover:text-white cursor-pointer"
            >
              <LucideIcons.Trash2 size={12} />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-[#86868b] hover:text-white cursor-pointer"
            title={isMinimized ? 'Expand Drawer' : 'Collapse Drawer'}
          >
            <LucideIcons.ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/*  Drawer Full-Width Inset Area */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden px-3.5 py-[5px] bg-black/60 min-h-0">
          {/* TAB 1: HUD TELEMETRY & GAUGES */}
          {activeTab === 'equity' && (
            <div className="h-full flex flex-col lg:flex-row gap-3.5 min-h-0">
              {/*  Left Cluster: Master Speedometer & 4 Cockpit Radial Gauges */}
              <div
                className={`flex flex-col gap-3 flex-shrink-0 min-h-0 transition-all duration-200 ${
                  isMaximized ? 'w-full lg:w-[480px]' : 'w-full lg:w-[420px]'
                }`}
              >
                {/* 1. Master Tachometer Speedometer Arch */}
                <div
                  className={`bg-gradient-to-b from-[#181826]/95 to-[#0e0e16]/95 border border-white/[0.08] relative overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex items-center justify-between flex-shrink-0 transition-all duration-200 ${
                    isMaximized ? 'rounded-3xl' : 'rounded-2xl'
                  }`}
                  style={{ padding: isMaximized ? '18px 28px' : '12px 22px' }}
                >
                  {/* Background Radial Glow */}
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#007aff]/15 via-[#30d158]/20 to-[#af52de]/15 blur-2xl rounded-full pointer-events-none ${
                      isMaximized ? 'w-56 h-28' : 'w-36 h-20'
                    }`}
                  />

                  {/* Left Specs: Total Return & Profit Factor */}
                  <div className="z-10 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-[#86868b]">
                      <LucideIcons.Gauge size={isMaximized ? 14 : 12} className="text-[#30d158]" />
                      <span
                        className={`font-bold tracking-widest uppercase ${
                          isMaximized ? 'text-[11px]' : 'text-[9px]'
                        }`}
                      >
                        Master RL Alpha Tachometer
                      </span>
                    </div>

                    <div className={`flex items-baseline gap-2 ${isMaximized ? 'mt-2' : 'mt-1'}`}>
                      <div
                        className={`font-black tracking-tight text-white leading-none ${
                          isMaximized ? 'text-4xl' : 'text-2xl'
                        }`}
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        {totalReturnPct >= 0 ? `+${totalReturnPct.toFixed(1)}` : totalReturnPct.toFixed(1)}
                        <span
                          className={`font-bold ml-0.5 ${
                            totalReturnPct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                          } ${isMaximized ? 'text-2xl' : 'text-base'}`}
                        >
                          %
                        </span>
                      </div>
                      <span
                        className={`font-semibold text-[#86868b] ${
                          isMaximized ? 'text-xs' : 'text-[10px]'
                        }`}
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        Total Return
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-2 font-semibold text-[#30d158] ${
                        isMaximized ? 'mt-2 text-xs' : 'mt-1 text-[11px]'
                      }`}
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      <LucideIcons.TrendingUp size={isMaximized ? 13 : 11} />
                      <span>PF {profitFactorVal}x</span>
                      <span className="text-white/30">•</span>
                      <span className="text-[#00c7be]">
                        {totalRewardVal >= 0 ? `+${totalRewardVal.toFixed(1)}` : totalRewardVal.toFixed(1)} R Reward
                      </span>
                    </div>
                  </div>

                  {/* Right: Master 180° Illuminated Arc Gauge */}
                  <div
                    className={`relative flex items-center justify-center z-10 flex-shrink-0 transition-all ${
                      isMaximized ? 'w-36 h-26' : 'w-28 h-20'
                    }`}
                  >
                    <svg className="w-full h-full" viewBox="0 0 110 75">
                      <defs>
                        <linearGradient id="audiSpeedoGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#007aff" />
                          <stop offset="50%" stopColor="#30d158" />
                          <stop offset="100%" stopColor="#ffd60a" />
                        </linearGradient>
                      </defs>

                      {/* Graduated Tick Marks */}
                      {[0, 25, 50, 75, 100].map((tick, i) => {
                        const angle = Math.PI * (1 + tick / 100);
                        const x1 = 55 + 34 * Math.cos(angle);
                        const y1 = 58 + 34 * Math.sin(angle);
                        const x2 = 55 + 40 * Math.cos(angle);
                        const y2 = 58 + 40 * Math.sin(angle);
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(255, 255, 255, 0.25)"
                            strokeWidth={isMaximized ? 1.8 : 1.5}
                          />
                        );
                      })}

                      {/* Background Arch Track */}
                      <path
                        d="M 15 58 A 40 40 0 0 1 95 58"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth={isMaximized ? 6.5 : 5.5}
                        strokeLinecap="round"
                      />

                      {/* Glowing Gradient Speed Arc */}
                      <path
                        d="M 15 58 A 40 40 0 0 1 95 58"
                        fill="none"
                        stroke="url(#audiSpeedoGrad)"
                        strokeWidth={isMaximized ? 7.5 : 6.5}
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 * (1 - Math.min(100, Math.max(0, winRateVal)) / 100)}
                        strokeLinecap="round"
                        style={{
                          filter: 'drop-shadow(0 0 7px rgba(48, 209, 88, 0.7))',
                          transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />

                      {/* Digital HUD Speedometer Text */}
                      <text
                        x="55"
                        y="52"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isMaximized ? 15 : 13}
                        fontWeight="bold"
                      >
                        {winRateVal.toFixed(1)}%
                      </text>
                      <text
                        x="55"
                        y="63"
                        textAnchor="middle"
                        fill="#86868b"
                        fontSize={isMaximized ? 7.5 : 6.5}
                        fontWeight="bold"
                        letterSpacing="0.05em"
                      >
                        WIN RATE
                      </text>
                    </svg>
                  </div>
                </div>

                {/* 2. Four Adaptive Vertical Cockpit Dial Cards (2x2 Grid) */}
                <div className={`grid grid-cols-2 flex-1 min-h-0 ${isMaximized ? 'gap-3.5' : 'gap-2.5'}`}>
                  {/* Sharpe Gauge */}
                  <MiniRadialGauge
                    label="Sharpe"
                    value={sharpeVal.toFixed(2)}
                    sublabel="Tier 1 Institutional"
                    percentage={Math.min(100, Math.max(0, (sharpeVal / 4.0) * 100))}
                    color="#30d158"
                    glowColor="rgba(48, 209, 88, 0.6)"
                    icon={<LucideIcons.TrendingUp size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Max Drawdown Gauge */}
                  <MiniRadialGauge
                    label="Max DD"
                    value={`-${maxDdVal.toFixed(1)}%`}
                    sublabel="Safety Limit"
                    percentage={Math.min(100, Math.max(0, (maxDdVal / 25.0) * 100))}
                    color="#ff453a"
                    glowColor="rgba(255, 69, 58, 0.6)"
                    icon={<LucideIcons.ShieldAlert size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Sortino Gauge */}
                  <MiniRadialGauge
                    label="Sortino"
                    value={sortinoVal.toFixed(2)}
                    sublabel="Downside Alpha"
                    percentage={Math.min(100, Math.max(0, (sortinoVal / 5.0) * 100))}
                    color="#00c7be"
                    glowColor="rgba(0, 199, 190, 0.6)"
                    icon={<LucideIcons.Zap size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />

                  {/* Trades Gauge */}
                  <MiniRadialGauge
                    label="Trades"
                    value={totalTradesVal}
                    sublabel={`${currentTelemetry.winningTrades}W / ${currentTelemetry.losingTrades}L (${winRateVal.toFixed(0)}%)`}
                    percentage={Math.min(100, Math.max(0, winRateVal))}
                    color="#bf5af2"
                    glowColor="rgba(191, 90, 242, 0.6)"
                    icon={<LucideIcons.Activity size={isMaximized ? 22 : 15} strokeWidth={2.5} />}
                    isMaximized={isMaximized}
                  />
                </div>
              </div>

              {/*  Right Cluster: RL Cumulative Reward Curve & Policy Telemetry */}
              <div
                className={`flex-1 h-full min-h-0 bg-gradient-to-b from-[#14141d]/95 to-[#0c0c12]/95 border border-white/[0.08] flex flex-col shadow-[0_10px_25px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all duration-200 ${
                  isMaximized ? 'rounded-3xl' : 'rounded-2xl'
                }`}
                style={{ padding: isMaximized ? '22px 28px 16px 28px' : '16px 22px 10px 22px' }}
              >
                {/* Header Legend */}
                <div
                  className={`flex items-center justify-between z-10 flex-shrink-0 ${
                    isMaximized ? 'text-xs mb-3' : 'text-[11px] mb-2'
                  }`}
                >
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_8px_#30d158]" />
                    RL Reward Curve & Telemetry
                  </span>
                  <div className="flex items-center gap-4 text-[#86868b]">
                    <span className="text-[#30d158] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-0.5 bg-[#30d158]" /> Cumulative Reward (
                      {totalRewardVal >= 0 ? `+${totalRewardVal.toFixed(1)}` : totalRewardVal.toFixed(1)} R)
                    </span>
                    <span className="text-[#00c7be] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-0.5 bg-[#00c7be]" /> 10-Ep MA
                    </span>
                    <span className="text-[#636366] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-0.5 bg-[#636366]" /> Market Baseline
                    </span>
                  </div>
                </div>

                {/* RL Reward Area Chart */}
                <div className="flex-1 w-full min-h-0 z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rewardData} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hudEquityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#30d158" stopOpacity={0.45} />
                          <stop offset="50%" stopColor="#30d158" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="episode" stroke="#636366" tick={{ fontSize: isMaximized ? 11 : 9 }} />
                      <YAxis stroke="#636366" tick={{ fontSize: isMaximized ? 11 : 9 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(14, 14, 20, 0.95)',
                          borderColor: 'rgba(255,255,255,0.12)',
                          fontSize: isMaximized ? '12px' : '11px',
                          borderRadius: '16px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                          backdropFilter: 'blur(25px)',
                        }}
                        formatter={(val: any, name: any) => [
                          `${Number(val) > 0 ? '+' : ''}${Number(val).toFixed(2)} R`,
                          name === 'cumulativeReward'
                            ? 'Cum Reward'
                            : name === 'rewardMa10'
                            ? '10-Ep MA'
                            : 'Market Return',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulativeReward"
                        name="cumulativeReward"
                        stroke="#30d158"
                        strokeWidth={isMaximized ? 3 : 2}
                        fillOpacity={1}
                        fill="url(#hudEquityGrad)"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(48, 209, 88, 0.35))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rewardMa10"
                        name="rewardMa10"
                        stroke="#00c7be"
                        strokeWidth={1.8}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="marketBaseline"
                        name="marketBaseline"
                        stroke="#636366"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOSS */}
          {activeTab === 'loss' && (
            <div
              className={`h-full bg-gradient-to-b from-[#14141d]/90 to-[#0c0c12]/90 border border-white/[0.08] flex flex-col shadow-inner min-h-0 ${
                isMaximized ? 'rounded-3xl' : 'rounded-2xl'
              }`}
              style={{ padding: isMaximized ? '22px 28px 16px 28px' : '16px 22px 10px 22px' }}
            >
              <div className="flex items-center justify-between px-1 mb-2 text-xs text-[#86868b] flex-shrink-0">
                <span className="font-bold text-white">Loss & Validation AUC Telemetry</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#00c7be]">● Train Loss</span>
                  <span className="text-[#af52de]">● Val Loss</span>
                  <span className="text-[#ff9f0a]">● Val AUC</span>
                </div>
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lossData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="epoch" stroke="#636366" tick={{ fontSize: isMaximized ? 11 : 9 }} />
                    <YAxis yAxisId="left" stroke="#636366" tick={{ fontSize: isMaximized ? 11 : 9 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#ff9f0a"
                      tick={{ fontSize: isMaximized ? 11 : 9 }}
                      domain={[0.4, 0.8]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(14, 14, 20, 0.95)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        fontSize: isMaximized ? '12px' : '11px',
                        borderRadius: '16px',
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="trainLoss"
                      stroke="#00c7be"
                      strokeWidth={isMaximized ? 2.5 : 1.8}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="valLoss"
                      stroke="#af52de"
                      strokeWidth={isMaximized ? 2.5 : 1.8}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="metricValue"
                      stroke="#ff9f0a"
                      strokeWidth={isMaximized ? 2.5 : 1.8}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: FEATURES */}
          {activeTab === 'features' && (
            <div
              className={`h-full bg-gradient-to-b from-[#14141d]/90 to-[#0c0c12]/90 border border-white/[0.08] flex flex-col shadow-inner min-h-0 ${
                isMaximized ? 'rounded-3xl' : 'rounded-2xl'
              }`}
              style={{ padding: isMaximized ? '22px 28px 16px 28px' : '16px 22px 10px 22px' }}
            >
              <div className="px-1 mb-2 text-xs font-bold text-white flex-shrink-0">
                Relative Feature Gain Importance Matrix
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={FEATURE_IMPORTANCE}
                    layout="vertical"
                    margin={{ top: 12, right: 20, left: 60, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" stroke="#636366" tick={{ fontSize: isMaximized ? 11 : 9 }} />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      stroke="#d1d1d6"
                      tick={{ fontSize: isMaximized ? 11 : 9 }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(14, 14, 20, 0.95)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        fontSize: isMaximized ? '12px' : '11px',
                        borderRadius: '16px',
                      }}
                      formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}% Gain`, 'Importance']}
                    />
                    <Bar dataKey="importance" fill="#ff9f0a" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 4: MT5 EXPERTS JOURNAL */}
          {activeTab === 'logs' && (
            <div
              className={`h-full bg-[#0a0a0f] border border-white/[0.08] flex flex-col shadow-inner min-h-0 overflow-hidden ${
                isMaximized ? 'rounded-3xl' : 'rounded-2xl'
              }`}
            >
              {/* MT5 Table Header */}
              <div className="h-8 bg-[#13131b] border-b border-white/[0.08] flex items-center text-xs font-semibold text-[#86868b] select-none flex-shrink-0">
                <div className="w-[230px] pl-6 pr-4 border-r border-white/[0.08] flex items-center gap-1.5">
                  <span>Time</span>
                </div>
                <div className="w-[160px] px-4 border-r border-white/[0.08] flex items-center">
                  <span>Source</span>
                </div>
                <div className="flex-1 px-4 flex items-center justify-between">
                  <span>Message</span>
                  <div className="flex items-center gap-3 text-[10px] text-[#636366] pr-4">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" /> Real-time IPC
                    </span>
                    <button
                      onClick={onClearLogs}
                      className="hover:text-white transition-colors cursor-pointer text-[10px] text-[#86868b] underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* MT5 Table Body Rows */}
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] select-text divide-y divide-white/[0.04]">
                {logs.map((log, index) => {
                  const now = new Date();
                  const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(
                    now.getDate()
                  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
                    now.getMinutes()
                  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(
                    ((index + 1) * 48) % 900 + 100
                  ).padStart(3, '0')}`;

                  let source = 'Tester';
                  let message = log;
                  let msgColor = 'text-white/90';

                  if (log.includes('[SYSTEM]')) {
                    source = 'Terminal';
                    message = log.replace('[SYSTEM]', '').trim();
                  } else if (log.includes('[CUDA]') || log.includes('[IPC]')) {
                    source = 'Tester';
                    message = log.replace(/\[CUDA\]|\[IPC\]/g, '').trim();
                    msgColor = 'text-[#00c7be]';
                  } else if (log.includes('[DAG]') || log.includes('[DATA]')) {
                    source = 'DataFeed';
                    message = log.replace(/\[DAG\]|\[DATA\]/g, '').trim();
                  } else if (log.includes('[FEAT]') || log.includes('[LABEL]')) {
                    source = 'FXForge Engine';
                    message = log.replace(/\[FEAT\]|\[LABEL\]/g, '').trim();
                  } else if (log.includes('[TRAIN]') || log.includes('[ONNX]')) {
                    source = 'ONNX Policy';
                    message = log.replace(/\[TRAIN\]|\[ONNX\]/g, '').trim();
                    msgColor = 'text-[#ffd60a]';
                  } else if (log.includes('[BACKTEST]') || log.includes('[TRADE]') || log.includes('[READY]')) {
                    source = 'FXForge Expert';
                    message = log.replace(/\[BACKTEST\]|\[TRADE\]|\[READY\]/g, '').trim();
                    msgColor = 'text-[#30d158] font-semibold';
                  } else if (log.includes('[ERROR]')) {
                    source = 'Expert';
                    message = log.replace('[ERROR]', '').trim();
                    msgColor = 'text-[#ff453a] font-semibold';
                  }

                  return (
                    <div
                      key={index}
                      className="flex items-center min-h-[26px] py-1 hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Time Column with MT5 Bullet */}
                      <div className="w-[230px] pl-6 pr-4 border-r border-white/[0.06] text-[#d1d1d6] flex items-center gap-2 flex-shrink-0">
                        <span className="text-[#86868b] text-[10px] select-none">•</span>
                        <span>{timeStr}</span>
                      </div>

                      {/* Source Column */}
                      <div className="w-[160px] px-4 border-r border-white/[0.06] text-[#a1a1aa] flex-shrink-0 truncate font-medium">
                        {source}
                      </div>

                      {/* Message Column */}
                      <div className={`flex-1 px-4 ${msgColor} truncate pr-6`}>
                        {message}
                      </div>
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
