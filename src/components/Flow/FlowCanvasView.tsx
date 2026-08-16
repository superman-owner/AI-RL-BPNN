import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Connection, Edge, Node } from '@xyflow/react';
import NodeCard from '../nodes/NodeCard';
import { NODE_DEFS, GROUPS } from '../../data/nodeRegistry';
import * as LucideIcons from 'lucide-react';

const nodeTypes = {
  nodeCard: NodeCard,
};

const INITIAL_NODES: Node[] = [
  {
    id: 'node-1',
    type: 'nodeCard',
    position: { x: 40, y: 80 },
    data: {
      nodeType: 'strategy_preset_return',
      preset: 'Standard Quant',
      timeframe: 'M15',
      symbol: 'XAUUSD',
      bars_count: '10,000',
      execution: { status: 'passed', detail: 'Strategy Feed: XAUUSD M15' },
    },
  },
  {
    id: 'node-2',
    type: 'nodeCard',
    position: { x: 40, y: 280 },
    data: {
      nodeType: 'volatility_indicator',
      vol_window: 10,
      sma_period: 20,
      metric: 'ATR Normalized',
      execution: { status: 'passed', detail: 'ATR Filter: 0.0018' },
    },
  },
  {
    id: 'node-3',
    type: 'nodeCard',
    position: { x: 380, y: 160 },
    data: {
      nodeType: 'fc1_dense_expansion',
      units: '64',
      activation: 'LeakyReLU',
      weight_init: 'Kaiming Normal',
      use_bias: true,
      execution: { status: 'passed', detail: 'FC1 Linear Expansion: 6 to 64' },
    },
  },
  {
    id: 'node-4',
    type: 'nodeCard',
    position: { x: 680, y: 160 },
    data: {
      nodeType: 'spatial_dropout',
      rate: 0.15,
      mode: 'Standard Dropout',
      execution: { status: 'passed', detail: 'Dropout Active: 0.15' },
    },
  },
  {
    id: 'node-5',
    type: 'nodeCard',
    position: { x: 980, y: 160 },
    data: {
      nodeType: 'fc2_bottleneck_synthesizer',
      units: '32',
      activation: 'LeakyReLU',
      residual: 'Enable',
      execution: { status: 'passed', detail: 'FC2 Bottleneck: 64 to 32' },
    },
  },
  {
    id: 'node-6',
    type: 'nodeCard',
    position: { x: 1280, y: 160 },
    data: {
      nodeType: 'friction_spread_cost',
      spread_pip: 0.15,
      commission: 0.00,
      execution: { status: 'passed', detail: 'Friction Adjusted: Spread 0.15' },
    },
  },
  {
    id: 'node-7',
    type: 'nodeCard',
    position: { x: 1580, y: 160 },
    data: {
      nodeType: 'fc3_policy_action_head',
      classes: '3',
      entropy_beta: 0.08,
      execution: { status: 'passed', detail: 'Policy Softmax: 3 Actions' },
    },
  },
  {
    id: 'node-8',
    type: 'nodeCard',
    position: { x: 1880, y: 160 },
    data: {
      nodeType: 'onnx_mt5_compiler',
      export_mode: 'TorchScript Standalone',
      target_folder: 'MQL5/Files/',
      opset: 14,
      execution: { status: 'passed', detail: 'Compiled ONNX Standalone Ready' },
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e1-3',
    source: 'node-1',
    target: 'node-3',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' },
  },
  {
    id: 'e2-3',
    source: 'node-2',
    target: 'node-3',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' },
  },
  {
    id: 'e3-4',
    source: 'node-3',
    target: 'node-4',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#30d158', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(48,209,88,0.55))' },
  },
  {
    id: 'e4-5',
    source: 'node-4',
    target: 'node-5',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#bf5af2', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(191,90,242,0.55))' },
  },
  {
    id: 'e5-6',
    source: 'node-5',
    target: 'node-6',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#ffd60a', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(255,214,10,0.55))' },
  },
  {
    id: 'e6-7',
    source: 'node-6',
    target: 'node-7',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' },
  },
  {
    id: 'e7-8',
    source: 'node-7',
    target: 'node-8',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.55))' },
  },
];

