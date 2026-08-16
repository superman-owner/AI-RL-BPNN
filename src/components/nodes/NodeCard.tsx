import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GROUPS, NODE_DEFS } from '../../data/nodeRegistry';
import {
  Cpu,
  ShieldCheck,
  Trophy,
  Zap,
  RefreshCw,
  Send,
  Bot,
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
  stage1: BarChart2,
  stage2: Sliders,
  stage3: Brain,
  stage4: Shield,
  stage5: Zap,
  trainer: Cpu,
  qc: ShieldCheck,
  tournament: Trophy,
  live: Zap,
  remediation: RefreshCw,
  output: Send,
  llm: Bot,
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
  const statusColor = STATUS_COLOR[execution?.status];
  const executionMode = data.executionMode || 'on';
  const GroupIcon = GROUP_ICONS[def.group] || Layers;

  return (
    <div
      style={{
        minWidth: 210,
        position: 'relative',
        background: 'var(--bg-node, #141416)',
        opacity: executionMode === 'off' ? 0.55 : 1,
        border: `1.5px solid ${selected ? '#ffffff' : accent}`,
        borderRadius: '8px',
        boxShadow: selected
          ? `0 0 0 1.5px ${accent}, 0 0 20px 3px ${accent}88`
          : '0 4px 14px rgba(0,0,0,0.45)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 10px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          borderTopLeftRadius: '7px',
          borderTopRightRadius: '7px',
        }}
      >
        <GroupIcon size={14} color={accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', color: accent }}>
            {group.label.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {def.label}
          </div>
        </div>

        {/* Execution Status Badge */}
        {statusColor && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }}
            title={execution?.detail}
          />
        )}
      </div>

      {/* Node Body (พารามิเตอร์ย่อ) */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {def.fields.slice(0, 3).map((f) => {
          const val = data[f.key] ?? f.default;
          return (
            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
              <span style={{ color: '#71717a' }}>{f.label}:</span>
              <span style={{ color: '#e4e4e7', fontWeight: 500, fontFamily: 'monospace' }}>
                {String(val)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input Handle (ซ้าย) */}
      {def.hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            left: -5,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#141416',
            border: `1.5px solid ${accent}`,
          }}
        />
      )}

      {/* Output Handle (ขวา) */}
      {def.hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          style={{
            right: -5,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            border: '1.5px solid #ffffff',
          }}
        />
      )}
    </div>
  );
}
