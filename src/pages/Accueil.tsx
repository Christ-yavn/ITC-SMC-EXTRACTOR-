import React, { useMemo, useState } from 'react';
import { 
  ArrowRight, 
  Video, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  TrendingUp,
  FolderSync,
  Layers,
  ShieldCheck,
  FileCheck,
  Terminal,
  Grid,
  AlertTriangle,
  Trash2,
  Cloud
} from 'lucide-react';
import type { ConsolidatedVideoItem } from '../utils/pipeline';
import { formatSeconds } from '../utils/pipeline';
import type { TraceabilityRegistry } from '../services/traceabilityRegistry';

interface AccueilProps {
  videos: ConsolidatedVideoItem[];
  registry: TraceabilityRegistry;
  savedFiches?: Record<string, string>;
  dailyQuotaLimit?: number;
  dailyQuotaUsed?: number;
  onNavigateToVideos: (statusFilter?: string) => void;
  onNavigateToFiches: () => void;
  onNavigateToDrive?: () => void;
  onSelectVideoToProcess: (video: ConsolidatedVideoItem) => void;
  onStartAutomatedQueue: (playlistCode?: string) => void;
}

export const Accueil: React.FC<AccueilProps> = ({
  videos,
  registry,
  savedFiches = {},
  onNavigateToVideos,
  onNavigateToFiches,
  onNavigateToDrive,
  onSelectVideoToProcess,
  onStartAutomatedQueue,
}) => {
  const [hoveredVideo, setHoveredVideo] = useState<ConsolidatedVideoItem | null>(null);

  const totalVideos = videos.length;

  // Real fiches count (Validé or Extrait or in savedFiches)
  const fichesReadyCount = useMemo(() => {
    const idSet = new Set<string>(Object.keys(savedFiches));
    Object.entries(registry.videoRecords).forEach(([vid, r]) => {
      if ((r.status === 'Extrait' || r.status === 'Validé') && !r.isFakeClone197) {
        idSet.add(vid);
      }
    });
    return idSet.size;
  }, [registry, savedFiches]);

  // Fake clones count (197 lines)
  const fakeClonesCount = useMemo(() => {
    return Object.values(registry.videoRecords).filter(
      r => r.status === 'Brouillon_Errone_197' || r.isFakeClone197
    ).length;
  }, [registry]);

  const aTraiterCount = Math.max(0, totalVideos - fichesReadyCount);

  const totalDurationSeconds = useMemo(() => {
    return videos.reduce((acc, v) => acc + (v.duree_s || 1200), 0);
  }, [videos]);

  const progressPercent = totalVideos > 0 
    ? Math.round((fichesReadyCount / totalVideos) * 100) 
    : 0;

  // Group videos by playlist for the 106-Lesson Heatmap
  const playlistGroups = useMemo(() => {
    const groups: Record<string, ConsolidatedVideoItem[]> = {
      P1: [],
      P2: [],
      P3: [],
      P4: [],
    };
    videos.forEach((v) => {
      const p = v.playlists[0] || 'P1';
      if (!groups[p]) groups[p] = [];
      groups[p].push(v);
    });
    return groups;
  }, [videos]);

  // Next video to process
  const nextVideo = useMemo(() => {
    return videos.find(v => {
      if (savedFiches[v.video_id]) return false;
      const rec = registry.videoRecords[v.video_id];
      return !rec || rec.isFakeClone197 || (rec.status !== 'Extrait' && rec.status !== 'Validé');
    }) || videos[0];
  }, [videos, registry, savedFiches]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. HERO COCKPIT BANNER (Blanc, Bleu Royal & Accents Rouges) */}
      <div className="quant-card p-6 sm:p-8 relative overflow-hidden bg-white dark:bg-[#0F1420] border-l-4 border-l-blue-600">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>STATION D'INGÉNIERIE COGNITIVE ICT / SMC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              HugoFX Knowledge Forge Pro
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Extraction multimodale réelle des 106 vidéos YouTube via l'API Gemini : Spécifications algorithmiques 10/10, double machine à états et sauvegarde directe sur Google Drive sans stockage local.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Primary Action Button: Launch Batch / Automated Engine */}
            <button
              type="button"
              onClick={() => onStartAutomatedQueue('TOUTES')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-500/25 border border-blue-700/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Mode Automatique (106 Leçons)</span>
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono font-bold">
                AUTO
              </span>
            </button>

            {nextVideo && (
              <button
                type="button"
                onClick={() => onSelectVideoToProcess(nextVideo)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-300 dark:border-white/10 transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                <span>Traiter Leçon Suivante</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. PURGE WARNING BANNER FOR 105 FAKE CLONES */}
      {fakeClonesCount > 0 && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-rose-950/20 border border-red-200 dark:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-red-950 dark:text-rose-200">
                  {fakeClonesCount} fichiers clones de 197 lignes (0.5/10) détectés
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
                  ATTENTION
                </span>
              </div>
              <p className="text-xs text-red-800 dark:text-rose-300 max-w-2xl leading-relaxed">
                Ces fichiers proviennent de l'ancien template statique de simulation. Utilisez l'outil de purge du Coffre Drive pour les supprimer et les remplacer par de vraies analyses Gemini.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {onNavigateToDrive && (
              <button
                type="button"
                onClick={onNavigateToDrive}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Aller au Coffre Drive pour Purger</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. THE 106-LESSON HEATMAP MATRIX */}
      <div className="quant-card p-6 space-y-4 bg-white dark:bg-[#0F1420]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Grid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Matrice de Traçabilité des 106 Leçons</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Statuts en direct depuis le Registre Léger : Vert (Authentique 10/10), Rouge (Clone à purger), Ardoise (À extraire).
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Validée ({fichesReadyCount})</span>
            </span>
            {fakeClonesCount > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Clone à purger ({fakeClonesCount})</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>À traiter ({aTraiterCount})</span>
            </span>
          </div>
        </div>

        {/* Playlists visual clusters */}
        <div className="space-y-4">
          {Object.entries(playlistGroups).map(([playlistKey, pVideos]) => {
            const playlistReady = pVideos.filter(v => {
              const r = registry.videoRecords[v.video_id];
              return r && (r.status === 'Extrait' || r.status === 'Validé') && !r.isFakeClone197;
            }).length;

            return (
              <div key={playlistKey} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    Playlist {playlistKey} ({pVideos.length} leçons)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {playlistReady} / {pVideos.length} fiches rédigées
                  </span>
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5">
                  {pVideos.map((video, idx) => {
                    const trace = registry.videoRecords[video.video_id];
                    const isReady = trace && (trace.status === 'Extrait' || trace.status === 'Validé') && !trace.isFakeClone197;
                    const isFake = trace && (trace.status === 'Brouillon_Errone_197' || trace.isFakeClone197);

                    return (
                      <button
                        key={video.video_id}
                        type="button"
                        onClick={() => onSelectVideoToProcess(video)}
                        onMouseEnter={() => setHoveredVideo(video)}
                        onMouseLeave={() => setHoveredVideo(null)}
                        className={`h-8 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer border ${
                          isReady 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                            : isFake
                            ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                            : 'bg-white dark:bg-black/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-blue-400 hover:text-blue-600'
                        }`}
                        title={`${video.video_id} - ${video.titre} (${formatSeconds(video.duree_s)})`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hovered video quick inspector */}
        {hoveredVideo && (
          <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono animate-in fade-in duration-150">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-blue-600 dark:text-blue-400">[{hoveredVideo.video_id}]</span>
              <span className="text-slate-800 dark:text-slate-200 truncate font-sans font-medium">{hoveredVideo.titre}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
              <span>{formatSeconds(hoveredVideo.duree_s)}</span>
              <span className="text-blue-600 font-bold">{hoveredVideo.playlists.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. THREE MAIN COGNITIVE ARCHITECTURE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: 106 Unique Lessons */}
        <div className="quant-card p-6 bg-white dark:bg-[#0F1420] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Video className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Corpus YouTube Dédoublonné</h3>
              <span className="text-xs font-mono font-bold text-blue-600">{videos.length} leçons</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              106 vidéos harvestées avec horodatages réels et découpage automatique en tranches de 35 min.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToVideos()}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-600 hover:text-blue-700 pt-2 cursor-pointer"
          >
            <span>Consulter le Registre</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: SCRIBE-ICT v3 Standard */}
        <div className="quant-card p-6 bg-white dark:bg-[#0F1420] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Spécifications SCRIBE-ICT v3</h3>
              <span className="text-xs font-mono font-bold text-emerald-600">{fichesReadyCount} fiches 10/10</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Double-Face : Leçon humaine 8 sections + Spécification agentique (ZONE_FSM & TRADE_FSM).
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToFiches}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-600 hover:text-blue-700 pt-2 cursor-pointer"
          >
            <span>Ouvrir l'Atelier Formel</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Cloud Storage & Registre Léger */}
        <div className="quant-card p-6 bg-white dark:bg-[#0F1420] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Coffre Google Drive Dédié</h3>
              <span className="text-xs font-mono font-bold text-blue-600">Cloud Sync</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Zéro stockage de fichiers lourds dans l'application. Sauvegarde Cloud directe et registre de traçabilité.
            </p>
          </div>
          {onNavigateToDrive && (
            <button
              type="button"
              onClick={onNavigateToDrive}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-600 hover:text-blue-700 pt-2 cursor-pointer"
            >
              <span>Accéder au Coffre Drive</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
