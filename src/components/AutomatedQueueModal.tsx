import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  FolderSync, 
  Play, 
  Pause, 
  Square,
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Layers,
  Sparkles,
  Terminal,
  ExternalLink,
  Cloud,
  Minimize2,
  RefreshCw,
  FileText,
  Zap,
  RotateCcw,
  Sliders,
  Check,
  Trash2
} from 'lucide-react';
import type { ConsolidatedVideoItem } from '../utils/pipeline';
import type { TraceabilityRegistry } from '../services/traceabilityRegistry';

export interface BatchLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type BatchModalPhase = 'SELECT' | 'RUNNING' | 'PAUSED' | 'FINISHED';

interface AutomatedQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetScope: string;
  videos: ConsolidatedVideoItem[];
  registry: TraceabilityRegistry;
  isDriveConnected: boolean;
  isRunning: boolean;
  isPaused: boolean;
  currentVideo: ConsolidatedVideoItem | null;
  currentIndex: number;
  totalInBatch: number;
  batchLogs: BatchLogItem[];
  currentBatchId?: string;
  selectedModel?: 'gemini-2.5-pro' | 'gemini-3.1-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-flash';
  onSelectModel?: (model: 'gemini-2.5-pro' | 'gemini-3.1-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-flash') => void;
  onStartBatch: (options: {
    videoIds: string[];
    scopeLabel: string;
    autoSyncDrive: boolean;
    batchSize?: number;
    model?: string;
  }) => void;
  onPauseBatch: () => void;
  onResumeBatch: () => void;
  onSkipCurrentVideo?: () => void;
  onStopBatch: () => void;
  onRollbackBatch?: (batchId: string) => Promise<void>;
  onNavigateToFiches: () => void;
  onOpenDriveFolder?: () => void;
  onResetBatchCursor?: () => void;
}

