import React, { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Connection, Edge, Node } from '@xyflow/react';
import NodeCard from '../nodes/NodeCard';
import * as LucideIcons from 'lucide-react';

const nodeTypes = {
  nodeCard: NodeCard,
};

const INITIAL_NODES: Node[] = [
  {
    id: 'node-1',
    type: 'nodeCard',
    position: { x: 40, y: 160 },
    data: {
      nodeType: 'mt5_feed',
      symbol: 'EURUSD',
      timeframe: 'M15',
      historyBars: 50000,
      execution: { status: 'passed', detail: 'Feed Connected: 50K Bars Synced' },
    },
  },
  {
    id: 'node-2',
    type: 'nodeCard',
    position: { x: 320, y: 160 },
    data: {
      nodeType: 'fractional_diff',
      d_order: 0.40,
      threshold: 0.0001,
      stationarity: -4.82,
      execution: { status: 'passed', detail: 'Stationary test passed (p < 0.001)' },
    },
  },
  {
    id: 'node-3',
    type: 'nodeCard',
    position: { x: 600, y: 80 },
    data: {
      nodeType: 'feature_pipeline',
      features: 6,
      scaling: 'Z-Score',
      lookback: 20,
      execution: { status: 'passed', detail: 'State Vector [1, 6] float32 ready' },
    },
  },
  {
    id: 'node-4',
    type: 'nodeCard',
    position: { x: 600, y: 280 },
    data: {
      nodeType: 'reward_shaper',
      metric: 'Diff Sharpe',
      inactivityPenalty: -0.0005,
      spreadFriction: 1.2,
      execution: { status: 'passed', detail: 'Reward Formulation Active' },
    },
  },
  {
    id: 'node-5',
    type: 'nodeCard',
    position: { x: 880, y: 160 },
    data: {
      nodeType: 'deep_rl_ppo',
      architecture: '6-64-32-3',
      learningRate: 0.0003,
      entropyCoef: 0.02,
      execution: { status: 'passed', detail: 'PPO Training Convergence: Active' },
    },
  },
  {
    id: 'node-6',
    type: 'nodeCard',
    position: { x: 1160, y: 160 },
    data: {
      nodeType: 'risk_guard',
      maxDd: '10.0%',
      action: 'Early Stop',
      penalty: -5.0,
      execution: { status: 'passed', detail: 'Drawdown Guard Armed' },
    },
  },
  {
    id: 'node-7',
    type: 'nodeCard',
    position: { x: 1440, y: 160 },
    data: {
      nodeType: 'mt5_onnx_deploy',
      opset: 14,
      tensorShape: '[1, 6]',
      eaName: 'FXForge_PPO.mq5',
      execution: { status: 'passed', detail: 'MQL5 ONNX Model Compiled' },
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e1-2',
    source: 'node-1',
    target: 'node-2',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 1.5 },
  },
  {
    id: 'e2-3',
    source: 'node-2',
    target: 'node-3',
    animated: true,
    style: { stroke: '#ff9f0a', strokeWidth: 1.5 },
  },
  {
    id: 'e2-4',
    source: 'node-2',
    target: 'node-4',
    animated: true,
    style: { stroke: '#ffd60a', strokeWidth: 1.5 },
  },
  {
    id: 'e3-5',
    source: 'node-3',
    target: 'node-5',
    animated: true,
    style: { stroke: '#bf5af2', strokeWidth: 1.5 },
  },
  {
    id: 'e4-5',
    source: 'node-4',
    target: 'node-5',
    animated: true,
    style: { stroke: '#bf5af2', strokeWidth: 1.5 },
  },
  {
    id: 'e5-6',
    source: 'node-5',
    target: 'node-6',
    animated: true,
    style: { stroke: '#ff453a', strokeWidth: 1.5 },
  },
  {
    id: 'e6-7',
    source: 'node-6',
    target: 'node-7',
    animated: true,
    style: { stroke: '#30d158', strokeWidth: 1.5 },
  },
];

const FlowContent: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const { fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#007aff', strokeWidth: 1.5 },
          },
          eds
        )
      ),
    [setEdges]
  );

  return (
    <div className="w-full h-full relative bg-[#040407]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(255,255,255,0.06)" />
        <Controls
          className="bg-[#0f0f18] border border-white/[0.08] text-white fill-white rounded-lg shadow-xl"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Floating Controls Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#0c0c14]/90 backdrop-blur-md border border-white/[0.08] px-3 py-1.5 rounded-lg shadow-2xl text-xs">
        <button
          onClick={() => fitView({ duration: 400, padding: 0.15 })}
          className="text-[#86868b] hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <LucideIcons.Maximize size={12} />
          <span>Fit View</span>
        </button>
        <span className="text-white/20">|</span>
        <span className="text-[#30d158] font-mono text-[11px] flex items-center gap-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
          7 Nodes Connected
        </span>
      </div>
    </div>
  );
};

export const FlowCanvasView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
};
