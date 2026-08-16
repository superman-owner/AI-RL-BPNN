import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { PipelineTemplate } from '../../data/templates';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';

interface TopNavProps {
  activeView: 'studio' | 'bpnn';
  onViewChange: (view: 'studio' | 'bpnn') => void;
  isRunning: boolean;
  onRunFlow: () => void;
  onStopFlow: () => void;
  onSelectTemplate?: (template: PipelineTemplate) => void;
  onOpenExportModal: () => void;
  onAutoLayout?: () => void;
  onFitView: () => void;
  onClearFlow: () => void;
  nodeCount?: number;
  // RL Live Telemetry Props
  isRLTraining?: boolean;
  onToggleRLTraining?: () => void;
  rlTelemetry?: QuantTelemetry;
  rlLatestStep?: RLEnvironmentStep | null;
  onOpenMT5Deploy?: () => void;
  onResetCamera?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  onViewChange,
  isRunning,
  onRunFlow,
  onStopFlow,
  onOpenExportModal,
  onFitView,
  onClearFlow,
  isRLTraining = true,
  onToggleRLTraining,
  rlTelemetry,
  rlLatestStep,
  onOpenMT5Deploy,
  onResetCamera,
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

      {/* Center: Controls & Telemetry (Pure Frameless Glowing Buttons, No Capsules) */}
      {activeView === 'studio' ? (
        <div className="flex items-center gap-5">
          {!isRunning ? (
            <button
              onClick={onRunFlow}
              className="flex items-center gap-1.5 text-xs font-bold text-[#007aff] hover:text-[#389bff] drop-shadow-[0_0_8px_rgba(0,122,255,0.6)] transition-all cursor-pointer"
            >
              <LucideIcons.Play size={13} className="fill-[#007aff] text-[#007aff]" />
              <span>Run Pipeline</span>
            </button>
          ) : (
            <button
              onClick={onStopFlow}
              className="flex items-center gap-1.5 text-xs font-bold text-[#ff453a] hover:text-[#ff6961] drop-shadow-[0_0_8px_rgba(255,69,58,0.7)] transition-all animate-pulse cursor-pointer"
            >
              <LucideIcons.Square size={13} className="fill-[#ff453a] text-[#ff453a]" />
              <span>Stop Pipeline</span>
            </button>
          )}

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] transition-all cursor-pointer"
          >
            <LucideIcons.FileCode size={13} className="text-[#007aff]" />
            <span>Export Python</span>
          </button>

          <button
            onClick={onClearFlow}
            title="Reset Flow"
            className="p-1 text-[#86868b] hover:text-[#ff453a] hover:drop-shadow-[0_0_6px_rgba(255,69,58,0.5)] transition-colors cursor-pointer"
          >
            <LucideIcons.Trash2 size={14} />
          </button>
        </div>
      ) : (
        /*  Live 3D BPNN Controls & Telemetry: Pure Frameless Glowing (No Capsules) */
        <div className="flex items-center gap-5 text-xs">
          <button
            onClick={onToggleRLTraining}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              isRLTraining
                ? 'text-[#007aff] hover:text-[#389bff] drop-shadow-[0_0_8px_rgba(0,122,255,0.8)]'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            {isRLTraining ? (
              <LucideIcons.Pause size={13} className="fill-[#007aff] text-[#007aff]" />
            ) : (
              <LucideIcons.Play size={13} className="fill-[#86868b] text-[#86868b]" />
            )}
            <span>{isRLTraining ? 'RL Training Active' : 'Paused'}</span>
          </button>

          <div className="h-3.5 w-[1px] bg-white/10" />

          {/* Live Telemetry Stats */}
          {rlTelemetry && (
            <div className="flex items-center gap-4 text-[11px] text-[#86868b]">
              <span>
                Episodes: <strong className="text-white tabular-nums">{rlTelemetry.episodes}</strong>
              </span>
              <span>
                Win Rate: <strong className="text-[#30d158] tabular-nums drop-shadow-[0_0_6px_rgba(48,209,88,0.5)]">{rlTelemetry.winRate}%</strong>
              </span>
              <span>
                Sharpe: <strong className="text-[#00c7be] tabular-nums drop-shadow-[0_0_6px_rgba(0,199,190,0.5)]">{rlTelemetry.annualizedSharpe}</strong>
              </span>
              <span>
                Reward: <strong className="text-[#ffd60a] tabular-nums drop-shadow-[0_0_6px_rgba(255,214,10,0.5)]">{rlTelemetry.totalReward}</strong>
              </span>
            </div>
          )}

          {/* Action Probability Indicator: Frameless Glowing Text */}
          {rlLatestStep && (
            <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  rlLatestStep.action === 0
                    ? 'bg-[#30d158] shadow-[0_0_8px_#30d158]'
                    : rlLatestStep.action === 2
                    ? 'bg-[#ff453a] shadow-[0_0_8px_#ff453a]'
                    : 'bg-[#ffd60a] shadow-[0_0_8px_#ffd60a]'
                }`}
              />
              <span
                className={`${
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
            </div>
          )}
        </div>
      )}

      {/* Right: Actions (Frameless Glowing Buttons, No Capsules) */}
      <div className="flex items-center gap-4">
        {activeView === 'studio' ? (
          <button
            onClick={onFitView}
            title="Fit Flow to Screen (Ctrl+1)"
            className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] transition-all cursor-pointer"
          >
            <LucideIcons.Maximize2 size={13} className="text-[#38bdf8]" />
            <span>Fit Screen</span>
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenMT5Deploy}
              className="flex items-center gap-1.5 text-xs font-bold text-[#30d158] hover:text-[#3cd864] drop-shadow-[0_0_8px_rgba(48,209,88,0.6)] transition-all cursor-pointer"
            >
              <LucideIcons.Rocket size={13} className="text-[#30d158]" />
              <span>Deploy MT5 ONNX</span>
            </button>

            <button
              onClick={onResetCamera}
              title="Reset Camera Angle"
              className="p-1 text-[#86868b] hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] transition-colors cursor-pointer"
            >
              <LucideIcons.RotateCcw size={13} />
            </button>
          </div>
        )}

        <div className="h-3.5 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3 text-[11px] text-[#86868b]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] shadow-[0_0_6px_#30d158]" />
            <span className="text-[#d1d1d6]">Neural Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
};
