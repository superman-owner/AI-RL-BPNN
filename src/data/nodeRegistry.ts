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

export const GROUPS: NodeGroup[] = [
  { id: 'stage1', label: '1. Data Ingestion', color: '#38bdf8' },
  { id: 'stage2', label: '2. Feature Engineering', color: '#ff9f0a' },
  { id: 'stage3', label: '3. Deep RL Agent', color: '#bf5af2' },
  { id: 'stage4', label: '4. Risk & Guardrails', color: '#ff453a' },
  { id: 'stage5', label: '5. Execution & MT5', color: '#30d158' },
  { id: 'trainer', label: 'Trainer Engine', color: '#6366f1' },
  { id: 'qc', label: 'Quality Control', color: '#10b981' },
  { id: 'tournament', label: 'Tournament', color: '#f59e0b' },
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
};
