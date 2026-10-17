import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, 
  Play, 
  FileText, 
  Filter, 
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import type { ConsolidatedVideoItem } from '../utils/pipeline';
import { formatSeconds, calculateSlices } from '../utils/pipeline';
import type { TraceabilityRegistry } from '../services/traceabilityRegistry';

interface VideosProps {
  videos: ConsolidatedVideoItem[];
  savedFiches: Record<string, string>;
  registry?: TraceabilityRegistry;
  onSelectVideoToProcess: (video: ConsolidatedVideoItem) => void;
  onViewFiche: (videoId: string) => void;
  onRollbackVideos?: (videoIds: string[]) => Promise<void>;
  searchQuery: string;
}

export const Videos: React.FC<VideosProps> = ({
  videos,
  savedFiches,
  registry,
  onSelectVideoToProcess,
  onViewFiche,
  onRollbackVideos,
  searchQuery,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('TOUS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TOUS');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);

  // Helper: check if a video has completed extraction (via Drive or local)
  const isVideoDone = (videoId: string) => {
    if (savedFiches[videoId]) return true;
    const rec = registry?.videoRecords[videoId];
    if (!rec || rec.isFakeClone197 || rec.status === 'Brouillon_Errone_197') return false;
    return Boolean(rec.status === 'Validé' || rec.status === 'Extrait' || Boolean(rec.driveFileId));
  };

  // Filtered and sorted videos
  const displayedVideos = useMemo(() => {
    let result = videos.filter((v) => {
      const hasFiche = isVideoDone(v.video_id);
      const matchesSearch = v.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.video_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFamily = selectedFamily === 'TOUS' || v.famille === selectedFamily;
      
      let matchesStatus = true;
      if (selectedStatus === 'PRETE') {
        matchesStatus = hasFiche;
      } else if (selectedStatus === 'A_FAIRE') {
        matchesStatus = !hasFiche;
      }

      return matchesSearch && matchesFamily && matchesStatus;
    });

    return result.sort((a, b) => {
      return sortOrder === 'asc' 
        ? a.video_id.localeCompare(b.video_id)
        : b.video_id.localeCompare(a.video_id);
    });
  }, [videos, savedFiches, registry, searchQuery, selectedFamily, selectedStatus, sortOrder]);

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlaylistBadgeColor = (p: string) => {
    switch (p) {
      case 'P1': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'P2': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'P3': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'P4': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };


  const toggleSelectAll = () => {
    if (selectedVideoIds.size === displayedVideos.length) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(displayedVideos.map(v => v.video_id)));
    }
  };

  const toggleSelectVideo = (videoId: string) => {
    const next = new Set(selectedVideoIds);
    if (next.has(videoId)) {
      next.delete(videoId);
    } else {
      next.add(videoId);
    }
    setSelectedVideoIds(next);
  };

  const handleRollbackSelected = async () => {
    if (!onRollbackVideos || selectedVideoIds.size === 0) return;
    setIsRollingBack(true);
    try {
      await onRollbackVideos(Array.from(selectedVideoIds));
      setSelectedVideoIds(new Set());
    } finally {
      setIsRollingBack(false);
    }
  };

  const readyCount = videos.filter(v => isVideoDone(v.video_id)).length;
  const todoCount = videos.length - readyCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Controls & Density Filter */}
      <div className="quant-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono bg-white dark:bg-[#0F1420]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 flex items-center gap-1.5 font-bold uppercase">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtre Famille :</span>
          </span>
          {['TOUS', 'FORMATION_A', 'CONCEPTS_SETUPS', 'FORMATION_2026'].map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setSelectedFamily(fam)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedFamily === fam
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {fam === 'TOUS' ? 'Toutes les familles' : fam.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/30 p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setSelectedStatus('TOUS')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                selectedStatus === 'TOUS' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({videos.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('PRETE')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                selectedStatus === 'PRETE' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prête ({readyCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('A_FAIRE')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                selectedStatus === 'A_FAIRE' ? 'bg-red-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              À faire ({todoCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer font-semibold"
            title="Trier par ID"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
            <span>ID ({sortOrder.toUpperCase()})</span>
          </button>
        </div>
      </div>

      {/* Floating Selection Action Bar */}
      {selectedVideoIds.size > 0 && (
        <div className="p-3 px-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg font-mono text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-blue-600 px-2 py-0.5 rounded text-[11px]">
              {selectedVideoIds.size} sélectionnée{selectedVideoIds.size > 1 ? 's' : ''}
            </span>
            <span className="text-slate-300">sur {displayedVideos.length} affichées</span>
          </div>

          <div className="flex items-center gap-2">
            {onRollbackVideos && (
              <button
                type="button"
                onClick={handleRollbackSelected}
                disabled={isRollingBack}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                title="Supprimer les fiches générées de Google Drive et remettre ces vidéos en statut À faire"
              >
                <span>{isRollingBack ? 'Annulation...' : '⏪ Annuler & Supprimer de Drive'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedVideoIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-all cursor-pointer"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* High-Density Video Registry Table */}
      <div className="quant-card overflow-hidden bg-white dark:bg-[#0F1420] border border-slate-200 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-700 dark:text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={displayedVideos.length > 0 && selectedVideoIds.size === displayedVideos.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Tout sélectionner / désélectionner"
                  />
                </th>
                <th className="py-3 px-4 w-28">ID Vidéo</th>
                <th className="py-3 px-4">Titre de la Leçon</th>
                <th className="py-3 px-3 w-28 text-center">Playlist</th>
                <th className="py-3 px-3 w-24 text-right">Durée</th>
                <th className="py-3 px-3 w-28 text-center">Tranches 35m</th>
                <th className="py-3 px-4 w-36 text-center">Statut Fiche</th>
                <th className="py-3 px-4 w-36 text-right">Action Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {displayedVideos.map((video) => {
                const rec = registry?.videoRecords[video.video_id];
                const hasFiche = isVideoDone(video.video_id);
                const slices = calculateSlices(video.video_id, video.duree_s, 35);
                const isSelected = selectedVideoIds.has(video.video_id);

                return (
                  <tr 
                    key={video.video_id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group ${
                      isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectVideo(video.video_id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* ID */}
                    <td className="py-3 px-4 align-middle">
                      <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                        {video.video_id}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 align-middle font-sans font-medium text-slate-900 dark:text-white max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="line-clamp-1">{video.titre}</span>
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity"
                          title="Voir sur YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Playlists */}
                    <td className="py-3 px-3 align-middle text-center">
                      <div className="flex items-center justify-center gap-1">
                        {video.playlists.map(p => (
                          <span 
                            key={p}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPlaylistBadgeColor(p)}`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 align-middle text-right text-slate-500 tabular-nums">
                      {formatSeconds(video.duree_s)}
                    </td>

                    {/* Slices count */}
                    <td className="py-3 px-3 align-middle text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        slices.length > 1
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {slices.length} tranche{slices.length > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 align-middle text-center">
                      {hasFiche ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>10/10 Prête</span>
                          </span>
                          {rec?.driveWebViewLink && (
                            <a
                              href={rec.driveWebViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-0.5"
                              title="Ouvrir dans Google Drive"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : rec?.isFakeClone197 || rec?.status === 'Brouillon_Errone_197' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200" title="Ancien clone statique 197 lignes à ré-extraire">
                          <span>Clone 197L</span>
                        </span>
                      ) : rec?.status === 'Erreur' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title={rec.lastError}>
                          <span>Erreur</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span>À extraire</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-middle text-right">
                      {hasFiche ? (
                        <button
                          type="button"
                          onClick={() => onViewFiche(video.video_id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Voir Fiche</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectVideoToProcess(video)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Extraire</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
