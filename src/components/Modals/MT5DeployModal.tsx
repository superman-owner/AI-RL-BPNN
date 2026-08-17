import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { generatePythonOnnxScript, generateMql5SourceCode } from '../../services/onnxExporter';

interface MT5DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MT5DeployModal: React.FC<MT5DeployModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'python' | 'mql5'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonCode = generatePythonOnnxScript();
  const mql5Code = generateMql5SourceCode();
  const currentCode = activeTab === 'python' ? pythonCode : mql5Code;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'python' ? 'fxforge_onnx_exporter.py' : 'FXForge_RL_EA.mq5';
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        cursor: 'var(--mac-cursor-default)',
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none transition-colors ${
        isLight ? 'bg-black/30 backdrop-blur-md' : 'bg-black/80 backdrop-blur-xl'
      }`}
    >
      {/*  macOS Style Glass Modal Window */}
      <div
        style={{
          boxShadow: isLight
            ? '0 24px 70px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.1)'
            : '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        }}
        className={`w-[800px] max-w-[94vw] h-[640px] max-h-[88vh] rounded-2xl flex flex-col overflow-hidden transition-colors ${
          isLight
            ? 'bg-[#ffffff]/98 backdrop-blur-3xl text-[#1d1d1f]'
            : 'bg-[#12121a]/98 backdrop-blur-3xl text-white'
        }`}
      >
        {/* 1. Header (Locked flex-shrink-0) with generous 16px 20px padding */}
        <div
          style={{ padding: '16px 20px' }}
          className={`flex items-center justify-between border-b flex-shrink-0 ${
            isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isLight
                  ? 'bg-[#34c759]/15 text-[#28cd41]'
                  : 'bg-[#30d158]/15 text-[#30d158]'
              }`}
            >
              <LucideIcons.Rocket size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-[14.5px] font-bold tracking-tight ${
                    isLight ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  MT5 Zero-Latency ONNX Deploy Package
                </h3>
                <div className="flex items-center gap-1.5 ml-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLight ? 'bg-[#34c759]' : 'bg-[#30d158]'
                    } animate-pulse`}
                  />
                  <span
                    className={`text-[11.5px] font-semibold ${
                      isLight ? 'text-[#28cd41]' : 'text-[#30d158]'
                    }`}
                  >
                    Ready
                  </span>
                </div>
              </div>
              <p
                className={`text-[12px] mt-0.5 ${
                  isLight ? 'text-[#6b7280]' : 'text-[#86868b]'
                }`}
              >
                Opset 14 Static Tensor Shape <code className="font-sans font-semibold text-[11.5px]">[1, 6] float32</code> ➔ <code className="font-sans font-semibold text-[11.5px]">[1, 3] float32</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ cursor: 'var(--mac-cursor-pointer)' }}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-[#6b7280] hover:text-[#111827] hover:bg-black/[0.06]'
                : 'text-[#86868b] hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <LucideIcons.X size={17} />
          </button>
        </div>

        {/* 2. Tab Navigation & Actions Bar with generous 12px 20px padding */}
        <div
          style={{ padding: '10px 20px' }}
          className={`flex items-center justify-between border-b flex-shrink-0 ${
            isLight ? 'bg-[#f5f5f7] border-black/[0.06]' : 'bg-[#0b0b12] border-white/[0.06]'
          }`}
        >
          {/* Segmented Tab Control (Clean Apple Hover & Active State, Zero Heavy Capsule) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('python')}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'python'
                  ? isLight
                    ? 'text-[#0071e3] font-bold bg-[#0071e3]/10'
                    : 'text-[#0a84ff] font-bold bg-[#0a84ff]/15'
                  : isLight
                  ? 'text-[#4b5563] font-medium hover:text-[#111827] hover:bg-black/[0.05]'
                  : 'text-[#9ca3af] font-medium hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <LucideIcons.FileCode size={13} />
              <span>1. PyTorch Exporter (.py)</span>
            </button>

            <button
              onClick={() => setActiveTab('mql5')}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'mql5'
                  ? isLight
                    ? 'text-[#0071e3] font-bold bg-[#0071e3]/10'
                    : 'text-[#0a84ff] font-bold bg-[#0a84ff]/15'
                  : isLight
                  ? 'text-[#4b5563] font-medium hover:text-[#111827] hover:bg-black/[0.05]'
                  : 'text-[#9ca3af] font-medium hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <LucideIcons.Cpu size={13} />
              <span>2. MetaTrader 5 EA (.mq5)</span>
            </button>
          </div>

          {/* Quick Action Buttons (Apple Hover Style, Zero Solid Capsule) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                copied
                  ? isLight
                    ? 'text-[#28cd41] bg-[#34c759]/15'
                    : 'text-[#30d158] bg-[#30d158]/15'
                  : isLight
                  ? 'text-[#4b5563] hover:text-[#111827] hover:bg-black/[0.05]'
                  : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {copied ? <LucideIcons.Check size={13} /> : <LucideIcons.Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isLight
                  ? 'text-[#0071e3] hover:text-[#0077ed] hover:bg-[#0071e3]/10'
                  : 'text-[#0a84ff] hover:text-[#409cff] hover:bg-[#0a84ff]/15'
              }`}
            >
              <LucideIcons.Download size={13} />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* 3. Code Viewport with Generous 16px 20px padding (Never touches edges) */}
        <div style={{ padding: '16px 20px' }} className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <pre
            style={{ padding: '18px 22px', margin: 0 }}
            className={`w-full h-full rounded-xl text-[12px] font-mono overflow-auto custom-scrollbar leading-relaxed border select-text transition-colors ${
              isLight
                ? 'bg-[#f5f5f7] border-black/[0.08] text-[#1f2937]'
                : 'bg-[#08080c] border-white/[0.08] text-[#e5e7eb]'
            }`}
          >
            {currentCode}
          </pre>
        </div>

        {/* 4. Footer (Locked flex-shrink-0) with generous 14px 20px padding */}
        <div
          style={{ padding: '14px 20px' }}
          className={`border-t flex items-center justify-between flex-shrink-0 ${
            isLight
              ? 'bg-[#fafafa] border-black/[0.08]'
              : 'bg-[#101017] border-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isLight ? 'bg-[#34c759]' : 'bg-[#30d158]'
              }`}
            />
            <span
              className={`text-[12px] font-medium ${
                isLight ? 'text-[#6b7280]' : 'text-[#86868b]'
              }`}
            >
              Hardware-Accelerated ONNX Runtime for MT5
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isLight
                  ? 'text-[#4b5563] hover:text-[#111827] hover:bg-black/[0.06]'
                  : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.10]'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
