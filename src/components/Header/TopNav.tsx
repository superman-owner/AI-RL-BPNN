import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { QuantTelemetry, RLEnvironmentStep } from '../../services/fxforgeEngine';
import { useTheme } from '../../context/ThemeContext';

interface TopNavProps {
  activeView?: 'studio' | 'bpnn';
  onViewChange?: (view: 'studio' | 'bpnn') => void;
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
  activeView = 'bpnn',
  onViewChange,
  rlStatus = 'running',
  onStartRL,
  onPauseRL,
  onStopRL,
  rlTelemetry,
  rlLatestStep,
  onOpenMT5Deploy,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <header
      style={{ paddingLeft: '16px', paddingRight: '20px' }}
      className={`h-12 w-full border-b flex items-center justify-between z-30 select-none overflow-x-auto overflow-y-hidden transition-colors duration-200 ${
        isLight
          ? 'bg-white/85 border-black/[0.08] text-[#1d1d1f] shadow-sm backdrop-blur-xl'
          : 'vision-glass apple-specular border-white/[0.08] text-slate-200'
      }`}
    >
      {/* Left: macOS Traffic Lights + Brand + Left Divider */}
      <div className="flex items-center gap-3.5 flex-shrink-0 min-w-max">
        <div className="flex items-center gap-1.5 pr-1">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 cursor-pointer hover:opacity-80 transition-opacity" />
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
            FXFORGE <span className={isLight ? 'text-[#0071e3]' : 'text-[#007aff]'}>LAB</span>
          </span>
        </div>

        {/*  Vertical Divider with perfectly balanced symmetrical spacing on both sides */}
        <div
          style={{ marginRight: '14px' }}
          className={`h-4 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/15' : 'bg-white/15'}`}
        />
      </div>

