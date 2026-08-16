import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { fxforgeEngine, type RLEnvironmentStep, type QuantTelemetry } from '../../services/fxforgeEngine';
import { generatePythonOnnxScript, generateMql5SourceCode } from '../../services/onnxExporter';

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
    rotX: 0.14,
    rotY: -0.22,
    zoom: 1.05,
    panX: 0,
    panY: 0,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // FXFORGE Engine State
  const [isTraining, setIsTraining] = useState(true);
  const [telemetry, setTelemetry] = useState<QuantTelemetry>(fxforgeEngine.getTelemetry());
  const [latestStep, setLatestStep] = useState<RLEnvironmentStep | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const isTrainingRef = useRef(isTraining);
  isTrainingRef.current = isTraining;

  // Topology Refs
  const neuronsRef = useRef<BPNeuron[]>([]);
  const synapsesRef = useRef<BPSynapse[]>([]);
  const particlesRef = useRef<SignalParticle[]>([]);

  // 1. Initialize FXFORGE 4-Stage Topology:
  // Layer 0: 6 State Inputs [Ret5, Ret10, Ret20, Volat10, DistSMA20, Pos]
  // Layer 1: 8 Hidden (Actor H1 64D)
  // Layer 2: 6 Hidden (Actor H2 32D)
  // Layer 3: 3 Action Outputs [BUY (0), HOLD (1), SELL (2)]
  useEffect(() => {
    const neurons: BPNeuron[] = [];
    const synapses: BPSynapse[] = [];

    const stateLabels = [
      { name: 'Ret5', sub: '5-bar Return %' },
      { name: 'Ret10', sub: '10-bar Return %' },
      { name: 'Ret20', sub: '20-bar Return %' },
      { name: 'Volat10', sub: 'Norm Volatility %' },
      { name: 'DistSMA20', sub: 'Distance SMA20 %' },
      { name: 'Position', sub: 'Holding State' },
    ];

    const actionLabels = [
      { name: 'BUY / LONG', sub: 'Action a=0' },
      { name: 'HOLD / FLAT', sub: 'Action a=1' },
      { name: 'SELL / SHORT', sub: 'Action a=2' },
    ];

    const layerConfigs = [
      { count: 6, x: -260, name: 'State Input s_t' },
      { count: 8, x: -90, name: 'Actor H1 (64D)' },
      { count: 6, x: 90, name: 'Actor H2 (32D)' },
      { count: 3, x: 260, name: 'Policy Action π' },
    ];

    layerConfigs.forEach((layer, layerIdx) => {
      const spacingY = layer.count === 8 ? 38 : layer.count === 6 ? 48 : 64;
      const totalHeight = (layer.count - 1) * spacingY;
      const startY = totalHeight / 2;

      for (let i = 0; i < layer.count; i++) {
        const yPos = startY - i * spacingY;
        const zPos = Math.sin((i / layer.count) * Math.PI) * 18;

        let label = `${layer.name} ${i + 1}`;
        let subLabel = `Layer ${layerIdx + 1}`;

        if (layerIdx === 0 && stateLabels[i]) {
          label = stateLabels[i].name;
          subLabel = stateLabels[i].sub;
        } else if (layerIdx === 3 && actionLabels[i]) {
          label = actionLabels[i].name;
          subLabel = actionLabels[i].sub;
        }

        neurons.push({
          id: `n_${layerIdx}_${i}`,
          layerIdx,
          neuronIdx: i,
          label,
          subLabel,
          x: layer.x,
          y: yPos,
          z: zPos,
          activation: 0.2 + Math.random() * 0.6,
          pulse: 0,
        });
      }
    });

    // Fully Connected Synapses between adjacent layers
    for (let l = 0; l < layerConfigs.length - 1; l++) {
      const currCount = layerConfigs[l].count;
      const nextCount = layerConfigs[l + 1].count;

      for (let i = 0; i < currCount; i++) {
        for (let j = 0; j < nextCount; j++) {
          synapses.push({
            id: `syn_${l}_${i}_${j}`,
            sourceLayer: l,
            sourceIdx: i,
            targetLayer: l + 1,
            targetIdx: j,
            weight: (Math.random() * 2 - 1) * 0.85,
          });
        }
      }
    }

    neuronsRef.current = neurons;
    synapsesRef.current = synapses;
  }, []);

  // 2. Real-time FXFORGE Environment Step Loop
  useEffect(() => {
    if (!isTraining) return;

    const interval = setInterval(() => {
      const stepResult = fxforgeEngine.step();
      setLatestStep(stepResult);
      setTelemetry(fxforgeEngine.getTelemetry());

      // Update Node Activations directly
      const neurons = neuronsRef.current;
      if (neurons.length > 0) {
        // State inputs
        neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 0)!.activation = Math.min(1, Math.abs(stepResult.state.ret5) / 2);
        neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 1)!.activation = Math.min(1, Math.abs(stepResult.state.ret10) / 3);
        neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 2)!.activation = Math.min(1, Math.abs(stepResult.state.ret20) / 4);
        neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 3)!.activation = Math.min(1, stepResult.state.volat10 / 1.5);
        neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 4)!.activation = Math.min(1, Math.abs(stepResult.state.distSma20) / 2);
        neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 5)!.activation = (stepResult.state.pos + 1) / 2;

        // Action outputs (Softmax Probabilities)
        neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === 0)!.activation = stepResult.actionProbs[0]; // BUY
        neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === 1)!.activation = stepResult.actionProbs[1]; // HOLD
        neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === 2)!.activation = stepResult.actionProbs[2]; // SELL
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isTraining]);

  // 3. Spawn Signal Pulses
  const spawnSignals = useCallback(() => {
    if (!isTrainingRef.current) return;
    const neurons = neuronsRef.current;
    if (neurons.length === 0) return;

    // A. Forward Pass (Pearl White Pulses: Left -> Right)
    if (Math.random() < 0.45) {
      const startLayer = Math.floor(Math.random() * 3);
      const layerSources = neurons.filter((n) => n.layerIdx === startLayer);
      const layerTargets = neurons.filter((n) => n.layerIdx === startLayer + 1);

      if (layerSources.length > 0 && layerTargets.length > 0) {
        const src = layerSources[Math.floor(Math.random() * layerSources.length)];
        const tgt = layerTargets[Math.floor(Math.random() * layerTargets.length)];

        particlesRef.current.push({
          id: `sig_fwd_${Date.now()}_${Math.random()}`,
          sourceX: src.x,
          sourceY: src.y,
          sourceZ: src.z,
          targetX: tgt.x,
          targetY: tgt.y,
          targetZ: tgt.z,
          progress: 0,
          speed: 0.022 + Math.random() * 0.015,
          color: 'rgba(255, 255, 255, 0.95)',
        });
      }
    }

    // B. Backpropagation Gradients (Apple Electric Blue: Right -> Left)
    if (Math.random() < 0.25) {
      const endLayer = 1 + Math.floor(Math.random() * 3);
      const layerSources = neurons.filter((n) => n.layerIdx === endLayer);
      const layerTargets = neurons.filter((n) => n.layerIdx === endLayer - 1);

      if (layerSources.length > 0 && layerTargets.length > 0) {
        const src = layerSources[Math.floor(Math.random() * layerSources.length)];
        const tgt = layerTargets[Math.floor(Math.random() * layerTargets.length)];

        particlesRef.current.push({
          id: `sig_bwd_${Date.now()}_${Math.random()}`,
          sourceX: src.x,
          sourceY: src.y,
          sourceZ: src.z,
          targetX: tgt.x,
          targetY: tgt.y,
          targetZ: tgt.z,
          progress: 0,
          speed: 0.028 + Math.random() * 0.015,
          color: 'rgba(10, 132, 255, 0.95)',
        });
      }
    }
  }, []);

  // 4. Main 60 FPS Render Loop (Aspect-Preserving 3D Projection)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
    });

    resizeObserver.observe(container);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep Luxury Space Background
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, 0, width, height);

      // Camera Matrix Transformations
      const cam = cameraRef.current;
      if (!isDraggingRef.current) {
        cam.rotY += 0.0012; // Subtle Auto-rotation
      }

      const cosX = Math.cos(cam.rotX);
      const sinX = Math.sin(cam.rotX);
      const cosY = Math.cos(cam.rotY);
      const sinY = Math.sin(cam.rotY);
      const fov = 750;
      const centerX = width / 2 + cam.panX;
      const centerY = height / 2 + cam.panY;

      // 3D Point Projection Function
      const project = (x: number, y: number, z: number) => {
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX + 500;
        const scale = (fov / Math.max(10, z2)) * cam.zoom;
        return {
          px: centerX + x1 * scale,
          py: centerY + y1 * scale,
          scale,
          depth: z2,
        };
      };

      spawnSignals();

      // Draw Synapses (Hairline Silver Filaments)
      const neurons = neuronsRef.current;
      const synapses = synapsesRef.current;

      synapses.forEach((syn) => {
        const src = neurons.find((n) => n.layerIdx === syn.sourceLayer && n.neuronIdx === syn.sourceIdx);
        const tgt = neurons.find((n) => n.layerIdx === syn.targetLayer && n.neuronIdx === syn.targetIdx);
        if (!src || !tgt) return;

        const p1 = project(src.x, src.y, src.z);
        const p2 = project(tgt.x, tgt.y, tgt.z);

        const alpha = 0.08 + Math.abs(syn.weight) * 0.12;
        ctx.strokeStyle = syn.weight > 0 
          ? `rgba(255, 255, 255, ${alpha})` 
          : `rgba(100, 210, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      });

      // Draw Signal Pulses
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          particles.splice(i, 1);
          continue;
        }

        const curX = p.sourceX + (p.targetX - p.sourceX) * p.progress;
        const curY = p.sourceY + (p.targetY - p.sourceY) * p.progress;
        const curZ = p.sourceZ + (p.targetZ - p.sourceZ) * p.progress;
        const proj = project(curX, curY, curZ);

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, 2.2 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Soma Orbs (Frosted Glass with Specular Glow)
      neurons.forEach((n) => {
        const proj = project(n.x, n.y, n.z);
        const isOutput = n.layerIdx === 3;
        const isInput = n.layerIdx === 0;
        const radius = (isOutput ? 8 : isInput ? 7 : 6) * proj.scale;

        // Custom glow colors based on layer type
        let coreColor = 'rgba(255, 255, 255, 0.95)';
        let outerColor = 'rgba(10, 132, 255, 0.2)';

        if (isOutput) {
          if (n.neuronIdx === 0) {
            // BUY
            coreColor = 'rgba(48, 209, 88, 0.95)';
            outerColor = 'rgba(48, 209, 88, 0.35)';
          } else if (n.neuronIdx === 1) {
            // HOLD
            coreColor = 'rgba(255, 214, 10, 0.95)';
            outerColor = 'rgba(255, 214, 10, 0.3)';
          } else {
            // SELL
            coreColor = 'rgba(255, 69, 58, 0.95)';
            outerColor = 'rgba(255, 69, 58, 0.35)';
          }
        }

        // Outer Glow
        const grad = ctx.createRadialGradient(
          proj.px - radius * 0.3,
          proj.py - radius * 0.3,
          radius * 0.1,
          proj.px,
          proj.py,
          radius * 1.6
        );
        grad.addColorStop(0, coreColor);
        grad.addColorStop(0.4, 'rgba(200, 225, 255, 0.5)');
        grad.addColorStop(0.8, outerColor);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * (1.2 + n.activation * 0.5), 0, Math.PI * 2);
        ctx.fill();

        // Inner Acrylic Core
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [spawnSignals]);

  // Mouse Drag / Camera Rotation Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    cameraRef.current.rotY += dx * 0.006;
    cameraRef.current.rotX = Math.max(-0.8, Math.min(0.8, cameraRef.current.rotX + dy * 0.006));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraRef.current.zoom = Math.max(0.6, Math.min(2.5, cameraRef.current.zoom - e.deltaY * 0.001));
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none bg-[#08080c]">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/*  Apple Vision Pro Floating Glass Capsule Controls (Live Telemetry & ONNX Deploy) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3.5 bg-[#12121a]/85 backdrop-blur-2xl border border-white/[0.12] px-4.5 py-2.5 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.75)] text-xs text-white">
        <button
          onClick={() => setIsTraining(!isTraining)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            isTraining
              ? 'bg-[#007aff] text-white shadow-[0_0_12px_rgba(0,122,255,0.5)]'
              : 'bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          {isTraining ? <LucideIcons.Pause size={13} /> : <LucideIcons.Play size={13} />}
          <span>{isTraining ? 'RL Training Active' : 'Paused'}</span>
        </button>

        <div className="h-4 w-[1px] bg-white/15" />

        <div className="flex items-center gap-4 font-mono text-[11px] text-[#86868b]">
          <span>Episodes: <strong className="text-white">{telemetry.episodes}</strong></span>
          <span>Win Rate: <strong className="text-[#30d158]">{telemetry.winRate}%</strong></span>
          <span>Sharpe: <strong className="text-[#00c7be]">{telemetry.annualizedSharpe}</strong></span>
          <span>Reward: <strong className="text-[#ffd60a]">{telemetry.totalReward}</strong></span>
        </div>

        <div className="h-4 w-[1px] bg-white/15" />

        {/* Action Probability Indicator */}
        {latestStep && (
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                latestStep.action === 0
                  ? 'bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40'
                  : latestStep.action === 2
                  ? 'bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/40'
                  : 'bg-white/10 text-white/80'
              }`}
            >
              {latestStep.action === 0 ? 'BUY (LONG)' : latestStep.action === 2 ? 'SELL (SHORT)' : 'HOLD (FLAT)'}
            </span>
          </div>
        )}

        <div className="h-4 w-[1px] bg-white/15" />

        {/* ONNX / MT5 Deploy Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold transition-all cursor-pointer"
        >
          <LucideIcons.Rocket size={13} className="text-[#30d158]" />
          <span>Deploy MT5 ONNX</span>
        </button>

        <button
          onClick={() => {
            cameraRef.current = { rotX: 0.14, rotY: -0.22, zoom: 1.05, panX: 0, panY: 0 };
          }}
          title="Reset Camera Angle"
          className="p-1.5 text-[#86868b] hover:text-white transition-colors cursor-pointer"
        >
          <LucideIcons.RotateCcw size={13} />
        </button>
      </div>

      {/* ONNX & MQL5 Code Deployment Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#12121a]/98 backdrop-blur-3xl border border-white/[0.14] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-white w-[720px] max-w-[92vw] p-6 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#30d158]/15 border border-[#30d158]/30 flex items-center justify-center text-[#30d158]">
                  <LucideIcons.Rocket size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">MT5 Zero-Latency ONNX Deploy Package</h3>
                  <p className="text-[11px] text-[#86868b]">Opset 14 Static Tensor Shape [1, 6] float32 ➔ [1, 3] float32</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <LucideIcons.X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar text-xs font-mono">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-slate-300 font-semibold">
                  <span>1. PyTorch ONNX Exporter (Python)</span>
                </div>
                <pre className="p-3.5 bg-[#09090e] border border-white/[0.06] rounded-xl text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                  {generatePythonOnnxScript()}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-slate-300 font-semibold">
                  <span>2. Native MetaTrader 5 Expert Advisor (MQL5)</span>
                </div>
                <pre className="p-3.5 bg-[#09090e] border border-white/[0.06] rounded-xl text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                  {generateMql5SourceCode()}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
