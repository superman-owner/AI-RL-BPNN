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

//  Apple-style Rounded Rectangle helper
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
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
  const latestStepRef = useRef<RLEnvironmentStep | null>(latestStep);

  // Sync refs
  useEffect(() => {
    isTrainingRef.current = isTraining;
  }, [isTraining]);

  useEffect(() => {
    latestStepRef.current = latestStep;
  }, [latestStep]);

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

    const inputLabels = ['Ret (5d)', 'Ret (10d)', 'Ret (20d)', 'Vol (10d)', 'Dist SMA', 'Position'];
    const outputLabels = ['BUY (LONG)', 'HOLD (FLAT)', 'SELL (SHORT)'];

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

  // 2. Real-time Activation Update from Global Latest Step (Syncing with Topbar)
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

      // Trigger synchronized photonic pulse on active action node
      const chosenNeuron = neurons.find((n) => n.layerIdx === 3 && n.neuronIdx === latestStep.action);
      if (chosenNeuron) {
        chosenNeuron.pulse = 1.0;

        // Convergence signal pulses towards selected action
        const hiddenLayer = neurons.filter((n) => n.layerIdx === 2);
        const actionColor =
          latestStep.action === 0
            ? 'rgba(48, 209, 88, 0.95)'
            : latestStep.action === 1
            ? 'rgba(255, 214, 10, 0.95)'
            : 'rgba(255, 69, 58, 0.95)';

        hiddenLayer.forEach((hn) => {
          if (Math.random() < 0.6) {
            particlesRef.current.push({
              id: `sig_sync_${Date.now()}_${hn.id}_${Math.random()}`,
              sourceX: hn.x,
              sourceY: hn.y,
              sourceZ: hn.z,
              targetX: chosenNeuron.x,
              targetY: chosenNeuron.y,
              targetZ: chosenNeuron.z,
              progress: 0,
              speed: 0.045 + Math.random() * 0.02,
              color: actionColor,
            });
          }
        });
      }
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

      // Deep Luxury Obsidian Canvas with Subtle Ambient Center Glow
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, '#0b0b14');
      bgGrad.addColorStop(1, '#040407');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Camera Matrix Transformations
      const cam = cameraRef.current;
      if (!isDraggingRef.current) {
        cam.rotY += 0.0010; // Subtle Apple Keynote Auto-rotation
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

      // Draw Synapses (Crisp Optical Neural Filaments with Dynamic Action Flow)
      const neurons = neuronsRef.current;
      const synapses = synapsesRef.current;
      const currentStep = latestStepRef.current;

      synapses.forEach((syn) => {
        const src = neurons.find((n) => n.layerIdx === syn.sourceLayer && n.neuronIdx === syn.sourceIdx);
        const tgt = neurons.find((n) => n.layerIdx === syn.targetLayer && n.neuronIdx === syn.targetIdx);
        if (!src || !tgt) return;

        const p1 = project(src.x, src.y, src.z);
        const p2 = project(tgt.x, tgt.y, tgt.z);

        const avgScale = Math.max(0.65, (p1.scale + p2.scale) / 2);
        const isLeadingToChosenAction =
          tgt.layerIdx === 3 && currentStep !== null && currentStep.action === tgt.neuronIdx;

        if (isLeadingToChosenAction) {
          // Vibrantly illuminated active decision path
          const actionColor =
            currentStep.action === 0
              ? 'rgba(48, 209, 88, 0.75)'
              : currentStep.action === 1
              ? 'rgba(255, 214, 10, 0.75)'
              : 'rgba(255, 69, 58, 0.75)';

          ctx.strokeStyle = actionColor;
          ctx.lineWidth = 1.35 * avgScale;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        } else {
          // Crisp, high-contrast synaptic fiber
          const alpha = Math.min(0.55, 0.22 + Math.abs(syn.weight) * 0.28);
          ctx.strokeStyle =
            syn.weight > 0
              ? `rgba(160, 210, 255, ${alpha})`
              : `rgba(220, 225, 245, ${alpha * 0.85})`;
          ctx.lineWidth = (0.85 + Math.abs(syn.weight) * 0.25) * avgScale;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      });

      // Draw Signal Pulses (Crisp Light Photons)
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
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, 1.8 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Soma Orbs (Apple Frosted Glass & Specular Photonic Aura)
      neurons.forEach((n) => {
        // Decay pulse
        if (n.pulse > 0) {
          n.pulse = Math.max(0, n.pulse - 0.035);
        }

        const proj = project(n.x, n.y, n.z);
        const isOutput = n.layerIdx === 3;
        const isInput = n.layerIdx === 0;
        const isSelectedAction = isOutput && currentStep !== null && currentStep.action === n.neuronIdx;
        
        // Proportional, balanced radius
        const baseRadius = isOutput ? 7.2 : isInput ? 6.2 : 5.0;
        const radius = baseRadius * proj.scale;

        // Apple Pro Palette: Monochromatic Glass by default, Subtle Glow ONLY on Active Decision
        let coreColor = '#FFFFFF';
        let outerColor = 'rgba(0, 122, 255, 0.15)';
        let auraIntensity = 1.25 + n.activation * 0.35 + n.pulse * 0.4;

        if (isOutput) {
          if (isSelectedAction) {
            if (n.neuronIdx === 0) {
              // BUY (Apple Soft Emerald - Matched with TopNav #30d158)
              coreColor = '#30d158';
              outerColor = 'rgba(48, 209, 88, 0.32)';
            } else if (n.neuronIdx === 1) {
              // HOLD (Apple Amber Yellow - Matched with TopNav #ffd60a)
              coreColor = '#ffd60a';
              outerColor = 'rgba(255, 214, 10, 0.32)';
            } else {
              // SELL (Apple Rose Crimson - Matched with TopNav #ff453a)
              coreColor = '#ff453a';
              outerColor = 'rgba(255, 69, 58, 0.32)';
            }
            auraIntensity = 1.45 + n.activation * 0.4 + n.pulse * 0.5;
          } else {
            // Inactive Output Node (Calm Frosted Platinum)
            coreColor = 'rgba(255, 255, 255, 0.42)';
            outerColor = 'rgba(255, 255, 255, 0.05)';
            auraIntensity = 1.15;
          }
        }

        // Soft Radial Aura
        const grad = ctx.createRadialGradient(
          proj.px,
          proj.py,
          radius * 0.1,
          proj.px,
          proj.py,
          radius * auraIntensity
        );
        grad.addColorStop(0, coreColor);
        grad.addColorStop(0.35, isSelectedAction ? outerColor : 'rgba(255, 255, 255, 0.12)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * auraIntensity, 0, Math.PI * 2);
        ctx.fill();

        // Inner Frosted Core
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Subtle Specular Ring
        ctx.strokeStyle = isSelectedAction ? coreColor : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        //  5. Apple macOS / iOS Frosted Glass Capsule Badges for Input & Output
        if (isOutput || isInput) {
          ctx.save();
          
          // Continuous floating-point scale
          const smoothScale = Math.max(0.75, Math.min(1.15, proj.scale));
          const depthAlpha = Math.max(0.4, Math.min(1.0, 1 - (proj.depth - 400) / 700));

          if (isInput) {
            // Input State Badges (Left Side)
            const text = n.label;
            const font = `600 11px -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Mono", system-ui, sans-serif`;
            ctx.font = font;
            const textMetrics = ctx.measureText(text);
            const badgeWidth = textMetrics.width + 16;
            const badgeHeight = 22;
            const badgeX = proj.px - (radius + 8 * proj.scale) - badgeWidth * smoothScale;
            const badgeY = proj.py - (badgeHeight * smoothScale) / 2;

            ctx.save();
            ctx.translate(badgeX, badgeY);
            ctx.scale(smoothScale, smoothScale);

            // Frosted Pill Background
            drawRoundedRect(ctx, 0, 0, badgeWidth, badgeHeight, 6);
            ctx.fillStyle = 'rgba(18, 18, 28, 0.75)';
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * depthAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Text Label (Muted Silver -> Crisp Apple Typography)
            ctx.fillStyle = `rgba(220, 220, 230, ${0.85 * depthAlpha})`;
            ctx.font = font;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(text, 8, badgeHeight / 2);

            ctx.restore();
          } else if (isOutput) {
            // Output Action Badges (Right Side)
            const isSelected = isSelectedAction;
            const actionProb = currentStep ? (currentStep.actionProbs[n.neuronIdx] * 100).toFixed(1) : '33.3';
            const actionText = `${n.label} · ${actionProb}%`;

            const font = isSelected
              ? `700 11.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`
              : `500 10.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`;
            
            ctx.font = font;
            const textMetrics = ctx.measureText(actionText);
            const badgeWidth = textMetrics.width + 24;
            const badgeHeight = 24;
            const badgeX = proj.px + (radius + 8 * proj.scale);
            const badgeY = proj.py - (badgeHeight * smoothScale) / 2;

            ctx.save();
            ctx.translate(badgeX, badgeY);
            ctx.scale(smoothScale, smoothScale);

            // Frosted Action Pill Capsule
            drawRoundedRect(ctx, 0, 0, badgeWidth, badgeHeight, 8);
            if (isSelected) {
              ctx.fillStyle = n.neuronIdx === 0
                ? 'rgba(48, 209, 88, 0.16)'
                : n.neuronIdx === 1
                ? 'rgba(255, 214, 10, 0.16)'
                : 'rgba(255, 69, 58, 0.16)';
              ctx.fill();

              ctx.strokeStyle = n.neuronIdx === 0
                ? 'rgba(48, 209, 88, 0.55)'
                : n.neuronIdx === 1
                ? 'rgba(255, 214, 10, 0.55)'
                : 'rgba(255, 69, 58, 0.55)';
              ctx.lineWidth = 1.2;
              ctx.stroke();

              // Status Active Indicator Dot
              ctx.fillStyle = coreColor;
              ctx.beginPath();
              ctx.arc(10, badgeHeight / 2, 3, 0, Math.PI * 2);
              ctx.fill();

              // Text (Apple System Colors)
              ctx.fillStyle = coreColor;
              ctx.font = font;
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'left';
              ctx.fillText(actionText, 18, badgeHeight / 2);
            } else {
              ctx.fillStyle = 'rgba(18, 18, 28, 0.6)';
              ctx.fill();

              ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * depthAlpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();

              // Inactive Indicator Dot
              ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * depthAlpha})`;
              ctx.beginPath();
              ctx.arc(10, badgeHeight / 2, 2.5, 0, Math.PI * 2);
              ctx.fill();

              // Inactive Muted Text
              ctx.fillStyle = `rgba(142, 142, 147, ${0.75 * depthAlpha})`;
              ctx.font = font;
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'left';
              ctx.fillText(actionText, 18, badgeHeight / 2);
            }

            ctx.restore();
          }

          ctx.restore();
        }
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
      {/*  Top Floating HUD Badges */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-[#0c0c14]/85 backdrop-blur-md border border-white/[0.08] shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_6px_#30d158] animate-pulse" />
          <span className="text-[12px] font-bold text-white tracking-tight">BPNN Policy Network</span>
          <span className="text-[11px] text-[#86868b] font-medium font-mono">PPO Actor-Critic</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-[#0c0c14]/85 backdrop-blur-md border border-white/[0.08] shadow-xl flex items-center gap-1.5 text-[11px] font-mono text-[#86868b]">
          <span className="text-white font-medium">Architecture:</span>
          <span>6 In ➔ 12 Dense ➔ 8 Dense ➔ 3 Action</span>
        </div>
      </div>

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

      {/*  Bottom Orbital Helper Hint */}
      <div className="absolute bottom-3 right-4 z-10 pointer-events-none text-[10.5px] text-[#86868b] font-medium tracking-tight bg-[#0c0c14]/70 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/[0.06]">
        Drag to Orbit · Scroll to Zoom
      </div>
    </div>
  );
};

export default LiveNeuralLink;
