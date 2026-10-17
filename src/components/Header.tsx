import React from 'react';
import { Search, Cloud, Sun, Moon, ChevronRight, Github, Sparkles, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  driveStatus?: {
    isConnected: boolean;
    userEmail?: string;
    onOpenDrive: () => void;
  };
  onOpenGitHub?: () => void;
  selectedModel?: 'gemini-2.5-pro' | 'gemini-3.1-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-flash';
  onSelectModel?: (model: 'gemini-2.5-pro' | 'gemini-3.1-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-flash') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  category = 'Atelier',
  searchQuery,
  onSearchChange,
  primaryAction,
  driveStatus,
  onOpenGitHub,
  selectedModel,
  onSelectModel,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="min-h-16 sm:h-20 bg-white/95 dark:bg-[#0B0E17]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] px-6 sm:px-8 py-3 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 transition-colors">
      {/* Breadcrumb & Title */}
      <div className="shrink-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase">
          <span className="text-blue-600 dark:text-blue-400 font-bold">{category}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">{title}</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Controls & Command Bar */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Search bar */}
        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher règle R-xx, ID, FVG..."
            className="w-full bg-slate-50 hover:bg-white focus:bg-white dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-9 pr-14 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded shadow-xs">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded shadow-xs">K</kbd>
          </div>
        </div>

        {/* Gemini Model Selector */}
        {onSelectModel && (
          <div className="hidden lg:flex items-center rounded-xl bg-slate-100 dark:bg-white/[0.05] p-0.5 border border-slate-200 dark:border-white/[0.08] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => onSelectModel('gemini-2.5-pro')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                (selectedModel || 'gemini-2.5-pro') === 'gemini-2.5-pro'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="gemini-2.5-pro : Modèle recommandé pour extraction SCRIBE-ICT v3 10/10"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>2.5-pro</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModel('gemini-3.1-pro-preview')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="gemini-3.1-pro-preview : Raisonnement profond dernière génération"
            >
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span>3.1-pro</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModel('gemini-3-flash-preview')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedModel === 'gemini-3-flash-preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="gemini-3-flash-preview : Modèle Flash Gen-3 rapide"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>3-flash</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModel('gemini-2.5-flash')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedModel === 'gemini-2.5-flash'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="gemini-2.5-flash : Débit rapide haute capacité"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>2.5-flash</span>
            </button>
          </div>
        )}

        {/* Google Drive Status button */}
        {driveStatus && (
          <button
            type="button"
            onClick={driveStatus.onOpenDrive}
            className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer shrink-0 ${
              driveStatus.isConnected
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/[0.04] dark:text-slate-400 dark:border-white/[0.08]'
            }`}
            title={driveStatus.isConnected ? `Drive Connecté (${driveStatus.userEmail})` : 'Connecter Google Drive'}
          >
            <Cloud className={`w-4 h-4 ${driveStatus.isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">
              {driveStatus.isConnected ? 'Drive Sync' : 'Drive'}
            </span>
            {driveStatus.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        )}

        {/* GitHub Push button */}
        {onOpenGitHub && (
          <button
            type="button"
            onClick={onOpenGitHub}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-900 hover:bg-black text-white transition-all cursor-pointer shrink-0 shadow-xs"
            title="Synchroniser et pousser sur GitHub"
          >
            <Github className="w-4 h-4 text-white" />
            <span className="hidden md:inline">GitHub</span>
          </button>
        )}

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
          title={isDark ? 'Passer en Mode Clair (Blanc & Bleu Pur)' : 'Passer en Mode Sombre'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600" />
          )}
        </button>

        {/* Primary Action Button */}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 border border-blue-700/20 transition-all shrink-0 cursor-pointer"
          >
            {primaryAction.icon}
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </header>
  );
};
