import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleDismiss = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div 
        className="fixed inset-0" 
        onClick={handleDismiss} 
      />

      <div className="relative w-full max-w-md bg-white dark:bg-[#0B0E17] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-10 overflow-hidden text-slate-800 dark:text-slate-200">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive 
                ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' 
                : 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
            }`}>
              {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 font-sans">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
              {description}
            </p>
          </div>

          {isDestructive && (
            <div className="p-3 bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/20 rounded-xl text-xs text-red-700 dark:text-rose-300 font-mono flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400" />
              <span>Cette opération supprimera le fichier distant de façon permanente.</span>
            </div>
          )}
        </div>

        <div className="p-4 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/95 dark:bg-black/40 flex items-center justify-end gap-2.5 font-mono text-xs">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-white font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
            } disabled:opacity-50`}
          >
            {isLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
