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
        className={`w-[780px] max-w-[94vw] h-[640px] max-h-[88vh] rounded-2xl flex flex-col overflow-hidden transition-colors ${
          isLight
            ? 'bg-[#ffffff]/98 backdrop-blur-3xl text-[#1d1d1f]'
            : 'bg-[#12121a]/98 backdrop-blur-3xl text-white'
        }`}
      >
        {/* 1. Header (Locked flex-shrink-0) */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b flex-shrink-0 ${
            isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isLight
                  ? 'bg-[#34c759]/15 border border-[#34c759]/30 text-[#28cd41]'
                  : 'bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158]'
              }`}
            >
              <LucideIcons.Rocket size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-[14px] font-semibold tracking-tight ${
                    isLight ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  MT5 Zero-Latency ONNX Deploy Package
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                    isLight
                      ? 'bg-[#34c759]/15 text-[#28cd41] border border-[#34c759]/25'
                      : 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30'
                  }`}
                >
                  Ready
                </span>
              </div>
              <p
                className={`text-[11.5px] mt-0.5 ${
                  isLight ? 'text-[#6b7280]' : 'text-[#86868b]'
                }`}
              >
                Opset 14 Static Tensor Shape <code className="font-mono">[1, 6] float32</code> ➔ <code className="font-mono">[1, 3] float32</code>
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

        {/* 2. Tab Navigation & Actions Bar (Locked flex-shrink-0) */}
        <div
          className={`px-5 py-2.5 flex items-center justify-between border-b flex-shrink-0 ${
            isLight ? 'bg-[#f5f5f7] border-black/[0.06]' : 'bg-[#0b0b12] border-white/[0.06]'
          }`}
        >
          {/* Segmented Tab Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('python')}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'python'
                  ? isLight
                    ? 'bg-[#0071e3] text-white shadow-sm'
                    : 'bg-[#0071e3] text-white shadow-sm'
                  : isLight
                  ? 'text-[#4b5563] hover:text-[#111827] hover:bg-black/[0.05]'
                  : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <LucideIcons.FileCode size={13} />
              1. PyTorch Exporter (.py)
            </button>

            <button
              onClick={() => setActiveTab('mql5')}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'mql5'
                  ? isLight
                    ? 'bg-[#0071e3] text-white shadow-sm'
                    : 'bg-[#0071e3] text-white shadow-sm'
                  : isLight
                  ? 'text-[#4b5563] hover:text-[#111827] hover:bg-black/[0.05]'
                  : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <LucideIcons.Cpu size={13} />
              2. MetaTrader 5 EA (.mq5)
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                copied
                  ? isLight
                    ? 'bg-[#34c759]/15 text-[#28cd41] border border-[#34c759]/30'
                    : 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30'
                  : isLight
                  ? 'bg-white text-[#111827] border border-black/[0.12] hover:bg-black/[0.04]'
                  : 'bg-white/[0.08] text-white border border-white/[0.10] hover:bg-white/[0.14]'
              }`}
            >
              {copied ? <LucideIcons.Check size={13} /> : <LucideIcons.Copy size={13} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>

            <button
              onClick={handleDownload}
              style={{ cursor: 'var(--mac-cursor-pointer)' }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                isLight
                  ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]'
                  : 'bg-[#0071e3] text-white hover:bg-[#0077ed]'
              }`}
            >
              <LucideIcons.Download size={13} />
              Download
            </button>
          </div>
        </div>

        {/* 3. Code Viewport (Strictly flex-1 min-h-0 with custom scrolling - No overflow / "ตกขอบ") */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
          <pre
            className={`w-full h-full p-4 rounded-xl text-[11.5px] font-mono overflow-auto custom-scrollbar leading-relaxed border select-text transition-colors ${
              isLight
                ? 'bg-[#f5f5f7] border-black/[0.08] text-[#1f2937]'
                : 'bg-[#08080c] border-white/[0.08] text-[#e5e7eb]'
            }`}
          >
            {currentCode}
          </pre>
        </div>

        {/* 4. Footer (Locked flex-shrink-0 - Always Visible) */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between flex-shrink-0 ${
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
              className={`text-[11.5px] font-medium ${
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
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isLight
                  ? 'bg-black/[0.07] hover:bg-black/[0.12] text-[#111827]'
                  : 'bg-white/[0.10] hover:bg-white/[0.16] text-white'
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
