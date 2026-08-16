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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
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
        background: '#07070b',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
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
      {/* 1. Header: Title, Count, Expand/Collapse & Search (Pure Flat Frameless) */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0a0a10',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
            }}
          >
            <FolderTree size={15} color="#38bdf8" />
            <span>AI Node Palette</span>
            <span
              style={{
                fontSize: 11,
                color: '#38bdf8',
                fontWeight: 700,
              }}
            >
              ({totalNodesCount})
            </span>
          </div>

          <button
            onClick={toggleAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#86868b',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.textShadow = '0 0 8px rgba(255,255,255,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#86868b';
              e.currentTarget.style.textShadow = 'none';
            }}
          >
            {Object.values(expandedGroups).every(Boolean) ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Flat Underline Search Bar (No Box Enclosure) */}
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 2,
              top: 8,
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
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 0,
              color: '#ffffff',
              fontSize: 12,
              padding: '6px 8px 6px 24px',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderBottomColor = '#38bdf8';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottomColor = 'rgba(255, 255, 255, 0.15)';
            }}
          />
        </div>
      </div>

      {/* 2. Pure Frameless Flat Scrollable Tree with Glowing Hover (Zero Box) */}
      <div
        id="node-palette-scroll-container"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '8px 14px 40px',
          display: 'flex',
          flexDirection: 'column',
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
          const isGroupHovered = hoveredGroup === group.id;
          const GroupIcon = GROUP_ICONS[group.id] || Layers;

          return (
            <div
              key={group.id}
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '6px 0',
              }}
            >
              {/* Flat Group Header (No Box Background, Pure Glow) */}
              <div
                onClick={() => toggleGroup(group.id)}
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup(null)}
                style={{
                  padding: '6px 2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                  {isExpanded ? (
                    <ChevronDown size={13} color={isGroupHovered ? '#ffffff' : '#86868b'} />
                  ) : (
                    <ChevronRight size={13} color={isGroupHovered ? '#ffffff' : '#86868b'} />
                  )}
                  <span
                    style={{
                      width: 3,
                      height: 12,
                      background: group.color,
                      borderRadius: 1,
                      flexShrink: 0,
                      boxShadow: isGroupHovered ? `0 0 8px ${group.color}` : 'none',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  />
                  <GroupIcon
                    size={13}
                    color={group.color}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isGroupHovered ? '#ffffff' : '#ededed',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textShadow: isGroupHovered
                        ? `0 0 10px ${group.color}, 0 0 20px ${group.color}88`
                        : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {group.label}
                  </span>
                </div>
              </div>

              {/* Child Nodes: Pure Text Glow, No Enclosing Boxes */}
              {isExpanded && (
                <div
                  style={{
                    padding: '3px 0 6px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {matchingNodes.map((node) => {
                    const isNodeHovered = hoveredNode === node.type;

                    return (
                      <div
                        key={node.type}
                        draggable
                        onDragStart={(e) => onDragStartNode(e, node.type)}
                        onMouseEnter={() => setHoveredNode(node.type)}
                        onMouseLeave={() => setHoveredNode(null)}
                        title="Drag onto canvas to create node"
                        style={{
                          padding: '6px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'grab',
                          background: 'transparent',
                          border: 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: group.color,
                              flexShrink: 0,
                              boxShadow: isNodeHovered ? `0 0 10px ${group.color}, 0 0 15px ${group.color}` : 'none',
                              transform: isNodeHovered ? 'scale(1.3)' : 'scale(1)',
                              transition: 'all 0.15s ease',
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: isNodeHovered ? 600 : 500,
                              color: isNodeHovered ? '#ffffff' : '#a1a1aa',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textShadow: isNodeHovered
                                ? `0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px ${group.color}`
                                : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {node.label}
                          </span>
                        </div>
                        <Plus
                          size={12}
                          color={isNodeHovered ? group.color : '#52525b'}
                          style={{
                            filter: isNodeHovered ? `drop-shadow(0 0 6px ${group.color})` : 'none',
                            transform: isNodeHovered ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.15s ease',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Flat Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0a0a10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#86868b',
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
            padding: '2px 0',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#38bdf8';
            e.currentTarget.style.textShadow = '0 0 8px rgba(56, 189, 248, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#86868b';
            e.currentTarget.style.textShadow = 'none';
          }}
        >
          <Settings size={13} />
          <span>Settings</span>
        </div>
        <span style={{ fontSize: 10.5, color: '#30d158', fontWeight: 600, textShadow: '0 0 6px rgba(48, 209, 88, 0.6)' }}>
          v2.0 Quant AI
        </span>
      </div>
    </aside>
  );
};

export default NodePalette;
