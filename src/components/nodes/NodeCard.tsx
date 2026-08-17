import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GROUPS, NODE_DEFS } from '../../data/nodeRegistry';
import { useTheme } from '../../context/ThemeContext';
import {
  Zap,
  Send,
  Layers,
  BarChart2,
  Sliders,
  Brain,
  Shield,
} from 'lucide-react';

const groupById = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

const STATUS_COLOR: Record<string, string> = {
  passed: 'var(--accent-green, #5fd390)',
  failed: 'var(--accent-red, #e05d55)',
  queued: 'var(--accent-amber, #f59e0b)',
  skipped: 'var(--accent-blue, #5b8dbe)',
  blocked: 'var(--text-faint, #64748b)',
};

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  input: BarChart2,
  fc1: Sliders,
  regularization: Shield,
  fc2: Brain,
  reward: Zap,
  output: Send,
};

export default function NodeCard({ data, selected }: { data: any; selected?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const def = NODE_DEFS[data.nodeType] || {
    group: 'stage1',
    label: data.label || data.nodeType || 'Node',
    fields: [],
    hasInput: true,
    hasOutput: true,
    decision: true,
  };
  const group = groupById[def.group] || { label: 'NODE', color: '#38bdf8' };
  const accent = group.color;
  const execution = data.execution;
  const isConnected = data.isConnected !== false;
  const statusColor = isConnected ? (STATUS_COLOR[execution?.status] || 'var(--accent-green, #5fd390)') : null;
  const executionMode = data.executionMode || 'on';
  const GroupIcon = GROUP_ICONS[def.group] || Layers;

  return (
    <div
      style={{
        minWidth: 260,
        maxWidth: 290,
        position: 'relative',
        background: isLight ? '#ffffff' : '#14141a',
        opacity: executionMode === 'off' ? 0.55 : (isConnected ? 1 : 0.85),
        border: selected
          ? `1.5px solid ${accent}`
          : (isConnected
            ? (isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)')
            : (isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)')),
        borderRadius: '10px',
        boxShadow: selected
          ? (isLight ? `0 0 0 1px ${accent}, 0 8px 24px rgba(0,0,0,0.12)` : `0 0 0 1px ${accent}, 0 8px 24px rgba(0,0,0,0.6)`)
          : (isLight ? '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.45)'),
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, -apple-system, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        transition: 'border 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, background 0.15s ease',
      }}
    >
      {/* Content Container (Layered above handles with zIndex 2) */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Node Header (Clean Minimalist, Zero Divider Line) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 12px 5px 12px',
            background: 'transparent',
            borderBottom: 'none',
            borderTopLeftRadius: '9px',
            borderTopRightRadius: '9px',
          }}
        >
          <GroupIcon size={15} color={isConnected ? accent : (isLight ? '#475569' : '#94a3b8')} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: isConnected ? accent : (isLight ? '#475569' : '#94a3b8'),
                textTransform: 'uppercase',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {group.label}
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: isConnected ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#334155' : '#e2e8f0'),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.25,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {def.label}
            </div>
          </div>

          {/* Execution Status Badge: Only lit green when isConnected is true */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isConnected && statusColor ? statusColor : (isLight ? '#cbd5e1' : '#475569'),
              boxShadow: isConnected && statusColor ? `0 0 8px ${statusColor}` : 'none',
              opacity: isConnected ? 1 : 0.5,
              flexShrink: 0,
            }}
            title={isConnected ? (execution?.detail || 'Connected & Active') : 'Disconnected / Standby (Not Active)'}
          />
        </div>

        {/* Node Body (พารามิเตอร์ย่อ) */}
        <div style={{ padding: '4px 12px 9px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {def.fields.slice(0, 3).map((f) => {
          const val = data[f.key] ?? f.default;
          return (
            <div
              key={f.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 11.5,
                letterSpacing: '-0.01em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <span style={{ color: isLight ? '#475569' : '#cbd5e1', fontWeight: 500, flexShrink: 0 }}>{f.label}:</span>
              <span
                style={{
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontWeight: 650,
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  fontFeatureSettings: typeof val === 'number' ? '"tnum"' : 'normal',
                  letterSpacing: '-0.01em',
                }}
              >
                {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
              </span>
            </div>
          );
        })}
        </div>
      </div>

      {/* =======================================================
          1. ขาเข้า IN (TARGET) - ครึ่งวงกลมฝั่งซ้าย ซ้อนอยู่ใต้ขอบ Node
          ======================================================= */}
      {def.hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            left: 0,
            width: 8,
            height: 18,
            borderRadius: '9px 0 0 9px',
            backgroundColor: accent,
            border: 'none',
            boxShadow: `0 0 6px ${accent}80`,
            cursor: 'crosshair',
            zIndex: -1,
            ['--handle-color' as any]: accent,
          }}
        />
      )}

      {/* =======================================================
          2. ขาออก OUT (SOURCE) - ครึ่งวงกลมฝั่งขวา ซ้อนอยู่ใต้ขอบ Node
          ======================================================= */}
      {def.hasOutput && !def.decision && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{
            right: 0,
            width: 8,
            height: 18,
            borderRadius: '0 9px 9px 0',
            backgroundColor: accent,
            border: 'none',
            boxShadow: `0 0 6px ${accent}80`,
            cursor: 'crosshair',
            zIndex: -1,
            ['--handle-color' as any]: accent,
          }}
        />
      )}

      {/* =======================================================
          3. ขาออกแยก 2 ทาง (TRUE = เขียว / FALSE = แดง) ครึ่งวงกลมฝั่งขวา
          ======================================================= */}
      {def.hasOutput && def.decision && (
        <>
          {/* 🟢 ขาออก TRUE / PASS (ด้านขวาบน 35%) */}
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{
              top: '35%',
              right: 0,
              width: 8,
              height: 18,
              borderRadius: '0 9px 9px 0',
              backgroundColor: '#10b981',
              border: 'none',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
              cursor: 'crosshair',
              zIndex: -1,
              ['--handle-color' as any]: '#10b981',
            }}
          />

          {/* 🔴 ขาออก FALSE / FAIL (ด้านขวาล่าง 65%) */}
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{
              top: '65%',
              right: 0,
              width: 8,
              height: 18,
              borderRadius: '0 9px 9px 0',
              backgroundColor: '#f43f5e',
              border: 'none',
              boxShadow: '0 0 6px rgba(244, 63, 94, 0.5)',
              cursor: 'crosshair',
              zIndex: -1,
              ['--handle-color' as any]: '#f43f5e',
            }}
          />
        </>
      )}
    </div>
  );
}