export const AutomatedQueueModal: React.FC<AutomatedQueueModalProps> = ({
  isOpen,
  onClose,
  targetScope,
  videos,
  registry,
  isDriveConnected,
  isRunning,
  isPaused,
  currentVideo,
  currentIndex,
  totalInBatch,
  batchLogs,
  currentBatchId,
  selectedModel = 'gemini-2.5-pro',
  onSelectModel,
  onStartBatch,
  onPauseBatch,
  onResumeBatch,
  onSkipCurrentVideo,
  onStopBatch,
  onRollbackBatch,
  onNavigateToFiches,
  onOpenDriveFolder,
  onResetBatchCursor,
}) => {
  // Phase state
  const [phase, setPhase] = useState<BatchModalPhase>('SELECT');

  // Selection controls
  const [selectedScope, setSelectedScope] = useState<string>(targetScope || 'TOUTES');
  const [batchCountOption, setBatchCountOption] = useState<'5' | '10' | '25' | 'ALL'>('ALL');
  const [forceReExtract, setForceReExtract] = useState<boolean>(false);
  const [autoSyncDrive, setAutoSyncDrive] = useState<boolean>(true);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync targetScope prop when parent changes it
  useEffect(() => {
    if (targetScope) {
      setSelectedScope(targetScope);
    }
  }, [targetScope]);

  // Sync phase with props
  useEffect(() => {
    if (isRunning) {
      setPhase(isPaused ? 'PAUSED' : 'RUNNING');
    } else if (totalInBatch > 0 && currentIndex >= totalInBatch) {
      setPhase('FINISHED');
    }
  }, [isRunning, isPaused, currentIndex, totalInBatch]);

  // Compute eligible videos for selected scope
  const eligibleVideos = useMemo(() => {
    return videos.filter(v => {
      // Filter by scope
      const matchScope = selectedScope === 'TOUTES' || v.playlists.includes(selectedScope);
      if (!matchScope) return false;

      // Filter by extraction status in registry
      if (!forceReExtract) {
        const record = registry.videoRecords[v.video_id];
        const isAlreadyDone = record && !record.isFakeClone197 && (record.status === 'Extrait' || record.status === 'Validé');
        if (isAlreadyDone) return false;
      }

      return true;
    });
  }, [videos, selectedScope, forceReExtract, registry]);

  // Target count according to batch option
  const effectiveVideosToProcess = useMemo(() => {
    if (batchCountOption === 'ALL') return eligibleVideos;
    const limit = parseInt(batchCountOption, 10);
    return eligibleVideos.slice(0, limit);
  }, [eligibleVideos, batchCountOption]);

  // Auto scroll terminal to bottom on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [batchLogs]);

  if (!isOpen) return null;

  const percentComplete = totalInBatch > 0 ? Math.min(100, Math.round((currentIndex / totalInBatch) * 100)) : 0;

  const handleLaunch = () => {
    const videoIds = effectiveVideosToProcess.map(v => v.video_id);
    if (videoIds.length === 0) return;

    setPhase('RUNNING');
    onStartBatch({
      videoIds,
      scopeLabel: `${selectedScope} (${videoIds.length} vidéos)`,
      autoSyncDrive: autoSyncDrive && isDriveConnected,
      batchSize: videoIds.length,
      model: selectedModel,
    });
  };

  const handleRollback = async () => {
    if (!currentBatchId || !onRollbackBatch) return;
    setIsRollingBack(true);
    try {
      await onRollbackBatch(currentBatchId);
      setPhase('SELECT');
      if (onResetBatchCursor) {
        onResetBatchCursor();
      }
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleResetToSelect = () => {
    setPhase('SELECT');
    if (onResetBatchCursor) {
      onResetBatchCursor();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity" 
        onClick={isRunning ? undefined : onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0A0E17] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-10 overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/95 dark:bg-[#07090F]/90">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md transition-all ${
              isRunning 
                ? 'bg-blue-600 shadow-blue-500/30' 
                : 'bg-blue-600 shadow-blue-500/20'
            }`}>
              <FolderSync className={`w-5 h-5 ${isRunning && !isPaused ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  Moteur d'Extraction Multimodal SCRIBE-ICT v3
                </h3>
                {isRunning ? (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                    isPaused 
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1'
                  }`}>
                    {!isPaused && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    {isPaused ? 'En Pause' : 'En Cours'}
                  </span>
                ) : phase === 'FINISHED' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Terminé
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    API Gemini Réelle
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Spécifications 10/10 : Causalité formelle, Machine à états, OHLC math et sauvegarde Google Drive
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {isRunning && (
              <button
                type="button"
                onClick={onClose}
                title="Minimiser en arrière-plan"
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200 dark:border-white/10 cursor-pointer font-semibold shadow-2xs"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Minimiser</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
          
          {/* Phase 1: SELECT */}
          {phase === 'SELECT' && (
            <div className="space-y-5">
              
              {/* Unlimited Telemetry Status */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between gap-4">
                <div className="space-y-0.5 font-sans">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-mono font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                      API Gemini Illimitée & Registre de Traçabilité
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Les fichiers .md partent directement sur Google Drive. L'application ne stocke que le registre d'état léger.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Mode Illimité Actif
                  </span>
                </div>
              </div>

              {/* 1. Scope selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block font-mono">
                  1. Périmètre de Playlist :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['TOUTES', 'P1', 'P2', 'P3', 'P4'].map((scope) => {
                    const countInScope = videos.filter(v => scope === 'TOUTES' || v.playlists.includes(scope)).length;
                    const remainingInScope = videos.filter(v => {
                      if (scope !== 'TOUTES' && !v.playlists.includes(scope)) return false;
                      const rec = registry.videoRecords[v.video_id];
                      return !rec || rec.isFakeClone197 || (rec.status !== 'Extrait' && rec.status !== 'Validé');
                    }).length;

                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setSelectedScope(scope)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedScope === scope
                            ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                            : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">{scope === 'TOUTES' ? 'Toutes' : `Playlist ${scope}`}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {remainingInScope} / {countInScope} à faire
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Official Gemini Model selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block font-mono">
                  2. Modèle Multimodal Vidéo Officiel (avec Fallback Cascade 4 Modèles) :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectModel && onSelectModel('gemini-2.5-pro')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      selectedModel === 'gemini-2.5-pro'
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-xs">gemini-2.5-pro</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-600 text-white font-bold font-mono">Recommandé 10/10</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans leading-normal">
                        Spécification formelle SCRIBE-ICT v3, machine à états et géométrie OHLC
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectModel && onSelectModel('gemini-3.1-pro-preview')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      selectedModel === 'gemini-3.1-pro-preview'
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-xs">gemini-3.1-pro-preview</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-600 text-white font-bold font-mono">Gen-3.1 Pro</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans leading-normal">
                        Raisonnement multimodal profond de dernière génération
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectModel && onSelectModel('gemini-3-flash-preview')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      selectedModel === 'gemini-3-flash-preview'
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-xs">gemini-3-flash-preview</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-600 text-white font-bold font-mono">Gen-3 Flash</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans leading-normal">
                        Modèle Flash Gen-3 rapide et analytique
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectModel && onSelectModel('gemini-2.5-flash')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      selectedModel === 'gemini-2.5-flash'
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-xs">gemini-2.5-flash</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white font-bold font-mono">Rapide</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans leading-normal">
                        Débit rapide haute capacité avec bascule automatique transparente
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Batch size selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block font-mono">
                  3. Taille du Lot d'Exécution :
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '5', label: '5 vidéos' },
                    { id: '10', label: '10 vidéos' },
                    { id: '25', label: '25 vidéos' },
                    { id: 'ALL', label: 'Tout le reste' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBatchCountOption(opt.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        batchCountOption === opt.id
                          ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-sm'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Options & Protections */}
              <div className="space-y-2.5 font-sans">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block font-mono">
                  3. Options & Sauvegarde :
                </label>
                
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncDrive}
                      onChange={(e) => setAutoSyncDrive(e.target.checked)}
                      disabled={!isDriveConnected}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Envoi direct du fichier Markdown sur Google Drive
                        {!isDriveConnected && (
                          <span className="text-[10px] text-amber-600 font-mono font-bold">(Connectez Drive d'abord)</span>
                        )}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Le fichier est directement téléversé dans votre coffre Cloud. Zéro encombrement dans le navigateur.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceReExtract}
                      onChange={(e) => setForceReExtract(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Forcer la ré-extraction des vidéos déjà traitées
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Par défaut décoché. Ré-analyse et réécrit les fiches de ce lot sur Google Drive.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* Phase 2 & 3: RUNNING & PAUSED */}
          {(phase === 'RUNNING' || phase === 'PAUSED') && (
            <div className="space-y-4">
              
              {/* Progress Bar & Telemetry */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">Progression du Lot :</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{currentIndex} / {totalInBatch} vidéos</span>
                    <span className="text-slate-500 font-semibold">({percentComplete}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isPaused ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Pause className="w-3 h-3" />
                        Traitement en pause
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        Analyse Gemini en cours
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar track */}
                <div className="w-full h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full shadow-xs"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>

                {/* Current video being extracted */}
                {currentVideo && (
                  <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 shrink-0 font-mono font-bold">[{currentVideo.video_id}]</span>
                      <span className="text-slate-900 dark:text-white font-medium truncate">{currentVideo.titre}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-[10px] font-mono text-blue-700 dark:text-slate-300 shrink-0 font-bold">
                      {currentVideo.playlists.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Live Terminal Console */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Journal d'Exécution en Direct (SCRIBE-ICT v3)</span>
                  </div>
                  <span>{batchLogs.length} événements</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] h-56 overflow-y-auto space-y-1.5 shadow-inner border border-slate-800">
                  {batchLogs.length === 0 ? (
                    <div className="text-slate-500 italic py-4 text-center">
                      Initialisation de l'appel multimodal Gemini...
                    </div>
                  ) : (
                    batchLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`break-words ${
                          log.type === 'success' 
                            ? 'text-emerald-400' 
                            : log.type === 'warning' 
                            ? 'text-amber-400' 
                            : log.type === 'error' 
                            ? 'text-rose-400' 
                            : 'text-slate-300'
                        }`}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

            </div>
          )}

          {/* Phase 4: FINISHED */}
          {phase === 'FINISHED' && (
            <div className="space-y-5">
              
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300 tracking-tight">
                  Lot Terminé avec Succès !
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                  {totalInBatch} vidéos ont été analysées avec succès via l'API Gemini. Leurs fiches formelles 10/10 sont enregistrées sur Google Drive.
                </p>
              </div>

              {/* 3 Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleResetToSelect}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔄 Configurer & Lancer un nouveau groupe de vidéos</span>
                </button>

                {currentBatchId && onRollbackBatch && (
                  <button
                    type="button"
                    onClick={handleRollback}
                    disabled={isRollingBack}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isRollingBack ? 'Annulation en cours...' : '⏪ Annuler ce lot (Supprimer de Google Drive + Remettre en À faire)'}</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/95 dark:bg-[#07090F]/90 flex items-center justify-between">
          {phase === 'SELECT' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleLaunch}
                disabled={effectiveVideosToProcess.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Démarrer l'Extraction ({effectiveVideosToProcess.length} vidéos)</span>
              </button>
            </>
          ) : phase === 'RUNNING' || phase === 'PAUSED' ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onStopBatch}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Interrompre immédiatement le lot en cours"
                >
                  <Square className="w-3.5 h-3.5 fill-red-700" />
                  <span>🛑 Arrêter</span>
                </button>

                {onSkipCurrentVideo && (
                  <button
                    type="button"
                    onClick={onSkipCurrentVideo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer border border-slate-300 dark:border-white/10"
                    title="Passer cette vidéo et enchaîner directement sur la suivante sans stopper le lot"
                  >
                    <span>⏭️ Passer cette vidéo</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {phase === 'PAUSED' ? (
                  <button
                    type="button"
                    onClick={onResumeBatch}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Reprendre</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPauseBatch}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs transition-all cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Mettre en Pause</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-semibold transition-all cursor-pointer"
                >
                  Continuer en arrière-plan
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToFiches();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Consulter les Fiches dans l'Atelier</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
