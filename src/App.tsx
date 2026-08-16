import { useState, useCallback, useEffect } from 'react';
import { AnalyticsDrawer } from './components/BottomPanel/AnalyticsDrawer';
import { TopNav } from './components/Header/TopNav';
import { TrainingConfigSidebar } from './components/Sidebar/TrainingConfigSidebar';
import { MT5DeployModal } from './components/Modals/MT5DeployModal';
import { LiveNeuralLink } from './components/NeuralLink/LiveNeuralLink';
import { FlowCanvasView } from './components/Flow/FlowCanvasView';
import { INITIAL_LOGS } from './data/mockAnalytics';
import { fxforgeEngine, DEFAULT_TRAINING_CONFIG } from './services/fxforgeEngine';
import type { QuantTelemetry, RLEnvironmentStep, RLTrainingConfig } from './services/fxforgeEngine';

export function App() {
  // Dual View Mode: 'studio' (Flow DAG) vs 'bpnn' (Live 3D BPNN)
  const [activeView, setActiveView] = useState<'studio' | 'bpnn'>('studio');

  // Sidebar Open/Close State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // RL Training Configuration State
  const [trainingConfig, setTrainingConfig] = useState<RLTrainingConfig>(() => fxforgeEngine.getConfig());

  // Logs State
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);

  // RL Live Telemetry & Control State (START, PAUSE, STOP)
  const [rlStatus, setRlStatus] = useState<'running' | 'paused' | 'stopped'>('running');
  const [rlTelemetry, setRlTelemetry] = useState<QuantTelemetry>(() => fxforgeEngine.getTelemetry());
  const [rlLatestStep, setRlLatestStep] = useState<RLEnvironmentStep | null>(null);
  const [isMT5DeployOpen, setIsMT5DeployOpen] = useState(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);

  // Real-time Deep RL Simulation Loop
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

  const handleStartRL = useCallback(() => {
    setRlStatus('running');
    setLogs((prev) => [...prev, `[RL ENGINE] Deep RL Training started on ${trainingConfig.symbol} (${trainingConfig.primaryTimeframe}).`]);
  }, [trainingConfig]);

  const handlePauseRL = useCallback(() => {
    setRlStatus('paused');
    setLogs((prev) => [...prev, `[RL ENGINE] Simulation paused.`]);
  }, []);

  const handleStopRL = useCallback(() => {
    setRlStatus('stopped');
    fxforgeEngine.reset();
    setRlTelemetry(fxforgeEngine.getTelemetry());
    setRlLatestStep(null);
    setLogs((prev) => [...prev, `[RL ENGINE] Simulation reset to initial state.`]);
  }, []);

  // Update Config handler
  const handleUpdateConfig = useCallback((updated: Partial<RLTrainingConfig>) => {
    setTrainingConfig((prev) => {
      const next = { ...prev, ...updated };
      fxforgeEngine.updateConfig(next);
      return next;
    });

    if (updated.spreadPips !== undefined) {
      setLogs((prev) => [...prev, `[CONFIG] Spread updated to ${updated.spreadPips} pips.`]);
    }
    if (updated.maxDrawdownLimit !== undefined) {
      setLogs((prev) => [...prev, `[CONFIG] Max Drawdown limit set to ${updated.maxDrawdownLimit}%.`]);
    }
    if (updated.inactivityPenalty !== undefined) {
      setLogs((prev) => [...prev, `[CONFIG] Inactivity penalty adjusted to -${updated.inactivityPenalty} R.`]);
    }
    if (updated.symbol !== undefined || updated.primaryTimeframe !== undefined) {
      setLogs((prev) => [...prev, `[CONFIG] Asset changed to ${updated.symbol || trainingConfig.symbol} (${updated.primaryTimeframe || trainingConfig.primaryTimeframe}).`]);
    }
  }, [trainingConfig]);

  // Reset to Defaults handler
  const handleResetDefaults = useCallback(() => {
    setTrainingConfig(DEFAULT_TRAINING_CONFIG);
    fxforgeEngine.updateConfig(DEFAULT_TRAINING_CONFIG);
    setLogs((prev) => [...prev, `[CONFIG] Reset all RL hyperparameters to institutional defaults.`]);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#040407] text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/*  Top Navigation Bar */}
      <TopNav
        activeView={activeView}
        onViewChange={setActiveView}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        rlStatus={rlStatus}
        onStartRL={handleStartRL}
        onPauseRL={handlePauseRL}
        onStopRL={handleStopRL}
        rlTelemetry={rlTelemetry}
        rlLatestStep={rlLatestStep}
        onOpenMT5Deploy={() => setIsMT5DeployOpen(true)}
        onResetCamera={() => setCameraResetTrigger((prev) => prev + 1)}
      />

      {/*  Main Quantum Visualizer & Parameters Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Collapsible RL Hyperparameters Input Sidebar */}
        <TrainingConfigSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          config={trainingConfig}
          onUpdateConfig={handleUpdateConfig}
          onResetDefaults={handleResetDefaults}
          isRunning={rlStatus === 'running'}
        />

        {/* Center: Full-Stage Flow DAG or 3D BPNN Visualizer */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#040407]">
          {activeView === 'studio' ? (
            <FlowCanvasView />
          ) : (
            <LiveNeuralLink
              isTraining={rlStatus === 'running'}
              latestStep={rlLatestStep}
              cameraResetTrigger={cameraResetTrigger}
            />
          )}
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

export default App;
