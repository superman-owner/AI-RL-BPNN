import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GROUPS, NODE_DEFS } from '../../data/nodeRegistry';
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
        minWidth: 240,
        maxWidth: 270,
        position: 'relative',
        background: '#14141a',
        opacity: executionMode === 'off' ? 0.55 : (isConnected ? 1 : 0.8),
        border: selected
          ? `1.5px solid ${accent}`
          : (isConnected ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)'),
        borderRadius: '10px',
        boxShadow: selected
          ? `0 0 0 1px ${accent}, 0 8px 24px rgba(0,0,0,0.6)`
          : '0 4px 16px rgba(0,0,0,0.45)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, -apple-system, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        transition: 'border 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
      }}
    >
      {/* Node Header (Reduced height, perfectly fitted single line) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 10px',
          background: 'rgba(255,255,255,0.025)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          borderTopLeftRadius: '9px',
          borderTopRightRadius: '9px',
        }}
      >
        <GroupIcon size={14} color={isConnected ? accent : '#86868b'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: isConnected ? accent : '#86868b',
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
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: isConnected ? '#ffffff' : '#a1a1aa',
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
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isConnected && statusColor ? statusColor : '#3f3f46',
            boxShadow: isConnected && statusColor ? `0 0 6px ${statusColor}` : 'none',
            opacity: isConnected ? 1 : 0.4,
          }}
          title={isConnected ? (execution?.detail || 'Connected & Active') : 'Disconnected / Standby (Not Active)'}
        />
      </div>

      {/* Node Body (พารามิเตอร์ย่อ - ลดความสูงลง 5px) */}
      <div style={{ padding: '5px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                fontSize: 11,
                letterSpacing: '-0.01em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <span style={{ color: '#86868b', fontWeight: 400, flexShrink: 0 }}>{f.label}:</span>
              <span
                style={{
                  color: '#f5f5f7',
                  fontWeight: 500,
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

      {/* =======================================================
          1. ขาเข้า IN (TARGET) - อยู่ฝั่งซ้ายกึ่งกลาง (Left 50%)
          ======================================================= */}
      {def.hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            left: -6,                           // ยื่นออกไปนอกขอบกล่อง 6px
            width: 9,                           // ขนาดกว้าง 9px
            height: 9,                          // ขนาดสูง 9px
            borderRadius: '50%',                // วงกลมมน
            background: accent,                 // 🟢 สีเต็มจุดเชื่อม ชัดเจน สว่างสดใส
            border: '2px solid #ffffff',        // 🟢 ขอบขาวสว่าง คมชัด
            cursor: 'crosshair',
          }}
        />
      )}

      {/* =======================================================
          2. ขาออก OUT (SOURCE) - แบบทางออกเดียว อยู่ฝั่งขวากึ่งกลาง
          ======================================================= */}
      {def.hasOutput && !def.decision && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{
            right: -6,                          // ยื่นออกไปนอกขอบขวา 6px
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: accent,                 // 🟢 สีเต็มจุดเชื่อม
            border: '2px solid #ffffff',        // 🟢 ขอบขาวสว่างเรืองแสง
            cursor: 'crosshair',
          }}
        />
      )}

      {/* =======================================================
          3. หรือ ขาออกแยก 2 ทาง (TRUE = เขียว / FALSE = แดง)
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
              right: -6,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#10b981',              // 🟢 สีเขียวมรกต (Emerald Green)
              border: '2px solid #ffffff',
              cursor: 'crosshair',
            }}
          />

          {/* 🔴 ขาออก FALSE / FAIL (ด้านขวาล่าง 65%) */}
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{
              top: '65%',
              right: -6,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#f43f5e',              // 🔴 สีแดงกุหลาบ (Rose Red)
              border: '2px solid #ffffff',
              cursor: 'crosshair',
            }}
          />
        </>
      )}
    </div>
  );
}
