import React, { useRef, useEffect, useCallback } from 'react';
import type { RLEnvironmentStep } from '../../services/fxforgeEngine';

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

interface LiveNeuralLinkProps {
  isTraining?: boolean;
  latestStep?: RLEnvironmentStep | null;
  cameraResetTrigger?: number;
}

export const LiveNeuralLink: React.FC<LiveNeuralLinkProps> = ({
  isTraining = true,
  latestStep = null,
  cameraResetTrigger = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const neuronsRef = useRef<BPNeuron[]>([]);
  const synapsesRef = useRef<BPSynapse[]>([]);
  const particlesRef = useRef<SignalParticle[]>([]);

  // Camera 3D Orbital Controls
  const cameraRef = useRef({ rotX: 0.14, rotY: -0.22, zoom: 1.05, panX: 0, panY: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isTrainingRef = useRef(isTraining);

  // Sync training ref
  useEffect(() => {
    isTrainingRef.current = isTraining;
  }, [isTraining]);

  // Reset Camera Trigger from TopNav
  useEffect(() => {
    if (cameraResetTrigger > 0) {
      cameraRef.current = { rotX: 0.14, rotY: -0.22, zoom: 1.05, panX: 0, panY: 0 };
    }
  }, [cameraResetTrigger]);

  // 1. Initialize Neural Network Geometry [6 -> 12 -> 8 -> 3]
  useEffect(() => {
    const layerSizes = [6, 12, 8, 3];
    const neurons: BPNeuron[] = [];
    const synapses: BPSynapse[] = [];

    const inputLabels = ['Ret(5)', 'Ret(10)', 'Ret(20)', 'Vol(10)', 'DistSMA', 'Pos'];
    const outputLabels = ['BUY (Long)', 'HOLD (Flat)', 'SELL (Short)'];

    const layerSpacingX = 240;
    const originX = -((layerSizes.length - 1) * layerSpacingX) / 2;

    for (let l = 0; l < layerSizes.length; l++) {
      const count = layerSizes[l];
      const spacingY = Math.min(65, 380 / count);
      const originY = -((count - 1) * spacingY) / 2;

      for (let i = 0; i < count; i++) {
        const x = originX + l * layerSpacingX;
        const y = originY + i * spacingY;
        const z = (Math.sin((l / 3) * Math.PI) * 50 - 25) + (i % 2 === 0 ? 15 : -15);

        let label = `N_${l}_${i}`;
        let subLabel = '';
        if (l === 0) {
          label = inputLabels[i] || `In_${i}`;
          subLabel = 'State';
        } else if (l === layerSizes.length - 1) {
          label = outputLabels[i] || `Act_${i}`;
          subLabel = 'Action';
        } else {
          label = `h_${l}_${i}`;
          subLabel = 'Hidden';
        }

        neurons.push({
          id: `neuron_${l}_${i}`,
          layerIdx: l,
          neuronIdx: i,
          label,
          subLabel,
          x,
          y,
          z,
          activation: Math.random() * 0.4 + 0.1,
          pulse: 0,
        });
      }
    }

    // Connect Fully Connected Dense Synapses
    for (let l = 0; l < layerSizes.length - 1; l++) {
      const currCount = layerSizes[l];
      const nextCount = layerSizes[l + 1];

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

  // 2. Real-time Activation Update from Global Latest Step
  useEffect(() => {
    if (!latestStep) return;
    const neurons = neuronsRef.current;
    if (neurons.length > 0) {
      // State inputs
      const n0 = neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 0);
      const n1 = neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 1);
      const n2 = neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 2);
      const n3 = neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 3);
      const n4 = neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 4);
      const n5 = neurons.find((n) => n.layerIdx === 0 && n.neuronIdx === 5);

      if (n0) n0.activation = Math.min(1, Math.abs(latestStep.state.ret5) / 2);
      if (n1) n1.activation = Math.min(1, Math.abs(latestStep.state.ret10) / 3);
      if (n2) n2.activation = Math.min(1, Math.abs(latestStep.state.ret20) / 4);
      if (n3) n3.activation = Math.min(1, latestStep.state.volat10 / 1.5);
      if (n4) n4.activation = Math.min(1, Math.abs(latestStep.state.distSma20) / 2);
      if (n5) n5.activation = (latestStep.state.pos + 1) / 2;

      // Action outputs (Softmax Probabilities)
      const out0 = neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === 0);
      const out1 = neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === 1);
      const out2 = neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === 2);

      if (out0) out0.activation = latestStep.actionProbs[0]; // BUY
      if (out1) out1.activation = latestStep.actionProbs[1]; // HOLD
      if (out2) out2.activation = latestStep.actionProbs[2]; // SELL
    }
  }, [latestStep]);

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
    </div>
  );
};