      {/* Main Suite (Shifted to the Right: 'Connected' & Theme Toggle end exactly 20px from right edge) */}
      <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
        {/*  Pure Frameless Glowing View Switcher */}
        {onViewChange && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => onViewChange('studio')}
              className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                activeView === 'studio'
                  ? isLight
                    ? 'text-[#0071e3] font-bold drop-shadow-[0_0_6px_rgba(0,113,227,0.4)]'
                    : 'text-[#007aff] font-bold drop-shadow-[0_0_8px_rgba(0,122,255,0.7)]'
                  : isLight
                  ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
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
                  ? isLight
                    ? 'text-[#0071e3] font-bold drop-shadow-[0_0_6px_rgba(0,113,227,0.4)]'
                    : 'text-[#0a84ff] font-bold drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]'
                  : isLight
                  ? 'text-[#6e6e73] hover:text-[#1d1d1f] font-medium'
                  : 'text-white/50 hover:text-white font-medium'
              }`}
            >
              <LucideIcons.Brain size={13} />
              <span>Live 3D BPNN</span>
            </button>
          </div>
        )}

        <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

        {/* Controls: Shared START / PAUSE Slot + STOP Button (Locked Widths, Zero Jitter) */}
        <div className="flex items-center gap-3.5 text-xs flex-shrink-0">
          <div className="flex items-center gap-2.5 font-bold flex-shrink-0">
            {/* Combined START / PAUSE Button (Shared Same Position) */}
            {rlStatus === 'running' ? (
              <button
                onClick={onPauseRL}
                className={`w-[66px] inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none ${
                  isLight
                    ? 'text-[#d97706] hover:text-[#b45309]'
                    : 'text-[#ffd60a] hover:text-[#ffe047] drop-shadow-[0_0_8px_rgba(255,214,10,0.85)]'
                }`}
                title="Pause Simulation"
              >
                <LucideIcons.Pause size={11} className={`flex-shrink-0 ${isLight ? 'fill-[#d97706]' : 'fill-[#ffd60a]'}`} />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={onStartRL}
                className={`w-[66px] inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none ${
                  isLight
                    ? 'text-[#28cd41] hover:text-[#1e9a31]'
                    : 'text-[#30d158] hover:text-[#4cd964] drop-shadow-[0_0_8px_rgba(48,209,88,0.85)]'
                }`}
                title={rlStatus === 'paused' ? 'Resume Simulation' : 'Start Simulation'}
              >
                <LucideIcons.Play size={11} className={`flex-shrink-0 ${isLight ? 'fill-[#28cd41]' : 'fill-[#30d158]'}`} />
                <span>START</span>
              </button>
            )}

            {/* STOP Button */}
            <button
              onClick={onStopRL}
              className={`w-[56px] inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap select-none ${
                rlStatus === 'stopped'
                  ? isLight
                    ? 'text-[#d70015]'
                    : 'text-[#ff453a] drop-shadow-[0_0_8px_rgba(255,69,58,0.85)]'
                  : isLight
                  ? 'text-[#8e8e93] hover:text-[#d70015]'
                  : 'text-white/40 hover:text-[#ff453a]'
              }`}
              title="Stop & Reset Simulation"
            >
              <LucideIcons.Square
                size={11}
                className={`flex-shrink-0 ${
                  rlStatus === 'stopped' ? (isLight ? 'fill-[#d70015]' : 'fill-[#ff453a]') : ''
                }`}
              />
              <span>STOP</span>
            </button>
          </div>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* Live Telemetry Stats (Locked start positions, Zero wrapping, Number close to label) */}
          {rlTelemetry && (
            <div className={`flex items-center gap-3 text-[11px] select-none flex-shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
              <div className="w-[98px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <span className="whitespace-nowrap">Win Rate:</span>
                <strong className={`tabular-nums whitespace-nowrap ${isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_6px_rgba(48,209,88,0.5)]'}`}>
                  {typeof rlTelemetry.winRate === 'number' ? rlTelemetry.winRate.toFixed(1) : rlTelemetry.winRate}%
                </strong>
              </div>

              <div className="w-[76px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <span>Sharpe:</span>
                <strong className={`tabular-nums ${isLight ? 'text-[#0071e3]' : 'text-[#00c7be] drop-shadow-[0_0_6px_rgba(0,199,190,0.5)]'}`}>
                  {typeof rlTelemetry.annualizedSharpe === 'number'
                    ? rlTelemetry.annualizedSharpe.toFixed(2)
                    : rlTelemetry.annualizedSharpe}
                </strong>
              </div>

              <div className="w-[118px] inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <span>Reward:</span>
                <strong className={`tabular-nums ${isLight ? 'text-[#d97706]' : 'text-[#ffd60a] drop-shadow-[0_0_6px_rgba(255,214,10,0.5)]'}`}>
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
                      ? isLight ? 'bg-[#28cd41]' : 'bg-[#30d158] shadow-[0_0_8px_#30d158]'
                      : rlLatestStep.action === 2
                      ? isLight ? 'bg-[#d70015]' : 'bg-[#ff453a] shadow-[0_0_8px_#ff453a]'
                      : isLight ? 'bg-[#d97706]' : 'bg-[#ffd60a] shadow-[0_0_8px_#ffd60a]'
                  }`}
                />
                <span
                  className={`truncate ${
                    rlLatestStep.action === 0
                      ? isLight ? 'text-[#28cd41]' : 'text-[#30d158] drop-shadow-[0_0_8px_rgba(48,209,88,0.8)]'
                      : rlLatestStep.action === 2
                      ? isLight ? 'text-[#d70015]' : 'text-[#ff453a] drop-shadow-[0_0_8px_rgba(255,69,58,0.8)]'
                      : isLight ? 'text-[#d97706]' : 'text-[#ffd60a] drop-shadow-[0_0_8px_rgba(255,214,10,0.8)]'
                  }`}
                >
                  {rlLatestStep.action === 0
                    ? 'BUY'
                    : rlLatestStep.action === 2
                    ? 'SELL'
                    : 'HOLD'}
                </span>
              </>
            )}
          </div>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* Deploy MT5 ONNX / ONNX Ready */}
          <button
            onClick={onOpenMT5Deploy}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer flex-shrink-0 group select-none ${
              isLight ? 'text-[#6e6e73] hover:text-[#1d1d1f]' : 'text-[#86868b] hover:text-white'
            }`}
          >
            <LucideIcons.Rocket
              size={13}
              className={`transition-all duration-150 ${
                isLight
                  ? 'text-[#6e6e73] group-hover:text-[#28cd41]'
                  : 'text-[#86868b] group-hover:text-[#30d158] group-hover:drop-shadow-[0_0_8px_rgba(48,209,88,0.85)]'
              }`}
            />
            <span>ONNX Ready</span>
          </button>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* MT5 Connected */}
          <div className="flex items-center gap-1.5 text-[11px] flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#28cd41]' : 'bg-[#30d158] shadow-[0_0_6px_#30d158]'}`} />
            <span className={`font-medium ${isLight ? 'text-[#1d1d1f]' : 'text-[#d1d1d6]'}`}>MT5 Connected</span>
          </div>

          <div className={`h-3.5 w-[1px] flex-shrink-0 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/*  Apple macOS Sliding Theme Switcher (Orb Morphing Sun ☀️ <-> Moon 🌙) */}
          <button
            onClick={toggleTheme}
            style={{
              width: '46px',
              height: '24px',
              borderRadius: '9999px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'var(--mac-cursor-default)',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: isLight
                ? 'inset 0 1px 2px rgba(0, 0, 0, 0.08)'
                : 'inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(10, 132, 255, 0.15)',
              position: 'relative',
              userSelect: 'none',
              transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            className="group flex-shrink-0"
            title={isLight ? 'Switch to Dark Mode (macOS Obsidian)' : 'Switch to Light Mode (macOS Studio)'}
          >
            {/* Background Track Icons (Sun on Left, Moon on Right) */}
            <div className="w-full h-full flex items-center justify-between px-1.5 pointer-events-none select-none">
              <LucideIcons.Sun
                size={10}
                className={`transition-opacity duration-200 ${isLight ? 'opacity-0' : 'opacity-40 text-white/50'}`}
              />
              <LucideIcons.Moon
                size={10}
                className={`transition-opacity duration-200 ${isLight ? 'opacity-40 text-black/40' : 'opacity-0'}`}
              />
            </div>

            {/*  Sliding Orb Sphere with Apple Spring Physics */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isLight ? 'translateX(0px)' : 'translateX(22px)',
                backgroundColor: isLight ? '#ffffff' : '#181820',
                border: isLight ? '0.5px solid rgba(0, 0, 0, 0.08)' : '0.5px solid rgba(255, 255, 255, 0.25)',
                boxShadow: isLight
                  ? '0 2px 5px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.1)'
                  : '0 2px 6px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 0 8px rgba(10, 132, 255, 0.4)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              {isLight ? (
                <LucideIcons.Sun
                  size={10}
                  className="text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]"
                />
              ) : (
                <LucideIcons.Moon
                  size={9.5}
                  className="text-[#60a5fa] drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]"
                />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

