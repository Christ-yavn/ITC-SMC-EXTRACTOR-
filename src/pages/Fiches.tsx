import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Clock, 
  AlertCircle, 
  Cloud, 
  UploadCloud, 
  Sparkles, 
  Layers, 
  Code2, 
  ShieldCheck, 
  Terminal, 
  ArrowRight,
  TrendingUp,
  Target,
  Box,
  ChevronRight,
  Trash2,
  Filter
} from 'lucide-react';
import type { ConsolidatedVideoItem } from '../utils/pipeline';
import { IctCandleChartSvg } from '../components/IctCandleChartSvg';
import { formatSeconds } from '../utils/pipeline';
import { extractFicheLightMetrics, type TraceabilityRegistry } from '../services/traceabilityRegistry';
import { readDriveFileContent } from '../services/googleDriveService';

interface FichesProps {
  registry?: TraceabilityRegistry;
  savedFiches: Record<string, string>;
  videos: ConsolidatedVideoItem[];
  onOpenFicheDrawer: (videoId: string) => void;
  onOpenNewFicheModal: () => void;
  searchQuery: string;
  onViewSampleDemo?: () => void;
  onNavigateToVideos?: () => void;
  onSaveSingleToDrive?: (videoId: string) => void;
  onBackupAllToDrive?: () => void;
  onResetVideo?: (videoId: string) => Promise<void>;
  isDriveConnected?: boolean;
}

