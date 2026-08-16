import React, { useState } from 'react';
import { GROUPS, nodesByGroup } from '../../data/nodeRegistry';
import {
  Search,
  ChevronRight,
  Plus,
  Sliders,
  Brain,
  Zap,
  ShieldCheck,
  Trophy,
  RefreshCw,
  Layers,
  Settings,
  Database,
  SlidersHorizontal,
  ShieldAlert,
  Activity,
  Radio,
  FileCode,
  Sparkles,
} from 'lucide-react';

// Apple SF Symbols Icon Mapping (Clean, authentic Apple Blue & System Colors)
const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  stage1: Database,
  stage2: SlidersHorizontal,
  stage3: Brain,
  stage4: ShieldAlert,
  stage5: Zap,
  trainer: Activity,
  qc: ShieldCheck,
  tournament: Trophy,
  live: Radio,
  remediation: RefreshCw,
  output: FileCode,
  llm: Sparkles,
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

  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      className="w-[290px] h-full flex flex-col flex-shrink-0 bg-[#08080c]/98 border-r border-white/[0.08] text-[#c7c7cc] select-none z-20 font-sans"
    >
      {/* 1.  Apple macOS Header & Spotlight Search */}
      <div className="px-4 pt-4 pb-3.5 border-b border-white/[0.06] bg-[#0c0c14]/90 flex-shrink-0">
        <div className="flex justify-between items-center mb-3.5 px-0.5">
          <div className="flex items-center gap-2.5">
            <Sliders size={15} className="text-[#0a84ff]" />
            <span className="text-[13.5px] font-bold text-white tracking-tight">
              RL Hyperparameters
            </span>
          </div>

          <button
            onClick={toggleAll}
            className="text-[11px] font-medium text-[#86868b] hover:text-white transition-colors cursor-pointer"
          >
            {Object.values(expandedGroups).every(Boolean) ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/*  macOS Spotlight-style Search Field */}
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-3 text-[#86868b] pointer-events-none z-10" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parameters & modules..."
            style={{ paddingLeft: '32px' }}
            className="w-full h-[32px] bg-white/[0.05] border border-white/[0.08] hover:border-white/20 focus:border-[#0a84ff] rounded-[7px] text-[12px] text-white placeholder-[#71717a] pr-3 py-1 outline-none transition-colors"
          />
        </div>
      </div>

      {/* 2.  Apple Mac Mail / Finder Sidebar List (Perfect Spacing & Rhythm) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-2 space-y-4">
        {GROUPS.map((group) => {
          const allNodes = nodesByGroup(group.id);
          const matchingNodes = allNodes.filter(
            (n) => !q || n.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)
          );

          if (q && matchingNodes.length === 0) return null;

          const isExpanded = expandedGroups[group.id] || Boolean(q);
          const GroupIcon = GROUP_ICONS[group.id] || Layers;

          return (
            <div key={group.id} className="space-y-1">
              {/*  Section Header (SF Symbol on Header) */}
              <div
                onClick={() => toggleGroup(group.id)}
                className="px-2 py-1.5 flex items-center justify-between cursor-pointer rounded-[6px] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Rotating Chevron */}
                  <ChevronRight
                    size={11}
                    className={`text-[#86868b] transition-transform duration-150 flex-shrink-0 ${
                      isExpanded ? 'rotate-90 text-white' : ''
                    }`}
                  />

                  {/* SF Symbol on Main Header */}
                  <GroupIcon
                    size={14}
                    className="text-[#0a84ff] flex-shrink-0"
                  />

                  {/* Section Label */}
                  <span className="text-[11.5px] font-bold text-[#e5e5ea] uppercase tracking-wider truncate">
                    {group.label}
                  </span>
                </div>
              </div>

              {/*  Child Items (Mid Dot for Draggable Nodes) */}
              {isExpanded && (
                <div className="space-y-0.5 pl-3.5">
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
                        className={`h-[30px] px-2.5 rounded-[6px] flex items-center justify-between cursor-grab transition-all ${
                          isNodeHovered
                            ? 'bg-white/[0.08] text-white shadow-sm'
                            : 'text-[#d1d1d6] hover:bg-white/[0.04]'
                        }`}
                      >
                        {/* Left: Mid Dot (·) + Label */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`text-[17px] font-bold leading-none select-none transition-colors flex-shrink-0 ${
                              isNodeHovered ? 'text-[#0a84ff]' : 'text-[#71717a]'
                            }`}
                          >
                            ·
                          </span>
                          <span
                            className={`text-[13px] tracking-tight truncate leading-tight ${
                              isNodeHovered ? 'font-medium text-white' : 'font-normal text-[#d1d1d6]'
                            }`}
                          >
                            {node.label}
                          </span>
                        </div>

                        {/* Right: Subtle Add Indicator */}
                        <Plus
                          size={12}
                          className={`flex-shrink-0 transition-opacity ${
                            isNodeHovered ? 'opacity-100 text-white' : 'opacity-0'
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

      {/* 3.  macOS Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-[#0c0c14]/90 flex items-center justify-between text-xs text-[#86868b] flex-shrink-0">
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
