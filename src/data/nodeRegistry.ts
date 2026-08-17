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
  { id: 'input', label: 'Input & Strategy', color: '#0a84ff' },
  { id: 'fc1', label: 'Feature Expansion', color: '#ff9f0a' },
  { id: 'regularization', label: 'Regularization & Norm', color: '#30d158' },
  { id: 'fc2', label: 'Bottleneck Synthesis', color: '#bf5af2' },
  { id: 'reward', label: 'Reward & Shaping Rules', color: '#ffd60a' },
  { id: 'output', label: 'Output & Deployment', color: '#0a84ff' },
];

export const NODE_DEFS: Record<string, NodeDef> = {
  // =========================================================================
  // หมวด INPUT NODES (ดึงข้อมูลและเลือกกลยุทธ์)
  // =========================================================================
  strategy_preset_return: {
    group: 'input',
    label: 'Strategy & Return Window',
    fields: [
      {
        key: 'preset',
        label: 'Strategy Preset',
        default: 'Standard Quant',
        type: 'select',
        options: [
          'Standard Quant',
          'Fibonacci Scale',
          'Ultra-Fast Scalper',
          'Macro Trend Follower',
          'Custom Configuration',
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
    label: 'Volatility & Indicator',
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
    hasInput: false,
    hasOutput: true,
  },
  position_feedback: {
    group: 'input',
    label: 'Position Feedback',
    fields: [
      {
        key: 'encoding',
        label: 'Position Encoding',
        default: 'Discrete',
        type: 'select',
        options: ['Discrete', 'Continuous'],
      },
    ],
    hasInput: false,
    hasOutput: true,
  },
  training_episodes_config: {
    group: 'input',
    label: 'Training Episodes & Target',
    fields: [
      {
        key: 'target_episodes',
        label: 'Target Episodes',
        default: '10,000',
        type: 'select',
        options: ['2,000', '5,000', '10,000', '20,000', '50,000', '100,000'],
      },
      {
        key: 'batch_size',
        label: 'Batch Size',
        default: '64',
        type: 'select',
        options: ['32', '64', '128', '256'],
      },
      {
        key: 'max_steps',
        label: 'Max Episode Steps',
        default: 32,
        type: 'number',
      },
      {
        key: 'checkpoint_interval',
        label: 'Save Checkpoint (Ep)',
        default: 1000,
        type: 'number',
      },
    ],
    hasInput: false,
    hasOutput: true,
  },

  // =========================================================================
  // หมวด HIDDEN LAYER 1 NODES (สกัดฟีเจอร์ย่อย)
  // =========================================================================
  fc1_dense_expansion: {
    group: 'fc1',
    label: 'Dense Feature Expansion',
    fields: [
      {
        key: 'units',
        label: 'Neuron Count',
        default: '64',
        type: 'select',
        options: ['32', '64', '128'],
      },
      {
        key: 'activation',
        label: 'Activation Function',
        default: 'LeakyReLU',
        type: 'select',
        options: ['LeakyReLU', 'GELU', 'ELU', 'ReLU', 'Mish'],
      },
      {
        key: 'weight_init',
        label: 'Weight Initialization',
        default: 'Kaiming Normal',
        type: 'select',
        options: ['Kaiming Normal', 'Xavier Uniform', 'Orthogonal'],
      },
      { key: 'use_bias', label: 'Use Bias', default: true, type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // หมวด ANTI-OVERFITTING & REGULARIZATION NODES (กันจำข้อสอบเก่า)
  // =========================================================================
  spatial_dropout: {
    group: 'regularization',
    label: 'Spatial Dropout',
    fields: [
      { key: 'rate', label: 'Dropout Rate', default: 0.15, type: 'number' },
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
    label: 'Layer Normalization',
    fields: [
      {
        key: 'norm_type',
        label: 'Norm Type',
        default: 'LayerNorm',
        type: 'select',
        options: ['LayerNorm', 'RMSNorm', 'None'],
      },
      { key: 'eps', label: 'Epsilon', default: '1e-5', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  l2_weight_decay: {
    group: 'regularization',
    label: 'L2 Weight Decay',
    fields: [
      { key: 'decay', label: 'Weight Decay', default: '1e-4', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  gradient_clipping: {
    group: 'regularization',
    label: 'Gradient Clipping',
    fields: [
      { key: 'max_norm', label: 'Max Gradient Norm', default: 1.0, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // หมวด HIDDEN LAYER 2 NODES (สังเคราะห์ภาพรวมกลยุทธ์)
  // =========================================================================
  fc2_bottleneck_synthesizer: {
    group: 'fc2',
    label: 'Strategy Synthesizer',
    fields: [
      {
        key: 'units',
        label: 'Neuron Count',
        default: '32',
        type: 'select',
        options: ['16', '32', '64'],
      },
      {
        key: 'activation',
        label: 'Activation Function',
        default: 'LeakyReLU',
        type: 'select',
        options: ['LeakyReLU', 'GELU', 'Tanh'],
      },
      {
        key: 'residual',
        label: 'Residual Connection',
        default: 'Enable',
        type: 'select',
        options: ['Enable', 'Disable'],
      },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // หมวด REWARD & SHAPING NODES (กฎเกณฑ์การเทรด)
  // =========================================================================
  friction_spread_cost: {
    group: 'reward',
    label: 'Friction Cost & Spread',
    fields: [
      { key: 'spread_pip', label: 'Spread', default: 0.15, type: 'number' },
      { key: 'commission', label: 'Commission', default: 0.00, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  anti_inactivity_reward: {
    group: 'reward',
    label: 'Inactivity & Opp Cost',
    fields: [
      { key: 'idle_penalty', label: 'Idle Penalty', default: -0.0005, type: 'number' },
      { key: 'opp_cost_multiplier', label: 'Opportunity Cost Multiplier', default: '0.50x', type: 'string' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // =========================================================================
  // หมวด OUTPUT & DEPLOY NODES (เคาะออเดอร์และส่ง MT5)
  // =========================================================================
  fc3_policy_action_head: {
    group: 'output',
    label: 'Policy Action Head',
    fields: [
      {
        key: 'classes',
        label: 'Output Classes',
        default: '3',
        type: 'string',
      },
      { key: 'entropy_beta', label: 'Entropy Regularization Bonus', default: 0.08, type: 'number' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  onnx_mt5_compiler: {
    group: 'output',
    label: 'ONNX MT5 Compiler',
    fields: [
      {
        key: 'export_mode',
        label: 'Export Mode',
        default: 'TorchScript Standalone',
        type: 'select',
        options: ['TorchScript Standalone'],
      },
      {
        key: 'target_folder',
        label: 'Target Folder',
        default: 'MQL5/Files/',
        type: 'string',
      },
      { key: 'opset', label: 'Opset Version', default: 14, type: 'number' },
    ],
    hasInput: true,
    hasOutput: false,
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
