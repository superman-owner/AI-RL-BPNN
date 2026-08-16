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
  { id: 'input', label: '1. Input & Strategy', color: '#38bdf8' },
  { id: 'fc1', label: '2. Hidden Layer 1 (FC1)', color: '#ff9f0a' },
  { id: 'regularization', label: '3. Anti-Overfitting & Norm', color: '#30d158' },
  { id: 'fc2', label: '4. Hidden Layer 2 (FC2)', color: '#bf5af2' },
  { id: 'reward', label: '5. Reward & Shaping Rules', color: '#f59e0b' },
  { id: 'output', label: '6. Output & MT5 Compiler', color: '#0a84ff' },
  { id: 'trainer', label: 'Trainer Engine', color: '#6366f1' },
  { id: 'qc', label: 'Quality Control', color: '#10b981' },
  { id: 'tournament', label: 'Tournament Arena', color: '#ec4899' },
  { id: 'live', label: 'Live Broker IPC', color: '#00c7be' },
  { id: 'llm', label: 'Quant LLM Copilot', color: '#8b5cf6' },
];

export const NODE_DEFS: Record<string, NodeDef> = {
  // =========================================================================
  // 1. 📥 หมวด INPUT NODES (ดึงข้อมูลและเลือกกลยุทธ์)
  // =========================================================================
  strategy_preset_return: {
    group: 'input',
    label: 'Strategy Preset & Return Window',
    fields: [
      {
        key: 'preset',
        label: 'Strategy Preset',
        default: '🥇 Standard Quant (RET [5, 10, 20])',
        type: 'select',
        options: [
          '🥇 Standard Quant (RET [5, 10, 20])',
          '🌀 Fibonacci Scale (RET [3, 8, 21])',
          '⚡ Ultra-Fast Scalper (RET [2, 5, 10])',
          '🌊 Macro Trend Follower (RET [10, 25, 50])',
          '🛠️ Custom Configuration',
        ],
      },
      {
        key: 'timeframe',
        label: 'Timeframe',
        default: 'M15',
        type: 'select',
        options: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'],
      },
      { key: 'symbol', label: 'Asset Symbol', default: 'XAUUSD', type: 'string' },
      {
        key: 'bars_count',
        label: 'Bars Count',
        default: '10,000',
        type: 'select',
        options: ['5,000', '10,000', '20,000', '50,000'],
      },
    ],
    hasInput: false,
    hasOutput: true,
  },
  volatility_indicator: {
    group: 'input',
    label: 'Volatility & Indicator Node',
    fields: [
      { key: 'vol_window', label: 'Volatility Window', default: 10, type: 'number' },
      { key: 'sma_period', label: 'SMA Baseline Period', default: 20, type: 'number' },
      {
        key: 'metric',
        label: 'Formula Metric',
        default: 'ATR Normalized',
        type: 'select',
        options: ['Standard Deviation %', 'ATR Normalized', 'Bollinger %B'],
      },
    ],
    hasInput: true,
    hasOutput: true,
  },
  position_feedback: {
    group: 'input',
    label: 'Position Feedback Node',
    fields: [
      {
        key: 'encoding',
        label: 'Position Encoding',
        default: 'Discrete {-1: Short, 0: Flat, +1: Long}',
        type: 'select',
        options: [
          'Discrete {-1: Short, 0: Flat, +1: Long}',
          'Continuous Lot Size',
        ],
      },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // Legacy Input Aliases
  mt5_feed: {
    group: 'input',
    label: 'MT5 Live Tick Ingestion',
    fields: [
      { key: 'symbol', label: 'Symbol', default: 'XAUUSD' },
      { key: 'timeframe', label: 'Timeframe', default: 'M15', type: 'select', options: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'] },
      { key: 'historyBars', label: 'Lookback Bars', default: 50000 },
    ],
    hasInput: false,
    hasOutput: true,
  },
  fractional_diff: {
    group: 'input',
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
    group: 'input',
    label: 'Stationary State Builder',
    fields: [
      { key: 'features', label: 'State Dim', default: 6 },
      { key: 'scaling', label: 'Scaler', default: 'Z-Score', type: 'select', options: ['Z-Score', 'MinMax', 'RobustScaler'] },
      { key: 'lookback', label: 'Norm Window', default: 20 },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 2. 🧠 หมวด HIDDEN LAYER 1 NODES (สกัดฟีเจอร์ย่อย)
  // =========================================================================
  fc1_dense_expansion: {
    group: 'fc1',
    label: 'Dense Feature Expansion (FC1)',
    fields: [
      {
        key: 'units',
        label: 'Neuron Count (Units)',
        default: '64 ⭐',
        type: 'select',
        options: ['32', '64 ⭐', '128'],
      },
      {
        key: 'activation',
        label: 'Activation Function',
        default: 'LeakyReLU (alpha=0.1) ⭐',
        type: 'select',
        options: ['LeakyReLU (alpha=0.1) ⭐', 'GELU', 'ELU', 'ReLU', 'Mish'],
      },
      {
        key: 'weight_init',
        label: 'Weight Initialization',
        default: 'Kaiming Normal (He) ⭐',
        type: 'select',
        options: ['Kaiming Normal (He) ⭐', 'Xavier Uniform', 'Orthogonal'],
      },
      { key: 'use_bias', label: 'Use Bias', default: true, type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  hidden_layer: {
    group: 'fc1',
    label: 'Hidden Layer Architecture',
    fields: [
      {
        key: 'hidden_layers',
        label: 'Hidden Layers',
        default: '64 -> 32',
        type: 'select',
        options: ['32 -> 16', '64 -> 32', '128 -> 64 -> 32'],
      },
      {
        key: 'activation',
        label: 'Activation',
        default: 'Mish',
        type: 'select',
        options: ['Mish', 'GELU', 'ReLU', 'Swish', 'Tanh'],
      },
      { key: 'dropout', label: 'Dropout Rate', default: 0.1 },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 3. 🛡️ หมวด ANTI-OVERFITTING & REGULARIZATION NODES (กันจำข้อสอบเก่า)
  // =========================================================================
  spatial_dropout: {
    group: 'regularization',
    label: 'Spatial Dropout Node',
    fields: [
      { key: 'rate', label: 'Dropout Rate (p)', default: 0.15, type: 'number' },
      {
        key: 'mode',
        label: 'Dropout Mode',
        default: 'Standard Dropout',
        type: 'select',
        options: ['Standard Dropout', 'Inverted Dropout'],
      },
    ],
    hasInput: true,
    hasOutput: true,
  },
  layer_normalization: {
    group: 'regularization',
    label: 'Layer Normalization Node',
    fields: [
      {
        key: 'norm_type',
        label: 'Norm Type',
        default: 'LayerNorm (Recommended for RL) ⭐',
        type: 'select',
        options: ['LayerNorm (Recommended for RL) ⭐', 'RMSNorm', 'None'],
      },
      { key: 'eps', label: 'Epsilon (ε)', default: '1e-5', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  l2_weight_decay: {
    group: 'regularization',
    label: 'L2 Weight Decay Regularizer',
    fields: [
      { key: 'decay', label: 'Weight Decay (λ)', default: '1e-4', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  gradient_clipping: {
    group: 'regularization',
    label: 'Gradient Clipping Node',
    fields: [
      { key: 'max_norm', label: 'Max Gradient Norm', default: 1.0, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 4. ⚡ หมวด HIDDEN LAYER 2 NODES (สังเคราะห์ภาพรวมกลยุทธ์)
  // =========================================================================
  fc2_bottleneck_synthesizer: {
    group: 'fc2',
    label: 'Strategy Bottleneck Synthesizer (FC2)',
    fields: [
      {
        key: 'units',
        label: 'Neuron Count (Units)',
        default: '32 ⭐',
        type: 'select',
        options: ['16', '32 ⭐', '64'],
      },
      {
        key: 'activation',
        label: 'Activation Function',
        default: 'LeakyReLU (alpha=0.1)',
        type: 'select',
        options: ['LeakyReLU (alpha=0.1)', 'GELU', 'Tanh'],
      },
      {
        key: 'residual',
        label: 'Residual Connection',
        default: 'Enable x + F(x)',
        type: 'select',
        options: ['Enable x + F(x)', 'Disable'],
      },
    ],
    hasInput: true,
    hasOutput: true,
  },
  ppo_policy: {
    group: 'fc2',
    label: 'Deep RL PPO Actor-Critic',
    fields: [
      {
        key: 'hidden_layers',
        label: 'Hidden Layers',
        default: '64 -> 32',
        type: 'select',
        options: ['32 -> 16', '64 -> 32', '128 -> 64 -> 32'],
      },
      { key: 'actor_lr', label: 'Learning Rate', default: 0.0003 },
      { key: 'clip_epsilon', label: 'Clip Epsilon', default: 0.2 },
      { key: 'gamma', label: 'Discount Gamma', default: 0.99 },
      { key: 'batch_size', label: 'Batch Size', default: 64 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  deep_rl_ppo: {
    group: 'fc2',
    label: 'Deep RL PPO Actor-Critic',
    fields: [
      {
        key: 'hidden_layers',
        label: 'Hidden Layers',
        default: '64 -> 32',
        type: 'select',
        options: ['32 -> 16', '64 -> 32', '128 -> 64 -> 32'],
      },
      { key: 'learningRate', label: 'Learning Rate', default: 0.0003 },
      { key: 'entropyCoef', label: 'Entropy (β)', default: 0.02 },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 5. 🎯 หมวด REWARD & SHAPING NODES (กฎเกณฑ์การเทรด)
  // =========================================================================
  friction_spread_cost: {
    group: 'reward',
    label: 'Friction Cost & Spread Node',
    fields: [
      { key: 'spread_pip', label: 'Spread (Pips)', default: 0.15, type: 'number' },
      { key: 'commission', label: 'Commission (USD/Lot)', default: 0.00, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  anti_inactivity_reward: {
    group: 'reward',
    label: 'Anti-Inactivity & Opportunity Cost',
    fields: [
      { key: 'idle_penalty', label: 'Idle Penalty (λ)', default: -0.0005, type: 'number' },
      { key: 'opp_cost_multiplier', label: 'Opportunity Multiplier', default: '0.50x', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  reward_shaper: {
    group: 'reward',
    label: 'Differential Sharpe Reward',
    fields: [
      { key: 'metric', label: 'Target', default: 'Diff Sharpe' },
      { key: 'inactivityPenalty', label: 'Idle Penalty', default: -0.0005 },
      { key: 'spreadFriction', label: 'Spread Pip', default: 1.2 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  var_guardrail: {
    group: 'reward',
    label: 'VaR Risk Guardrail',
    fields: [
      { key: 'max_drawdown', label: 'Max Drawdown', default: '5.0%' },
      { key: 'var_confidence', label: 'VaR Confidence', default: 0.99 },
      { key: 'max_leverage', label: 'Max Leverage', default: 3.0 },
    ],
    hasInput: true,
    hasOutput: true,
  },
  risk_guard: {
    group: 'reward',
    label: 'Max Drawdown Guard',
    fields: [
      { key: 'maxDd', label: 'Max DD Threshold', default: '10.0%' },
      { key: 'action', label: 'Breach Action', default: 'Early Stop' },
      { key: 'penalty', label: 'Penalty Score', default: -5.0 },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // 6. 🚀 หมวด OUTPUT & DEPLOY NODES (เคาะออเดอร์และส่ง MT5)
  // =========================================================================
  fc3_policy_action_head: {
    group: 'output',
    label: 'Policy Softmax Action Head (FC3)',
    fields: [
      {
        key: 'classes',
        label: 'Output Classes',
        default: '3 [0: BUY, 1: HOLD, 2: SELL]',
        type: 'string',
      },
      { key: 'entropy_beta', label: 'Entropy Bonus (β)', default: 0.08, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  onnx_mt5_compiler: {
    group: 'output',
    label: '1-Click ONNX MT5 Compiler',
    fields: [
      {
        key: 'export_mode',
        label: 'Export Mode',
        default: 'TorchScript Standalone Single-File (.onnx)',
        type: 'select',
        options: ['TorchScript Standalone Single-File (.onnx)'],
      },
      {
        key: 'target_folder',
        label: 'Target Folder',
        default: '%APPDATA%/MetaQuotes/Terminal/*/MQL5/Files/',
        type: 'string',
      },
      { key: 'opset', label: 'Opset Version', default: 14, type: 'number' },
    ],
    hasInput: true,
    hasOutput: false,
  },
  mt5_execution: {
    group: 'output',
    label: 'MT5 Execution Router',
    fields: [
      { key: 'magic_number', label: 'Magic Number', default: 888123 },
      { key: 'slippage_max', label: 'Max Slippage', default: 2.0 },
      {
        key: 'execution_mode',
        label: 'Execution Mode',
        default: 'DMA_STP',
        type: 'select',
        options: ['DMA_STP', 'ECN_DIRECT', 'MARKET_MAKER'],
      },
    ],
    hasInput: true,
    hasOutput: true,
  },
  onnx_export: {
    group: 'output',
    label: 'ONNX Model Exporter',
    fields: [
      { key: 'opset', label: 'ONNX Opset', default: 14 },
      { key: 'input_shape', label: 'Input Shape', default: '[1, 6]' },
      { key: 'target_file', label: 'Target File', default: 'FXForge_PPO.mq5' },
    ],
    hasInput: true,
    hasOutput: false,
  },

  // =========================================================================
  // Auxiliary Systems
  // =========================================================================
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
