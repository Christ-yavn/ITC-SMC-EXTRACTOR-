import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
  footerAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  widthClass = 'max-w-4xl',
  footerAction,
  secondaryAction,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentWidth = isExpanded ? 'max-w-[94vw]' : widthClass;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer Container */}
      <aside className={`relative w-full ${currentWidth} bg-white dark:bg-[#0A0D16] text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-white/10 animate-in slide-in-from-right duration-200 transition-all`}>
        {/* Header */}
        <div className="h-18 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 shrink-0 bg-slate-50/95 dark:bg-[#07090F]/90 backdrop-blur-md">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight line-clamp-1 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-mono mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Fullscreen / Split Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-2 rounded-xl bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? "Réduire la vue" : "Agrandir en Plein Écran / Split-View"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {(footerAction || secondaryAction) && (
          <div className="p-4 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/95 dark:bg-[#07090F]/90 flex items-center justify-between gap-3 shrink-0">
            <div>
              {secondaryAction && (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-mono text-xs border border-slate-200 dark:border-white/10 shadow-xs transition-all cursor-pointer font-semibold"
                >
                  {secondaryAction.icon}
                  <span>{secondaryAction.label}</span>
                </button>
              )}
            </div>

            <div>
              {footerAction && (
                <button
                  type="button"
                  onClick={footerAction.onClick}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {footerAction.icon}
                  <span>{footerAction.label}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
