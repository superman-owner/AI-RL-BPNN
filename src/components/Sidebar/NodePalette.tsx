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
  ChevronDown,
  ChevronRight,
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

  //  Pointer-based Drag Handler (100% Guaranteed Mac Closed Fist Cursor during entire drag)
  const handleItemPointerDown = (e: React.PointerEvent, nodeType: string, label: string, color: string) => {
    // Only handle primary left click (No right-click or middle-click)
    if (e.button !== 0) return;

    // Remove any orphaned drag ghosts from DOM
    document.querySelectorAll('.fxforge-drag-ghost').forEach((el) => el.remove());

    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;
    let ghostEl: HTMLDivElement | null = null;

    //  Create High-Contrast Apple macOS Drag Preview Capsule Centered on Cursor
    const createGhost = (clientX: number, clientY: number) => {
      if (ghostEl) return;
      ghostEl = document.createElement('div');
      ghostEl.className = 'fxforge-drag-ghost';
      ghostEl.style.position = 'fixed';
      ghostEl.style.top = '0px';
      ghostEl.style.left = '0px';
      ghostEl.style.pointerEvents = 'none';
      ghostEl.style.zIndex = '9999999';
      ghostEl.style.padding = '6px 12px 6px 10px';
      ghostEl.style.borderRadius = '18px';
      ghostEl.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(26, 26, 34, 0.94)';
      ghostEl.style.backdropFilter = 'blur(24px)';
      (ghostEl.style as any).webkitBackdropFilter = 'blur(24px)';
      ghostEl.style.color = isLight ? '#1d1d1f' : '#f5f5f7';
      ghostEl.style.border = isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.18)';
      ghostEl.style.boxShadow = isLight
        ? '0 14px 34px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.05)'
        : '0 18px 44px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.2)';
      ghostEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
      ghostEl.style.fontSize = '12px';
      ghostEl.style.fontWeight = '600';
      ghostEl.style.letterSpacing = '-0.01em';
      ghostEl.style.display = 'flex';
      ghostEl.style.alignItems = 'center';
      ghostEl.style.gap = '7px';
      // 🎯 Exact Center Alignment: The grabbing hand sits precisely in the center of the Visual
      ghostEl.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;

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
      text.style.marginRight = '2px';
      ghostEl.appendChild(text);

      //  Authentic Apple SF-Symbol SVG Plus Badge (Pixel-Perfect Alignment)
      const addBadge = document.createElement('div');
      addBadge.style.width = '15px';
      addBadge.style.height = '15px';
      addBadge.style.minWidth = '15px';
      addBadge.style.minHeight = '15px';
      addBadge.style.borderRadius = '50%';
      addBadge.style.background = isLight
        ? 'linear-gradient(180deg, #34c759 0%, #28a745 100%)'
        : 'linear-gradient(180deg, #30d158 0%, #248a3d 100%)';
      addBadge.style.display = 'flex';
      addBadge.style.alignItems = 'center';
      addBadge.style.justifyContent = 'center';
      addBadge.style.flexShrink = '0';
      addBadge.style.border = isLight ? '0.5px solid rgba(0, 0, 0, 0.08)' : '0.5px solid rgba(255, 255, 255, 0.3)';
      addBadge.style.boxShadow = isLight
        ? '0 1.5px 4px rgba(52, 199, 89, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
        : '0 2px 6px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.35)';
      addBadge.innerHTML = `<svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="1.4" x2="5" y2="8.6"></line><line x1="1.4" y1="5" x2="8.6" y2="5"></line></svg>`;
      ghostEl.appendChild(addBadge);

      document.body.appendChild(ghostEl);
    };

    //  1-Second Hold Timer: Single click (< 1s) does NOT grab. Holding >= 1s triggers grabbing.
    let holdTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      document.documentElement.classList.add('is-dragging-node');
      document.body.classList.add('is-dragging-node');
      document.body.style.cursor = 'var(--mac-cursor-grabbing)';
      createGhost(startX, startY);
    }, 1000);

    const cleanup = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', cleanup);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('blur', cleanup);

      document.documentElement.classList.remove('is-dragging-node');
      document.body.classList.remove('is-dragging-node');
      document.body.style.cursor = '';

      document.querySelectorAll('.fxforge-drag-ghost').forEach((el) => el.remove());
      ghostEl = null;

      window.dispatchEvent(new CustomEvent('fxforge-drag-hover', { detail: { isOver: false } }));
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      // If mouse button is no longer held down, immediately abort & clean up
      if (moveEvent.buttons === 0) {
        cleanup();
        return;
      }

      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!isDragging && dist > 4) {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }

        isDragging = true;
        document.documentElement.classList.add('is-dragging-node');
        document.body.classList.add('is-dragging-node');
        document.body.style.cursor = 'var(--mac-cursor-grabbing)';
        createGhost(moveEvent.clientX, moveEvent.clientY);
      }

      if (ghostEl) {
        // Keep Visual perfectly centered on the cursor
        ghostEl.style.transform = `translate3d(${moveEvent.clientX}px, ${moveEvent.clientY}px, 0) translate(-50%, -50%)`;

        const sidebarEl = document.querySelector('aside');
        const sidebarRect = sidebarEl?.getBoundingClientRect();
        const hasCrossedDivider = sidebarRect ? moveEvent.clientX > sidebarRect.right : moveEvent.clientX > 345;

        const elUnder = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const isOverCanvas = hasCrossedDivider && Boolean(elUnder?.closest('.react-flow'));
        window.dispatchEvent(new CustomEvent('fxforge-drag-hover', { detail: { isOver: isOverCanvas } }));
      }
    };

    const onPointerUp = (upEvent: MouseEvent | PointerEvent) => {
      const wasDragging = isDragging;
      const dropClientX = upEvent.clientX;
      const dropClientY = upEvent.clientY;

      cleanup();

      if (wasDragging) {
        //  Strict Boundary Check: Must cross divider line into Canvas to allow Drop
        const sidebarEl = document.querySelector('aside');
        const sidebarRect = sidebarEl?.getBoundingClientRect();
        const hasCrossedDivider = sidebarRect ? dropClientX > sidebarRect.right : dropClientX > 345;

        if (hasCrossedDivider) {
          const elUnder = document.elementFromPoint(dropClientX, dropClientY);
          const flowEl = elUnder?.closest('.react-flow');
          if (flowEl) {
            window.dispatchEvent(
              new CustomEvent('fxforge-drop-node', {
                detail: {
                  nodeType,
                  clientX: dropClientX,
                  clientY: dropClientY,
                },
              })
            );
          }
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    window.addEventListener('pointercancel', cleanup, { once: true });
    window.addEventListener('mouseup', onPointerUp, { once: true });
    window.addEventListener('blur', cleanup, { once: true });
  };

  //  2. Full Expanded Sidebar Mode
  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      style={{
        width: '345px',
        minWidth: '345px',
        transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
      className={`h-full flex flex-col flex-shrink-0 border-r select-none z-20 font-sans transition-colors duration-200 ${
        isLight ? 'bg-[#f5f5f7] border-black/[0.08] text-[#111827]' : 'bg-[#08080c] border-white/[0.08] text-[#e5e7eb]'
      }`}
    >
      {/* 1.  Apple macOS Header & Spotlight Search */}
      <div
        style={{
          paddingTop: '12px',
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
            <Sliders size={17} className={`transition-colors flex-shrink-0 ${isLight ? 'text-[#374151]' : 'text-[#a1a1aa]'}`} />
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: isLight ? '#111827' : '#ffffff',
                letterSpacing: '-0.015em',
                whiteSpace: 'nowrap',
              }}
            >
              RL Hyperparameters
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={toggleAll}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: isLight ? '#4b5563' : '#a1a1aa',
                background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                padding: '3px 8px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isLight ? '#111827' : '#ffffff';
                e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isLight ? '#4b5563' : '#a1a1aa';
                e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)';
              }}
            >
              {Object.values(expandedGroups).every(Boolean) ? 'Collapse' : 'Expand'}
            </button>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse to Slim Rail (พับแถบข้าง)"
                style={{
                  background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '6px',
                  color: isLight ? '#4b5563' : '#a1a1aa',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isLight ? '#111827' : '#ffffff';
                  e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isLight ? '#4b5563' : '#a1a1aa';
                  e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </div>
        </div>

        {/*  macOS Spotlight-style Search Field (h-36px, High Contrast) */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '11px',
              color: isLight ? '#4b5563' : '#9ca3af',
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
              height: '36px',
              paddingLeft: '34px',
              paddingRight: '12px',
              backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.14)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: isLight ? '#111827' : '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
            }}
          />
        </div>
      </div>

      {/* 2.  Apple Mac Mail / Finder Sidebar List */}
      <div
        style={{
          paddingLeft: '14px',
          paddingRight: '14px',
          paddingTop: '10px',
          paddingBottom: '20px',
        }}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6"
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
              {/*  Section Header (Solid Apple Typography, Zero Hover Effect, Fold/Open Indicators) */}
              <div
                onClick={() => toggleGroup(group.id)}
                style={{ cursor: 'var(--mac-cursor-default)' }}
                className="py-1.5 px-2 -mx-2 rounded-lg flex items-center justify-between select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* SF Symbol on Main Header */}
                  <GroupIcon
                    size={16}
                    style={{ color: group.color }}
                    className="flex-shrink-0"
                  />

                  {/* Section Label */}
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider truncate ${
                      isLight ? 'text-[#1f2937]' : 'text-[#e5e7eb]'
                    }`}
                    style={{ letterSpacing: '0.03em' }}
                  >
                    {group.label}
                  </span>
                </div>

                {/*  Fold / Open Arrow Indicator: ChevronDown when collapsed (พับ), ChevronRight (>) when open (เปิด) */}
                <div className="flex items-center justify-center flex-shrink-0 ml-1.5">
                  {isExpanded ? (
                    <ChevronRight
                      size={14}
                      strokeWidth={2.4}
                      className={isLight ? 'text-black/50' : 'text-white/50'}
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      strokeWidth={2.4}
                      className={isLight ? 'text-black/50' : 'text-white/50'}
                    />
                  )}
                </div>
              </div>

              {/*  Child Items (Large & Crisp Text 13.5px font-medium with Generous Breathing Room) */}
              {isExpanded && (
                <div
                  style={{
                    paddingLeft: '6px',
                    marginTop: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
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
                          minHeight: '32px',
                          paddingLeft: '16px',
                          paddingRight: '14px',
                          paddingTop: '6px',
                          paddingBottom: '6px',
                          borderRadius: '8px',
                          cursor: 'var(--mac-cursor-grab)',
                          userSelect: 'none',
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                          backgroundColor: isNodeHovered
                            ? (isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.12)')
                            : 'transparent',
                          color: isNodeHovered
                            ? (isLight ? '#0071e3' : '#ffffff')
                            : (isLight ? '#111827' : '#e5e7eb'),
                        }}
                      >
                        {/* Left: Crisp Solid Bullet Point with 16px Capsule Clearance */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              flexShrink: 0,
                              backgroundColor: isNodeHovered ? (isLight ? '#0071e3' : '#ffffff') : group.color,
                              transition: 'background-color 0.15s ease',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isNodeHovered ? 600 : 500,
                              letterSpacing: '-0.01em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: '1.2',
                            }}
                          >
                            {node.label}
                          </span>
                        </div>

                        {/* Right: Subtle Add Indicator with 14px Capsule Clearance */}
                        <Plus
                          size={13}
                          style={{
                            flexShrink: 0,
                            marginLeft: '8px',
                            opacity: isNodeHovered ? 1 : 0,
                            color: isLight ? '#0071e3' : '#ffffff',
                            transition: 'opacity 0.15s ease',
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

      {/* 3.  macOS Footer (High Contrast) */}
      <div
        style={{
          paddingTop: '10px',
          paddingBottom: '12px',
          paddingLeft: '14px',
          paddingRight: '14px',
          borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
        className={`text-xs ${isLight ? 'text-[#4b5563]' : 'text-[#9ca3af]'}`}
      >
        <button
          onClick={onOpenSettings}
          title="Open System & Quant Settings"
          className={`flex items-center gap-2 transition-colors cursor-pointer text-[12.5px] font-semibold ${
            isLight ? 'hover:text-[#111827]' : 'hover:text-white'
          }`}
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>
        <span className={`text-[11.5px] font-mono font-bold ${isLight ? 'text-[#16a34a]' : 'text-[#30d158]'}`}>
          v2.0 Quant AI
        </span>
      </div>
    </aside>
  );
};

export default NodePalette;
