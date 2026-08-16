import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Connection, Edge, Node } from '@xyflow/react';
import NodeCard from '../nodes/NodeCard';
import NodePalette from '../Sidebar/NodePalette';
import { NODE_DEFS, GROUPS } from '../../data/nodeRegistry';
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

interface ContextMenuState {
  x: number;
  y: number;
  flowPos: { x: number; y: number };
  targetNodeId: string | null;
}

interface InspectorState {
  nodeId: string;
  x: number;
  y: number;
}

const FlowContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const { fitView, screenToFlowPosition } = useReactFlow();

  // Floating Context Menu & Inspector States
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [inspectors, setInspectors] = useState<InspectorState[]>([]);

  // Clipboard Reference for Multi-Node Copy / Cut / Paste
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const pasteCountRef = useRef(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });

  // Get currently selected nodes helper
  const selectedNodes = useCallback(() => {
    return nodes.filter((n) => n.selected);
  }, [nodes]);

  // ==========================================
  // 1. การเชื่อมต่อสายสัญญาณ (Connect Edge)
  // ==========================================
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

  // ==========================================
  // 2. การ COPY (คัดลอก NODE + EDGES ที่เชื่อมกัน)
  // ==========================================
  const copyNodes = useCallback(
    (nodesToCopy: Node[] | null = null) => {
      const targets = nodesToCopy || selectedNodes();
      if (!targets.length) return false;
      const selectedIds = new Set(targets.map((n) => n.id));

      // เก็บทั้ง Node และสาย Edges ที่เชื่อมต่อกันภายในกลุ่ม
      clipboardRef.current = {
        nodes: targets.map((node) => ({
          ...node,
          selected: false,
          data: { ...node.data },
        })),
        edges: edges
          .filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target))
          .map((edge) => ({ ...edge })),
      };
      pasteCountRef.current = 0;
      return true;
    },
    [edges, selectedNodes]
  );

  // ==========================================
  // 3. การ DELETE (ลบ NODE + EDGES)
  // ==========================================
  const deleteNodes = useCallback(
    (nodesToDelete: Node[] | null = null) => {
      const targets = nodesToDelete || selectedNodes();
      if (!targets.length) return;
      const targetIds = new Set(targets.map((n) => n.id));

      setNodes((nds) => nds.filter((n) => !targetIds.has(n.id)));
      setEdges((eds) => eds.filter((e) => !targetIds.has(e.source) && !targetIds.has(e.target)));
      setInspectors((ins) => ins.filter((i) => !targetIds.has(i.nodeId)));
    },
    [selectedNodes, setEdges, setNodes]
  );

  // ==========================================
  // 4. การ CUT (ตัด NODE)
  // ==========================================
  const cutNodes = useCallback(
    (nodesToCut: Node[] | null = null) => {
      const targets = nodesToCut || selectedNodes();
      copyNodes(targets);
      deleteNodes(targets);
    },
    [copyNodes, deleteNodes, selectedNodes]
  );

  // ==========================================
  // 5. การ PASTE (วาง ณ ตำแหน่ง CURSOR เมาส์)
  // ==========================================
  const pasteAt = useCallback(
    (targetFlowPos: { x: number; y: number } | null = null) => {
      const clip = clipboardRef.current;
      if (!clip || !clip.nodes.length) return;

      pasteCountRef.current += 1;
      const offset = pasteCountRef.current * 24;

      let basePos = { x: offset, y: offset };
      if (targetFlowPos) {
        const minX = Math.min(...clip.nodes.map((n) => n.position.x));
        const minY = Math.min(...clip.nodes.map((n) => n.position.y));
        basePos = { x: targetFlowPos.x - minX, y: targetFlowPos.y - minY };
      }

      // สร้าง ID ใหม่ให้กับ Node และสาย Edges ทั้งหมด
      const idMap = new Map<string, string>();
      const newNodes = clip.nodes.map((node) => {
        const newId = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        idMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          selected: true,
          position: { x: node.position.x + basePos.x, y: node.position.y + basePos.y },
        };
      });

      const newEdges = clip.edges.map((edge) => ({
        ...edge,
        id: `e-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source: idMap.get(edge.source) || edge.source,
        target: idMap.get(edge.target) || edge.target,
      }));

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
    },
    [setEdges, setNodes]
  );

  // ==========================================
  // 6. การ DUPLICATE (ทำสำเนาทันที)
  // ==========================================
  const duplicateNodes = useCallback(
    (nodesToDup: Node[] | null = null) => {
      const targets = nodesToDup || selectedNodes();
      copyNodes(targets);
      pasteAt(null);
    },
    [copyNodes, pasteAt, selectedNodes]
  );

  // ==========================================
  // 7. การ DISCONNECT (ตัดสาย EDGES ทั้งหมดของ NODE)
  // ==========================================
  const disconnectNodes = useCallback(
    (nodesToDisconnect: Node[] | null = null) => {
      const targets = nodesToDisconnect || selectedNodes();
      if (!targets.length) return;
      const ids = new Set(targets.map((n) => n.id));

      // กรองลบเฉพาะสายที่ต่อเข้าหรือออกจาก Node เหล่านี้ (ตัว Node ไม่ถูกลบ)
      setEdges((eds) => eds.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)));
    },
    [selectedNodes, setEdges]
  );

  // ==========================================
  // 8. การ INSPECT (เปิดแผงลอยปรับพารามิเตอร์)
  // ==========================================
  const openInspector = useCallback((nodeId: string, pos: { x: number; y: number }) => {
    setInspectors((ins) => {
      const exists = ins.find((item) => item.nodeId === nodeId);
      if (exists) return ins.map((item) => (item.nodeId === nodeId ? { ...item, ...pos } : item));
      return [...ins, { nodeId, ...pos }];
    });
  }, []);

  const closeInspector = useCallback((nodeId: string) => {
    setInspectors((ins) => ins.filter((item) => item.nodeId !== nodeId));
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, key: string, value: any) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                [key]: value,
              },
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Double Click opens Inspector
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      openInspector(node.id, {
        x: node.position.x + 230,
        y: node.position.y,
      });
    },
    [openInspector]
  );

  // ==========================================
  // 9. Right-Click Context Menus
  // ==========================================
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      // Select clicked node if not already selected
      if (!node.selected) {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
      }
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPos,
        targetNodeId: node.id,
      });
    },
    [screenToFlowPosition, setNodes]
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowPos,
        targetNodeId: null,
      });
    },
    [screenToFlowPosition]
  );

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Track Mouse Movement for Cursor-based Pasting
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mousePosRef.current = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    },
    [screenToFlowPosition]
  );

  // ==========================================
  // 10. Global Keyboard Shortcuts
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyNodes();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutNodes();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteAt(mousePosRef.current);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateNodes();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        disconnectNodes();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteNodes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyNodes, cutNodes, pasteAt, duplicateNodes, disconnectNodes, deleteNodes]);

  // Drag-and-Drop from Palette onto Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/fxforge-node');
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'nodeCard',
        position,
        data: {
          nodeType,
          execution: { status: 'queued', detail: 'Ready for execution' },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="w-full h-full flex overflow-hidden relative bg-[#040407]" onMouseMove={onMouseMove}>
      {/* AI Node Palette Sidebar (RL Hyperparameters) */}
      <NodePalette />

      {/* Main ReactFlow Canvas */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          selectionOnDrag={true}
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1, 2]}
          minZoom={0.3}
          maxZoom={1.6}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(255,255,255,0.06)" />
          <Controls
            className="bg-[#0f0f18] border border-white/[0.08] text-white fill-white rounded-lg shadow-xl"
            showInteractive={false}
          />
        </ReactFlow>

        {/* Floating Controls Bar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-[#0c0c14]/90 backdrop-blur-md border border-white/[0.08] px-3.5 py-1.5 rounded-lg shadow-2xl text-xs select-none">
          <button
            onClick={() => fitView({ duration: 400, padding: 0.15 })}
            className="text-[#86868b] hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <LucideIcons.Maximize size={12} />
            <span>Fit View</span>
          </button>
          <span className="text-white/20">|</span>
          <span className="text-[#30d158] font-mono text-[11px] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
            {nodes.length} Nodes · Marquee Active
          </span>
        </div>

        {/* Floating Right-Click Context Menu */}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 100,
            }}
            className="bg-[#12121a]/95 backdrop-blur-xl border border-white/[0.12] rounded-lg shadow-2xl py-1.5 min-w-[180px] text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.targetNodeId ? (
              <>
                <button
                  onClick={() => {
                    const node = nodes.find((n) => n.id === contextMenu.targetNodeId);
                    if (node) {
                      openInspector(node.id, { x: node.position.x + 230, y: node.position.y });
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#007aff]/20 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Sliders size={12} className="text-[#007aff]" />
                    <span>Inspect Parameters</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">2×Click</span>
                </button>
                <button
                  onClick={() => {
                    duplicateNodes();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.CopyPlus size={12} className="text-[#ffd60a]" />
                    <span>Duplicate</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Ctrl+D</span>
                </button>
                <button
                  onClick={() => {
                    copyNodes();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Copy size={12} className="text-white/70" />
                    <span>Copy</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Ctrl+C</span>
                </button>
                <button
                  onClick={() => {
                    cutNodes();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Scissors size={12} className="text-white/70" />
                    <span>Cut</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Ctrl+X</span>
                </button>
                <div className="my-1 border-t border-white/[0.08]" />
                <button
                  onClick={() => {
                    disconnectNodes();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#ff9f0a]/20 hover:text-[#ff9f0a] transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Unlink size={12} className="text-[#ff9f0a]" />
                    <span>Disconnect Edges</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Ctrl+K</span>
                </button>
                <button
                  onClick={() => {
                    deleteNodes();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#ff453a]/20 text-[#ff453a] transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Trash2 size={12} />
                    <span>Delete</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Del</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    pasteAt(contextMenu.flowPos);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.ClipboardPaste size={12} className="text-[#007aff]" />
                    <span>Paste Here</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Ctrl+V</span>
                </button>
                <button
                  onClick={() => {
                    fitView({ duration: 400, padding: 0.15 });
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Maximize size={12} className="text-[#30d158]" />
                    <span>Fit View</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">F</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Floating Parameter Inspectors */}
        {inspectors.map((ins) => {
          const targetNode = nodes.find((n) => n.id === ins.nodeId);
          if (!targetNode) return null;
          const nodeType = targetNode.data?.nodeType as string;
          const def = NODE_DEFS[nodeType];
          const group = GROUPS.find((g) => g.id === def?.group) || { label: 'Node', color: '#007aff' };
          const nodeLabel = String(def?.label || targetNode.data?.label || nodeType);

          return (
            <div
              key={ins.nodeId}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                zIndex: 40,
                width: 280,
              }}
              className="bg-[#0f0f18]/95 backdrop-blur-xl border border-white/[0.12] rounded-xl shadow-2xl p-3.5 text-xs select-none animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Inspector Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }}
                  />
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase block" style={{ color: group.color }}>
                      {group.label}
                    </span>
                    <span className="text-xs font-semibold text-white block">
                      {nodeLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => closeInspector(ins.nodeId)}
                  className="text-white/40 hover:text-white transition-colors p-1"
                >
                  <LucideIcons.X size={13} />
                </button>
              </div>

              {/* Parameter Inputs */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {def?.fields.map((f) => {
                  const val = (targetNode.data?.[f.key] ?? f.default) as string | number;
                  return (
                    <div key={f.key}>
                      <label className="text-[10px] text-[#86868b] block mb-1">{f.label}</label>
                      <input
                        type={typeof f.default === 'number' ? 'number' : 'text'}
                        value={val}
                        onChange={(e) =>
                          updateNodeData(
                            ins.nodeId,
                            f.key,
                            typeof f.default === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                          )
                        }
                        className="w-full bg-[#161622] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#007aff]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Inspector Footer Actions */}
              <div className="mt-3 pt-2 border-t border-white/[0.08] flex items-center justify-between">
                <button
                  onClick={() => disconnectNodes([targetNode])}
                  className="text-[10px] text-[#ff9f0a] hover:underline flex items-center gap-1 font-medium"
                >
                  <LucideIcons.Unlink size={10} />
                  <span>Disconnect</span>
                </button>
                <button
                  onClick={() => deleteNodes([targetNode])}
                  className="text-[10px] text-[#ff453a] hover:underline flex items-center gap-1 font-medium"
                >
                  <LucideIcons.Trash2 size={10} />
                  <span>Delete Node</span>
                </button>
              </div>
            </div>
          );
        })}
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
