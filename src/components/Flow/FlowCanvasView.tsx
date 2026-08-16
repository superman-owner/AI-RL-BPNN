import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
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
import { useTheme } from '../../context/ThemeContext';

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

const InspectorTextField: React.FC<{
  label: string;
  value: string | number | boolean;
  defaultValue?: string | number | boolean;
  type?: 'string' | 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  onChange: (val: any) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}> = ({ label, value, defaultValue, type, options, onChange, isOpen = false, onToggleOpen }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isFocused, setIsFocused] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const isBoolean = type === 'boolean' || typeof defaultValue === 'boolean';
  const isSelect = !isBoolean && (type === 'select' || (options && options.length > 0));
  const isNumber = !isBoolean && !isSelect && (type === 'number' || typeof defaultValue === 'number');

  // Calculate portal position on open
  const updateMenuPosition = useCallback(() => {
    if (!triggerButtonRef.current) return;
    const rect = triggerButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min((options?.length || 3) * 32 + 10, 220);
    const openUpwards = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    setMenuStyle({
      position: 'fixed',
      top: openUpwards ? Math.max(10, rect.top - estimatedHeight - 4) : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(28, 28, 34, 0.98)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderRadius: '8px',
      border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.16)',
      boxShadow: isLight
        ? '0 16px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        : '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.4)',
      padding: '4px',
      zIndex: 999999,
      maxHeight: `${estimatedHeight}px`,
      overflowY: 'auto',
    });
  }, [options, isLight]);

  const toggleDropdown = () => {
    if (!isOpen) {
      updateMenuPosition();
      onToggleOpen?.(true);
    } else {
      onToggleOpen?.(false);
    }
  };

  // Close dropdown on click outside anywhere (including on nodes) or scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsidePointerDown = (e: PointerEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        (triggerButtonRef.current && triggerButtonRef.current.contains(target)) ||
        (menuRef.current && menuRef.current.contains(target))
      ) {
        return;
      }
      onToggleOpen?.(false);
    };

    const handleScroll = () => onToggleOpen?.(false);
    window.addEventListener('pointerdown', handleOutsidePointerDown, { capture: true });
    window.addEventListener('mousedown', handleOutsidePointerDown, { capture: true });
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointerDown, { capture: true });
      window.removeEventListener('mousedown', handleOutsidePointerDown, { capture: true });
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onToggleOpen]);

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
          className={`text-[12px] font-medium tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-[#f5f5f7]'}`}
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
            isChecked
              ? isLight ? 'bg-[#28cd41]' : 'bg-[#30d158]'
              : isLight ? 'bg-[#d1d1d6]' : 'bg-[#3a3a44]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
              isChecked ? 'left-[18px]' : 'left-0.5'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
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
    <div className="flex flex-col gap-1.5 group nodrag nopan relative" style={{ pointerEvents: 'all' }}>
      {/* Label above */}
      <label
        className={`text-[11px] font-medium select-none tracking-tight ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
          cursor: 'var(--mac-cursor-default)',
        }}
      >
        {label}
      </label>

      {/*  macOS Apple Dropdown Select (Instant 1-Click Switchable) */}
      {isSelect ? (
        <div className="relative w-full">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              pointerEvents: 'all',
              paddingLeft: '10px',
              paddingRight: '10px',
            }}
            className={`w-full h-[25px] rounded-[6px] flex items-center justify-between transition-all border text-left cursor-pointer nodrag nopan pointer-events-auto select-none ${
              isLight
                ? isOpen
                  ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-[#e8e8ed]'
                  : 'bg-[#f0f0f2] hover:bg-[#e8e8ed] border-black/[0.08] hover:border-black/[0.16]'
                : isOpen
                ? 'border-[#0a84ff] ring-2 ring-[#0a84ff]/25 bg-white/[0.12]'
                : 'bg-white/[0.07] hover:bg-white/[0.11] border-white/[0.14] hover:border-white/[0.22]'
            }`}
          >
            <span className={`text-[12px] font-medium truncate ${isLight ? 'text-[#1d1d1f]' : 'text-[#f5f5f7]'}`}>
              {strVal || selectOptions[0]}
            </span>
            <LucideIcons.ChevronsUpDown size={12} className={`flex-shrink-0 ml-1.5 ${isLight ? 'text-black/40' : 'text-white/50'}`} />
          </button>

          {/*  macOS Floating Dark/Light Glass Menu Portal */}
          {isOpen &&
            createPortal(
              <div
                ref={menuRef}
                style={menuStyle}
                className="custom-scrollbar nodrag nopan select-none"
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
                        onToggleOpen?.(false);
                      }}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                        paddingLeft: '8px',
                        paddingRight: '10px',
                        height: '28px',
                      }}
                      className={`flex items-center gap-2 rounded-[5px] text-[12px] cursor-pointer transition-colors select-none ${
                        isSelected
                          ? isLight ? 'bg-[#0071e3] text-white font-medium shadow-sm' : 'bg-[#0a84ff] text-white font-medium shadow-sm'
                          : isLight ? 'text-[#1d1d1f] hover:bg-black/[0.05] hover:text-[#0071e3] font-normal' : 'text-[#e5e5ea] hover:bg-white/[0.08] hover:text-white font-normal'
                      }`}
                    >
                      <span className="w-3.5 flex items-center justify-center flex-shrink-0">
                        {isSelected && <LucideIcons.Check size={12} strokeWidth={2.5} className="text-white" />}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  );
                })}
              </div>,
              document.body
            )}
        </div>
      ) : (
        /* Text / Number Input Container */
        <div
          style={{ pointerEvents: 'all', paddingLeft: '10px', paddingRight: '10px' }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`h-[25px] w-full rounded-[6px] flex items-center transition-all duration-150 pointer-events-auto relative ${
            isError
              ? isLight ? 'border border-[#d70015] ring-2 ring-[#d70015]/20 bg-[#ffeff0]' : 'border border-[#ff453a] ring-2 ring-[#ff453a]/25 bg-[#261c1e]'
              : isFocused
              ? isLight ? 'border border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-[#ffffff]' : 'border border-[#0a84ff] ring-2 ring-[#0a84ff]/25 bg-white/[0.09]'
              : isFilled
              ? isLight ? 'bg-[#f0f0f2] border border-black/[0.12] hover:border-black/[0.2]' : 'bg-white/[0.05] border border-white/[0.14] hover:border-white/[0.22]'
              : isLight ? 'bg-[#f0f0f2] border border-black/[0.08] hover:border-black/[0.16]' : 'bg-white/[0.05] border border-white/[0.10] hover:border-white/[0.18]'
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
            className={`w-full bg-transparent text-[12px] font-medium focus:outline-none nodrag nopan pointer-events-auto cursor-text px-0 ${
              isLight ? 'text-[#1d1d1f] placeholder:text-[#8e8e93]' : 'text-[#f5f5f7] placeholder:text-[#71717a]'
            }`}
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
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const currentPosRef = useRef(position);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync position prop to ref and DOM when not actively dragging
  useEffect(() => {
    currentPosRef.current = position;
    if (containerRef.current && !isDraggingRef.current) {
      containerRef.current.style.left = `${position.x}px`;
      containerRef.current.style.top = `${position.y}px`;
    }
  }, [position.x, position.y]);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
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

      // Ultra-sharp vector positioning: Zero blurriness on zoom
      if (containerRef.current) {
        containerRef.current.style.left = `${nextX}px`;
        containerRef.current.style.top = `${nextY}px`;
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

  const [activeDropdownKey, setActiveDropdownKey] = useState<string | null>(null);

  const nodeType = node.data?.nodeType as string;
  const def = NODE_DEFS[nodeType];
  const group = GROUPS.find((g) => g.id === def?.group) || { label: 'Node', color: '#007aff' };
  const nodeLabel = String(def?.label || node.data?.label || nodeType);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 265,
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(22, 22, 28, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 9999,
        padding: '12px 14px 10px 14px',
        pointerEvents: 'all',
        cursor: 'var(--mac-cursor-default)',
        boxShadow: isLight
          ? '0 20px 50px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255, 255, 255, 0.8) inset'
          : '0 24px 48px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.08) inset',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
      className={`border rounded-2xl text-xs select-none nodrag nopan pointer-events-auto transition-colors duration-150 ${
        isLight ? 'border-black/[0.12] text-[#1d1d1f]' : 'border-white/[0.12] text-slate-200'
      }`}
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
          marginBottom: '10px',
          cursor: isDragging ? 'var(--mac-cursor-grabbing)' : 'var(--mac-cursor-grab)',
          userSelect: 'none',
          borderBottom: 'none',
          pointerEvents: 'all',
        }}
        className="nodrag nopan pointer-events-auto"
      >
        <div className="flex items-center gap-2 pointer-events-none min-w-0 flex-1 pr-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }}
          />
          <div className="min-w-0 flex-1">
            <span
              className="text-[9px] font-bold tracking-wider uppercase block truncate"
              style={{
                color: group.color,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {group.label}
            </span>
            <span
              className={`text-[12px] font-semibold block truncate ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.015em',
                whiteSpace: 'nowrap',
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
          style={{ pointerEvents: 'all', cursor: 'var(--mac-cursor-pointer)' }}
          className={`transition-colors duration-150 pointer-events-auto nodrag nopan flex-shrink-0 ${
            isLight ? 'text-black/40 hover:text-[#1d1d1f]' : 'text-white/40 hover:text-white'
          }`}
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
          cursor: 'var(--mac-cursor-default)',
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
              isOpen={activeDropdownKey === f.key}
              onToggleOpen={(open) => setActiveDropdownKey(open ? f.key : null)}
            />
          );
        })}
      </div>

      {/* 🟢 FOOTER: Centered Apple Action Buttons with 20px Gap */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          pointerEvents: 'all',
          cursor: 'var(--mac-cursor-default)',
        }}
        className="nodrag nopan pointer-events-auto px-1 select-none"
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
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'var(--mac-cursor-pointer)',
          }}
          className="text-[12px] text-[#0a84ff] hover:text-[#409cff] flex items-center gap-1.5 font-medium transition-colors duration-150 pointer-events-auto nodrag nopan select-none group"
        >
          <LucideIcons.Check size={13} className="text-[#0a84ff] group-hover:text-[#409cff] transition-colors duration-150" />
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
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'var(--mac-cursor-pointer)',
          }}
          className="text-[12px] text-[#ff453a] hover:text-[#ff6961] flex items-center gap-1.5 font-medium transition-colors duration-150 pointer-events-auto nodrag nopan select-none group"
        >
          <LucideIcons.Trash2 size={13} className="text-[#ff453a] group-hover:text-[#ff6961] transition-colors duration-150" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
});

const FlowContent: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const { screenToFlowPosition } = useReactFlow();

  // Floating Context Menu & Inspector States
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [inspectors, setInspectors] = useState<InspectorState[]>([]);

  // Clipboard Reference for Multi-Node Copy / Cut / Paste
  const [hasClipboard, setHasClipboard] = useState(false);
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const pasteCountRef = useRef(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Get currently selected nodes helper
  const selectedNodes = useCallback((specificNodeId: string | null = null) => {
    if (specificNodeId) {
      const node = nodesRef.current.find((n) => n.id === specificNodeId);
      return node ? [node] : [];
    }
    return nodesRef.current.filter((n) => n.selected);
  }, []);

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
      const targets = nodesToCopy && nodesToCopy.length ? nodesToCopy : selectedNodes();
      if (!targets.length) return false;
      const selectedIds = new Set(targets.map((n) => n.id));

      // เก็บทั้ง Node และสาย Edges ที่เชื่อมต่อกันภายในกลุ่ม
      clipboardRef.current = {
        nodes: targets.map((node) => ({
          ...node,
          selected: false,
          data: { ...node.data },
        })),
        edges: edgesRef.current
          .filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target))
          .map((edge) => ({ ...edge })),
      };
      pasteCountRef.current = 0;
      setHasClipboard(true);
      return true;
    },
    [selectedNodes]
  );

  // ==========================================
  // 3. การ DELETE (ลบ NODE + EDGES)
  // ==========================================
  const deleteNodes = useCallback(
    (nodesToDelete: Node[] | null = null) => {
      const targets = nodesToDelete && nodesToDelete.length ? nodesToDelete : selectedNodes();
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
      const targets = nodesToCut && nodesToCut.length ? nodesToCut : selectedNodes();
      if (!targets.length) return;
      copyNodes(targets);
      deleteNodes(targets);
      setHasClipboard(true);
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
      const targets = nodesToDup && nodesToDup.length ? nodesToDup : selectedNodes();
      if (!targets.length) return;
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
      const targets = nodesToDisconnect && nodesToDisconnect.length ? nodesToDisconnect : selectedNodes();
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
  // 10. Global Keyboard Shortcuts (Supports all keyboard layouts & codes)
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea / editable fields
      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetEl?.tagName || '') ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName || '') ||
        targetEl?.isContentEditable ||
        activeEl?.isContentEditable
      ) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const code = e.code;

      if (isCmdOrCtrl && (code === 'KeyC' || key === 'c')) {
        e.preventDefault();
        copyNodes();
      } else if (isCmdOrCtrl && (code === 'KeyX' || key === 'x')) {
        e.preventDefault();
        cutNodes();
      } else if (isCmdOrCtrl && (code === 'KeyV' || key === 'v')) {
        e.preventDefault();
        pasteAt(mousePosRef.current);
      } else if (isCmdOrCtrl && (code === 'KeyD' || key === 'd')) {
        e.preventDefault();
        duplicateNodes();
      } else if (isCmdOrCtrl && (code === 'KeyK' || key === 'k')) {
        e.preventDefault();
        disconnectNodes();
      } else if (isCmdOrCtrl && (code === 'KeyA' || key === 'a')) {
        e.preventDefault();
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
      } else if (e.key === 'Delete' || e.key === 'Backspace' || code === 'Delete' || code === 'Backspace') {
        e.preventDefault();
        deleteNodes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyNodes, cutNodes, pasteAt, duplicateNodes, disconnectNodes, deleteNodes, setNodes]);

  // Drag-and-Drop from Palette onto Canvas
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // Listen to custom Pointer-based Drag & Drop for 100% Theme-locked Mac Cursors
  useEffect(() => {
    const handleCustomDrop = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeType: string; clientX: number; clientY: number }>;
      if (!customEvent.detail) return;
      const { nodeType, clientX, clientY } = customEvent.detail;
      const position = screenToFlowPosition({ x: clientX, y: clientY });
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
      setIsDragOverCanvas(false);
    };

    const handleCustomHover = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOver: boolean }>;
      if (customEvent.detail) {
        setIsDragOverCanvas(Boolean(customEvent.detail.isOver));
      }
    };

    window.addEventListener('fxforge-drop-node', handleCustomDrop);
    window.addEventListener('fxforge-drag-hover', handleCustomHover);
    return () => {
      window.removeEventListener('fxforge-drop-node', handleCustomDrop);
      window.removeEventListener('fxforge-drag-hover', handleCustomHover);
    };
  }, [screenToFlowPosition, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOverCanvas(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOverCanvas(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOverCanvas(false);
      document.body.classList.remove('is-dragging-node');

      // Strict Boundary Check: Must cross divider line into Canvas
      const sidebarEl = document.querySelector('aside');
      const sidebarRect = sidebarEl?.getBoundingClientRect();
      const hasCrossedDivider = sidebarRect ? event.clientX > sidebarRect.right : true;
      if (!hasCrossedDivider) return;

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
      style={{
        boxShadow: isDragOverCanvas
          ? isLight
            ? 'inset 0 0 0 2.5px #0071e3, inset 0 0 30px rgba(0, 113, 227, 0.15)'
            : 'inset 0 0 0 2.5px #0a84ff, inset 0 0 40px rgba(10, 132, 255, 0.25)'
          : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
      className={`w-full h-full relative overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-[#f5f5f7]' : 'bg-[#040407]'
      }`}
      onMouseMove={onMouseMove}
      onDragLeave={onDragLeave}
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
        onNodeDragStart={() => {
          document.documentElement.classList.add('is-dragging-node');
          document.body.classList.add('is-dragging-node');
        }}
        onNodeDragStop={() => {
          document.documentElement.classList.remove('is-dragging-node');
          document.body.classList.remove('is-dragging-node');
        }}
        onSelectionStart={() => {
          document.documentElement.classList.add('is-selecting-canvas');
          document.body.classList.add('is-selecting-canvas');
        }}
        onSelectionEnd={() => {
          document.documentElement.classList.remove('is-selecting-canvas');
          document.body.classList.remove('is-selecting-canvas');
        }}
        onConnectStart={() => {
          document.documentElement.classList.add('is-connecting');
          document.body.classList.add('is-connecting');
        }}
        onConnectEnd={() => {
          document.documentElement.classList.remove('is-connecting');
          document.body.classList.remove('is-connecting');
        }}
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
        connectionLineStyle={{
          stroke: isLight ? '#0071e3' : '#0a84ff',
          strokeWidth: 2.5,
          filter: isLight
            ? 'drop-shadow(0 0 8px rgba(0, 113, 227, 0.75))'
            : 'drop-shadow(0 0 10px rgba(10, 132, 255, 0.9))',
        }}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        minZoom={0.3}
        maxZoom={1.6}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
          color={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)'}
        />
        <Controls
          className={
            isLight
              ? 'bg-white/90 border border-black/[0.08] text-[#1d1d1f] fill-[#1d1d1f] rounded-lg shadow-lg'
              : 'bg-[#0f0f18] border border-white/[0.08] text-white fill-white rounded-lg shadow-xl'
          }
          showInteractive={false}
        />
        <MiniMap
          nodeColor={isLight ? '#0071e3' : '#0a84ff'}
          maskColor={isLight ? 'rgba(245, 245, 247, 0.75)' : 'rgba(4, 4, 7, 0.8)'}
          className={
            isLight
              ? 'bg-white/80 border border-black/[0.08] rounded-xl shadow-lg'
              : 'bg-[#0f0f18]/80 border border-white/[0.08] rounded-xl shadow-xl'
          }
        />
      </ReactFlow>

      {/* Real-time Status Badge */}
      <div
        className={`absolute bottom-6 left-6 z-10 px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 select-none shadow-sm ${
          isLight ? 'bg-white/90 border-black/[0.08]' : 'bg-[#12121a]/90 border-white/[0.08]'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
        <span
          className={`text-xs font-semibold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
        >
          {activeNodesCount} Nodes Active
        </span>
        {nodes.length > activeNodesCount && (
          <span
            className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
          >
            ({nodes.length - activeNodesCount} Idle)
          </span>
        )}
      </div>

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(contextMenu.y, window.innerHeight - 260),
            left: Math.min(contextMenu.x, window.innerWidth - 240),
            zIndex: 100,
            minWidth: '220px',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(18, 18, 26, 0.96)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            padding: '6px',
            boxShadow: isLight
              ? '0 16px 40px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.1)'
              : '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.14)',
          }}
          className={`rounded-2xl text-xs select-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 ${
            isLight ? 'text-[#111827]' : 'text-slate-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetNodeId ? (
            <>
              {/* Duplicate */}
              <button
                onClick={() => {
                  const target = nodes.filter((n) => n.id === contextMenu.targetNodeId);
                  duplicateNodes(target.length ? target : null);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between transition-all text-left ${
                  isLight
                    ? 'text-[#111827] hover:bg-black/[0.06] hover:text-[#0071e3]'
                    : 'text-white/90 hover:bg-white/[0.08] hover:text-[#ffd60a]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2.5 text-[12.5px] font-medium">
                  <LucideIcons.CopyPlus size={14} className="text-[#ffd60a] flex-shrink-0" />
                  <span>Duplicate</span>
                </span>
                <span className={`text-[11px] font-mono pl-4 flex-shrink-0 ${isLight ? 'text-black/40' : 'text-white/40'}`}>
                  Ctrl+D
                </span>
              </button>

              {/* Copy */}
              <button
                onClick={() => {
                  const target = nodes.filter((n) => n.id === contextMenu.targetNodeId);
                  copyNodes(target.length ? target : null);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between transition-all text-left ${
                  isLight
                    ? 'text-[#111827] hover:bg-black/[0.06] hover:text-[#0071e3]'
                    : 'text-white/90 hover:bg-white/[0.08] hover:text-white'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2.5 text-[12.5px] font-medium">
                  <LucideIcons.Copy size={14} className={isLight ? 'text-[#4b5563] flex-shrink-0' : 'text-white/70 flex-shrink-0'} />
                  <span>Copy</span>
                </span>
                <span className={`text-[11px] font-mono pl-4 flex-shrink-0 ${isLight ? 'text-black/40' : 'text-white/40'}`}>
                  Ctrl+C
                </span>
              </button>

              {/* Cut */}
              <button
                onClick={() => {
                  const target = nodes.filter((n) => n.id === contextMenu.targetNodeId);
                  cutNodes(target.length ? target : null);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between transition-all text-left ${
                  isLight
                    ? 'text-[#111827] hover:bg-black/[0.06] hover:text-[#0071e3]'
                    : 'text-white/90 hover:bg-white/[0.08] hover:text-white'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2.5 text-[12.5px] font-medium">
                  <LucideIcons.Scissors size={14} className={isLight ? 'text-[#4b5563] flex-shrink-0' : 'text-white/70 flex-shrink-0'} />
                  <span>Cut</span>
                </span>
                <span className={`text-[11px] font-mono pl-4 flex-shrink-0 ${isLight ? 'text-black/40' : 'text-white/40'}`}>
                  Ctrl+X
                </span>
              </button>

              {/* Paste (Grayed out if clipboard is empty) */}
              <button
                disabled={!hasClipboard}
                onClick={() => {
                  if (!hasClipboard) return;
                  pasteAt(contextMenu.flowPos);
                  setContextMenu(null);
                }}
                style={{ cursor: hasClipboard ? 'var(--mac-cursor-default)' : 'not-allowed' }}
                className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between transition-all text-left ${
                  !hasClipboard
                    ? isLight
                      ? 'opacity-35 text-black/30 cursor-not-allowed pointer-events-none hover:bg-transparent'
                      : 'opacity-35 text-white/30 cursor-not-allowed pointer-events-none hover:bg-transparent'
                    : isLight
                    ? 'text-[#111827] hover:bg-black/[0.06] hover:text-[#0071e3]'
                    : 'text-white/90 hover:bg-white/[0.08] hover:text-[#007aff]'
                }`}
              >
                <span className="flex items-center gap-2.5 text-[12.5px] font-medium">
                  <LucideIcons.ClipboardPaste
                    size={14}
                    className={`${
                      !hasClipboard
                        ? isLight
                          ? 'text-black/30'
                          : 'text-white/30'
                        : isLight
                        ? 'text-[#0071e3]'
                        : 'text-[#0a84ff]'
                    } flex-shrink-0`}
                  />
                  <span>Paste</span>
                </span>
                <span
                  className={`text-[11px] font-mono pl-4 flex-shrink-0 ${
                    !hasClipboard
                      ? isLight
                        ? 'text-black/20'
                        : 'text-white/20'
                      : isLight
                      ? 'text-black/40'
                      : 'text-white/40'
                  }`}
                >
                  Ctrl+V
                </span>
              </button>

              {/* Divider */}
              <div className={`my-1 border-t mx-2 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`} />

              {/* Disconnect */}
              <button
                onClick={() => {
                  const target = nodes.filter((n) => n.id === contextMenu.targetNodeId);
                  disconnectNodes(target.length ? target : null);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between transition-all text-left text-[#ff9f0a] ${
                  isLight
                    ? 'hover:bg-[#ff9f0a]/10'
                    : 'hover:bg-white/[0.08]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2.5 text-[12.5px] font-medium">
                  <LucideIcons.Unlink size={14} className="text-[#ff9f0a] flex-shrink-0" />
                  <span>Disconnect Edges</span>
                </span>
                <span className={`text-[11px] font-mono pl-4 flex-shrink-0 ${isLight ? 'text-[#ff9f0a]/60' : 'text-[#ff9f0a]/60'}`}>
                  Ctrl+K
                </span>
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  const target = nodes.filter((n) => n.id === contextMenu.targetNodeId);
                  deleteNodes(target.length ? target : null);
                  setContextMenu(null);
                }}
                className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between transition-all text-left text-[#ff453a] ${
                  isLight
                    ? 'hover:bg-[#ff453a]/10'
                    : 'hover:bg-white/[0.08]'
                }`}
                style={{ cursor: 'var(--mac-cursor-default)' }}
              >
                <span className="flex items-center gap-2.5 text-[12.5px] font-medium">
                  <LucideIcons.Trash2 size={14} className="text-[#ff453a] flex-shrink-0" />
                  <span>Delete</span>
                </span>
                <span className={`text-[11px] font-mono pl-4 flex-shrink-0 ${isLight ? 'text-[#ff453a]/60' : 'text-[#ff453a]/60'}`}>
                  Del
                </span>
              </button>
            </>
          ) : (
            /* Paste Here (Grayed out if clipboard is empty) */
            <button
              disabled={!hasClipboard}
              onClick={() => {
                if (!hasClipboard) return;
                pasteAt(contextMenu.flowPos);
                setContextMenu(null);
              }}
              style={{ cursor: hasClipboard ? 'var(--mac-cursor-default)' : 'not-allowed' }}
              className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between transition-all text-left ${
                !hasClipboard
                  ? isLight
                    ? 'opacity-35 text-black/30 cursor-not-allowed pointer-events-none hover:bg-transparent'
                    : 'opacity-35 text-white/30 cursor-not-allowed pointer-events-none hover:bg-transparent'
                  : isLight
                  ? 'text-[#111827] hover:bg-black/[0.06] hover:text-[#0071e3]'
                  : 'text-white/90 hover:bg-white/[0.08] hover:text-[#007aff]'
              }`}
            >
              <span className="flex items-center gap-2.5 text-[12.5px] font-medium">
                <LucideIcons.ClipboardPaste
                  size={14}
                  className={`${
                    !hasClipboard
                      ? isLight
                        ? 'text-black/30'
                        : 'text-white/30'
                      : isLight
                      ? 'text-[#0071e3]'
                      : 'text-[#0a84ff]'
                  } flex-shrink-0`}
                />
                <span>Paste Here</span>
              </span>
              <span
                className={`text-[11px] font-mono pl-4 flex-shrink-0 ${
                  !hasClipboard
                    ? isLight
                      ? 'text-black/20'
                      : 'text-white/20'
                    : isLight
                    ? 'text-black/40'
                    : 'text-white/40'
                }`}
              >
                Ctrl+V
              </span>
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
