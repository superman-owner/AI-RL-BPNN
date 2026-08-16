import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';

interface BPNeuron {
  id: string;
  layerIdx: number;
  neuronIdx: number;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  z: number;
  activation: number;
  pulse: number;
}

interface BPSynapse {
  id: string;
  sourceLayer: number;
  sourceIdx: number;
  targetLayer: number;
  targetIdx: number;
  weight: number;
}

interface SignalParticle {
  id: string;
  sourceX: number;
  sourceY: number;
  sourceZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  progress: number;
  speed: number;
  color: string;
}

export const LiveNeuralLink: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Orbital Camera Matrix
  const cameraRef = useRef({
    rotX: 0.12,
    rotY: -0.25,
    zoom: 1.1,
    panX: 0,
    panY: 0,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hoveredNeuronRef = useRef<BPNeuron | null>(null);

  // Minimalist Apple Pro State
  const [isTraining, setIsTraining] = useState(true);
  const [epoch, setEpoch] = useState(240);
  const [loss, setLoss] = useState(0.038);
  const [accuracy, setAccuracy] = useState(96.8);
  const [hoveredInfo, setHoveredInfo] = useState<{ label: string; val: string } | null>(null);

  const isTrainingRef = useRef(isTraining);
  isTrainingRef.current = isTraining;

  // BPNN Topology Refs
  const neuronsRef = useRef<BPNeuron[]>([]);
  const synapsesRef = useRef<BPSynapse[]>([]);
  const particlesRef = useRef<SignalParticle[]>([]);

  // 1. Initialize Clean Architecture (4 Layers: 4 -> 6 -> 6 -> 3 = 19 Neurons, 66 Synapses)
  useEffect(() => {
    const neurons: BPNeuron[] = [];
    const synapses: BPSynapse[] = [];

    // Perfectly proportioned layer layout (Golden ratio grid)
    const layerConfigs = [
      { count: 4, x: -240, name: 'Input' },
      { count: 6, x: -80, name: 'Hidden 1' },
      { count: 6, x: 80, name: 'Hidden 2' },
      { count: 3, x: 240, name: 'Output' },
    ];

    layerConfigs.forEach((layer, layerIdx) => {
      const spacingY = 52;
      const totalHeight = (layer.count - 1) * spacingY;
      const startY = totalHeight / 2;

      for (let i = 0; i < layer.count; i++) {
        const yPos = startY - i * spacingY;
        const zPos = Math.sin((i / layer.count) * Math.PI) * 16;

        neurons.push({
          id: `n_${layerIdx}_${i}`,
          layerIdx,
          neuronIdx: i,
          label: `${layer.name} ${i + 1}`,
          subLabel: `Layer ${layerIdx + 1}`,
          x: layer.x,
          y: yPos,
          z: zPos,
          activation: Math.random() * 0.6 + 0.3,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    });

    // Synaptic connections between adjacent layers
    for (let l = 0; l < layerConfigs.length - 1; l++) {
      const srcCount = layerConfigs[l].count;
      const tgtCount = layerConfigs[l + 1].count;

      for (let i = 0; i < srcCount; i++) {
        for (let j = 0; j < tgtCount; j++) {
          synapses.push({
            id: `s_${l}_${i}_${l + 1}_${j}`,
            sourceLayer: l,
            sourceIdx: i,
            targetLayer: l + 1,
            targetIdx: j,
            weight: (Math.random() - 0.5) * 1.6,
          });
        }
      }
    }

    neuronsRef.current = neurons;
    synapsesRef.current = synapses;
  }, []);

  // 3D Perspective Projection with Strict Isotropic Aspect Ratio
  const project3D = useCallback(
    (
      x: number,
      y: number,
      z: number,
      width: number,
      height: number,
      rotX: number,
      rotY: number,
      zoom: number,
      panX: number,
      panY: number
    ) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY + z * sinY;
      const y1 = y;
      const z1 = -x * sinY + z * cosY;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      const focalLength = 580;
      const cameraDist = 440;
      const depth = z2 + cameraDist;
      const safeDepth = Math.max(10, depth);
      const scale = (focalLength / safeDepth) * zoom;

      // Project onto uniform CSS coordinate space
      const screenX = width / 2 + panX + x2 * scale;
      const screenY = height / 2 + panY - y2 * scale;

      return { screenX, screenY, scale, depth: z2 };
    },
    []
  );

  // Soft Forward Signal Emit
  const triggerForwardPass = useCallback(() => {
    const neurons = neuronsRef.current;
    const synapses = synapsesRef.current;
    const newParticles: SignalParticle[] = [];

    synapses
      .filter((s) => s.sourceLayer === 0)
      .forEach((syn) => {
        const src = neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === syn.sourceIdx);
        const tgt = neurons.find((n) => n.layerIdx === 1 && n.neuronIdx === syn.targetIdx);
        if (src && tgt) {
          newParticles.push({
            id: `p_${syn.id}_${Date.now()}_${Math.random()}`,
            sourceX: src.x,
            sourceY: src.y,
            sourceZ: src.z,
            targetX: tgt.x,
            targetY: tgt.y,
            targetZ: tgt.z,
            progress: 0,
            speed: 0.04,
            color: 'rgba(255, 255, 255, 0.95)',
          });
        }
      });

    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-40);
  }, []);

  // Soft Backward Gradient Emit
  const triggerBackwardPass = useCallback(() => {
    const neurons = neuronsRef.current;
    const synapses = synapsesRef.current;
    const newParticles: SignalParticle[] = [];

    synapses
      .filter((s) => s.targetLayer === 3)
      .forEach((syn) => {
        const src = neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === syn.targetIdx);
        const tgt = neurons.find((n) => n.layerIdx === 2 && n.neuronIdx === syn.sourceIdx);
        if (src && tgt) {
          newParticles.push({
            id: `p_bwd_${syn.id}_${Date.now()}_${Math.random()}`,
            sourceX: src.x,
            sourceY: src.y,
            sourceZ: src.z,
            targetX: tgt.x,
            targetY: tgt.y,
            targetZ: tgt.z,
            progress: 0,
            speed: 0.04,
            color: 'rgba(10, 132, 255, 0.95)',
          });
        }
      });

    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-40);

    setEpoch((prev) => prev + 1);
    setLoss((prev) => Math.max(0.012, prev * 0.992));
    setAccuracy((prev) => Math.min(99.4, prev + 0.02));
  }, []);

  // Main 60 FPS Render Loop (Hardware Accelerated & Distortion Free)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick++;

      // Real CSS dimensions of container
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      // Sync physical bitmap resolution with exact pixel ratio
      const physicalW = Math.floor(width * dpr);
      const physicalH = Math.floor(height * dpr);

      if (canvas.width !== physicalW || canvas.height !== physicalH) {
        canvas.width = physicalW;
        canvas.height = physicalH;
      }

      // Auto-Training cycle
      if (isTrainingRef.current && tick % 50 === 0) {
        if (tick % 100 === 0) {
          triggerForwardPass();
        } else {
          triggerBackwardPass();
        }
      }

      const { rotX, rotY, zoom, panX, panY } = cameraRef.current;

      ctx.save();
      ctx.scale(dpr, dpr); // Scale context by DPR to keep 1:1 crispness

      // 1. Apple Deep Obsidian Canvas (#08080c)
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, 0, width, height);

      // 2. Soft Ambient Vignette Glow
      const centerGlow = ctx.createRadialGradient(
        width / 2 + panX,
        height / 2 + panY,
        30 * zoom,
        width / 2 + panX,
        height / 2 + panY,
        width * 0.55
      );
      centerGlow.addColorStop(0, 'rgba(20, 25, 45, 0.35)');
      centerGlow.addColorStop(0.5, 'rgba(10, 12, 22, 0.15)');
      centerGlow.addColorStop(1, 'rgba(8, 8, 12, 1)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      const neurons = neuronsRef.current;
      const synapses = synapsesRef.current;
      const particles = particlesRef.current;

      // 3. Project Neurons (in logical CSS pixels)
      const projectedMap = new Map<
        string,
        { neuron: BPNeuron; screenX: number; screenY: number; scale: number; depth: number }
      >();

      neurons.forEach((n) => {
        n.pulse += 0.025;
        const proj = project3D(n.x, n.y, n.z, width, height, rotX, rotY, zoom, panX, panY);
        projectedMap.set(n.id, { neuron: n, ...proj });
      });

      // 4. Render Hairline Frosted Synapses
      synapses.forEach((syn) => {
        const srcId = `n_${syn.sourceLayer}_${syn.sourceIdx}`;
        const tgtId = `n_${syn.targetLayer}_${syn.targetIdx}`;
        const p1 = projectedMap.get(srcId);
        const p2 = projectedMap.get(tgtId);
        if (!p1 || !p2) return;

        const avgDepth = (p1.depth + p2.depth) / 2;
        const depthAlpha = Math.max(0.06, Math.min(0.32, (avgDepth + 180) / 360));

        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${depthAlpha * 0.45})`;
        ctx.lineWidth = Math.max(0.6, 0.85 * p1.scale);
        ctx.stroke();
      });

      // 5. Render Floating Signal Pearl Pulses
      const activeParticles: SignalParticle[] = [];
      particles.forEach((p) => {
        p.progress += p.speed;

        if (p.progress < 1.0) {
          activeParticles.push(p);

          const curX = p.sourceX + (p.targetX - p.sourceX) * p.progress;
          const curY = p.sourceY + (p.targetY - p.sourceY) * p.progress;
          const curZ = p.sourceZ + (p.targetZ - p.sourceZ) * p.progress;

          const proj = project3D(curX, curY, curZ, width, height, rotX, rotY, zoom, panX, panY);

          ctx.save();
          ctx.beginPath();
          ctx.arc(proj.screenX, proj.screenY, Math.max(2, 3.0 * proj.scale), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }
      });
      particlesRef.current = activeParticles;

      // 6. Render Apple Pro Frosted Glass Somata (Depth Sorted)
      const sortedProjected = Array.from(projectedMap.values()).sort((a, b) => a.depth - b.depth);

      sortedProjected.forEach(({ neuron, screenX, screenY, scale, depth }) => {
        const isHovered = hoveredNeuronRef.current?.id === neuron.id;
        const depthFactor = Math.max(0.35, Math.min(1.0, (depth + 180) / 360));
        const baseRadius = 8.0 * scale * (isHovered ? 1.25 : 1.0);

        ctx.save();

        // Soft Outer Pearl Glow
        const haloGrad = ctx.createRadialGradient(
          screenX,
          screenY,
          baseRadius * 0.3,
          screenX,
          screenY,
          baseRadius * 2.2
        );
        haloGrad.addColorStop(0, 'rgba(10, 132, 255, 0.25)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(screenX, screenY, baseRadius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.globalAlpha = depthFactor;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Dark Frosted Glass Body
        ctx.beginPath();
        ctx.arc(screenX, screenY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#101018';
        ctx.fill();

        // Specular Silver Rim
        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = isHovered ? 1.8 : 1.2;
        ctx.stroke();

        // Inner Active Core
        const innerRadius = baseRadius * 0.45;
        ctx.beginPath();
        ctx.arc(screenX, screenY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#0a84ff' : 'rgba(245, 245, 247, 0.85)';
        ctx.shadowColor = '#0a84ff';
        ctx.shadowBlur = 6;
        ctx.fill();

        ctx.restore();
      });

      ctx.restore(); // Restore DPR scaling

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [project3D, triggerForwardPass, triggerBackwardPass]);

  // Handle Resize via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(container.clientWidth * dpr);
      canvas.height = Math.floor(container.clientHeight * dpr);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // 3D Orbital Mouse Interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      cameraRef.current.rotY += dx * 0.006;
      cameraRef.current.rotX = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, cameraRef.current.rotX - dy * 0.006)
      );

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }

    // Subtle Hover Detection using container-relative coordinates
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closestNeuron: BPNeuron | null = null;
    let minDistance = 22;

    const { rotX, rotY, zoom, panX, panY } = cameraRef.current;

    neuronsRef.current.forEach((n) => {
      const proj = project3D(
        n.x,
        n.y,
        n.z,
        rect.width,
        rect.height,
        rotX,
        rotY,
        zoom,
        panX,
        panY
      );
      const dist = Math.hypot(proj.screenX - mouseX, proj.screenY - mouseY);
      if (dist < minDistance) {
        minDistance = dist;
        closestNeuron = n;
      }
    });

    hoveredNeuronRef.current = closestNeuron;
    if (closestNeuron) {
      const target: BPNeuron = closestNeuron;
      setHoveredInfo({
        label: target.label,
        val: `a = ${target.activation.toFixed(2)}`,
      });
    } else {
      setHoveredInfo(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
    cameraRef.current.zoom = Math.min(2.5, Math.max(0.6, cameraRef.current.zoom * zoomFactor));
  };

  const handleResetCamera = () => {
    cameraRef.current = {
      rotX: 0.12,
      rotY: -0.25,
      zoom: 1.1,
      panX: 0,
      panY: 0,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#08080c] cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/*  Apple Vision Pro Floating Glass Capsule (Single Cohesive Toolbar) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3.5 bg-[#14141e]/80 backdrop-blur-3xl border border-white/[0.1] px-4 py-1.5 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.7)] text-xs text-white">
        {/* Brand Label */}
        <div className="flex items-center gap-2 pr-1">
          <div className="w-2 h-2 rounded-full bg-[#0a84ff]" />
          <span className="font-semibold text-white/90 tracking-tight">BPNN</span>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10" />

        {/* Segmented Controls with proper spacing and hover states */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/[0.06]">
          <button
            onClick={() => setIsTraining(!isTraining)}
            className={`px-3 py-1 rounded-full font-medium text-[11px] transition-all cursor-pointer ${
              isTraining
                ? 'bg-[#0a84ff] text-white shadow-[0_2px_8px_rgba(10,132,255,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {isTraining ? 'Training' : 'Paused'}
          </button>
          <button
            onClick={triggerForwardPass}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Forward
          </button>
          <button
            onClick={triggerBackwardPass}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Backward
          </button>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10" />

        {/* Minimalist Quiet Telemetry */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-white/60 px-1">
          <span>
            Loss <span className="text-white font-medium">{loss.toFixed(3)}</span>
          </span>
          <span>•</span>
          <span>
            Epoch <span className="text-white font-medium">#{epoch}</span>
          </span>
          <span>•</span>
          <span className="text-[#30d158] font-medium">{accuracy.toFixed(1)}%</span>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10" />

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          className="text-white/40 hover:text-white hover:bg-white/[0.06] p-1 rounded-full transition-colors cursor-pointer"
          title="Reset Camera"
        >
          <LucideIcons.RotateCcw size={13} />
        </button>
      </div>

      {/* Subtle Hover Tooltip */}
      {hoveredInfo && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#14141e]/85 backdrop-blur-2xl border border-white/[0.1] px-4 py-1.5 rounded-full text-[11px] font-mono text-white/80 pointer-events-none shadow-lg animate-in fade-in duration-100 flex items-center gap-2">
          <span className="font-semibold text-white">{hoveredInfo.label}</span>
          <span className="text-white/30">•</span>
          <span className="text-[#0a84ff]">{hoveredInfo.val}</span>
        </div>
      )}
    </div>
  );
};
