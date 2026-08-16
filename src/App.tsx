import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  useReactFlow,
  SelectionMode,
} from '@xyflow/react';
import type { Connection, Edge, Node, OnSelectionChangeParams } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';
import { CustomTradingNode } from './components/nodes/CustomTradingNode';
import { NodePalette } from './components/Sidebar/NodePalette';
import { NodeInspector } from './components/Inspector/NodeInspector';
import { AnalyticsDrawer } from './components/BottomPanel/AnalyticsDrawer';
import { TopNav } from './components/Header/TopNav';
import { CodeExportModal } from './components/Modals/CodeExportModal';
import { MT5DeployModal } from './components/Modals/MT5DeployModal';
import { CanvasContextMenu } from './components/Canvas/CanvasContextMenu';
import { LiveNeuralLink } from './components/NeuralLink/LiveNeuralLink';
import { TEMPLATES } from './data/templates';
import type { PipelineTemplate } from './data/templates';
import { INITIAL_LOGS } from './data/mockAnalytics';
import { fxforgeEngine } from './services/fxforgeEngine';
import type { QuantTelemetry, RLEnvironmentStep } from './services/fxforgeEngine';
import type { TradingNodeConfig } from './types/flow';
import { generatePythonScript } from './utils/codeGenerator';
import { autoLayoutDAG } from './utils/dagLayout';

// Memoized nodeTypes defined statically outside the component
const nodeTypes = {
  customTrading: CustomTradingNode,
};

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

