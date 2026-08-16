import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { CATALOG_GROUPS, NODE_CATALOG } from '../../data/nodeCatalog';
import type { TradingNodeConfig } from '../../types/flow';

interface NodePaletteProps {
  onAddNode?: (config: TradingNodeConfig) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // Track open accordion categories (Default: open data, feature & model)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    data: true,
    feature: true,
    model: true,
    backtest: true,
  });

  // Toggle single category
  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Expand / Collapse All
  const areAllExpanded = useMemo(() => {
    return CATALOG_GROUPS.every((g) => openCategories[g.id]);
  }, [openCategories]);

  const toggleAll = () => {
    const nextState = !areAllExpanded;
    const updated: Record<string, boolean> = {};
    CATALOG_GROUPS.forEach((g) => {
      updated[g.id] = nextState;
    });
    setOpenCategories(updated);
  };

  // Node Map by ID for quick lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, TradingNodeConfig>();
    NODE_CATALOG.forEach((node) => map.set(node.id, node));
    return map;
  }, []);

  // Drag start handler (Drag & Drop ONLY)
  const handleDragStart = (e: React.DragEvent, node: TradingNodeConfig) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Dynamic Lucide Icon Resolver
  const renderIcon = (iconName: string, size = 14, className = '') => {
    const IconComponent = (LucideIcons as Record<string, any>)[iconName] || LucideIcons.Box;
    return <IconComponent size={size} className={className} />;
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-[#0d0d12] border-r border-white/[0.08] flex flex-col items-center py-4 select-none z-20 flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Expand Components Library"
        >
          <LucideIcons.PanelLeftOpen size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-[300px] h-full bg-[#0d0d12]/98 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col select-none z-20 flex-shrink-0 overflow-hidden">
      {/* 1. Header: Components Title + Total Count + Expand All */}
      <div className="h-12 px-3.5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-[#0d0d12]">
        <div className="flex items-center gap-2">
          <LucideIcons.LayoutGrid size={15} className="text-[#007aff]" />
          <h2 className="text-xs font-semibold text-white tracking-tight">Components</h2>
          <span className="text-[10px] font-mono font-bold text-[#007aff] px-1.5 py-0.5 rounded bg-[#007aff]/10 border border-[#007aff]/20 leading-none">
            {NODE_CATALOG.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="text-[11px] font-medium text-[#86868b] hover:text-white transition-colors cursor-pointer"
          >
            {areAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <LucideIcons.PanelLeftClose size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Categorized Accordion List (Drag & Drop ONLY - Direct Flow) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-2 custom-scrollbar">
        {CATALOG_GROUPS.map((group) => {
          const isOpen = !!openCategories[group.id];

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-white/[0.06] bg-[#12121a]/80 overflow-hidden transition-all flex-shrink-0"
            >
              {/* Category Accordion Header with Colored Vertical Accent Line */}
              <button
                onClick={() => toggleCategory(group.id)}
                className="w-full h-9 px-3 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LucideIcons.ChevronDown
                    size={13}
                    className={`text-[#86868b] transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />

                  {/* Colored Vertical Accent Indicator Bar */}
                  <div
                    className="w-1 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.accentColor }}
                  />

                  {/* Category Icon */}
                  <div className="text-white/80 flex-shrink-0">
                    {renderIcon(group.icon, 14, `text-[${group.accentColor}]`)}
                  </div>

                  {/* Category Title */}
                  <span className="text-xs font-semibold text-white tracking-tight truncate">
                    {group.name}
                  </span>
                </div>
              </button>

              {/* Expanded Sub-Nodes (Strictly Drag & Drop ONLY) */}
              {isOpen && (
                <div className="px-2 pb-2 pt-0.5 space-y-0.5 border-t border-white/[0.04]">
                  {group.nodeIds.map((nodeId) => {
                    const node = nodeMap.get(nodeId);
                    if (!node) return null;

                    return (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, node)}
                        className="group w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.1] flex items-center justify-between transition-all cursor-grab active:cursor-grabbing select-none"
                        title="Drag and drop onto canvas"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/*  Apple Glass Lucide Icon Badge */}
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: `${group.accentColor}18`,
                              color: group.accentColor,
                              border: `1px solid ${group.accentColor}33`,
                              boxShadow: `0 0 10px ${group.accentColor}15`,
                            }}
                          >
                            {renderIcon(node.icon, 13)}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-white/90 group-hover:text-white truncate">
                              {node.title}
                            </span>
                            <span className="text-[10px] text-[#86868b] truncate leading-tight">
                              {node.subtitle}
                            </span>
                          </div>
                        </div>

                        {/* Subtle Drag Handle Icon on Hover */}
                        <div className="opacity-0 group-hover:opacity-40 transition-opacity text-white flex-shrink-0">
                          <LucideIcons.GripVertical size={13} />
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

      {/* 3. Bottom Footer Info */}
      <div className="h-9 px-3.5 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-[#86868b] font-mono flex-shrink-0 bg-[#0d0d12]">
        <span className="flex items-center gap-1.5">
          <LucideIcons.Move size={11} className="text-[#007aff]" />
          <span>Drag & Drop to Canvas</span>
        </span>
        <span className="text-[#636366]">Dark Studio</span>
      </div>
    </aside>
  );
};
