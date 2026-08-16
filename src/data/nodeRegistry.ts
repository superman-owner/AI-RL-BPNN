export interface NodeFieldDef {
  key: string;
  label: string;
  default: string | number | boolean;
  type?: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export interface NodeDef {
  group: string;
  label: string;
  fields: NodeFieldDef[];
  hasInput: boolean;
  hasOutput: boolean;
  decision?: boolean;
}

export interface NodeGroup {
  id: string;
  label: string;
  color: string;
  icon?: string;
}

export interface NodeItem {
  type: string;
  label: string;
  group: string;
}

export const GROUPS: NodeGroup[] = [
  { id: 'stage1', label: 'Data Ingestion', color: '#38bdf8' },
  { id: 'stage2', label: 'Feature Engineering', color: '#ff9f0a' },
  { id: 'stage3', label: 'Deep RL Agent', color: '#bf5af2' },
  { id: 'stage4', label: 'Risk & Guardrails', color: '#ff453a' },
  { id: 'stage5', label: 'Execution & MT5', color: '#30d158' },
  { id: 'trainer', label: 'Trainer Engine', color: '#6366f1' },
  { id: 'qc', label: 'Quality Control', color: '#10b981' },
  { id: 'tournament', label: 'Tournament Arena', color: '#f59e0b' },
  { id: 'live', label: 'Live Broker IPC', color: '#00c7be' },
  { id: 'remediation', label: 'Remediation', color: '#ec4899' },
  { id: 'output', label: 'Export Artifact', color: '#0a84ff' },
  { id: 'llm', label: 'Quant LLM Copilot', color: '#8b5cf6' },
];

export const NODE_DEFS: Record<string, NodeDef> = {
  mt5_feed: {
    group: 'stage1',
    label: 'MT5 Live Tick Ingestion',
    fields: [
      { key: 'symbol', label: 'Symbol', default: 'EURUSD' },
      { key: 'timeframe', label: 'Timeframe', default: 'M15' },
      { key: 'historyBars', label: 'Lookback Bars', default: 50000 },
    ],
    hasInput: false,
    hasOutput: true,
  },
  binance_feed: {
    group: 'stage1',
    label: 'Binance Spot Orderbook',
    fields: [
      { key: 'symbol', label: 'Pair', default: 'BTCUSDT' },
      { key: 'depth', label: 'Book Depth', default: 50 },
      { key: 'interval', label: 'Interval', default: '1m' },
    ],
    hasInput: false,
    hasOutput: true,
  },
  synthetic_noise: {
    group: 'stage1',
    label: 'GBM Jump Diffusion Noise',
    fields: [
      { key: 'drift', label: 'Drift (μ)', default: 0.0002 },
      { key: 'volatility', label: 'Sigma (σ)', default: 0.0018 },
      { key: 'jumps', label: 'Poisson Jumps', default: '5%' },
    ],
    hasInput: false,
    hasOutput: true,
  },
  fractional_diff: {
    group: 'stage2',
    label: 'Fractional Differentiation',
    fields: [
      { key: 'd_order', label: 'd (Memory Order)', default: 0.40 },
      { key: 'threshold', label: 'Weight Cutoff', default: 0.0001 },
      { key: 'stationarity', label: 'ADF Test Stat', default: -4.82 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  feature_pipeline: {
    group: 'stage2',
    label: 'Stationary State Builder',
    fields: [
      { key: 'features', label: 'State Dim', default: 6 },
      { key: 'scaling', label: 'Scaler', default: 'Z-Score' },
      { key: 'lookback', label: 'Norm Window', default: 20 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  wavelet_denoise: {
    group: 'stage2',
    label: 'Wavelet Transform Filter',
    fields: [
      { key: 'wavelet', label: 'Mother Wavelet', default: 'db4' },
      { key: 'level', label: 'Decomp Level', default: 3 },
      { key: 'mode', label: 'Thresholding', default: 'Soft' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  deep_rl_ppo: {
    group: 'stage3',
    label: 'Deep RL PPO Actor-Critic',
    fields: [
      { key: 'architecture', label: 'Topology', default: '6-64-32-3' },
      { key: 'learningRate', label: 'Learning Rate', default: 0.0003 },
      { key: 'entropyCoef', label: 'Entropy (β)', default: 0.02 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  reward_shaper: {
    group: 'stage3',
    label: 'Differential Sharpe Reward',
    fields: [
      { key: 'metric', label: 'Target', default: 'Diff Sharpe' },
      { key: 'inactivityPenalty', label: 'Idle Penalty', default: -0.0005 },
      { key: 'spreadFriction', label: 'Spread Pip', default: 1.2 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  risk_guard: {
    group: 'stage4',
    label: 'Max Drawdown Guard',
    fields: [
      { key: 'maxDd', label: 'Max DD Threshold', default: '10.0%' },
      { key: 'action', label: 'Breach Action', default: 'Early Stop' },
      { key: 'penalty', label: 'Penalty Score', default: -5.0 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  volatility_killswitch: {
    group: 'stage4',
    label: 'Volatility Circuit Breaker',
    fields: [
      { key: 'atrMax', label: 'ATR Multiplier', default: 3.5 },
      { key: 'cooldown', label: 'Cooldown Bars', default: 12 },
      { key: 'emergencyClose', label: 'Force Liquidate', default: true },
    ],
    hasInput: true,
    hasOutput: true,
  },
  mt5_onnx_deploy: {
    group: 'stage5',
    label: 'MT5 MQL5 ONNX Exporter',
    fields: [
      { key: 'opset', label: 'ONNX Opset', default: 14 },
      { key: 'tensorShape', label: 'Input Shape', default: '[1, 6]' },
      { key: 'eaName', label: 'EA Target', default: 'FXForge_PPO.mq5' },
    ],
    hasInput: true,
    hasOutput: false,
  },
  distributed_trainer: {
    group: 'trainer',
    label: 'Multi-GPU Vectorized PPO',
    fields: [
      { key: 'workers', label: 'Parallel Envs', default: 16 },
      { key: 'batchSize', label: 'Batch Size', default: 2048 },
      { key: 'epochs', label: 'PPO Epochs', default: 10 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  wfa_validator: {
    group: 'qc',
    label: 'Walk-Forward Validator',
    fields: [
      { key: 'windows', label: 'WFA Slices', default: 8 },
      { key: 'trainRatio', label: 'IS/OOS Ratio', default: '70/30' },
      { key: 'minSharpe', label: 'Min OOS Sharpe', default: 1.8 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  elo_tournament: {
    group: 'tournament',
    label: 'Policy Elo Rating Arena',
    fields: [
      { key: 'candidates', label: 'Active Checkpoints', default: 8 },
      { key: 'metric', label: 'Score Metric', default: 'Sortino' },
      { key: 'promoteThreshold', label: 'Top Tier Elo', default: 1500 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  shm_ipc: {
    group: 'live',
    label: 'Zero-Copy Shared Memory IPC',
    fields: [
      { key: 'bufferSize', label: 'Ring Buffer', default: '64 MB' },
      { key: 'latency', label: 'Max Delay', default: '< 50 μs' },
      { key: 'channel', label: 'IPC Pipe', default: 'Global\\FXForge_IPC' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  drift_remediator: {
    group: 'remediation',
    label: 'Concept Drift Auto-Retrain',
    fields: [
      { key: 'driftMetric', label: 'Wasserstein Dist', default: 0.25 },
      { key: 'trigger', label: 'Auto Trigger', default: 'Retrain PPO' },
      { key: 'fallback', label: 'Safe Baseline', default: 'Flat Cash' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  quant_report: {
    group: 'output',
    label: 'Tear Sheet PDF & JSON',
    fields: [
      { key: 'format', label: 'Report Format', default: 'QuantStats HTML' },
      { key: 'benchmark', label: 'Benchmark', default: 'Buy & Hold' },
      { key: 'savePath', label: 'Export Dir', default: './reports/' },
    ],
    hasInput: true,
    hasOutput: false,
  },
  copilot_advisor: {
    group: 'llm',
    label: 'Claude/Gemini Quant Copilot',
    fields: [
      { key: 'model', label: 'LLM Engine', default: 'Gemini 2.5 Flash' },
      { key: 'role', label: 'Prompt Role', default: 'Quant Risk Auditor' },
      { key: 'autoAudit', label: 'Auto Audit DAG', default: true },
    ],
    hasInput: true,
    hasOutput: true,
  },
};

export function nodesByGroup(groupId: string): NodeItem[] {
  return Object.entries(NODE_DEFS)
    .filter(([_, def]) => def.group === groupId)
    .map(([type, def]) => ({
      type,
      label: def.label,
      group: def.group,
    }));
}
