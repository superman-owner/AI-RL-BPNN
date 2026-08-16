import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { PipelineTemplate } from '../../data/templates';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';

interface TopNavProps {
  activeView: 'studio' | 'bpnn';
  onViewChange: (view: 'studio' | 'bpnn') => void;
  onSelectTemplate?: (template: PipelineTemplate) => void;
  onOpenExportModal?: () => void;
  onAutoLayout?: () => void;
  onFitView?: () => void;
  onClearFlow?: () => void;
  nodeCount?: number;
  isRLTraining?: boolean;
  onToggleRLTraining?: () => void;
  rlTelemetry?: QuantTelemetry | null;
  rlLatestStep?: RLEnvironmentStep | null;
  onOpenMT5Deploy?: () => void;
  onResetCamera?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  onViewChange,
  isRLTraining = true,
  onToggleRLTraining,
  rlTelemetry,
  rlLatestStep,
  onOpenMT5Deploy,
}) => {
  return (
    <header className="h-12 w-full vision-glass apple-specular border-b border-white/[0.08] px-4 flex items-center justify-between text-slate-200 z-30 select-none">
      {/* Left: macOS Traffic Lights + Brand + Frameless Glowing View Switcher */}
      <div className="flex items-center gap-4">
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

        {/*  Pure Frameless Glowing View Switcher (No Capsules) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onViewChange('studio')}
            className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <LucideIcons.Network size={13} />
            <span>Flow DAG</span>
          </button>
          <button
            onClick={() => onViewChange('bpnn')}
            className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
              activeView === 'bpnn'
                ? 'text-[#0a84ff] font-bold drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]'
                : 'text-white/50 hover:text-white font-medium'
            }`}
          >
            <LucideIcons.Brain size={13} />
            <span>Live 3D BPNN</span>
          </button>
        </div>
      </div>

      {/* Center + Actions: Compact & Optimized spacing so it never overflows or collides with the screen edge */}
      <div className="flex items-center gap-3.5 text-xs pr-6">
        <button
          onClick={onToggleRLTraining}
          className={`w-[125px] inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
            isRLTraining
              ? 'text-[#007aff] hover:text-[#389bff] drop-shadow-[0_0_8px_rgba(0,122,255,0.8)]'
              : 'text-[#86868b] hover:text-white'
          }`}
        >
          {isRLTraining ? (
            <LucideIcons.Pause size={13} className="fill-[#007aff] text-[#007aff] flex-shrink-0" />
          ) : (
            <LucideIcons.Play size={13} className="fill-[#86868b] text-[#86868b] flex-shrink-0" />
          )}
          <span className="truncate">{isRLTraining ? 'RL Training Active' : 'Paused'}</span>
        </button>

        <div className="h-3.5 w-[1px] bg-white/10 flex-shrink-0" />

        {/* Live Telemetry Stats (Numbers tight to labels, Header start positions locked) */}
        {rlTelemetry && (
          <div className="flex items-center gap-3 text-[11px] text-[#86868b] select-none">
            <div className="w-[74px] inline-flex items-center gap-1 flex-shrink-0">
              <span className="text-[#86868b]">Episodes:</span>
              <strong className="text-white tabular-nums">{rlTelemetry.episodes}</strong>
            </div>

            <div className="w-[88px] inline-flex items-center gap-1 flex-shrink-0">
              <span className="text-[#86868b]">Win Rate:</span>
              <strong className="text-[#30d158] tabular-nums drop-shadow-[0_0_6px_rgba(48,209,88,0.5)]">
                {typeof rlTelemetry.winRate === 'number' ? rlTelemetry.winRate.toFixed(1) : rlTelemetry.winRate}%
              </strong>
            </div>

            <div className="w-[72px] inline-flex items-center gap-1 flex-shrink-0">
              <span className="text-[#86868b]">Sharpe:</span>
              <strong className="text-[#00c7be] tabular-nums drop-shadow-[0_0_6px_rgba(0,199,190,0.5)]">
                {typeof rlTelemetry.annualizedSharpe === 'number'
                  ? rlTelemetry.annualizedSharpe.toFixed(2)
                  : rlTelemetry.annualizedSharpe}
              </strong>
            </div>

            <div className="w-[110px] inline-flex items-center gap-1 flex-shrink-0">
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

        {/* Action Probability Indicator: Locked 92px Fixed Width */}
        <div className="w-[94px] inline-flex items-center gap-1.5 text-xs font-bold tabular-nums flex-shrink-0">
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
