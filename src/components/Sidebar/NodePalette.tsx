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
      {/* 1.  Apple macOS Header & Spotlight Search (Exact 30px Spacing) */}
      <div className="px-4.5 pt-[30px] pb-[30px] border-b border-white/[0.06] bg-[#0c0c14]/90 flex-shrink-0">
        <div className="flex justify-between items-center mb-[30px] px-0.5">
          <div className="flex items-center gap-2.5">
            <Sliders size={15} className="text-[#86868b] hover:text-white transition-colors" />
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

        {/*  macOS Spotlight-style Search Field (h-34px rounded-8) */}
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-3 text-[#86868b] pointer-events-none z-10" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parameters & modules..."
            style={{ paddingLeft: '32px' }}
            className="w-full h-[34px] bg-white/[0.05] border border-white/[0.08] hover:border-white/20 focus:border-[#0a84ff] rounded-[8px] text-[12px] text-white placeholder-[#71717a] pr-3 py-1 outline-none transition-colors"
          />
        </div>
      </div>

      {/* 2.  Apple Mac Mail / Finder Sidebar List (space-y-6: 24px between groups) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3.5 py-4 space-y-6">
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
              {/*  Section Header (Muted Gray -> Pure White on Hover, No Frame) */}
              <div
                onClick={() => toggleGroup(group.id)}
                className="group px-1 py-1.5 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Rotating Chevron */}
                  <ChevronRight
                    size={11}
                    className={`transition-all duration-150 flex-shrink-0 ${
                      isExpanded
                        ? 'rotate-90 text-[#86868b] group-hover:text-white'
                        : 'text-[#86868b] group-hover:text-white'
                    }`}
                  />

                  {/* SF Symbol on Main Header (Gray -> White) */}
                  <GroupIcon
                    size={14}
                    className="text-[#86868b] group-hover:text-white transition-colors flex-shrink-0"
                  />

                  {/* Section Label (Gray -> White) */}
                  <span className="text-[11.5px] font-bold text-[#86868b] group-hover:text-white uppercase tracking-wider truncate transition-colors">
                    {group.label}
                  </span>
                </div>
              </div>

              {/*  Child Items (mt-2: gap under header, h-[34px] row height) */}
              {isExpanded && (
                <div className="mt-2 space-y-1 pl-4">
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
                        className="h-[34px] px-1 flex items-center justify-between cursor-grab transition-colors"
                      >
                        {/* Left: Mid Dot (·) + Label */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`text-[18px] font-bold leading-none select-none transition-colors flex-shrink-0 ${
                              isNodeHovered ? 'text-white' : 'text-[#71717a]'
                            }`}
                          >
                            ·
                          </span>
                          <span
                            className={`text-[13px] tracking-tight truncate leading-tight transition-colors ${
                              isNodeHovered ? 'font-medium text-white' : 'font-normal text-[#8e8e93]'
                            }`}
                          >
                            {node.label}
                          </span>
                        </div>

                        {/* Right: Subtle Add Indicator */}
                        <Plus
                          size={12}
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
