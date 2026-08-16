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
        minWidth: 215,
        position: 'relative',
        background: '#121218',
        opacity: executionMode === 'off' ? 0.55 : 1,
        border: `1.5px solid ${accent}`,
        borderRadius: '10px',
        boxShadow: selected
          ? `0 0 0 1px ${accent}, 0 0 22px 2px ${accent}66, 0 8px 24px rgba(0,0,0,0.6)`
          : '0 4px 16px rgba(0,0,0,0.45)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
        transition: 'border 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 11px',
          background: 'rgba(255,255,255,0.025)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          borderTopLeftRadius: '9px',
          borderTopRightRadius: '9px',
        }}
      >
        <GroupIcon size={14} color={accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: accent,
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            {group.label}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.35,
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
      <div style={{ padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {def.fields.slice(0, 3).map((f) => {
          const val = data[f.key] ?? f.default;
          return (
            <div
              key={f.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                letterSpacing: '-0.01em',
              }}
            >
              <span style={{ color: '#86868b', fontWeight: 400 }}>{f.label}:</span>
              <span
                style={{
                  color: '#f5f5f7',
                  fontWeight: 500,
                  fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
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
            background: '#08080c',
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
            border: '1.5px solid #08080c',
          }}
        />
      )}
    </div>
  );
}