const FlowCanvas: React.FC = () => {
  const [activeView, setActiveView] = useState<'studio' | 'bpnn'>('studio');
  const initialTemplate = TEMPLATES[0];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialTemplate.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialTemplate.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // RL Live Telemetry & Control State (START, PAUSE, STOP)
  const [rlStatus, setRlStatus] = useState<'running' | 'paused' | 'stopped'>('running');
  const [rlTelemetry, setRlTelemetry] = useState<QuantTelemetry>(() => fxforgeEngine.getTelemetry());
  const [rlLatestStep, setRlLatestStep] = useState<RLEnvironmentStep | null>(null);
  const [isMT5DeployOpen, setIsMT5DeployOpen] = useState(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);

  // Global Real-time Deep RL Simulation Loop (Active on both Flow DAG & Live 3D BPNN views)
  useEffect(() => {
    if (rlStatus !== 'running') return;

    const interval = setInterval(() => {
      const stepResult = fxforgeEngine.step();
      const telem = fxforgeEngine.getTelemetry();
      setRlTelemetry(telem);
      setRlLatestStep(stepResult);
    }, 450);

    return () => clearInterval(interval);
  }, [rlStatus]);

  const handleStartRL = useCallback(() => {
    setRlStatus('running');
    setLogs((prev) => [...prev, `[RL ENGINE] Training started/resumed.`]);
  }, []);

  const handlePauseRL = useCallback(() => {
    setRlStatus('paused');
    setLogs((prev) => [...prev, `[RL ENGINE] Training paused.`]);
  }, []);

  const handleStopRL = useCallback(() => {
    setRlStatus('stopped');
    fxforgeEngine.reset();
    setRlTelemetry(fxforgeEngine.getTelemetry());
    setRlLatestStep(null);
    setLogs((prev) => [...prev, `[RL ENGINE] Training stopped and environment reset.`]);
  }, []);

  // Clipboard & History State
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [history, setHistory] = useState<HistorySnapshot[]>([
    { nodes: initialTemplate.nodes, edges: initialTemplate.edges },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    targetNode: Node | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    flowPosition: { x: 0, y: 0 },
    targetNode: null,
  });

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();

  // Save history snapshot helper
  const saveHistorySnapshot = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, { nodes: newNodes, edges: newEdges }].slice(-30);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [historyIndex]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetState = history[targetIndex];
      setNodes(targetState.nodes);
      setEdges(targetState.edges);
      setHistoryIndex(targetIndex);
      setLogs((prev) => [...prev, `[UNDO] Restored previous canvas state.`]);
    }
  }, [history, historyIndex, setEdges, setNodes]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetState = history[targetIndex];
      setNodes(targetState.nodes);
      setEdges(targetState.edges);
      setHistoryIndex(targetIndex);
      setLogs((prev) => [...prev, `[REDO] Applied forward state.`]);
    }
  }, [history, historyIndex, setEdges, setNodes]);

  // Selected Nodes Collection
  const selectedNodes = useMemo(() => {
    return nodes.filter((n) => n.selected);
  }, [nodes]);

  // Primary Selected Node for Inspector (ONLY opens when explicitly clicked, NEVER during marquee drag)
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || selectedNodes.length > 1) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId, selectedNodes.length]);

  // Selection change listener from React Flow (Tracks multi-select count without popping open inspector)
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (params.nodes.length !== 1) {
      setSelectedNodeId(null);
    }
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Direct click on a single node explicitly opens the Inspector
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Connect Sockets
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        animated: true,
        style: { stroke: '#0a84ff', strokeWidth: 2 },
      };
      setEdges((eds) => {
        const nextEdges = addEdge(newEdge, eds);
        saveHistorySnapshot(nodes, nextEdges);
        return nextEdges;
      });
      setLogs((prev) => [
        ...prev,
        `[DAG] Connected: ${connection.source} -> ${connection.target}`,
      ]);
    },
    [nodes, saveHistorySnapshot, setEdges]
  );

  // Drag & Drop from Sidebar Palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      const config: TradingNodeConfig = JSON.parse(rawData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node-${config.id}-${Date.now().toString().slice(-4)}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'customTrading',
        position,
        selected: false,
        data: {
          nodeId: config.id,
          title: config.title,
          subtitle: config.subtitle,
          category: config.category,
          icon: config.icon,
          status: 'idle',
          params: config.params,
          inputs: config.inputs,
          outputs: config.outputs,
          metrics: {},
        },
      };

      setNodes((nds) => {
        const deselectOthers: Node[] = nds.map((n) => ({ ...n, selected: false }));
        const updated: Node[] = [...deselectOthers, newNode];
        saveHistorySnapshot(updated, edges);
        return updated;
      });
      // Do NOT open Inspector automatically on drop (only on direct Left-Click)
      setSelectedNodeId(null);
      setLogs((prev) => [...prev, `[DAG] Added: ${config.title}`]);
    },
    [edges, saveHistorySnapshot, screenToFlowPosition, setNodes]
  );

  // Click to add helper (Shift+A or Quick Add)
  const handleAddNodeFromPalette = (config: TradingNodeConfig, targetPos?: { x: number; y: number } | null) => {
    const pos = targetPos || {
      x: 340 + Math.random() * 120,
      y: 200 + Math.random() * 120,
    };

    const newNodeId = `node-${config.id}-${Date.now().toString().slice(-4)}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'customTrading',
      position: pos,
      selected: false,
      data: {
        nodeId: config.id,
        title: config.title,
        subtitle: config.subtitle,
        category: config.category,
        icon: config.icon,
        status: 'idle',
        params: config.params,
        inputs: config.inputs,
        outputs: config.outputs,
        metrics: {},
      },
    };

    setNodes((nds) => {
      const deselectOthers: Node[] = nds.map((n) => ({ ...n, selected: false }));
      const updated: Node[] = [...deselectOthers, newNode];
      saveHistorySnapshot(updated, edges);
      return updated;
    });
    // Do NOT open Inspector automatically
    setSelectedNodeId(null);
    setLogs((prev) => [...prev, `[DAG] Added: ${config.title}`]);
  };

  // Update Parameters
  const handleUpdateParams = (nodeId: string, newParams: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              params: newParams,
            },
          };
        }
        return node;
      })
    );
  };

  // Delete Single Node
  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => {
      const updatedNodes = nds.filter((n) => n.id !== nodeId);
      setEdges((eds) => {
        const updatedEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
        saveHistorySnapshot(updatedNodes, updatedEdges);
        return updatedEdges;
      });
      return updatedNodes;
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    setLogs((prev) => [...prev, `[DAG] Removed: ${nodeId}`]);
  };

  // Delete Selected Nodes (Batch)
  const handleDeleteSelected = useCallback(() => {
    const idsToDelete = new Set(
      selectedNodes.length > 0
        ? selectedNodes.map((n) => n.id)
        : selectedNodeId
        ? [selectedNodeId]
        : []
    );

    if (idsToDelete.size === 0) return;

    setNodes((nds) => {
      const nextNodes = nds.filter((n) => !idsToDelete.has(n.id));
      setEdges((eds) => {
        const nextEdges = eds.filter(
          (e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target)
        );
        saveHistorySnapshot(nextNodes, nextEdges);
        return nextEdges;
      });
      return nextNodes;
    });

    setSelectedNodeId(null);
    setLogs((prev) => [...prev, `[DAG] Removed ${idsToDelete.size} selected node(s).`]);
  }, [saveHistorySnapshot, selectedNodeId, selectedNodes, setEdges, setNodes]);

  // Copy to Clipboard
  const handleCopy = useCallback(() => {
    const targets =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNodeId
        ? nodes.filter((n) => n.id === selectedNodeId)
        : [];

    if (targets.length === 0) return;

    const targetIds = new Set(targets.map((n) => n.id));
    const internalEdges = edges.filter(
      (e) => targetIds.has(e.source) && targetIds.has(e.target)
    );

    setClipboard({ nodes: targets, edges: internalEdges });
    setLogs((prev) => [
      ...prev,
      `[CLIPBOARD] Copied ${targets.length} node(s) to clipboard.`,
    ]);
  }, [edges, nodes, selectedNodeId, selectedNodes]);

  // Paste from Clipboard
  const handlePaste = useCallback(
    (targetPos?: { x: number; y: number }) => {
      if (!clipboard || clipboard.nodes.length === 0) return;

      // Calculate anchor bounding box
      let minX = Infinity;
      let minY = Infinity;
      clipboard.nodes.forEach((n) => {
        if (n.position.x < minX) minX = n.position.x;
        if (n.position.y < minY) minY = n.position.y;
      });

      const offsetX = targetPos ? targetPos.x - minX : 40;
      const offsetY = targetPos ? targetPos.y - minY : 40;

      const idMap: Record<string, string> = {};
      const newPastedNodes: Node[] = clipboard.nodes.map((node) => {
        const newId = `node-${(node.data as any).nodeId || 'cln'}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5)}`;
        idMap[node.id] = newId;

        const posX = targetPos ? node.position.x + offsetX : node.position.x + offsetX;
        const posY = targetPos ? node.position.y + offsetY : node.position.y + offsetY;

        return {
          ...node,
          id: newId,
          position: { x: posX, y: posY },
          selected: true,
          data: {
            ...node.data,
            title: `${(node.data as any).title} (Copy)`,
            status: 'idle',
          },
        };
      });

      const newPastedEdges: Edge[] = clipboard.edges.map((edge) => ({
        ...edge,
        id: `e-${idMap[edge.source]}-${idMap[edge.target]}-${Date.now().toString().slice(-4)}`,
        source: idMap[edge.source],
        target: idMap[edge.target],
      }));

      setNodes((nds) => {
        const deselectPrev = nds.map((n) => ({ ...n, selected: false }));
        const updated = [...deselectPrev, ...newPastedNodes];
        setEdges((eds) => {
          const updatedEds = [...eds, ...newPastedEdges];
          saveHistorySnapshot(updated, updatedEds);
          return updatedEds;
        });
        return updated;
      });

      if (newPastedNodes.length === 1) {
        setSelectedNodeId(newPastedNodes[0].id);
      }

      setLogs((prev) => [
        ...prev,
        `[CLIPBOARD] Pasted ${newPastedNodes.length} node(s).`,
      ]);
    },
    [clipboard, saveHistorySnapshot, setEdges, setNodes]
  );

  // Duplicate Selected
  const handleDuplicate = useCallback(() => {
    handleCopy();
    setTimeout(() => {
      handlePaste();
    }, 20);
  }, [handleCopy, handlePaste]);

  // Cut Selected
  const handleCut = useCallback(() => {
    handleCopy();
    handleDeleteSelected();
  }, [handleCopy, handleDeleteSelected]);

  // Select All Nodes
  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setLogs((prev) => [...prev, `[DAG] Selected all ${nodes.length} nodes.`]);
  }, [nodes.length, setNodes]);

  // Auto-Align DAG Flow (Dagre Hierarchical Layout)
  const handleAutoLayout = useCallback(() => {
    const result = autoLayoutDAG(nodes, edges);
    setNodes(result.nodes);
    setEdges(result.edges);
    saveHistorySnapshot(result.nodes, result.edges);
    setLogs((prev) => [...prev, `[DAG] Auto-arranged flow layout.`]);
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 500 });
    }, 50);
  }, [edges, fitView, nodes, saveHistorySnapshot, setEdges, setNodes]);

  // Context Menu Events (Right-Click NEVER opens Inspector; only Left-Click does)
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      event.stopPropagation();

      // If clicked node is not selected, select it for clipboard context actions without opening Inspector
      if (!node.selected) {
        setNodes((nds) =>
          nds.map((n) => ({ ...n, selected: n.id === node.id }))
        );
      }

      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        targetNode: node,
      });
    },
    [screenToFlowPosition, setNodes]
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      // Empty canvas right-click context menu: Opens Paste menu at cursor position
      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        targetNode: null,
      });
    },
    [screenToFlowPosition]
  );

  const onSelectionContextMenu = useCallback(
    (event: React.MouseEvent, selNodes: Node[]) => {
      event.preventDefault();
      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        targetNode: selNodes[0] || null,
      });
    },
    [screenToFlowPosition]
  );

  // Load Pipeline Template
  const handleSelectTemplate = (template: PipelineTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setSelectedNodeId(null);
    saveHistorySnapshot(template.nodes, template.edges);
    setLogs((prev) => [...prev, `[TEMPLATE] Loaded "${template.name}"`]);
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 500 });
    }, 100);
  };



  const handleClearFlow = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setIsClearModalOpen(false);
    saveHistorySnapshot([], []);
    setLogs((prev) => [...prev, `[CLEAR] Canvas cleared.`]);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Copy: Ctrl + C
      if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }

      // Paste: Ctrl + V
      else if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      }

      // Duplicate: Ctrl + D
      else if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicate();
      }

      // Cut: Ctrl + X
      else if (isCtrlOrCmd && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
      }

      // Select All: Ctrl + A
      else if (isCtrlOrCmd && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      }

      // Delete / Backspace
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      }

      // Undo: Ctrl + Z
      else if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl + Y or Ctrl + Shift + Z
      else if (
        (isCtrlOrCmd && e.key.toLowerCase() === 'y') ||
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Zoom In: Ctrl + = or Ctrl + +
      else if (isCtrlOrCmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn({ duration: 250 });
      }

      // Zoom Out: Ctrl + -
      else if (isCtrlOrCmd && e.key === '-') {
        e.preventDefault();
        zoomOut({ duration: 250 });
      }

      // Reset 100%: Ctrl + 0
      else if (isCtrlOrCmd && e.key === '0') {
        e.preventDefault();
        zoomTo(1, { duration: 250 });
      }

      // Fit View: Ctrl + 1
      else if (isCtrlOrCmd && e.key === '1') {
        e.preventDefault();
        fitView({ padding: 0.25, duration: 400 });
      }

      // Escape: deselect and close menus
      else if (e.key === 'Escape') {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
        setSelectedNodeId(null);
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    fitView,
    handleCopy,
    handleCut,
    handleDeleteSelected,
    handleDuplicate,
    handlePaste,
    handleRedo,
    handleSelectAll,
    handleUndo,
    setNodes,
    zoomIn,
    zoomOut,
    zoomTo,
  ]);

  const compiledPythonCode = useMemo(() => {
    return generatePythonScript(nodes);
  }, [nodes]);

  return (
    <div className="w-screen h-screen flex flex-col bg-black overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <TopNav
        activeView={activeView}
        onViewChange={setActiveView}
        onSelectTemplate={handleSelectTemplate}
        onOpenExportModal={() => setIsExportOpen(true)}
        onAutoLayout={handleAutoLayout}
        onFitView={() => fitView({ padding: 0.25, duration: 400 })}
        onClearFlow={() => setIsClearModalOpen(true)}
        nodeCount={nodes.length}
        rlStatus={rlStatus}
        onStartRL={handleStartRL}
        onPauseRL={handlePauseRL}
        onStopRL={handleStopRL}
        rlTelemetry={rlTelemetry}
        rlLatestStep={rlLatestStep}
        onOpenMT5Deploy={() => setIsMT5DeployOpen(true)}
        onResetCamera={() => setCameraResetTrigger((c) => c + 1)}
      />

      {/* Main Viewport Routing: Flow DAG Canvas vs. Live 3D BPNN Visualizer */}
      {activeView === 'bpnn' ? (
        <div className="flex-1 h-full relative bg-[#08080c]">
          <LiveNeuralLink
            isTraining={rlStatus === 'running'}
            latestStep={rlLatestStep}
            cameraResetTrigger={cameraResetTrigger}
          />
        </div>
      ) : (
        <>
          {/* Main Studio Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Accordion Components Library */}
            <NodePalette
              onAddNode={(cfg) => handleAddNodeFromPalette(cfg)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />

            {/* Center: React Flow Canvas */}
            <div ref={reactFlowWrapper} className="flex-1 h-full relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onSelectionChange={onSelectionChange}
                onNodeContextMenu={onNodeContextMenu}
                onPaneContextMenu={onPaneContextMenu}
                onSelectionContextMenu={onSelectionContextMenu}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                proOptions={{ hideAttribution: true }}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.1}
                maxZoom={2.5}
                selectionOnDrag={true}
                selectionMode={SelectionMode.Partial}
                selectNodesOnDrag={true}
                panOnDrag={[1, 2]}
                panActivationKeyCode="Space"
                multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
                zoomOnScroll={true}
                zoomOnPinch={true}
                defaultEdgeOptions={{
                  animated: true,
                  style: { stroke: '#0a84ff', strokeWidth: 1.8 },
                }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1}
                  color="rgba(255, 255, 255, 0.08)"
                />
              </ReactFlow>
            </div>

            {/* Right: Apple Inspector */}
            <NodeInspector
              selectedNode={selectedNode}
              onUpdateParams={handleUpdateParams}
              onDeleteNode={handleDeleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>

          {/* Bottom: Apple Analytics Drawer */}
          <AnalyticsDrawer
            logs={logs}
            isRunning={rlStatus === 'running'}
            onClearLogs={() => setLogs(['[SYSTEM] Console cleared.'])}
          />
        </>
      )}

      {/* Minimal Clean Right-Click Context Menu */}
      <CanvasContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        flowPosition={contextMenu.flowPosition}
        targetNode={contextMenu.targetNode}
        selectedNodes={selectedNodes}
        hasClipboard={!!clipboard && clipboard.nodes.length > 0}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDuplicate={handleDuplicate}
        onCut={handleCut}
        onDelete={handleDeleteSelected}
      />

      {/* Clear Canvas Confirmation Modal - Bulletproof 28px Padding & Insets */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div
            className="bg-[#14141c]/98 backdrop-blur-3xl border border-white/[0.14] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-white animate-in fade-in zoom-in-95 duration-150 select-none"
            style={{
              width: '420px',
              maxWidth: '90vw',
              padding: '28px 24px',
              boxSizing: 'border-box',
            }}
          >
            {/* Red Trash Icon (with safe inset) */}
            <div
              className="rounded-xl bg-red-500/15 border border-red-500/25 text-[#ff453a] flex items-center justify-center"
              style={{ width: '44px', height: '44px', marginBottom: '18px' }}
            >
              <LucideIcons.Trash2 size={22} />
            </div>

            {/* Modal Title */}
            <h3
              className="font-semibold text-white tracking-tight"
              style={{ fontSize: '17px', lineHeight: '1.3', marginBottom: '8px' }}
            >
              Clear Canvas Flow?
            </h3>

            {/* Modal Description */}
            <p
              className="text-[#86868b] font-normal"
              style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '26px' }}
            >
              This will remove all {nodes.length} nodes and active connections from the current pipeline. This action cannot be undone.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-98 text-white font-medium transition-all cursor-pointer text-center"
                style={{ height: '38px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearFlow}
                className="flex-1 rounded-xl bg-[#ff453a] hover:bg-[#ff3b30] active:scale-98 text-white font-semibold transition-all shadow-[0_4px_16px_rgba(255,69,58,0.3)] cursor-pointer text-center"
                style={{ height: '38px', fontSize: '13px' }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Xcode Code Export Modal */}
      <CodeExportModal
        isOpen={isExportOpen}
        code={compiledPythonCode}
        onClose={() => setIsExportOpen(false)}
      />

      {/* MT5 ONNX Deploy Modal */}
      <MT5DeployModal
        isOpen={isMT5DeployOpen}
        onClose={() => setIsMT5DeployOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
