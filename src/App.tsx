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

function AppContent() {
  const { theme } = useTheme();

  // Dual View Mode: 'studio' (Flow DAG) vs 'bpnn' (Live 3D BPNN)
  const [activeView, setActiveView] = useState<'studio' | 'bpnn'>('studio');

  // Sidebar Collapsed State (Active on both views, collapsible to the left)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    setLogs((prev) => [...prev, `[RL ENGINE] Deep RL Training session started.`]);
  }, []);

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

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

