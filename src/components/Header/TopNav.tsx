import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';

interface TopNavProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  rlStatus?: 'running' | 'paused' | 'stopped';
  onStartRL?: () => void;
  onPauseRL?: () => void;
  onStopRL?: () => void;
  rlTelemetry?: QuantTelemetry | null;
  rlLatestStep?: RLEnvironmentStep | null;
  onOpenMT5Deploy?: () => void;
  onResetCamera?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isSidebarOpen = true,
  onToggleSidebar,
  rlStatus = 'running',
  onStartRL,
  onPauseRL,
  onStopRL,
  rlTelemetry,
  rlLatestStep,
  onOpenMT5Deploy,
}) => {
  return (
    <header className="h-12 w-full vision-glass apple-specular border-b border-white/[0.08] px-4 flex items-center gap-4 text-slate-200 z-30 select-none overflow-x-auto no-scrollbar">
      {/* Left: macOS Traffic Lights + Brand + Parameters Toggle */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 pr-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 cursor-pointer hover:opacity-80 transition-opacity" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-tight text-white">
            FXFORGE <span className="text-[#007aff]">LAB</span>
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10" />

        {/*  RL Parameters Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
            isSidebarOpen
              ? 'text-[#0a84ff] font-bold drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]'
              : 'text-white/60 hover:text-white font-medium'
          }`}
          title="Toggle RL Hyperparameters Sidebar"
        >
          <LucideIcons.Sliders size={13} />
          <span>RL Parameters</span>
        </button>
      </div>

      <div className="h-3.5 w-[1px] bg-white/10 flex-shrink-0" />

      {/* Controls: Shared START / PAUSE Slot + STOP Button (Locked Widths, Zero Jitter) */}
      <div className="flex items-center gap-3.5 text-xs flex-shrink-0">
        <div className="flex items-center gap-2.5 font-bold flex-shrink-0">
          {/* Combined START / PAUSE Button (Shared Same Position) */}
          {rlStatus === 'running' ? (
            <button
              onClick={onPauseRL}
              className="w-[66px] inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd60a] hover:text-[#ffe047] drop-shadow-[0_0_8px_rgba(255,214,10,0.85)] transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none"
              title="Pause Simulation"
            >
              <LucideIcons.Pause size={11} className="fill-[#ffd60a] flex-shrink-0" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={onStartRL}
              className="w-[66px] inline-flex items-center gap-1.5 text-xs font-bold text-[#30d158] hover:text-[#4cd964] drop-shadow-[0_0_8px_rgba(48,209,88,0.85)] transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none"
              title={rlStatus === 'paused' ? 'Resume Simulation' : 'Start Simulation'}
            >
              <LucideIcons.Play size={11} className="fill-[#30d158] flex-shrink-0" />
              <span>START</span>
            </button>
          )}

          {/* STOP Button */}
          <button
            onClick={onStopRL}
            className={`w-[56px] inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none ${
              rlStatus === 'stopped'
                ? 'text-[#ff453a] drop-shadow-[0_0_8px_rgba(255,69,58,0.85)]'
                : 'text-white/40 hover:text-[#ff453a]'
            }`}
            title="Stop & Reset Simulation"
          >
            <LucideIcons.Square size={11} className={`flex-shrink-0 ${rlStatus === 'stopped' ? 'fill-[#ff453a]' : ''}`} />
            <span>STOP</span>
          </button>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10 flex-shrink-0" />

        {/* Live Telemetry Stats (Locked start positions, Zero wrapping, Number close to label) */}
        {rlTelemetry && (
          <div className="flex items-center gap-3 text-[11px] text-[#86868b] select-none flex-shrink-0">
            <div className="w-[98px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <span className="text-[#86868b] whitespace-nowrap">Win Rate:</span>
              <strong className="text-[#30d158] tabular-nums whitespace-nowrap drop-shadow-[0_0_6px_rgba(48,209,88,0.5)]">
                {typeof rlTelemetry.winRate === 'number' ? rlTelemetry.winRate.toFixed(1) : rlTelemetry.winRate}%
              </strong>
            </div>

            <div className="w-[76px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <span className="text-[#86868b]">Sharpe:</span>
              <strong className="text-[#00c7be] tabular-nums drop-shadow-[0_0_6px_rgba(0,199,190,0.5)]">
                {typeof rlTelemetry.annualizedSharpe === 'number'
                  ? rlTelemetry.annualizedSharpe.toFixed(2)
                  : rlTelemetry.annualizedSharpe}
              </strong>
            </div>

            <div className="w-[118px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
              <span className="text-[#86868b]">Reward:</span>
              <strong className="text-[#ffd60a] tabular-nums drop-shadow-[0_0_6px_rgba(255,214,10,0.5)]">
                {typeof rlTelemetry.totalReward === 'number'
                  ? rlTelemetry.totalReward > 0
                    ? `+${rlTelemetry.totalReward.toFixed(4)}`
                    : rlTelemetry.totalReward.toFixed(4)
                  : rlTelemetry.totalReward}
              </strong>
            </div>
          </div>
        )}

        {/* Action Probability Indicator: Locked 96px Fixed Width, Zero wrap */}
        <div className="w-[96px] inline-flex items-center gap-1.5 text-xs font-bold tabular-nums flex-shrink-0 whitespace-nowrap">
          {rlLatestStep && (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  rlLatestStep.action === 0
                    ? 'bg-[#30d158] shadow-[0_0_8px_#30d158]'
                    : rlLatestStep.action === 2
                    ? 'bg-[#ff453a] shadow-[0_0_8px_#ff453a]'
                    : 'bg-[#ffd60a] shadow-[0_0_8px_#ffd60a]'
                }`}
              />
              <span
                className={`truncate ${
                  rlLatestStep.action === 0
                    ? 'text-[#30d158] drop-shadow-[0_0_8px_rgba(48,209,88,0.8)]'
                    : rlLatestStep.action === 2
                    ? 'text-[#ff453a] drop-shadow-[0_0_8px_rgba(255,69,58,0.8)]'
                    : 'text-[#ffd60a] drop-shadow-[0_0_8px_rgba(255,214,10,0.8)]'
                }`}
              >
                {rlLatestStep.action === 0
                  ? 'BUY (LONG)'
                  : rlLatestStep.action === 2
                  ? 'SELL (SHORT)'
                  : 'HOLD (FLAT)'}
              </span>
            </>
          )}
        </div>

        <div className="h-3.5 w-[1px] bg-white/10 flex-shrink-0" />

        {/* Deploy MT5 ONNX */}
        <button
          onClick={onOpenMT5Deploy}
          className="flex items-center gap-1.5 text-xs font-bold text-[#30d158] hover:text-[#3cd864] drop-shadow-[0_0_8px_rgba(48,209,88,0.6)] transition-all cursor-pointer flex-shrink-0"
        >
          <LucideIcons.Rocket size={13} className="text-[#30d158]" />
          <span>Deploy MT5 ONNX</span>
        </button>

        <div className="h-3.5 w-[1px] bg-white/10 flex-shrink-0" />

        {/* MT5 Connected */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#86868b] flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] shadow-[0_0_6px_#30d158]" />
          <span className="text-[#d1d1d6] font-medium">MT5 Connected</span>
        </div>
      </div>
    </header>
  );
};
