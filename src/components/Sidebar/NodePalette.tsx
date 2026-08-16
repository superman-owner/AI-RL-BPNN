import React, { useState } from 'react';
import { GROUPS, nodesByGroup } from '../../data/nodeRegistry';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  BarChart2,
  Sliders,
  Brain,
  Shield,
  Zap,
  Cpu,
  ShieldCheck,
  Trophy,
  RefreshCw,
  Send,
  Bot,
  Layers,
  Settings,
  FolderTree,
} from 'lucide-react';

// Map Group Icons
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

function onDragStartNode(event: React.DragEvent, nodeType: string) {
  event.dataTransfer.setData('application/fxforge-node', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

interface NodePaletteProps {
  onOpenSettings?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onOpenSettings }) => {
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, true]))
  );

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const allExpanded = Object.values(expandedGroups).every(Boolean);
    setExpandedGroups(Object.fromEntries(GROUPS.map((g) => [g.id, !allExpanded])));
  };

  const q = query.toLowerCase().trim();
  const totalNodesCount = GROUPS.reduce((acc, g) => acc + nodesByGroup(g.id).length, 0);

  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      style={{
        width: 300,
        height: '100%',
        maxHeight: '100%',
        flexShrink: 0,
        background: '#0a0a0f',
        borderRight: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#d4d4d8',
        userSelect: 'none',
        zIndex: 20,
      }}
    >
      {/* 1. Header: Title, Count, Expand/Collapse & Search */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid #27272a',
          background: '#101017',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FolderTree size={16} color="#38bdf8" />
            <span>AI Node Palette</span>
            <span
              style={{
                fontSize: 11,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                padding: '2px 7px',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              {totalNodesCount}
            </span>
          </div>

          <button
            onClick={toggleAll}
            style={{
              background: '#1f1f26',
              border: '1px solid #33333d',
              borderRadius: 4,
              color: '#a1a1aa',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '3px 8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#71717a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.borderColor = '#33333d';
            }}
          >
            {Object.values(expandedGroups).every(Boolean) ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Real-time search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: 9,
              color: '#71717a',
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AI modules & nodes..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#060609',
              border: '1px solid #27272a',
              borderRadius: 6,
              color: '#fafafa',
              fontSize: 12,
              padding: '6px 10px 6px 30px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* 2. Scrollable Tree */}
      <div
        id="node-palette-scroll-container"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '10px 10px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          boxSizing: 'border-box',
        }}
        className="custom-scrollbar"
      >
        {GROUPS.map((group) => {
          const allNodes = nodesByGroup(group.id);
          const matchingNodes = allNodes.filter(
            (n) => !q || n.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)
          );

          if (q && matchingNodes.length === 0) return null;

          const isExpanded = expandedGroups[group.id] || Boolean(q);
          const GroupIcon = GROUP_ICONS[group.id] || Layers;

          return (
            <div
              key={group.id}
              style={{
                flexShrink: 0,
                borderRadius: 6,
                overflow: 'hidden',
                border: isExpanded ? '1px solid #27272a' : '1px solid #1a1a20',
                background: '#111118',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Group Accordion Header */}
              <div
                onClick={() => toggleGroup(group.id)}
                style={{
                  padding: '8px 10px',
                  background: isExpanded ? '#181822' : '#111118',
                  borderBottom: isExpanded ? '1px solid #27272a' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  {isExpanded ? (
                    <ChevronDown size={14} color="#a1a1aa" />
                  ) : (
                    <ChevronRight size={14} color="#a1a1aa" />
                  )}
                  <span
                    style={{
                      width: 4,
                      height: 14,
                      background: group.color,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                  <GroupIcon size={14} color={group.color} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fafafa',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.label}
                  </span>
                </div>
              </div>

              {/* Draggable Child Nodes */}
              {isExpanded && (
                <div
                  style={{
                    padding: '5px 5px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    background: '#0b0b10',
                  }}
                >
                  {matchingNodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStartNode(e, node.type)}
                      title="Drag onto canvas to create node"
                      style={{
                        padding: '6px 8px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'grab',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid transparent',
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1e1e28';
                        e.currentTarget.style.borderColor = '#3f3f4e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: group.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            color: '#e4e4e7',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {node.label}
                        </span>
                      </div>
                      <Plus size={12} color="#71717a" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Footer */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid #27272a',
          background: '#101017',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#a1a1aa',
          flexShrink: 0,
        }}
      >
        <div
          onClick={onOpenSettings}
          title="Open System & LLM Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            padding: '3px 6px',
            borderRadius: 4,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#27272a';
            e.currentTarget.style.color = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#a1a1aa';
          }}
        >
          <Settings size={14} />
          <span>Settings</span>
        </div>
        <span style={{ fontSize: 10.5, color: '#10b981', fontWeight: 600 }}>v2.0 Quant AI</span>
      </div>
    </aside>
  );
};

export default NodePalette;
