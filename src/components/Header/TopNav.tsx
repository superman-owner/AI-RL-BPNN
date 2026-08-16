import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { PipelineTemplate } from '../../data/templates';

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
}) => {
  return (
    <header className="h-12 w-full vision-glass apple-specular border-b border-white/[0.08] px-4 flex items-center justify-between text-slate-200 z-30 select-none">
      {/* Left: macOS Traffic Lights + Brand + View Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 pr-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 cursor-pointer hover:opacity-80 transition-opacity" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-tight text-white">
            AlphaFlow <span className="text-[#0a84ff]">Studio</span>
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10" />

        {/*  Apple Vision Pro Segmented View Switcher */}
        <div className="flex items-center bg-[#14141e]/90 p-0.5 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => onViewChange('studio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-[#007aff] text-white shadow-[0_2px_8px_rgba(0,122,255,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LucideIcons.Network size={13} />
            <span>Flow DAG</span>
          </button>
          <button
            onClick={() => onViewChange('bpnn')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'bpnn'
                ? 'bg-[#0a84ff] text-white shadow-[0_2px_8px_rgba(10,132,255,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LucideIcons.Brain size={13} />
            <span>Live 3D BPNN</span>
          </button>
        </div>
      </div>

      {/* Center: Execution & Export Controls */}
      <div className="flex items-center gap-5">
        {!isRunning ? (
          <button
            onClick={onRunFlow}
            className="flex items-center gap-1.5 text-xs font-bold text-[#007aff] hover:text-[#389bff] transition-all cursor-pointer"
          >
            <LucideIcons.Play size={13} className="fill-[#007aff] text-[#007aff]" />
            <span>Run Pipeline</span>
          </button>
        ) : (
          <button
            onClick={onStopFlow}
            className="flex items-center gap-1.5 text-xs font-bold text-[#ff453a] hover:text-[#ff6961] transition-all animate-pulse cursor-pointer"
          >
            <LucideIcons.Square size={13} className="fill-[#ff453a] text-[#ff453a]" />
            <span>Stop Pipeline</span>
          </button>
        )}

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-all cursor-pointer"
        >
          <LucideIcons.FileCode size={13} className="text-[#007aff]" />
          <span>Export Python</span>
        </button>

        <button
          onClick={onClearFlow}
          title="Reset Flow"
          className="p-1 text-[#86868b] hover:text-[#ff453a] transition-colors cursor-pointer"
        >
          <LucideIcons.Trash2 size={14} />
        </button>
      </div>

      {/* Right: Fit Screen Button + Neural Engine Indicator */}
      <div className="flex items-center gap-4">
        {activeView === 'studio' && (
          <button
            onClick={onFitView}
            title="Fit Flow to Screen (Ctrl+1)"
            className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.06] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
          >
            <LucideIcons.Maximize2 size={14} className="text-[#38bdf8]" />
            <span>Fit Screen</span>
          </button>
        )}

        <div className="h-3.5 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3 text-[11px] font-mono text-[#86868b]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
            <span className="text-[#d1d1d6]">Neural Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
};
