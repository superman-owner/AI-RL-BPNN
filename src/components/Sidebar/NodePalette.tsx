import React, { useState } from 'react';
import { GROUPS, nodesByGroup } from '../../data/nodeRegistry';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
        className={`h-full flex flex-col items-center justify-between border-r select-none z-20 py-3 flex-shrink-0 transition-colors duration-200 ${
          isLight ? 'bg-[#f5f5f7] border-black/[0.08] text-[#1d1d1f]' : 'bg-[#08080c] border-white/[0.08] text-[#c7c7cc]'
        }`}
      >
        {/* Top: Expand Toggle Button & Search Quick-Action */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar (ขยายแถบข้าง)"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isLight ? 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.05]' : 'text-[#86868b] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          {/* Quick Search Action */}
          <button
            onClick={onToggleCollapse}
            title="Search parameters & modules"
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
              isLight
                ? 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.05] border-black/[0.08]'
                : 'text-[#86868b] hover:text-white hover:bg-white/[0.06] border-white/[0.06]'
            }`}
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
                  className={`w-9 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer relative ${
                    isLight ? 'hover:bg-black/[0.06]' : 'hover:bg-white/[0.08]'
                  }`}
                >
                  <GroupIcon
                    size={15}
                    style={{ color: group.color }}
                    className="transition-transform duration-150 group-hover:scale-115"
                  />
                </button>

                {/* Apple macOS Floating Tooltip */}
                <div
                  className={`absolute left-[54px] px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl border ${
                    isLight ? 'bg-white border-black/[0.12] text-[#1d1d1f]' : 'bg-[#161622] border-white/[0.12] text-white'
                  }`}
                >
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
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.05]' : 'text-[#86868b] hover:text-white hover:bg-white/[0.06]'
            }`}
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
        width: '335px',
        minWidth: '335px',
        transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`h-full flex flex-col flex-shrink-0 border-r select-none z-20 font-sans transition-colors duration-200 ${
        isLight ? 'bg-[#f5f5f7] border-black/[0.08] text-[#1d1d1f]' : 'bg-[#08080c] border-white/[0.08] text-[#c7c7cc]'
      }`}
    >
      {/* 1.  Apple macOS Header & Spotlight Search */}
      <div
        style={{
          paddingTop: '10px',
          paddingBottom: '10px',
          paddingLeft: '10px',
          paddingRight: '10px',
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
            <Sliders size={16} className={`transition-colors flex-shrink-0 ${isLight ? 'text-[#6e6e73] hover:text-[#1d1d1f]' : 'text-[#86868b] hover:text-white'}`} />
            <span
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: isLight ? '#1d1d1f' : '#ffffff',
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
                color: isLight ? '#6e6e73' : '#86868b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                transition: 'color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#1d1d1f' : '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? '#6e6e73' : '#86868b')}
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
                  color: isLight ? '#6e6e73' : '#86868b',
                  cursor: 'pointer',
                  padding: '2px 3px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#1d1d1f' : '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isLight ? '#6e6e73' : '#86868b')}
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
              left: '10px',
              color: isLight ? '#6e6e73' : '#86868b',
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
              paddingLeft: '32px',
              paddingRight: '10px',
              backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              color: isLight ? '#1d1d1f' : '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 2.  Apple Mac Mail / Finder Sidebar List (Left offset 10px) */}
      <div
        style={{
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingTop: '12px',
          paddingBottom: '16px',
        }}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-[36px]"
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
            <div key={group.id}>
              {/*  Section Header (Clean Icon & Label, No Down Arrow) */}
              <div
                onClick={() => toggleGroup(group.id)}
                className="group py-1.5 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* SF Symbol on Main Header (Distinct Group Color) */}
                  <GroupIcon
                    size={14}
                    style={{ color: group.color }}
                    className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                  />

                  {/* Section Label */}
                  <span
                    className={`text-[11.5px] font-bold uppercase tracking-wider truncate transition-colors ${
                      isLight ? 'text-[#6e6e73] group-hover:text-[#1d1d1f]' : 'text-[#86868b] group-hover:text-white'
                    }`}
                  >
                    {group.label}
                  </span>
                </div>
              </div>

              {/*  Child Items */}
              {isExpanded && (
                <div
                  className="mt-2 space-y-2.5"
                  style={{ paddingLeft: '18px' }}
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
                        className="py-[3px] min-h-[24px] flex items-center justify-between cursor-grab transition-colors pr-1"
                      >
                        {/* Left: Mid Dot (·) */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            style={{ color: isNodeHovered ? (isLight ? '#0071e3' : '#ffffff') : group.color }}
                            className="text-[14px] font-bold leading-none select-none transition-colors flex-shrink-0"
                          >
                            ·
                          </span>
                          <span
                            className={`text-[12.5px] tracking-tight truncate leading-normal transition-colors ${
                              isLight
                                ? isNodeHovered
                                  ? 'font-medium text-[#0071e3]'
                                  : 'font-normal text-[#1d1d1f]'
                                : isNodeHovered
                                ? 'font-medium text-white'
                                : 'font-normal text-[#8e8e93]'
                            }`}
                          >
                            {node.label}
                          </span>
                        </div>

                        {/* Right: Subtle Add Indicator */}
                        <Plus
                          size={11}
                          className={`flex-shrink-0 transition-colors ${
                            isNodeHovered ? (isLight ? 'text-[#0071e3]' : 'text-white') : 'text-transparent'
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
        className={`text-xs ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}
      >
        <button
          onClick={onOpenSettings}
          title="Open System & Quant Settings"
          className={`flex items-center gap-2 transition-colors cursor-pointer text-[12px] font-medium ${
            isLight ? 'hover:text-[#1d1d1f]' : 'hover:text-white'
          }`}
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
        <span className={`text-[11px] font-mono font-medium ${isLight ? 'text-[#28cd41]' : 'text-[#30d158]'}`}>
          v2.0 Quant AI
        </span>
      </div>
    </aside>
  );
};

export default NodePalette;
