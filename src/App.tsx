import { useState, useCallback, useEffect } from 'react';
import { AnalyticsDrawer } from './components/BottomPanel/AnalyticsDrawer';
import { TopNav } from './components/Header/TopNav';
import { MT5DeployModal } from './components/Modals/MT5DeployModal';
import { LiveNeuralLink } from './components/NeuralLink/LiveNeuralLink';
import { FlowCanvasView } from './components/Flow/FlowCanvasView';
import { NodePalette } from './components/Sidebar/NodePalette';
import { INITIAL_LOGS } from './data/mockAnalytics';
import { fxforgeEngine } from './services/fxforgeEngine';
import type { QuantTelemetry, RLEnvironmentStep } from './services/fxforgeEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { FlowProvider, useFlow } from './context/FlowContext';

function AppContent() {
  const { theme } = useTheme();
  const { architectureSpec } = useFlow();

  // Dual View Mode: 'studio' (Flow DAG) vs 'bpnn' (Live 3D BPNN)
  const [activeView, setActiveView] = useState<'studio' | 'bpnn'>('studio');

  // Sidebar Collapsed State (Active on both views, collapsible to the left)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Logs State
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);

  // RL Live Telemetry & Control State (START, PAUSE, STOP) - Default strictly 'stopped' (Standby)
  const [rlStatus, setRlStatus] = useState<'running' | 'paused' | 'stopped'>('stopped');
  const [rlTelemetry, setRlTelemetry] = useState<QuantTelemetry>(() => {
    fxforgeEngine.reset();
    return fxforgeEngine.getTelemetry();
  });
  const [rlLatestStep, setRlLatestStep] = useState<RLEnvironmentStep | null>(null);
  const [isMT5DeployOpen, setIsMT5DeployOpen] = useState(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);

  // Real-time In-App Deep RL Engine Loop
  useEffect(() => {
    if (rlStatus !== 'running') return;

    const interval = setInterval(() => {
      const stepResult = fxforgeEngine.step();
      const telem = fxforgeEngine.getTelemetry();
      setRlTelemetry(telem);
      setRlLatestStep(stepResult);
    }, 450);

    return () => clearInterval(interval);
  }, [rlStatus]);

  // Real-time PyTorch Backend Process Listeners (via Electron IPC & Web Server SSE)
  useEffect(() => {
    const processStdout = (text: string) => {
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      setLogs((prev) => [...prev.slice(-150), ...lines]);

      lines.forEach((line: string) => {
        if (line.includes('"type": "progress"')) {
          try {
            const jsonStr = line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonStr);
            setRlTelemetry((prev) => ({
              ...prev,
              episodes: data.episode,
              reward: data.reward,
              winRate: data.win_rate,
              sharpe: data.sharpe,
              totalTrades: data.trades,
              netPnL: data.cum_return,
            }));
          } catch (e) {}
        }
      });
    };

    const processStderr = (text: string) => {
      setLogs((prev) => [...prev.slice(-150), `[PYTORCH] ${text.trim()}`]);
    };

    const processFinished = (code: number) => {
      setLogs((prev) => [
        ...prev,
        `[PYTORCH] ✅ Real Training completed (Code: ${code}). Single-file ONNX model exported to MT5.`,
      ]);
    };

    // 1. Electron IPC Listener
    const electron = (window as any).electronAPI;
    let unsubOut: any, unsubErr: any, unsubDone: any;
    if (electron && typeof electron.on === 'function') {
      unsubOut = electron.on('training-stdout', processStdout);
      unsubErr = electron.on('training-stderr', processStderr);
      unsubDone = electron.on('training-finished', ({ code }: { code: number }) => processFinished(code));
    }

    // 2. Web Browser SSE Stream Listener
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/train/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'stdout') processStdout(data.text);
          else if (data.type === 'stderr') processStderr(data.text);
          else if (data.type === 'finished') processFinished(data.code);
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (typeof unsubOut === 'function') unsubOut();
      if (typeof unsubErr === 'function') unsubErr();
      if (typeof unsubDone === 'function') unsubDone();
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto-switch to Studio Flow DAG view when dropping a node from Sidebar
  useEffect(() => {
    const handleDropOnCanvas = () => {
      if (activeView !== 'studio') {
        setActiveView('studio');
      }
    };
    window.addEventListener('fxforge-drop-node', handleDropOnCanvas);
    return () => window.removeEventListener('fxforge-drop-node', handleDropOnCanvas);
  }, [activeView]);

  const handleStartRL = useCallback(() => {
    setRlStatus('running');
    setLogs((prev) => [
      ...prev,
      `[NODE PIPELINE] Applying Node Config: ${architectureSpec.strategyPreset} (${architectureSpec.symbol} ${architectureSpec.timeframe})`,
      `[NODE PIPELINE] Layers: 6 -> ${architectureSpec.hidden1Units} (${architectureSpec.hidden1Activation}) -> Dropout(${architectureSpec.dropoutRate}) -> ${architectureSpec.hidden2Units} -> 3 Actions`,
      `[RL ENGINE] Launching Real PyTorch Training Engine (${architectureSpec.totalEpisodes || 400} Episodes)...`,
    ]);

    const payload = {
      symbol: architectureSpec.symbol,
      timeframe: architectureSpec.timeframe,
      bars_count: architectureSpec.barsCount,
      strategy_preset: architectureSpec.strategyPreset,
      hidden1_units: architectureSpec.hidden1Units,
      hidden1_activation: architectureSpec.hidden1Activation,
      has_dropout: architectureSpec.hasDropout,
      dropout_rate: architectureSpec.dropoutRate,
      has_layer_norm: architectureSpec.hasLayerNorm,
      has_l2_decay: architectureSpec.hasL2Decay,
      l2_decay_rate: architectureSpec.l2DecayRate,
      hidden2_units: architectureSpec.hidden2Units,
      hidden2_activation: architectureSpec.hidden2Activation,
      has_residual: architectureSpec.hasResidual,
      spread_pips: architectureSpec.spreadPips,
      inactivity_penalty: architectureSpec.inactivityPenalty,
      entropy_beta: architectureSpec.entropyBeta,
      total_episodes: architectureSpec.totalEpisodes || 400,
    };

    const electron = (window as any).electronAPI;
    if (electron && typeof electron.startRealTraining === 'function') {
      electron.startRealTraining(payload);
    } else {
      // Trigger via Local Server API
      fetch('/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  }, [architectureSpec]);

  const handlePauseRL = useCallback(() => {
    setRlStatus('paused');
    setLogs((prev) => [...prev, `[RL ENGINE] Simulation paused.`]);
  }, []);

  const handleStopRL = useCallback(() => {
    setRlStatus('stopped');
    fxforgeEngine.reset();
    setRlTelemetry(fxforgeEngine.getTelemetry());
    setRlLatestStep(null);
    setLogs((prev) => [...prev, `[RL ENGINE] Training stopped and reset to baseline.`]);

    const electron = (window as any).electronAPI;
    if (electron && typeof electron.stopRealTraining === 'function') {
      electron.stopRealTraining();
    } else {
      fetch('/api/train/stop', { method: 'POST' }).catch(() => {});
    }
  }, []);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans select-none antialiased transition-colors duration-200 ${
        theme === 'light' ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'bg-[#040407] text-slate-100'
      }`}
    >
      {/*  Top Navigation Bar */}
      <TopNav
        activeView={activeView}
        onViewChange={setActiveView}
        rlStatus={rlStatus}
        onStartRL={handleStartRL}
        onPauseRL={handlePauseRL}
        onStopRL={handleStopRL}
        rlTelemetry={rlTelemetry}
        rlLatestStep={rlLatestStep}
        onOpenMT5Deploy={() => setIsMT5DeployOpen(true)}
        onResetCamera={() => setCameraResetTrigger((prev) => prev + 1)}
      />

      {/*  Main Quantum Visualizer & Flow DAG Stage with Shared Left Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Shared Sidebar (Slim Rail when Collapsed, Full Tree when Expanded) */}
        <NodePalette
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main
          className={`flex-1 h-full relative overflow-hidden transition-colors duration-200 ${
            theme === 'light' ? 'bg-[#f5f5f7]' : 'bg-[#040407]'
          }`}
        >
          <div className={`w-full h-full ${activeView === 'studio' ? 'block' : 'hidden'}`}>
            <FlowCanvasView />
          </div>
          <div className={`w-full h-full ${activeView === 'bpnn' ? 'block' : 'hidden'}`}>
            <LiveNeuralLink
              isTraining={rlStatus === 'running'}
              latestStep={rlLatestStep}
              cameraResetTrigger={cameraResetTrigger}
            />
          </div>
        </main>
      </div>

      {/*  Bottom Persistent Analytics Drawer */}
      <AnalyticsDrawer
        logs={logs}
        isRunning={rlStatus === 'running'}
        rlTelemetry={rlTelemetry}
        latestStep={rlLatestStep}
      />

      {/*  MT5 One-Click Deploy Modal */}
      <MT5DeployModal
        isOpen={isMT5DeployOpen}
        onClose={() => setIsMT5DeployOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <FlowProvider>
        <AppContent />
      </FlowProvider>
    </ThemeProvider>
  );
}

export default App;

