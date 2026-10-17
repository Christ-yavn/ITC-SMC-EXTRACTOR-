import React from 'react';
import { 
  Home, 
  Video, 
  FileText, 
  Compass, 
  Settings,
  Cloud,
  LucideIcon,
  Activity,
  Layers,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type PageId = 'accueil' | 'videos' | 'fiches' | 'concepts' | 'drive' | 'reglages';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  counts: {
    videosTotal: number;
    fichesCount: number;
    aTraiterCount: number;
  };
  isDriveConnected?: boolean;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  badge?: number;
  isStatusDot?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, counts, isDriveConnected }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const navItems: NavItem[] = [
    { id: 'accueil', label: 'Dashboard', icon: Home },
    { id: 'videos', label: 'Registre 106', icon: Video, badge: counts.videosTotal },
    { id: 'fiches', label: 'Fiches Spéc.', icon: FileText, badge: counts.fichesCount },
    { id: 'concepts', label: 'Taxonomie', icon: Compass },
    { id: 'drive', label: 'Coffre Drive', icon: Cloud, isStatusDot: isDriveConnected },
    { id: 'reglages', label: 'Moteur & LLM', icon: Settings },
  ];

  const progressPercentage = counts.videosTotal > 0
    ? Math.round((counts.fichesCount / counts.videosTotal) * 100)
    : 0;

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#0B0E17]/95 border-r border-slate-200 dark:border-white/[0.08] shrink-0 select-none z-30 transition-colors">
        {/* Brand Header with Candlestick Logo (Blue & Red Touch) */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-white/[0.08] gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-700 to-red-600 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
            {/* Candlestick vector icon */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3v4" />
              <rect x="7" y="7" width="4" height="9" rx="1" fill="currentColor" fillOpacity="0.4" />
              <path d="M9 16v5" />
              <path d="M15 6v2" />
              <rect x="13" y="8" width="4" height="6" rx="1" fill="#ef4444" fillOpacity="0.7" />
              <path d="M15 14v4" />
            </svg>
            <div className="absolute -inset-0.5 rounded-xl bg-blue-500/20 blur-xs pointer-events-none" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight tracking-tight">
                HugoFX Forge
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                ICT / SMC STUDIO
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
                )}
                
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.isStatusDot && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Sync</span>
                  </span>
                )}

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-mono tabular-nums font-bold rounded-lg border ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-500/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-400/40' 
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mini Progress Gauge above footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-white/[0.08]">
          <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-400">Couverture Corpus</span>
              <span className="font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                {counts.fichesCount} / {counts.videosTotal} ({progressPercentage}%)
              </span>
            </div>
            
            {/* Progress Bar (Blue to Red gradient) */}
            <div className="w-full bg-slate-200 dark:bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-white/5">
              <div 
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progressPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Reste: <strong className="text-red-600 dark:text-red-400 font-bold">{counts.aTraiterCount}</strong> leçons</span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                SCRIBE-ICT v3
              </span>
            </div>
          </div>
        </div>

        {/* Operator Mode & Theme Switcher Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] space-y-2">
          <div className="bg-slate-50 dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Mode Opérateur</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                FORGE PRO
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Station de Spécification Formelle
            </p>
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Google AI Studio Pro</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer"
                title="Changer de thème"
              >
                {isDark ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-blue-600" />}
                <span>{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar (Fixed) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#0B0E17]/95 border-t border-slate-200 dark:border-white/[0.08] z-50 flex items-center justify-around px-2 backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium cursor-pointer ${
                isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
