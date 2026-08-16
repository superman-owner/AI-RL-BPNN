import React, { useState } from 'react';
import { GROUPS, nodesByGroup } from '../../data/nodeRegistry';
import {
  Search,
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
} from 'lucide-react';

// Apple SF Symbols Icon Mapping
const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
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

  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      className="w-[280px] h-full flex flex-col flex-shrink-0 bg-[#09090e]/95 border-r border-white/[0.08] text-[#c7c7cc] select-none z-20 font-sans"
    >
      {/* 1.  Apple macOS Pro Header */}
      <div className="p-3 pb-2.5 border-b border-white/[0.06] bg-[#0c0c14]/90 flex-shrink-0">
        <div className="flex justify-between items-center mb-2.5 px-0.5">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-[#0a84ff]" />
            <span className="text-xs font-bold text-white tracking-tight">
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
          <Search size={13} className="absolute left-2.5 text-[#86868b] pointer-events-none z-10" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parameters & modules..."
            style={{ paddingLeft: '32px' }}
            className="w-full bg-white/[0.05] border border-white/[0.08] hover:border-white/20 focus:border-[#0a84ff] rounded-md text-xs text-white placeholder-[#71717a] pr-2.5 py-1.5 outline-none transition-colors"
          />
        </div>
      </div>

      {/* 2.  macOS Xcode-style Navigation Tree (Clean SF Symbols) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 py-1.5 space-y-0.5">
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
            <div key={group.id} className="py-0.5">
              {/*  Section Header (Clean SF Symbol + Rotating Disclosure Chevron) */}
              <div
                onClick={() => toggleGroup(group.id)}
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup(null)}
                className={`px-2 py-1.5 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                  isGroupHovered ? 'bg-white/[0.04] text-white' : 'text-[#8e8e93]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Rotating Chevron */}
                  <ChevronRight
                    size={12}
                    className={`text-[#86868b] transition-transform duration-150 flex-shrink-0 ${
                      isExpanded ? 'rotate-90 text-white' : ''
                    }`}
                  />
                  
                  {/* Single Clean SF Symbol Icon */}
                  <GroupIcon
                    size={13}
                    className={`flex-shrink-0 transition-colors ${
                      isGroupHovered ? 'text-[#0a84ff]' : 'text-[#8e8e93]'
                    }`}
                  />

                  {/* Section Label */}
                  <span
                    className={`text-xs font-semibold tracking-tight truncate transition-colors ${
                      isGroupHovered ? 'text-white' : 'text-[#d1d1d6]'
                    }`}
                  >
                    {group.label}
                  </span>
                </div>
              </div>

              {/*  Child Items (Clean Indentation & Monochromatic Style) */}
              {isExpanded && (
                <div className="pl-6 pr-1 py-0.5 space-y-0.5">
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
                        className={`px-2 py-1 rounded-md flex items-center justify-between cursor-grab transition-colors ${
                          isNodeHovered
                            ? 'bg-white/[0.06] text-white'
                            : 'text-[#8e8e93] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-opacity flex-shrink-0 ${
                              isNodeHovered ? 'opacity-100 bg-[#0a84ff]' : 'opacity-40 bg-[#8e8e93]'
                            }`}
                          />
                          <span
                            className={`text-[11.5px] truncate font-normal ${
                              isNodeHovered ? 'font-medium text-white' : 'text-[#a1a1aa]'
                            }`}
                          >
                            {node.label}
                          </span>
                        </div>

                        <Plus
                          size={11}
                          className={`flex-shrink-0 transition-colors ${
                            isNodeHovered ? 'text-[#0a84ff]' : 'text-transparent'
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

      {/* 3.  macOS Footer Status */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0c0c14]/90 flex items-center justify-between text-xs text-[#86868b] flex-shrink-0">
        <button
          onClick={onOpenSettings}
          title="Open System & Quant Settings"
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
        <span className="text-[10.5px] text-[#30d158] font-mono font-medium">
          v2.0 Quant AI
        </span>
      </div>
    </aside>
  );
};

export default NodePalette;
