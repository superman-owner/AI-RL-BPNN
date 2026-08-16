import React, { useState } from 'react';
import { GROUPS, nodesByGroup } from '../../data/nodeRegistry';
import {
  Search,
  Plus,
  Sliders,
  Brain,
  Zap,
  Layers,
  Settings,
  Database,
  SlidersHorizontal,
  ShieldAlert,
  FileCode,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const GROUP_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>
> = {
  input: Database,
  fc1: SlidersHorizontal,
  regularization: ShieldAlert,
  fc2: Brain,
  reward: Zap,
  output: FileCode,
};

function onDragStartNode(event: React.DragEvent, nodeType: string) {
  event.dataTransfer.setData('application/fxforge-node', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

interface NodePaletteProps {
  onOpenSettings?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [query, setQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
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

  //  1. Slim Icon Rail Mode (Collapsed Sidebar like Reference Image)
  if (isCollapsed) {
    return (
      <aside
        onWheel={(e) => e.stopPropagation()}
        style={{
          width: '56px',
          minWidth: '56px',
          transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="h-full flex flex-col items-center justify-between bg-[#08080c] border-r border-white/[0.08] text-[#c7c7cc] select-none z-20 py-3 flex-shrink-0"
      >
        {/* Top: Expand Toggle Button & Search Quick-Action */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar (ขยายแถบข้าง)"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          {/* Quick Search Action */}
          <button
            onClick={onToggleCollapse}
            title="Search parameters & modules"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#86868b] hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-all cursor-pointer"
          >
            <Search size={13} />
          </button>
        </div>

        {/* Middle: Vertical Group Icons Rail */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center gap-1.5 py-4 my-1">
          {GROUPS.map((group) => {
            const GroupIcon = GROUP_ICONS[group.id] || Layers;

            return (
              <div key={group.id} className="relative group w-full flex items-center justify-center">
                <button
                  onClick={() => {
                    setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
                    if (onToggleCollapse) onToggleCollapse();
                  }}
                  title={group.label}
                  className="w-9 h-8 rounded-md flex items-center justify-center hover:bg-white/[0.08] transition-all cursor-pointer relative"
                >
                  <GroupIcon
                    size={15}
                    style={{ color: group.color }}
                    className="transition-transform duration-150 group-hover:scale-115"
                  />
                </button>

                {/* Apple macOS Floating Tooltip */}
                <div className="absolute left-[54px] px-2.5 py-1 bg-[#161622] border border-white/[0.12] rounded-md shadow-2xl text-[11px] font-medium text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {group.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: Settings Button */}
        <div className="w-full flex justify-center pt-2">
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>
      </aside>
    );
  }

  //  2. Full Expanded Sidebar Mode
  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      style={{
        width: '295px',
        minWidth: '295px',
        transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="h-full flex flex-col flex-shrink-0 bg-[#08080c] border-r border-white/[0.08] text-[#c7c7cc] select-none z-20 font-sans"
    >
      {/* 1.  Apple macOS Header & Spotlight Search (Exact 10px Spacing, Seamless Background) */}
      <div
        style={{
          paddingTop: '10px',
          paddingBottom: '10px',
          paddingLeft: '14px',
          paddingRight: '14px',
          borderBottom: 'none',
          backgroundColor: 'transparent',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <Sliders size={16} className="text-[#86868b] hover:text-white transition-colors flex-shrink-0" />
            <span
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              RL Hyperparameters
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={toggleAll}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#86868b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                transition: 'color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#86868b')}
            >
              {Object.values(expandedGroups).every(Boolean) ? 'Collapse' : 'Expand'}
            </button>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse to Slim Rail (พับแถบข้าง)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#86868b',
                  cursor: 'pointer',
                  padding: '2px 3px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#86868b')}
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </div>
        </div>

        {/*  macOS Spotlight-style Search Field (h-34px) */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '12px',
              color: '#86868b',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parameters & modules..."
            style={{
              width: '100%',
              height: '34px',
              paddingLeft: '34px',
              paddingRight: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 2.  Apple Mac Mail / Finder Sidebar List (space-y-[36px]: +50% Section Gap = 36px) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3.5 py-4 space-y-[36px]">
        {GROUPS.map((group) => {
          const allNodes = nodesByGroup(group.id);
          const matchingNodes = allNodes.filter(
            (n) => !q || n.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)
          );

          if (q && matchingNodes.length === 0) return null;

          const isExpanded = expandedGroups[group.id] || Boolean(q);
          const GroupIcon = GROUP_ICONS[group.id] || Layers;

          return (
            <div key={group.id}>
              {/*  Section Header (Clean Icon & Label, No Down Arrow) */}
              <div
                onClick={() => toggleGroup(group.id)}
                className="group px-1 py-1 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* SF Symbol on Main Header (Distinct Group Color) */}
                  <GroupIcon
                    size={14}
                    style={{ color: group.color }}
                    className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                  />

                  {/* Section Label (Gray -> White) */}
                  <span className="text-[11.5px] font-bold text-[#86868b] group-hover:text-white uppercase tracking-wider truncate transition-colors">
                    {group.label}
                  </span>
                </div>
              </div>

              {/*  Child Items */}
              {isExpanded && (
                <div
                  className="mt-1.5 space-y-1.5"
                  style={{ paddingLeft: '22px' }}
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
                        title="Drag onto canvas to add module"
                        className="h-[18px] flex items-center justify-between cursor-grab transition-colors pr-2"
                      >
                        {/* Left: Mid Dot (·) directly aligned at 45px mark under Header text */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            style={{ color: isNodeHovered ? '#ffffff' : group.color }}
                            className="text-[15px] font-bold leading-none select-none transition-colors flex-shrink-0"
                          >
                            ·
                          </span>
                          <span
                            className={`text-[12.5px] tracking-tight truncate leading-none transition-colors ${
                              isNodeHovered ? 'font-medium text-white' : 'font-normal text-[#8e8e93]'
                            }`}
                          >
                            {node.label}
                          </span>
                        </div>

                        {/* Right: Subtle Add Indicator */}
                        <Plus
                          size={11}
                          className={`flex-shrink-0 transition-colors ${
                            isNodeHovered ? 'text-white' : 'text-transparent'
                          }`}
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

      {/* 3.  macOS Footer (Seamless, No Border, Settings 10px Left Offset) */}
      <div
        style={{
          paddingTop: '10px',
          paddingBottom: '12px',
          paddingLeft: '10px',
          paddingRight: '14px',
          borderTop: 'none',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
        className="text-xs text-[#86868b]"
      >
        <button
          onClick={onOpenSettings}
          title="Open System & Quant Settings"
          className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer text-[12px] font-medium"
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
        <span className="text-[11px] text-[#30d158] font-mono font-medium">
          v2.0 Quant AI
        </span>
      </div>
    </aside>
  );
};

export default NodePalette;
