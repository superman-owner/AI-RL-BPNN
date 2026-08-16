import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { RLTrainingConfig } from '../../services/fxforgeEngine';

interface TrainingConfigSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  config: RLTrainingConfig;
  onUpdateConfig: (updated: Partial<RLTrainingConfig>) => void;
  onResetDefaults: () => void;
  isRunning?: boolean;
}

export const TrainingConfigSidebar: React.FC<TrainingConfigSidebarProps> = ({
  isOpen,
  onToggle,
  config,
  onUpdateConfig,
  onResetDefaults,
  isRunning = false,
}) => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('friction');

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  // Preset Configurations
  const applyPreset = (preset: 'scalping' | 'daytrading' | 'swing') => {
    if (preset === 'scalping') {
      onUpdateConfig({
        symbol: 'EURUSD',
        primaryTimeframe: 'M5',
        contextTimeframe: 'H1',
        spreadPips: 0.8,
        slippagePips: 0.3,
        maxDrawdownLimit: 5.0,
        takeProfitAtr: 1.5,
        stopLossAtr: 0.8,
        maxHoldingBars: 16,
        inactivityPenalty: 0.0008,
        entropyCoef: 0.03,
      });
    } else if (preset === 'daytrading') {
      onUpdateConfig({
        symbol: 'EURUSD',
        primaryTimeframe: 'M15',
        contextTimeframe: 'H4',
        spreadPips: 1.2,
        slippagePips: 0.5,
        maxDrawdownLimit: 10.0,
        takeProfitAtr: 2.0,
        stopLossAtr: 1.0,
        maxHoldingBars: 32,
        inactivityPenalty: 0.0005,
        entropyCoef: 0.02,
      });
    } else if (preset === 'swing') {
      onUpdateConfig({
        symbol: 'XAUUSD',
        primaryTimeframe: 'H1',
        contextTimeframe: 'D1',
        spreadPips: 2.5,
        slippagePips: 1.0,
        maxDrawdownLimit: 15.0,
        takeProfitAtr: 3.0,
        stopLossAtr: 1.5,
        maxHoldingBars: 64,
        inactivityPenalty: 0.0002,
        entropyCoef: 0.015,
      });
    }
  };

  return (
    <aside
      className={`h-full bg-[#08080d]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col transition-all duration-300 ease-in-out z-30 flex-shrink-0 select-none overflow-hidden ${
        isOpen ? 'w-[330px]' : 'w-0'
      }`}
    >
      {/*  Top Header (Frameless, Zero-Capsule) */}
      <div className="h-12 px-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#0c0c14]/80">
        <div className="flex items-center gap-2.5">
          <LucideIcons.Sliders size={14} className="text-[#0a84ff] drop-shadow-[0_0_8px_rgba(10,132,255,0.7)]" />
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide">RL Hyperparameters</h2>
            <p className="text-[10px] text-[#86868b]">Deep PPO Agent Configuration</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaults}
            title="Reset to Institutional Defaults"
            className="text-[#86868b] hover:text-white transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium"
          >
            <LucideIcons.RotateCcw size={11} />
            <span>Reset</span>
          </button>

          <div className="h-3 w-[1px] bg-white/10" />

          <button
            onClick={onToggle}
            title="Collapse Sidebar"
            className="text-[#86868b] hover:text-white transition-colors cursor-pointer p-0.5"
          >
            <LucideIcons.ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/*  Preset Bar (Frameless Typography, Zero Pills) */}
      <div className="px-4 py-2 border-b border-white/[0.06] bg-[#07070b] flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-medium text-[#636366]">Presets:</span>
        <div className="flex items-center gap-3 text-[11px]">
          <button
            onClick={() => applyPreset('scalping')}
            className="text-[#86868b] hover:text-white transition-colors cursor-pointer font-medium"
          >
            Scalping
          </button>
          <span className="text-white/20">·</span>
          <button
            onClick={() => applyPreset('daytrading')}
            className="text-[#0a84ff] font-semibold drop-shadow-[0_0_6px_rgba(10,132,255,0.6)] cursor-pointer"
          >
            Day Trade
          </button>
          <span className="text-white/20">·</span>
          <button
            onClick={() => applyPreset('swing')}
            className="text-[#86868b] hover:text-white transition-colors cursor-pointer font-medium"
          >
            Swing
          </button>
        </div>
      </div>

      {/*  Scrollable Parameter Controls */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
        
        {/* SECTION 1: TRADING FRICTION & SPREAD */}
        <div className="bg-[#0f0f18] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion('friction')}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <LucideIcons.Coins size={13} className="text-[#ffd60a]" />
              <span>1. Friction & Spread</span>
            </div>
            <LucideIcons.ChevronDown
              size={12}
              className={`text-[#86868b] transition-transform duration-200 ${
                activeAccordion === 'friction' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {activeAccordion === 'friction' && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-white/[0.06] text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-[#86868b]">Spread (Pips):</label>
                  <span className="font-mono text-white text-[11px] font-bold">{config.spreadPips} pips</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={config.spreadPips}
                  onChange={(e) => onUpdateConfig({ spreadPips: parseFloat(e.target.value) })}
                  className="w-full accent-[#ffd60a] bg-white/10 h-1 rounded-full cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">Slippage (Pips)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5.0"
                    value={config.slippagePips}
                    onChange={(e) => onUpdateConfig({ slippagePips: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#007aff]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">Commission ($/Lot)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={config.commissionPerLot}
                    onChange={(e) => onUpdateConfig({ commissionPerLot: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#007aff]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#86868b] block mb-1">Spread Modeling Mode</label>
                <select
                  value={config.spreadMode}
                  onChange={(e) => onUpdateConfig({ spreadMode: e.target.value as 'fixed' | 'dynamic' })}
                  className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#007aff] cursor-pointer"
                >
                  <option value="fixed">Fixed Spread (Constant Pips)</option>
                  <option value="dynamic">Dynamic Market Spread (Volatility-Adaptive)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: RISK MANAGEMENT & LIMITS */}
        <div className="bg-[#0f0f18] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion('risk')}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <LucideIcons.ShieldAlert size={13} className="text-[#ff453a]" />
              <span>2. Risk & Drawdown Limits</span>
            </div>
            <LucideIcons.ChevronDown
              size={12}
              className={`text-[#86868b] transition-transform duration-200 ${
                activeAccordion === 'risk' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {activeAccordion === 'risk' && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-white/[0.06] text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-[#86868b]">Max Allowed Drawdown:</label>
                  <span className="font-mono text-[#ff453a] text-[11px] font-bold">
                    {config.maxDrawdownLimit.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="30.0"
                  step="0.5"
                  value={config.maxDrawdownLimit}
                  onChange={(e) => onUpdateConfig({ maxDrawdownLimit: parseFloat(e.target.value) })}
                  className="w-full accent-[#ff453a] bg-white/10 h-1 rounded-full cursor-pointer"
                />
                <p className="text-[9px] text-[#636366] mt-0.5">Early termination and penalty if drawdown threshold is breached</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">TP Barrier (× ATR)</label>
                  <input
                    type="number"
                    step="0.2"
                    min="0.5"
                    max="10.0"
                    value={config.takeProfitAtr}
                    onChange={(e) => onUpdateConfig({ takeProfitAtr: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-[#30d158] font-mono text-xs focus:outline-none focus:border-[#007aff]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">SL Barrier (× ATR)</label>
                  <input
                    type="number"
                    step="0.2"
                    min="0.2"
                    max="5.0"
                    value={config.stopLossAtr}
                    onChange={(e) => onUpdateConfig({ stopLossAtr: parseFloat(e.target.value) || 0.5 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-[#ff453a] font-mono text-xs focus:outline-none focus:border-[#007aff]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#86868b] block mb-1">Max Holding Period (Bars)</label>
                <input
                  type="number"
                  min="4"
                  max="128"
                  value={config.maxHoldingBars}
                  onChange={(e) => onUpdateConfig({ maxHoldingBars: parseInt(e.target.value, 10) || 32 })}
                  className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#007aff]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#86868b] block mb-1">Reward Optimization Objective</label>
                <select
                  value={config.rewardMetric}
                  onChange={(e) => onUpdateConfig({ rewardMetric: e.target.value as 'sharpe' | 'sortino' | 'pnl' })}
                  className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#007aff] cursor-pointer"
                >
                  <option value="sharpe">Differential Sharpe Ratio (Risk-Adjusted Return)</option>
                  <option value="sortino">Sortino Ratio (Downside Risk Penalized)</option>
                  <option value="pnl">Pure Net Cumulative PnL</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: INACTIVITY & ACTION BALANCING */}
        <div className="bg-[#0f0f18] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion('inactivity')}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <LucideIcons.Flame size={13} className="text-[#ff9f0a]" />
              <span>3. Inactivity & Action Penalty</span>
            </div>
            <LucideIcons.ChevronDown
              size={12}
              className={`text-[#86868b] transition-transform duration-200 ${
                activeAccordion === 'inactivity' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {activeAccordion === 'inactivity' && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-white/[0.06] text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-[#86868b]">Hold Step Penalty:</label>
                  <span className="font-mono text-[#ff9f0a] text-[11px] font-bold">
                    -{config.inactivityPenalty} R
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0001"
                  max="0.0020"
                  step="0.0001"
                  value={config.inactivityPenalty}
                  onChange={(e) => onUpdateConfig({ inactivityPenalty: parseFloat(e.target.value) })}
                  className="w-full accent-[#ff9f0a] bg-white/10 h-1 rounded-full cursor-pointer"
                />
                <p className="text-[9px] text-[#636366] mt-0.5">Penalizes continuous idle holding to encourage active alpha search</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-white font-medium block">Opportunity Cost Penalty</span>
                  <span className="text-[9px] text-[#86868b] block">Penalize staying flat during strong market moves</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableOppCostPenalty}
                  onChange={(e) => onUpdateConfig({ enableOppCostPenalty: e.target.checked })}
                  className="w-4 h-4 accent-[#007aff] rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: ANTI-OVERFITTING & PPO */}
        <div className="bg-[#0f0f18] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion('ppo')}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <LucideIcons.BrainCircuit size={13} className="text-[#bf5af2]" />
              <span>4. Anti-Overfitting & PPO Policy</span>
            </div>
            <LucideIcons.ChevronDown
              size={12}
              className={`text-[#86868b] transition-transform duration-200 ${
                activeAccordion === 'ppo' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {activeAccordion === 'ppo' && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-white/[0.06] text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-[#86868b]">Entropy Regularization (β):</label>
                  <span className="font-mono text-[#bf5af2] text-[11px] font-bold">{config.entropyCoef}</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.08"
                  step="0.005"
                  value={config.entropyCoef}
                  onChange={(e) => onUpdateConfig({ entropyCoef: parseFloat(e.target.value) })}
                  className="w-full accent-[#bf5af2] bg-white/10 h-1 rounded-full cursor-pointer"
                />
                <p className="text-[9px] text-[#636366] mt-0.5">Higher entropy forces action exploration and prevents overfitting</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">Learning Rate (α)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.00005"
                    max="0.005"
                    value={config.learningRate}
                    onChange={(e) => onUpdateConfig({ learningRate: parseFloat(e.target.value) || 0.0003 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#007aff]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">Discount (γ)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.80"
                    max="0.999"
                    value={config.discountFactor}
                    onChange={(e) => onUpdateConfig({ discountFactor: parseFloat(e.target.value) || 0.97 })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#007aff]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#86868b] block mb-1">Target Episodes Target</label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  max="100000"
                  value={config.targetEpisodes}
                  onChange={(e) => onUpdateConfig({ targetEpisodes: parseInt(e.target.value, 10) || 10000 })}
                  className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#007aff]"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: DATA & SYMBOL */}
        <div className="bg-[#0f0f18] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion('data')}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <LucideIcons.BarChart2 size={13} className="text-[#0a84ff]" />
              <span>5. Market & Asset Setup</span>
            </div>
            <LucideIcons.ChevronDown
              size={12}
              className={`text-[#86868b] transition-transform duration-200 ${
                activeAccordion === 'data' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {activeAccordion === 'data' && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-white/[0.06] text-xs">
              <div>
                <label className="text-[10px] text-[#86868b] block mb-1">Trading Asset / Symbol</label>
                <select
                  value={config.symbol}
                  onChange={(e) => onUpdateConfig({ symbol: e.target.value })}
                  className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#007aff] cursor-pointer"
                >
                  <option value="EURUSD">EURUSD (Euro / US Dollar)</option>
                  <option value="GBPUSD">GBPUSD (British Pound / USD)</option>
                  <option value="USDJPY">USDJPY (US Dollar / Yen)</option>
                  <option value="XAUUSD">XAUUSD (Gold Spot / USD)</option>
                  <option value="BTCUSDT">BTCUSDT (Bitcoin Spot)</option>
                  <option value="ETHUSDT">ETHUSDT (Ethereum Spot)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">Primary TF</label>
                  <select
                    value={config.primaryTimeframe}
                    onChange={(e) => onUpdateConfig({ primaryTimeframe: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#007aff] cursor-pointer"
                  >
                    <option value="M1">M1</option>
                    <option value="M5">M5</option>
                    <option value="M15">M15</option>
                    <option value="H1">H1</option>
                    <option value="H4">H4</option>
                    <option value="D1">D1</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#86868b] block mb-1">Context TF</label>
                  <select
                    value={config.contextTimeframe}
                    onChange={(e) => onUpdateConfig({ contextTimeframe: e.target.value })}
                    className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#007aff] cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="H1">H1</option>
                    <option value="H4">H4</option>
                    <option value="D1">D1</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-[#86868b]">Fractional Diff (d):</label>
                  <span className="font-mono text-[#0a84ff] text-[11px] font-bold">{config.fractionalDiffOrder}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={config.fractionalDiffOrder}
                  onChange={(e) => onUpdateConfig({ fractionalDiffOrder: parseFloat(e.target.value) })}
                  className="w-full accent-[#0a84ff] bg-white/10 h-1 rounded-full cursor-pointer"
                />
                <p className="text-[9px] text-[#636366] mt-0.5">Fractionally differentiated stationary series preserving memory features</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/*  Bottom Status Footer (Frameless Typography, Zero Capsules) */}
      <div className="px-4 py-3 border-t border-white/[0.08] bg-[#0c0c14] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-[#86868b]">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[#30d158] shadow-[0_0_6px_#30d158] animate-pulse' : 'bg-[#ffd60a]'}`} />
          <span className="font-medium">{isRunning ? 'Live Training Sync' : 'Engine Ready'}</span>
        </div>
        <span className="text-[11px] font-mono text-[#0a84ff] font-semibold">
          {config.symbol} · {config.primaryTimeframe}
        </span>
      </div>
    </aside>
  );
};
