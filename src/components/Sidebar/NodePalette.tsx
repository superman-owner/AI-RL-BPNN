import React, { useState } from 'react';
import { GROUPS, nodesByGroup } from '../../data/nodeRegistry';
import { useTheme } from '../../context/ThemeContext';
import {
  SFSymbolChartBar,
  SFSymbolSliders,
  SFSymbolShield,
  SFSymbolBrain,
  SFSymbolBolt,
  SFSymbolPaperplane,
  SFSymbolChevronDown,
  SFSymbolChevronRight,
  SFSymbolPlus,
  SFSymbolSearch,
} from '../Common/AppleSFSymbols';
import {
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties; className?: string }>> = {
  input: SFSymbolChartBar,
  fc1: SFSymbolSliders,
  regularization: SFSymbolShield,
  fc2: SFSymbolBrain,
  reward: SFSymbolBolt,
  output: SFSymbolPaperplane,
};

interface NodePaletteProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSettings?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [search, setSearch] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    input: true,
    fc1: true,
    regularization: true,
    fc2: true,
    reward: true,
    output: true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  //  Pointer-Down Handlers for Drag-and-Drop Node onto Canvas
  const handleItemPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    nodeType: string,
    label: string,
    color?: string
  ) => {
    if (e.button !== 0) return; // Primary mouse button only

    const startX = e.clientX;
    const startY = e.clientY;
    let ghost: HTMLElement | null = null;
    let isDragging = false;

    const createGhost = (x: number, y: number) => {
      if (ghost) return;
      const ghostEl = document.createElement('div');
      ghost = ghostEl;
      ghostEl.className = 'drag-ghost-apple';
      ghostEl.style.position = 'fixed';
      ghostEl.style.pointerEvents = 'none';
      ghostEl.style.zIndex = '9999999';
      ghostEl.style.left = `${x}px`;
      ghostEl.style.top = `${y}px`;
      ghostEl.style.transform = 'translate(-50%, -50%)';
      ghostEl.style.display = 'flex';
      ghostEl.style.alignItems = 'center';
      ghostEl.style.gap = '8px';
      ghostEl.style.padding = '6px 14px';
      ghostEl.style.borderRadius = '9999px';
      ghostEl.style.fontFamily = 'var(--font-apple-text)';
      ghostEl.style.fontSize = '12px';
      ghostEl.style.fontWeight = '600';
      ghostEl.style.letterSpacing = '-0.01em';
      ghostEl.style.backdropFilter = 'blur(20px)';
      (ghostEl.style as any).WebkitBackdropFilter = 'blur(20px)';
      ghostEl.style.cursor = 'var(--mac-cursor-grabbing)';

      if (isLight) {
        ghostEl.style.background = 'rgba(255, 255, 255, 0.95)';
        ghostEl.style.color = '#1d1d1f';
        ghostEl.style.border = '1px solid rgba(0, 0, 0, 0.12)';
        ghostEl.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.1)';
      } else {
        ghostEl.style.background = 'rgba(20, 20, 28, 0.95)';
        ghostEl.style.color = '#ffffff';
        ghostEl.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        ghostEl.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.8), 0 0 12px rgba(10, 132, 255, 0.3)';
      }

      // Color orb
      const dot = document.createElement('span');
      dot.style.width = '7px';
      dot.style.height = '7px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = color || '#0071e3';
      dot.style.boxShadow = `0 0 6px ${color || '#0071e3'}`;
      dot.style.flexShrink = '0';
      ghostEl.appendChild(dot);

      // Node label
      const text = document.createElement('span');
      text.textContent = label;
      text.style.whiteSpace = 'nowrap';
      ghostEl.appendChild(text);

      document.body.appendChild(ghostEl);
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true;
        document.documentElement.classList.add('is-dragging-node');
        document.body.classList.add('is-dragging-node');
        document.body.style.cursor = 'var(--mac-cursor-grabbing)';
        createGhost(moveEvent.clientX, moveEvent.clientY);
      }

      if (isDragging && ghost) {
        ghost.style.left = `${moveEvent.clientX}px`;
        ghost.style.top = `${moveEvent.clientY}px`;
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.documentElement.classList.remove('is-dragging-node');
      document.body.classList.remove('is-dragging-node');
      document.body.style.cursor = '';

      if (ghost && ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
        ghost = null;
      }

      if (isDragging) {
        // Dispatch custom event to let FlowCanvasView place the new node at drop point!
        window.dispatchEvent(
          new CustomEvent('fxforge-drag-drop-node', {
            detail: {
              nodeType,
              label,
              clientX: upEvent.clientX,
              clientY: upEvent.clientY,
            },
          })
        );
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const q = search.trim().toLowerCase();

  // =========================================================================
  //  SLIM COLLAPSED RAIL VIEW
  // =========================================================================
  if (isCollapsed) {
    return (
      <aside
        style={{ width: '48px' }}
        className={`h-full border-r flex flex-col items-center py-3.5 z-20 select-none flex-shrink-0 transition-all duration-200 ${
          isLight
            ? 'bg-white/80 border-black/[0.08] backdrop-blur-xl'
            : 'vision-glass apple-specular border-white/[0.08]'
        }`}
      >
        {/* Toggle Expand Button */}
        <button
          onClick={onToggleCollapse}
          title="Expand Node Palette"
          className={`p-2 rounded-lg transition-colors cursor-pointer mb-4 ${
            isLight
              ? 'text-black/60 hover:text-black hover:bg-black/5'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <PanelLeftOpen size={16} />
        </button>

        {/* Quick Group Icons */}
        <div className="flex flex-col items-center gap-3.5 flex-1">
          {GROUPS.map((group) => {
            const GroupIcon = GROUP_ICONS[group.id] || SFSymbolSliders;
            return (
              <button
                key={group.id}
                onClick={() => {
                  if (onToggleCollapse) onToggleCollapse();
                }}
                title={`Group: ${group.label}`}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isLight
                    ? 'text-black/60 hover:text-black hover:bg-black/5'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <GroupIcon size={15} style={{ color: group.color }} />
              </button>
            );
          })}
        </div>

        {/* Bottom Version Indicator */}
        <div className="text-[10px] font-bold text-white/30 tracking-wider rotate-90 my-2 select-none">
          NODES
        </div>
      </aside>
    );
  }

  // =========================================================================
  //  EXPANDED NODE PALETTE SIDEBAR
  // =========================================================================
  return (
    <aside
      style={{ width: '256px' }}
      className={`h-full border-r flex flex-col z-20 select-none flex-shrink-0 transition-all duration-200 relative ${
        isLight
          ? 'bg-[#fcfcfd]/90 border-black/[0.08] backdrop-blur-2xl text-[#1d1d1f]'
          : 'vision-glass apple-specular border-white/[0.08] text-slate-200'
      }`}
    >
      {/* 🟢 1. HEADER: Title & Search */}
      <div
        style={{
          paddingLeft: '14px',
          paddingRight: '12px',
          paddingTop: '12px',
          paddingBottom: '10px',
        }}
        className={`border-b flex items-center justify-between flex-shrink-0 ${
          isLight ? 'border-black/[0.06]' : 'border-white/[0.06]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#0a84ff]/20 text-[#0a84ff]'
            }`}
          >
            <SFSymbolSliders size={13} />
          </div>
          <div>
            <span
              className={`text-[12.5px] font-bold tracking-tight block leading-tight ${
                isLight ? 'text-[#1d1d1f]' : 'text-white'
              }`}
            >
              Node Palette
            </span>
            <span
              className={`text-[10px] font-medium block leading-none ${
                isLight ? 'text-[#6e6e73]' : 'text-white/45'
              }`}
            >
              14 Registered Modules
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          title="Collapse Sidebar"
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            isLight
              ? 'text-black/60 hover:text-black hover:bg-black/5'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* 🟢 2. SEARCH BAR */}
      <div
        style={{
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: '10px',
          paddingBottom: '8px',
        }}
        className="flex-shrink-0"
      >
        <div className="relative w-full">
          <SFSymbolSearch
            size={12}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isLight ? 'text-black/40' : 'text-white/40'
            }`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            style={{
              fontFamily: 'var(--font-apple-text)',
              paddingLeft: '28px',
              paddingRight: '10px',
            }}
            className={`h-7 w-full text-[11.5px] rounded-lg focus:outline-none transition-all duration-150 ${
              isLight
                ? 'bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20 border border-black/[0.08] text-[#1d1d1f] placeholder:text-black/40'
                : 'bg-white/[0.06] focus:bg-white/[0.10] focus:ring-2 focus:ring-[#0a84ff]/25 border border-white/[0.08] text-white placeholder:text-white/40'
            }`}
          />
        </div>
      </div>

      {/* 🟢 3. NODE GROUPS LIST */}
      <div
        style={{
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: '6px',
          paddingBottom: '20px',
        }}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4"
      >
        {GROUPS.map((group) => {
          const allNodes = nodesByGroup(group.id);
          const matchingNodes = allNodes.filter(
            (n) => !q || n.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)
          );

          if (q && matchingNodes.length === 0) return null;

          const isExpanded = expandedGroups[group.id] || Boolean(q);
          const GroupIcon = GROUP_ICONS[group.id] || SFSymbolSliders;

          return (
            <div key={group.id}>
              {/* Section Header */}
              <div
                onClick={() => toggleGroup(group.id)}
                style={{
                  cursor: 'var(--mac-cursor-default)',
                  paddingLeft: '4px',
                  paddingRight: '6px',
                  paddingTop: '5px',
                  paddingBottom: '5px',
                }}
                className={`group rounded-md flex items-center justify-between select-none transition-colors duration-150 ${
                  isLight
                    ? 'hover:text-[#0071e3] text-[#111827]'
                    : 'hover:text-white text-[#9ca3af]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <GroupIcon
                    size={14}
                    style={{ color: group.color }}
                    className="flex-shrink-0"
                  />
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider truncate"
                    style={{ letterSpacing: '0.04em' }}
                  >
                    {group.label}
                  </span>
                </div>

                <div className="flex items-center justify-center flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  {isExpanded ? (
                    <SFSymbolChevronDown size={9} />
                  ) : (
                    <SFSymbolChevronRight size={9} />
                  )}
                </div>
              </div>

              {/* Child Nodes (Draggable onto canvas) */}
              {isExpanded && (
                <div className="flex flex-col gap-1 mt-1 pl-1">
                  {matchingNodes.map((node) => {
                    const isNodeHovered = hoveredNode === node.type;

                    return (
                      <div
                        key={node.type}
                        onPointerDown={(e) => handleItemPointerDown(e, node.type, node.label, group.color)}
                        onMouseEnter={() => setHoveredNode(node.type)}
                        onMouseLeave={() => setHoveredNode(null)}
                        title="Drag onto canvas to add module"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '28px',
                          paddingLeft: '10px',
                          paddingRight: '8px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          borderRadius: '6px',
                          cursor: 'var(--mac-cursor-grab)',
                          userSelect: 'none',
                          transition: 'all 0.15s ease',
                          color: isNodeHovered
                            ? (isLight ? '#0071e3' : '#ffffff')
                            : (isLight ? '#1d1d1f' : '#cbd5e1'),
                        }}
                        className={`${
                          isNodeHovered
                            ? isLight
                              ? 'bg-black/[0.04]'
                              : 'bg-white/[0.08]'
                            : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              flexShrink: 0,
                              backgroundColor: group.color,
                              boxShadow: isNodeHovered ? `0 0 6px ${group.color}` : 'none',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: isNodeHovered ? 600 : 500,
                              letterSpacing: '-0.01em',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {node.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-center flex-shrink-0">
                          <SFSymbolPlus
                            size={10}
                            style={{
                              opacity: isNodeHovered ? 1 : 0,
                              color: isLight ? '#0071e3' : '#ffffff',
                              transition: 'opacity 0.15s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🟢 4. FOOTER */}
      <div
        style={{
          paddingTop: '10px',
          paddingBottom: '12px',
          paddingLeft: '14px',
          paddingRight: '14px',
          borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
        className={`text-xs ${isLight ? 'text-[#4b5563]' : 'text-[#9ca3af]'}`}
      >
        <button
          onClick={onOpenSettings}
          title="Open Quant Settings"
          className={`flex items-center gap-2 transition-colors cursor-pointer text-[12px] font-semibold ${
            isLight ? 'hover:text-[#111827]' : 'hover:text-white'
          }`}
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
        <span className={`text-[11px] font-mono font-semibold ${isLight ? 'text-[#16a34a]' : 'text-[#30d158]'}`}>
          v2.0 Quant
        </span>
      </div>
    </aside>
  );
};

export default NodePalette;