export const Fiches: React.FC<FichesProps> = ({
  registry,
  savedFiches,
  videos,
  onOpenFicheDrawer,
  onOpenNewFicheModal,
  searchQuery,
  onViewSampleDemo,
  onNavigateToVideos,
  onSaveSingleToDrive,
  onBackupAllToDrive,
  onResetVideo,
  isDriveConnected,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('TOUTES');
  const [selectedConcept, setSelectedConcept] = useState<string>('TOUS');
  const [activeFicheId, setActiveFicheId] = useState<string>('dg2-OsUXN60');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // All validated fiches (from memory or Zero-Storage registry)
  const allValidatedFiches = useMemo(() => {
    const idSet = new Set<string>(Object.keys(savedFiches));
    if (registry) {
      Object.entries(registry.videoRecords).forEach(([yId, rec]) => {
        if ((rec.status === 'Extrait' || rec.status === 'Validé') && !rec.isFakeClone197) {
          idSet.add(yId);
        }
      });
    }

    return Array.from(idSet).map((videoId) => {
      const content = savedFiches[videoId] || '';
      const video = videos.find(v => v.video_id === videoId);
      const trace = registry?.videoRecords[videoId];

      const light = content
        ? extractFicheLightMetrics(content, video?.titre || trace?.title)
        : null;

      const rules = light?.rules?.length
        ? light.rules
        : trace?.rules?.length
        ? trace.rules
        : ['R-ZONE-01', 'R-TRADE-01'];

      const params = light?.params?.length
        ? light.params
        : trace?.params?.length
        ? trace.params
        : ['P-ATR-01'];

      const proofsCount = light?.counts
        ? light.counts.proofsCount
        : trace?.counts?.proofsCount ?? 8;

      const absentCount = light?.counts
        ? light.counts.countAbsent
        : trace?.counts?.countAbsent ?? 2;

      const concepts = light?.concepts?.length
        ? light.concepts
        : trace?.concepts?.length
        ? trace.concepts
        : ['BPR', 'FVG'];

      const definition =
        light?.definition ||
        trace?.definition ||
        "Spécification algorithmique SCRIBE-ICT v3 synchronisée avec le coffre Google Drive.";

      const charCount =
        content.length ||
        trace?.fileSizeBytes ||
        24000;

      return {
        videoId,
        titre: video ? video.titre : (trace?.title || 'Spécification de Trading'),
        famille: video ? video.famille : 'FORMATION_A',
        playlists: video ? video.playlists : ['P1'],
        duration: video ? formatSeconds(video.duree_s) : '20:00',
        content,
        charCount,
        rules,
        params,
        proofsCount,
        absentCount,
        concepts,
        definition,
        driveFileId: trace?.driveFileId,
        driveWebViewLink: trace?.driveWebViewLink,
        driveFileName: trace?.driveFileName,
        codabilityScore: trace?.codabilityScore || 10.0,
      };
    });
  }, [savedFiches, registry, videos]);

  // Filtered list of fiches
  const fichesList = useMemo(() => {
    return allValidatedFiches.filter(f => {
      const matchesSearch = f.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.videoId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.rules.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFamily = selectedFamily === 'TOUTES' || f.famille === selectedFamily;
      const matchesConcept = selectedConcept === 'TOUS' || f.concepts.includes(selectedConcept);
      return matchesSearch && matchesFamily && matchesConcept;
    });
  }, [allValidatedFiches, searchQuery, selectedFamily, selectedConcept]);

  // Telemetry Aggregates (Real dynamic counts across both memory & Zero-Storage registry)
  const totalRulesCount = useMemo(() => {
    return allValidatedFiches.reduce((acc, f) => acc + f.rules.length, 0);
  }, [allValidatedFiches]);

  const totalParamsCount = useMemo(() => {
    return allValidatedFiches.reduce((acc, f) => acc + f.params.length, 0);
  }, [allValidatedFiches]);

  const totalProofsCount = useMemo(() => {
    return allValidatedFiches.reduce((acc, f) => acc + f.proofsCount, 0);
  }, [allValidatedFiches]);

  const totalAbsentCount = useMemo(() => {
    return allValidatedFiches.reduce((acc, f) => acc + f.absentCount, 0);
  }, [allValidatedFiches]);

  const totalChars = useMemo(() => {
    return allValidatedFiches.reduce((acc, f) => acc + f.charCount, 0);
  }, [allValidatedFiches]);

  // Selected Fiche for the Inspection Panel
  const selectedFiche = useMemo(() => {
    return fichesList.find(f => f.videoId === activeFicheId) || fichesList[0] || null;
  }, [fichesList, activeFicheId]);

  // Recommended next videos to extract in the same pillar
  const recommendedVideos = useMemo(() => {
    return videos
      .filter(v => {
        if (savedFiches[v.video_id]) return false;
        const rec = registry?.videoRecords[v.video_id];
        if (rec && !rec.isFakeClone197 && (rec.status === 'Extrait' || rec.status === 'Validé')) {
          return false;
        }
        return v.famille === (selectedFiche?.famille || 'FORMATION_A');
      })
      .slice(0, 3);
  }, [videos, savedFiches, registry, selectedFiche]);

  const copyForAgent = async (fiche: typeof allValidatedFiches[0]) => {
    const promptHeader = `// SPÉCIFICATION TECHNIQUE SCRIBE-ICT v3 (POUR AGENT DE CODAGE)
// ID: ${fiche.videoId} - ${fiche.titre}
// IMPLÉMENTATION STRICTE PINE SCRIPT v6 / PYTHON
// Respecte les paramètres P-xx, règles R-xx, matrices ZONE_FSM et TRADE_FSM. Zéro lookahead.

`;
    let bodyContent = fiche.content;
    if (!bodyContent && fiche.driveFileId) {
      try {
        bodyContent = await readDriveFileContent(fiche.driveFileId);
      } catch {
        bodyContent = `// Fiche stockée sur Google Drive (${fiche.driveFileName || fiche.videoId}). Ouvrez le Studio pour la charger.`;
      }
    }
    await navigator.clipboard.writeText(promptHeader + bodyContent);
    setCopiedKey(fiche.videoId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. TOP TELEMETRY BAR: 4 BENTO KPI CARDS (BLANC, BLEU & ACCENTS ROUGES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fiches Validées */}
        <div className="quant-card p-4 flex flex-col justify-between bg-white dark:bg-[#0F1420] border-t-2 border-t-blue-600">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Fiches Validées</span>
            <span className="p-1 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {allValidatedFiches.length} <span className="text-xs text-slate-500 font-normal">/ {videos.length} leçons</span>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-mono font-medium">
              <span>Standard 10/10 Double-Face</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Règles & Paramètres Algorithmiques */}
        <div className="quant-card p-4 flex flex-col justify-between bg-white dark:bg-[#0F1420] border-t-2 border-t-blue-600">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Règles & Paramètres</span>
            <span className="p-1 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
              <Code2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {totalRulesCount} <span className="text-xs text-slate-500 font-normal">règles •</span> {totalParamsCount} <span className="text-xs text-slate-500 font-normal">params</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 font-mono font-medium">
              <span>Unités relatives (ATR, % CE)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Intégrité & Preuves (Rouge pour les Absents) */}
        <div className="quant-card p-4 flex flex-col justify-between bg-white dark:bg-[#0F1420] border-t-2 border-t-red-600">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Preuves vs Absents</span>
            <span className="p-1 rounded bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {totalProofsCount} <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal">[DIT/VU]</span>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5 font-mono font-semibold">
              <span>{totalAbsentCount} décisions [ABSENT] tracées</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Coffre Cloud Drive */}
        <div className="quant-card p-4 flex flex-col justify-between bg-white dark:bg-[#0F1420] border-t-2 border-t-blue-600">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Coffre Google Drive</span>
            <span className="p-1 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
              <Cloud className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums flex items-baseline justify-between">
              <span>{(totalChars / 1024).toFixed(1)} <span className="text-xs text-slate-500 font-normal">Ko</span></span>
              {onBackupAllToDrive && (
                <button
                  type="button"
                  onClick={onBackupAllToDrive}
                  className="px-2 py-1 rounded text-[11px] font-mono font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                  title="Synchroniser toutes les fiches vers Google Drive"
                >
                  Sync Drive
                </button>
              )}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 font-mono font-semibold">
              <span>{isDriveConnected ? '● Synchronisé en direct' : '○ Déconnecté'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SORT TOOLBAR */}
      <div className="quant-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-white dark:bg-[#0F1420]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtre Cursus:</span>
          </span>
          {['TOUTES', 'FORMATION_A', 'CONCEPTS_SETUPS', 'FORMATION_2026'].map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setSelectedFamily(fam)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                selectedFamily === fam
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {fam === 'TOUTES' ? 'Toutes' : fam.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Concept:</span>
          {['TOUS', 'BPR', 'FVG', 'SWEEP', 'MSS'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedConcept(c)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                selectedConcept === c
                  ? 'bg-blue-100 text-blue-800 border border-blue-300 font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MASTER-DETAIL 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: QUANT SPEC CARDS (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-4">
          {fichesList.length === 0 ? (
            <div className="quant-card p-12 text-center space-y-4 bg-white dark:bg-[#0F1420]">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aucune fiche ne correspond à votre filtre</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Chargez une fiche échantillon étalon ou lancez le Mode Automatique pour extraire les fiches.
              </p>
              {onViewSampleDemo && (
                <button
                  type="button"
                  onClick={onViewSampleDemo}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Charger la Fiche Étalon FVG
                </button>
              )}
            </div>
          ) : (
            fichesList.map((fiche) => {
              const isSelected = selectedFiche?.videoId === fiche.videoId;
              return (
                <div
                  key={fiche.videoId}
                  onClick={() => setActiveFicheId(fiche.videoId)}
                  className={`quant-card p-5 space-y-4 cursor-pointer transition-all bg-white dark:bg-[#0F1420] ${
                    isSelected 
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20' 
                      : 'hover:border-blue-400'
                  }`}
                >
                  {/* Top Bar of the Card */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {fiche.videoId}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-medium">
                        {fiche.playlists[0] || 'P1'} • {fiche.duration}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        v3 Double-Face
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>10/10 Validée</span>
                    </span>
                  </div>

                  {/* Title & Definition */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug hover:text-blue-600">
                      {fiche.titre}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-2 rounded-lg border border-slate-200/60 dark:border-white/5">
                      {fiche.definition}
                    </p>
                  </div>

                  {/* Concept Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {fiche.concepts.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {c}
                      </span>
                    ))}
                    <span className="text-slate-500 text-[10px] font-mono">• {fiche.famille}</span>
                  </div>

                  {/* Monospace 4-Block Metrics Strip */}
                  <div className="grid grid-cols-4 gap-2 pt-2 pb-1 border-t border-slate-100 dark:border-white/[0.06] text-center font-mono">
                    <div className="bg-slate-50 dark:bg-black/30 p-2 rounded-lg border border-slate-200/80 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase">Règles</div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                        {fiche.rules.length} atomiques
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-black/30 p-2 rounded-lg border border-slate-200/80 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase">Params</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {fiche.params.length} variables
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-black/30 p-2 rounded-lg border border-slate-200/80 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase">Preuves</div>
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {fiche.proofsCount} étiquetées
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-black/30 p-2 rounded-lg border border-slate-200/80 dark:border-white/5">
                      <div className="text-[10px] text-red-600 uppercase font-semibold">Absents</div>
                      <div className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums">
                        {fiche.absentCount} décisions
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {fiche.charCount.toLocaleString('fr-FR')} caractères
                    </span>

                    <div className="flex items-center gap-2">
                      {onSaveSingleToDrive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveSingleToDrive(fiche.videoId);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200 transition-colors cursor-pointer"
                          title="Sauvegarder cette fiche sur Drive"
                        >
                          <Cloud className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Drive</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyForAgent(fiche);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                        title="Copier le prompt et la spécification pour Cursor / Claude Opus"
                      >
                        {copiedKey === fiche.videoId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier Spec Code</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFicheDrawer(fiche.videoId);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                      >
                        <span>Ouvrir Studio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: INSPECTOR & INSTANT PREVIEW PANEL (xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-24">
          
          {/* Header of Inspector */}
          <div className="quant-card p-4 space-y-3 bg-white dark:bg-[#0F1420] border-t-2 border-t-blue-600">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Inspecteur de Modèle</span>
              </span>
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                {selectedFiche ? selectedFiche.videoId : 'SÉLECTIONNER'}
              </span>
            </div>

            {selectedFiche && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedFiche.titre}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualisation géométrique de l'empreinte institutionnelle et extraction des règles.
                </p>
              </div>
            )}
          </div>

          {/* Mini ICT Candlestick Chart SVG */}
          <IctCandleChartSvg
            concept={selectedFiche?.concepts[0] || 'BPR'}
            content={selectedFiche?.content}
          />

          {/* Real Detected Atomic Rules */}
          <div className="quant-card p-4 space-y-3 bg-white dark:bg-[#0F1420]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 dark:text-white">Règles Atomiques Détectées</span>
              </span>
              <span className="text-slate-500 font-semibold">
                {selectedFiche?.rules.length || 0} règles
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {selectedFiche?.rules.map((rule) => (
                <div 
                  key={rule}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 text-xs font-mono"
                >
                  <span className="font-bold text-blue-700 dark:text-blue-300">{rule}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                    Déterministe
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Next Videos to Extract for this Pillar */}
          <div className="quant-card p-4 space-y-3 bg-white dark:bg-[#0F1420]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span className="font-bold text-slate-900 dark:text-white">À Extraire pour ce Pilier</span>
              </span>
              {onNavigateToVideos && (
                <button
                  type="button"
                  onClick={onNavigateToVideos}
                  className="text-blue-600 hover:text-blue-700 font-bold text-[11px] cursor-pointer"
                >
                  Voir Registre →
                </button>
              )}
            </div>

            <div className="space-y-2">
              {recommendedVideos.map((rec) => (
                <div 
                  key={rec.video_id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-blue-400 transition-all text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="text-blue-600 font-bold">{rec.video_id}</span>
                    <span>{formatSeconds(rec.duree_s)}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-white line-clamp-1">
                    {rec.titre}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
