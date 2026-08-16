import React from 'react';
import * as LucideIcons from 'lucide-react';
import { generatePythonOnnxScript, generateMql5SourceCode } from '../../services/onnxExporter';

interface MT5DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MT5DeployModal: React.FC<MT5DeployModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200 select-none">
      <div className="bg-[#12121a]/98 backdrop-blur-3xl border border-white/[0.14] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-white w-[740px] max-w-[92vw] p-6 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4 flex-shrink-0">
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
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <LucideIcons.X size={16} />
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar text-xs select-text">
          <div>
            <div className="flex items-center justify-between mb-1.5 text-slate-300 font-semibold">
              <span>1. PyTorch ONNX Exporter (Python)</span>
            </div>
            <pre className="p-3.5 bg-[#09090e] border border-white/[0.06] rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
              {generatePythonOnnxScript()}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-slate-300 font-semibold">
              <span>2. Native MetaTrader 5 Expert Advisor (MQL5)</span>
            </div>
            <pre className="p-3.5 bg-[#09090e] border border-white/[0.06] rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
              {generateMql5SourceCode()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