// ==========================================
// 1. กำหนดค่าเริ่มต้นของทุกเส้นเป็น "smoothstep" แบบไม่มีหัวลูกศร
// ==========================================
const defaultEdgeOptions = {
  type: 'smoothstep', // 🟢 เส้นตรงหักมุมฉากแบบมุมมน
  animated: true,     // 🟢 แอนิเมชันจุดไฟวิ่งบนเส้น
  interactionWidth: 20, // 🟢 ขอบจับสัมผัสสำหรับการคลิกและคลิกขวาตัดสาย
  style: {
    stroke: '#0a84ff', // สีเส้นเริ่มต้น
    strokeWidth: 2,    // ความหนาของเส้น 2px
  },
  pathOptions: {
    borderRadius: 16,  // 🟢 รัศมีความโค้งมนของมุมเลี้ยว (16px กำลังสวย สบายตา)
  },
};

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

//  Apple Design System: State-driven Text & Dropdown Field (Default, Focus, Filled, Error)
interface InspectorTextFieldProps {
  label: string;
  value: string | number | boolean;
  defaultValue: string | number | boolean;
  type?: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  onChange: (val: string | number | boolean) => void;
}

const InspectorTextField: React.FC<InspectorTextFieldProps> = ({
  label,
  value,
  defaultValue,
  type,
  options,
  onChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isBoolean = type === 'boolean' || typeof defaultValue === 'boolean';
  const isSelect = !isBoolean && (type === 'select' || (options && options.length > 0));
  const isNumber = !isBoolean && !isSelect && typeof defaultValue === 'number';

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [isOpen]);

  //  Frameless Apple Settings Toggle Switch (with explicit 10px spacing)
  if (isBoolean) {
    const isChecked = Boolean(value ?? defaultValue);
    return (
      <div
        className="flex items-center justify-between py-1.5 px-0.5 nodrag nopan select-none"
        style={{ pointerEvents: 'all', marginTop: '2px', marginBottom: '2px' }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span
          className="text-[12px] font-medium text-[#f5f5f7] tracking-tight"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={() => onChange(!isChecked)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer nodrag nopan pointer-events-auto flex-shrink-0 ${
            isChecked ? 'bg-[#30d158]' : 'bg-[#3a3a44]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
              isChecked ? 'left-[18px]' : 'left-0.5'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
          />
        </button>
      </div>
    );
  }

  // State checks matching Apple/Figma specs
  const strVal = value !== undefined && value !== null ? String(value) : '';
  const isInvalidNumber = isNumber && (strVal.trim() === '' || isNaN(Number(strVal)));
  const isError = isInvalidNumber;
  const isFilled = strVal.trim() !== '';
  const selectOptions = options || ['32', '64', '128'];

  return (
    <div className="flex flex-col gap-1.5 group nodrag nopan relative" style={{ pointerEvents: 'all' }} ref={dropdownRef}>
      {/* Label above */}
      <label
        className="text-[11px] font-medium text-[#86868b] select-none tracking-tight"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
      >
        {label}
      </label>

      {/*  macOS Apple Dropdown Select (Exact replica of macOS System Popover) */}
      {isSelect ? (
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              pointerEvents: 'all',
            }}
            className={`w-full h-[30px] rounded-[7px] px-2.5 flex items-center justify-between transition-all bg-white/[0.07] hover:bg-white/[0.11] active:bg-white/[0.14] border text-left cursor-pointer nodrag nopan pointer-events-auto select-none ${
              isOpen
                ? 'border-[#0a84ff] ring-2 ring-[#0a84ff]/25 bg-white/[0.12]'
                : 'border-white/[0.14] hover:border-white/[0.22]'
            }`}
          >
            <span className="text-[12px] font-medium text-[#f5f5f7] truncate">
              {strVal || selectOptions[0]}
            </span>
            <LucideIcons.ChevronsUpDown size={12} className="text-white/50 flex-shrink-0 ml-1.5" />
          </button>

          {/*  macOS Floating Dark Glass Menu */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                backgroundColor: 'rgba(28, 28, 34, 0.97)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.3)',
                padding: '4px',
                zIndex: 100000,
                maxHeight: '220px',
                overflowY: 'auto',
              }}
              className="custom-scrollbar nodrag nopan"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {selectOptions.map((opt) => {
                const isSelected = opt === (strVal || selectOptions[0]);
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[12px] cursor-pointer transition-colors select-none ${
                      isSelected
                        ? 'bg-[#0a84ff] text-white font-medium shadow-sm'
                        : 'text-[#e5e5ea] hover:bg-white/[0.08] hover:text-white font-normal'
                    }`}
                  >
                    <span className="w-3.5 flex items-center justify-center flex-shrink-0">
                      {isSelected && <LucideIcons.Check size={12} strokeWidth={2.5} className="text-white" />}
                    </span>
                    <span className="truncate">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Text / Number Input Container */
        <div
          style={{ pointerEvents: 'all' }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`h-[30px] w-full rounded-[7px] px-2.5 flex items-center transition-all duration-150 bg-white/[0.05] pointer-events-auto relative ${
            isError
              ? 'border border-[#ff453a] ring-2 ring-[#ff453a]/25 bg-[#261c1e]'
              : isFocused
              ? 'border border-[#0a84ff] ring-2 ring-[#0a84ff]/25 bg-white/[0.09]'
              : isFilled
              ? 'border border-white/[0.14] hover:border-white/[0.22]'
              : 'border border-white/[0.10] hover:border-white/[0.18]'
          }`}
        >
          <input
            type={isNumber ? 'number' : 'text'}
            value={strVal}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (isNumber) {
                const val = e.target.value;
                const parsed = parseFloat(val);
                onChange(isNaN(parsed) ? val : parsed);
              } else {
                onChange(e.target.value);
              }
            }}
            placeholder={`Enter ${label.toLowerCase()}...`}
            style={{
              fontFamily: isNumber
                ? 'SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                : '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              pointerEvents: 'all',
            }}
            className="w-full bg-transparent text-[#f5f5f7] text-[12px] font-medium focus:outline-none placeholder:text-[#71717a] nodrag nopan pointer-events-auto cursor-text"
          />
        </div>
      )}

      {/* Error message indicator */}
      {isError && (
        <span
          className="text-[10px] text-[#ff453a] font-medium tracking-tight -mt-0.5"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
        >
          Invalid numeric value
        </span>
      )}
    </div>
  );
};

//  Draggable Floating Inspector Component (Pinned to Canvas Layer with GPU Direct Transforms)
interface FloatingInspectorProps {
  node: Node;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  onClose: () => void;
  toLocal: (clientX: number, clientY: number) => { x: number; y: number };
  updateNodeData: (nodeId: string, key: string, value: any) => void;
  deleteNode: () => void;
}

const FloatingInspector = React.memo<FloatingInspectorProps>(({
  node,
  position,
  onPositionChange,
  onClose,
  toLocal,
  updateNodeData,
  deleteNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const currentPosRef = useRef(position);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync position prop to ref and DOM when not actively dragging
  useEffect(() => {
    currentPosRef.current = position;
    if (containerRef.current && !isDraggingRef.current) {
      containerRef.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    }
  }, [position.x, position.y]);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    // Don't trigger drag if clicking buttons or inputs
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    isDraggingRef.current = true;
    setIsDragging(true);

    const startLocal = toLocal(e.clientX, e.clientY);
    dragRef.current = {
      dx: startLocal.x - currentPosRef.current.x,
      dy: startLocal.y - currentPosRef.current.y,
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || !dragRef.current) return;
      const nextLocal = toLocal(event.clientX, event.clientY);
      const nextX = nextLocal.x - dragRef.current.dx;
      const nextY = nextLocal.y - dragRef.current.dy;
      currentPosRef.current = { x: nextX, y: nextY };

      // 🚀 GPU-Direct Hardware Acceleration: Zero layout thrashing / 120 FPS
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      dragRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      // Commit final position to parent state once when dragging finishes
      onPositionChange(currentPosRef.current);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  const nodeType = node.data?.nodeType as string;
  const def = NODE_DEFS[nodeType];
  const group = GROUPS.find((g) => g.id === def?.group) || { label: 'Node', color: '#007aff' };
  const nodeLabel = String(def?.label || node.data?.label || nodeType);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: 'transform',
        width: 310,
        backgroundColor: 'rgba(22, 22, 28, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 9999,
        padding: '14px 16px 12px 16px',
        pointerEvents: 'all',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.08) inset',
      }}
      className="border border-white/[0.12] rounded-2xl text-xs select-none nodrag nopan nowheel cursor-default pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 🟢 DRAGGABLE HEADER BAR */}
      <div
        onPointerDown={onHeaderPointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          borderBottom: 'none',
          pointerEvents: 'all',
        }}
        className="nodrag nopan pointer-events-auto"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }}
          />
          <div>
            <span
              className="text-[9.5px] font-bold tracking-wider uppercase block"
              style={{
                color: group.color,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {group.label}
            </span>
            <span
              className="text-[12.5px] font-semibold text-white block"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.015em',
              }}
            >
              {nodeLabel}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'all' }}
          className="text-white/40 hover:text-white transition-all p-1 rounded-md hover:bg-white/[0.08] cursor-pointer pointer-events-auto nodrag nopan"
        >
          <LucideIcons.X size={13} />
        </button>
      </div>

      {/* 📝 BODY: Parameter Inputs (Guaranteed 10px Spacing) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '320px',
          overflowY: 'auto',
          paddingRight: '4px',
          pointerEvents: 'all',
        }}
        className="custom-scrollbar nodrag nopan"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {def?.fields.map((f) => {
          const val = (node.data?.[f.key] ?? f.default) as string | number | boolean;
          return (
            <InspectorTextField
              key={f.key}
              label={f.label}
              value={val}
              defaultValue={f.default}
              type={f.type}
              options={f.options}
              onChange={(newVal) => updateNodeData(node.id, f.key, newVal)}
            />
          );
        })}
      </div>

      {/* 🟢 FOOTER: Clean Apple Action Buttons (No Inner Divider Line, 10px Spacing) */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '4px',
          borderTop: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'all',
        }}
        className="nodrag nopan pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            pointerEvents: 'all',
          }}
          className="text-[12px] text-[#0a84ff] hover:text-[#409cff] flex items-center gap-1.5 font-medium transition-colors cursor-pointer pointer-events-auto nodrag nopan px-2 py-1 rounded-md hover:bg-white/[0.06]"
        >
          <LucideIcons.Check size={13} />
          <span>Update</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            pointerEvents: 'all',
          }}
          className="text-[12px] text-[#ff453a] hover:text-[#ff6961] flex items-center gap-1.5 font-medium transition-colors cursor-pointer pointer-events-auto nodrag nopan px-2 py-1 rounded-md hover:bg-[#ff453a]/10"
        >
          <LucideIcons.Trash2 size={13} />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
});

const FlowContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const { screenToFlowPosition } = useReactFlow();

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
  // 2. จัดการเมื่อผู้ใช้ลากสายเชื่อมต่อ (onConnect)
  // ==========================================
  const onConnect = useCallback(
    (connection: Connection) => {
      // 🎨 กำหนดสีตามขาที่ลากออกมา
      let edgeColor = '#38bdf8'; // สีฟ้าปกติ
      if (connection.sourceHandle === 'true' || connection.sourceHandle === 'pass') {
        edgeColor = '#10b981'; // 🟢 ขาผ่าน/สัญญาณซื้อ = สีเขียว Emerald
      } else if (connection.sourceHandle === 'false' || connection.sourceHandle === 'fail') {
        edgeColor = '#f43f5e'; // 🔴 ขาไม่ผ่าน/สัญญาณหยุด = สีแดง Rose
      }

      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        type: 'smoothstep', // 🟢 กำหนดเป็น smoothstep
        animated: true,     // เส้นไฟวิ่ง
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
          filter: `drop-shadow(0 0 6px ${edgeColor}88)`, // แสงนีออนฟุ้งเรืองแสง
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
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
  // 🎯 คำนวณจุดเกิดข้างๆ Node
  const openInspectorForNode = useCallback((node: Node, index = 0) => {
    // กว้างของ Node ปกติประมาณ 210px -> วางเยื้องขวา 230px
    const spawnX = node.position.x + 230 + (index * 14);
    const spawnY = node.position.y + (index * 14);

    setInspectors((prev) => {
      const exists = prev.find((item) => item.nodeId === node.id);
      if (exists) {
        // ถ้าเปิดอยู่แล้ว ให้เลื่อนมาโฟกัสที่ตำแหน่งข้าง Node
        return prev.map((item) => (item.nodeId === node.id ? { ...item, x: spawnX, y: spawnY } : item));
      }
      // ถ้ายังไม่เปิด ให้เพิ่มหน้าต่างใหม่ ณ จุดเกิดข้าง Node
      return [...prev, { nodeId: node.id, x: spawnX, y: spawnY }];
    });
  }, []);

  const moveInspector = useCallback((nodeId: string, pos: { x: number; y: number }) => {
    setInspectors((prev) =>
      prev.map((item) => (item.nodeId === nodeId ? { ...item, ...pos } : item))
    );
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

  // 🖱️ Event เมื่อดับเบิลคลิกที่ Node
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      openInspectorForNode(node);
    },
    [openInspectorForNode]
  );

  const [viewportElement, setViewportElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findViewport = () => {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      if (el) setViewportElement(el);
    };
    findViewport();
    const timer = setTimeout(findViewport, 50);
    return () => clearTimeout(timer);
  }, []);

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

  // ✂️ Event เมื่อคลิกขวาที่เส้น Edge เพื่อตัดสายเชื่อมต่อทันที (Disconnect Edge)
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu(null);
      // ตัดสายสัญญาณนี้ทันที (Disconnect Edge)
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    [setEdges]
  );

  // Close context menu on click elsewhere or zoom/wheel scroll
  useEffect(() => {
    const handleDismiss = () => setContextMenu(null);
    window.addEventListener('click', handleDismiss);
    window.addEventListener('wheel', handleDismiss, { passive: true });
    return () => {
      window.removeEventListener('click', handleDismiss);
      window.removeEventListener('wheel', handleDismiss);
    };
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

  // Calculate connected node IDs dynamically in real-time
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    edges.forEach((edge) => {
      ids.add(edge.source);
      ids.add(edge.target);
    });
    return ids;
  }, [edges]);

  // Inject isConnected into nodes data for NodeCard rendering
  const augmentedNodes = useMemo(() => {
    return nodes.map((node) => {
      const isConnected = connectedNodeIds.has(node.id);
      if (node.data?.isConnected === isConnected) return node;
      return {
        ...node,
        data: {
          ...node.data,
          isConnected,
        },
      };
    });
  }, [nodes, connectedNodeIds]);

  const activeNodesCount = useMemo(() => {
    return nodes.filter((n) => connectedNodeIds.has(n.id)).length;
  }, [nodes, connectedNodeIds]);

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#040407]"
      onMouseMove={onMouseMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={augmentedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onMoveStart={() => setContextMenu(null)}
        onPaneClick={() => setContextMenu(null)}
        onPaneScroll={() => setContextMenu(null)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#38bdf8', strokeWidth: 2 }}
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

      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#0c0c14]/90 backdrop-blur-md border border-white/[0.08] px-3 py-1.5 rounded-lg shadow-2xl text-xs select-none">
        <span className="text-[#30d158] font-mono text-[11px] flex items-center gap-1.5 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
          {activeNodesCount} Nodes Active
        </span>
        {nodes.length > activeNodesCount && (
          <span className="text-[#86868b] font-mono text-[10.5px]">
            ({nodes.length - activeNodesCount} Idle)
          </span>
        )}
      </div>

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(contextMenu.y, window.innerHeight - 240),
            left: Math.min(contextMenu.x, window.innerWidth - 240),
            zIndex: 100,
            minWidth: '220px',
            backgroundColor: '#08080c',
            padding: '8px 6px',
          }}
          className="border border-white/[0.14] rounded-xl shadow-2xl text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetNodeId ? (
            <>
              <button
                onClick={() => {
                  duplicateNodes();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg flex items-center justify-between bg-transparent text-white/80 hover:text-[#ffd60a] hover:drop-shadow-[0_0_8px_rgba(255,214,10,0.85)] transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5 text-[12px] font-medium">
                  <LucideIcons.CopyPlus size={13} className="text-[#ffd60a] flex-shrink-0" />
                  <span>Duplicate</span>
                </span>
                <span className="text-[11px] text-white/40 font-mono pl-4 flex-shrink-0">Ctrl+D</span>
              </button>
              <button
                onClick={() => {
                  copyNodes();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg flex items-center justify-between bg-transparent text-white/80 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5 text-[12px] font-medium">
                  <LucideIcons.Copy size={13} className="text-white/70 flex-shrink-0" />
                  <span>Copy</span>
                </span>
                <span className="text-[11px] text-white/40 font-mono pl-4 flex-shrink-0">Ctrl+C</span>
              </button>
              <button
                onClick={() => {
                  cutNodes();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg flex items-center justify-between bg-transparent text-white/80 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5 text-[12px] font-medium">
                  <LucideIcons.Scissors size={13} className="text-white/70 flex-shrink-0" />
                  <span>Cut</span>
                </span>
                <span className="text-[11px] text-white/40 font-mono pl-4 flex-shrink-0">Ctrl+X</span>
              </button>
              <div className="my-0.5 border-t border-white/[0.08] mx-2" />
              <button
                onClick={() => {
                  disconnectNodes();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg flex items-center justify-between bg-transparent text-[#ff9f0a]/90 hover:text-[#ff9f0a] hover:drop-shadow-[0_0_8px_rgba(255,159,10,0.85)] transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5 text-[12px] font-medium">
                  <LucideIcons.Unlink size={13} className="text-[#ff9f0a] flex-shrink-0" />
                  <span>Disconnect Edges</span>
                </span>
                <span className="text-[11px] text-white/40 font-mono pl-4 flex-shrink-0">Ctrl+K</span>
              </button>
              <button
                onClick={() => {
                  deleteNodes();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 rounded-lg flex items-center justify-between bg-transparent text-[#ff453a]/90 hover:text-[#ff453a] hover:drop-shadow-[0_0_8px_rgba(255,69,58,0.85)] transition-all cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5 text-[12px] font-medium">
                  <LucideIcons.Trash2 size={13} className="text-[#ff453a] flex-shrink-0" />
                  <span>Delete</span>
                </span>
                <span className="text-[11px] text-white/40 font-mono pl-4 flex-shrink-0">Del</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                pasteAt(contextMenu.flowPos);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 rounded-lg flex items-center justify-between bg-transparent text-white/80 hover:text-[#007aff] hover:drop-shadow-[0_0_8px_rgba(0,122,255,0.85)] transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-2.5 text-[12px] font-medium">
                <LucideIcons.ClipboardPaste size={13} className="text-[#007aff] flex-shrink-0" />
                <span>Paste Here</span>
              </span>
              <span className="text-[11px] text-white/40 font-mono pl-4 flex-shrink-0">Ctrl+V</span>
            </button>
          )}
        </div>
      )}

        {/* Floating Parameter Inspectors (Rendered on Canvas Layer via Portal) */}
        {viewportElement &&
          createPortal(
            inspectors.map((insp) => {
              const node = nodes.find((n) => n.id === insp.nodeId);
              if (!node) return null;

              return (
                <FloatingInspector
                  key={insp.nodeId}
                  node={node}
                  position={{ x: insp.x, y: insp.y }}
                  onPositionChange={(pos) => moveInspector(insp.nodeId, pos)}
                  onClose={() => closeInspector(insp.nodeId)}
                  toLocal={(cx, cy) => screenToFlowPosition({ x: cx, y: cy })}
                  updateNodeData={updateNodeData}
                  deleteNode={() => {
                    closeInspector(insp.nodeId);
                    deleteNodes([node]);
                  }}
                />
              );
            }),
            viewportElement
          )}
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
