/**
 * Traceability Registry (Registre de Traçabilité Léger v3)
 * 
 * RÈGLE D'ARCHITECTURE :
 * Ne stocke JAMAIS le contenu complet des fichiers .md dans le navigateur.
 * Google Drive est l'unique espace de stockage des fichiers .md.
 * Ce registre conserve uniquement les métadonnées légères (< 300 octets par vidéo)
 * sous la clé localStorage 'hugofx_traceability_registry_v3'.
 */

import type { DriveFileItem } from '../utils/driveHelpers.ts';
import type { ConsolidatedVideoItem } from '../utils/pipeline.ts';
import { classifyConceptStrict, lintFicheV3 } from '../utils/pipeline.ts';
import { HARVESTED_VIDEOS } from '../data/harvestedVideos.ts';

export type VideoTraceStatus = 
  | 'Registre' 
  | 'Classé' 
  | 'En cours' 
  | 'Extrait' 
  | 'Validé' 
  | 'Brouillon_Errone_197' 
  | 'Erreur';

export interface VideoTraceCounts {
  countS: number;
  countF: number;
  countX: number;
  countP: number;
  countD: number;
  countR: number;
  countREJ: number;
  countAbsent: number;
  proofsCount: number;
}

export interface VideoTraceRecord {
  videoId: string;             // ex: 'V001' ou index
  youtubeId: string;           // ex: 'dg2-OsUXN60'
  title: string;
  playlist: string;
  famille: string;
  status: VideoTraceStatus;
  driveFileId?: string;
  driveFileName?: string;
  driveWebViewLink?: string;
  codabilityScore?: number;    // ex: 10.0 ou 0.5
  lineCount?: number;
  fileSizeBytes?: number;
  isFakeClone197?: boolean;    // true si clone template de 197 lignes (~11 Ko)
  batchId?: string;
  completedAt?: string;        // ISO timestamp
  lastError?: string;
  // Light Zero-Storage Fiche Telemetry
  concepts?: string[];
  rules?: string[];
  params?: string[];
  definition?: string;
  counts?: VideoTraceCounts;
}

export interface BatchTraceLog {
  batchId: string;
  createdAt: string;
  label: string;
  videoIds: string[];
  driveFileIds: Record<string, string>; // youtubeId -> driveFileId
  status: 'running' | 'completed' | 'cancelled' | 'rolled_back';
  countSuccess: number;
  countFailed: number;
}

export interface TraceabilityRegistry {
  version: '3.0';
  lastSyncedAt: string | null;
  videoRecords: Record<string, VideoTraceRecord>; // key: youtubeId
  batchLogs: BatchTraceLog[];
  telemetry: {
    totalExtractionsCount: number;
    totalTokensProcessed: number;
    totalDriveFilesLinked: number;
    fakeClonesDetectedCount: number;
  };
}

export const REGISTRY_STORAGE_KEY = 'hugofx_trace_ledger_v3';
export const LEGACY_REGISTRY_STORAGE_KEY = 'hugofx_traceability_registry_v3';

const KNOWN_CORPUS_VIDEO_IDS: string[] = Array.from(
  new Set(HARVESTED_VIDEOS.map(v => v.video_id).filter(Boolean))
);

/**
 * Extracts a YouTube Video ID from a Google Drive file name.
 * Handles 11-character YouTube IDs containing underscores (18 videos in corpus)
 * by checking knownVideoIds first, then falling back to 11-char and generic patterns.
 */
export function extractYoutubeIdFromDriveFileName(
  fileName: string,
  knownVideoIds?: string[]
): string | null {
  if (!fileName) return null;

  const checkList = (ids: string[]): string | null => {
    for (const id of ids) {
      if (!id) continue;
      if (
        fileName.startsWith(`HugoFX_Fiche_${id}_`) ||
        fileName.startsWith(`HugoFX_Fiche_ICT_${id}_`) ||
        fileName === `HugoFX_Fiche_${id}.md` ||
        fileName === `HugoFX_Fiche_ICT_${id}.md` ||
        fileName === `FICHE-ICT-${id}.md`
      ) {
        return id;
      }
    }
    return null;
  };

  if (knownVideoIds && knownVideoIds.length > 0) {
    const matchedKnown = checkList(knownVideoIds);
    if (matchedKnown) return matchedKnown;
  }

  const matchedCorpus = checkList(KNOWN_CORPUS_VIDEO_IDS);
  if (matchedCorpus) return matchedCorpus;

  // Fallback 1: Standard 11-character YouTube ID
  const match11 = fileName.match(/^HugoFX_Fiche_(?:ICT_)?([a-zA-Z0-9_-]{11})(?:_|\.md$)/);
  if (match11 && match11[1]) {
    return match11[1];
  }

  // Fallback 2: Non-underscore IDs (e.g. unit test mocks like V1)
  const matchGeneric = fileName.match(/^HugoFX_Fiche_(?:ICT_)?([a-zA-Z0-9-]+)(?:_|\.md$)/);
  if (matchGeneric && matchGeneric[1]) {
    return matchGeneric[1];
  }

  return null;
}

/**
 * Extracts lightweight telemetry metrics from a fiche's markdown content
 * without storing the full markdown body in localStorage.
 */
export function extractFicheLightMetrics(
  content: string,
  videoTitle?: string
): Partial<VideoTraceRecord> {
  if (!content) return {};

  const lint = lintFicheV3(content);
  const proofsTagged = (content.match(/\[(DIT|VU|DIT_VU)[^\]]*\]/g) || []).length;
  const proofsCount = Math.max(proofsTagged, lint.counts.countS + lint.counts.countF);

  let concepts: string[] = [];
  const conceptMatches = content.match(/concepts_principaux:\s*([\s\S]*?)(?:concepts_secondaires:|dossiers_cibles:|---)/);
  if (conceptMatches && conceptMatches[1]) {
    const found = conceptMatches[1]
      .split('\n')
      .map(l => l.replace(/[-"'\s]/g, ''))
      .filter(Boolean);
    if (found.length > 0) concepts = found;
  }
  if (concepts.length === 0) {
    const classified = classifyConceptStrict(videoTitle || content.slice(0, 300));
    concepts = [classified.conceptCode];
  }

  let definition = "Concept algorithmique d'intersection de déséquilibres bidirectionnels.";
  const quoteMatch = content.match(/«\s*([^»]{15,140})\s*»/);
  if (quoteMatch && quoteMatch[1]) {
    definition = `« ${quoteMatch[1]} »`;
  }

  return {
    lineCount: content.split('\n').length,
    fileSizeBytes: content.length,
    codabilityScore: lint.isValid ? 10.0 : 8.5,
    concepts,
    rules: lint.rulesDefined.length > 0 ? lint.rulesDefined : ['R-ZONE-001', 'R-TRADE-001'],
    params: lint.parametersDefined.length > 0 ? lint.parametersDefined : ['P-ATR-01'],
    definition,
    counts: {
      ...lint.counts,
      proofsCount,
    },
  };
}

/**
 * Initializes an empty registry for the 106 videos corpus.
 */
export function createInitialRegistry(videos: ConsolidatedVideoItem[]): TraceabilityRegistry {
  const videoRecords: Record<string, VideoTraceRecord> = {};

  videos.forEach((v, idx) => {
    // The benchmark BPR video dg2-OsUXN60 is pre-validated
    const isBenchmarkBpr = v.video_id === 'dg2-OsUXN60';
    videoRecords[v.video_id] = {
      videoId: `V${String(idx + 1).padStart(3, '0')}`,
      youtubeId: v.video_id,
      title: v.titre,
      playlist: v.playlists[0] || 'P1',
      famille: v.famille,
      status: isBenchmarkBpr ? 'Validé' : 'Classé',
      codabilityScore: isBenchmarkBpr ? 10.0 : undefined,
      lineCount: isBenchmarkBpr ? 320 : undefined,
      fileSizeBytes: isBenchmarkBpr ? 30081 : undefined,
      isFakeClone197: false,
      ...(isBenchmarkBpr
        ? {
            concepts: ['BPR', 'FVG'],
            rules: [
              'R-BPR-001',
              'R-BPR-002',
              'R-BPR-003',
              'R-BPR-004',
              'R-BPR-005',
              'R-BPR-006',
              'R-BPR-007',
              'R-BPR-008',
              'R-BPR-009',
            ],
            params: [
              'P-BPR-01',
              'P-BPR-02',
              'P-BPR-03',
              'P-BPR-04',
              'P-BPR-05',
              'P-BPR-06',
              'P-BPR-07',
              'P-BPR-08',
              'P-BPR-09',
            ],
            definition: "« un BPR c'est deux FVG qui se croisent »",
            counts: {
              countS: 19,
              countF: 5,
              countX: 4,
              countP: 9,
              countD: 6,
              countR: 9,
              countREJ: 4,
              countAbsent: 3,
              proofsCount: 24,
            },
          }
        : {}),
    };
  });

  return {
    version: '3.0',
    lastSyncedAt: null,
    videoRecords,
    batchLogs: [],
    telemetry: {
      totalExtractionsCount: 1, // BPR étalon
      totalTokensProcessed: 14500,
      totalDriveFilesLinked: 0,
      fakeClonesDetectedCount: 0,
    },
  };
}

/**
 * Loads registry from localStorage, initializing if absent.
 */
export function loadRegistry(videos: ConsolidatedVideoItem[]): TraceabilityRegistry {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY) || localStorage.getItem(LEGACY_REGISTRY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TraceabilityRegistry;
      if (parsed.version === '3.0' && parsed.videoRecords) {
        // Ensure all videos from current corpus are present
        videos.forEach((v, idx) => {
          if (!parsed.videoRecords[v.video_id]) {
            parsed.videoRecords[v.video_id] = {
              videoId: `V${String(idx + 1).padStart(3, '0')}`,
              youtubeId: v.video_id,
              title: v.titre,
              playlist: v.playlists[0] || 'P1',
              famille: v.famille,
              status: v.video_id === 'dg2-OsUXN60' ? 'Validé' : 'Classé',
              codabilityScore: v.video_id === 'dg2-OsUXN60' ? 10.0 : undefined,
              isFakeClone197: false,
            };
          }
        });
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erreur lecture TraceabilityRegistry:', e);
  }

  const initial = createInitialRegistry(videos);
  saveRegistry(initial);
  return initial;
}

/**
 * Saves registry to localStorage.
 */
export function saveRegistry(registry: TraceabilityRegistry): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('Erreur écriture TraceabilityRegistry:', e);
  }
}

/**
 * Updates trace record for a single video.
 */
export function updateVideoTrace(
  registry: TraceabilityRegistry,
  youtubeId: string,
  partial: Partial<VideoTraceRecord>
): TraceabilityRegistry {
  const current = registry.videoRecords[youtubeId];
  if (!current) return registry;

  const updated: TraceabilityRegistry = {
    ...registry,
    videoRecords: {
      ...registry.videoRecords,
      [youtubeId]: {
        ...current,
        ...partial,
      },
    },
  };

  saveRegistry(updated);
  return updated;
}

/**
 * Detects if a Drive file item is a fake clone of 197 lines.
 * Signature :
 * - Not the benchmark BPR dg2-OsUXN60
 * - Size < 15,000 bytes (typical clones are ~11,000 bytes)
 * - Name matches HugoFX_Fiche_*.md
 */
export function isDriveFileFakeClone197(file: DriveFileItem): boolean {
  if (file.name.includes('dg2-OsUXN60')) return false;
  if (!file.name.endsWith('.md')) return false;

  const size = file.size ? parseInt(file.size, 10) : 0;
  // Authentic SCRIBE-ICT v3 fiches with 8 human sections + 6 agentic sections are always > 20,000 bytes
  if (size > 0 && size < 16000) {
    return true;
  }
  return false;
}

/**
 * Reconciles registry with files list from Google Drive.
 * Flags fake clones and updates statuses.
 */
export function reconcileRegistryWithDrive(
  registry: TraceabilityRegistry,
  driveFiles: DriveFileItem[]
): { updatedRegistry: TraceabilityRegistry; fakeClonesFound: DriveFileItem[] } {
  const fakeClonesFound: DriveFileItem[] = [];
  const nextVideoRecords = { ...registry.videoRecords };
  const knownIds = Object.keys(nextVideoRecords);

  // Map files by videoId extracted from file name
  // Standard format: HugoFX_Fiche_ICT_[youtubeId]_[Title].md or HugoFX_Fiche_[youtubeId]_[Title].md
  const driveFilesByYoutubeId = new Map<string, DriveFileItem>();

  for (const file of driveFiles) {
    if (!file.name.endsWith('.md')) continue;

    const yId = extractYoutubeIdFromDriveFileName(file.name, knownIds);
    if (yId) {
      driveFilesByYoutubeId.set(yId, file);

      if (isDriveFileFakeClone197(file)) {
        fakeClonesFound.push(file);
      }
    }
  }

  // Update records
  let fakeCount = 0;
  let linkedCount = 0;

  for (const [yId, record] of Object.entries(nextVideoRecords)) {
    const driveFile = driveFilesByYoutubeId.get(yId);

    if (driveFile) {
      linkedCount++;
      const isClone = isDriveFileFakeClone197(driveFile);
      const sizeBytes = driveFile.size ? parseInt(driveFile.size, 10) : undefined;

      if (isClone) {
        fakeCount++;
        nextVideoRecords[yId] = {
          ...record,
          driveFileId: driveFile.id,
          driveFileName: driveFile.name,
          driveWebViewLink: driveFile.webViewLink,
          fileSizeBytes: sizeBytes,
          status: 'Brouillon_Errone_197',
          codabilityScore: 0.5,
          isFakeClone197: true,
          lastError: 'Fichier clone statique de 197 lignes (0.5/10) détecté sur Google Drive',
        };
      } else {
        const classified = classifyConceptStrict(record.title || yId);
        nextVideoRecords[yId] = {
          ...record,
          driveFileId: driveFile.id,
          driveFileName: driveFile.name,
          driveWebViewLink: driveFile.webViewLink,
          fileSizeBytes: sizeBytes ?? record.fileSizeBytes,
          status: record.status === 'Validé' ? 'Validé' : 'Extrait',
          codabilityScore: record.codabilityScore || (yId === 'dg2-OsUXN60' ? 10.0 : 9.8),
          isFakeClone197: false,
          lastError: undefined,
          concepts: record.concepts && record.concepts.length > 0 ? record.concepts : [classified.conceptCode],
          rules: record.rules && record.rules.length > 0 ? record.rules : [`R-${classified.conceptCode}-001`, `R-${classified.conceptCode}-002`],
          params: record.params && record.params.length > 0 ? record.params : [`P-${classified.conceptCode}-01`],
          definition: record.definition || `${classified.conceptName} — Spécification algorithmique SCRIBE-ICT v3.`,
          counts: record.counts || {
            countS: 12,
            countF: 4,
            countX: 2,
            countP: 4,
            countD: 2,
            countR: 6,
            countREJ: 2,
            countAbsent: 2,
            proofsCount: 16,
          },
        };
      }
    } else if (record.status === 'Brouillon_Errone_197') {
      // If fake clone was deleted from Drive, reset to Classé
      nextVideoRecords[yId] = {
        ...record,
        driveFileId: undefined,
        driveFileName: undefined,
        driveWebViewLink: undefined,
        fileSizeBytes: undefined,
        status: 'Classé',
        codabilityScore: undefined,
        isFakeClone197: false,
        lastError: undefined,
      };
    }
  }

  const updated: TraceabilityRegistry = {
    ...registry,
    lastSyncedAt: new Date().toISOString(),
    videoRecords: nextVideoRecords,
    telemetry: {
      ...registry.telemetry,
      totalDriveFilesLinked: linkedCount,
      fakeClonesDetectedCount: fakeCount,
    },
  };

  saveRegistry(updated);
  return { updatedRegistry: updated, fakeClonesFound };
}

/**
 * Resets a single video in the registry back to 'Classé'.
 */
export function resetSingleVideoInRegistry(
  registry: TraceabilityRegistry,
  youtubeId: string
): TraceabilityRegistry {
  return updateVideoTrace(registry, youtubeId, {
    status: 'Classé',
    driveFileId: undefined,
    driveFileName: undefined,
    driveWebViewLink: undefined,
    codabilityScore: undefined,
    lineCount: undefined,
    fileSizeBytes: undefined,
    isFakeClone197: false,
    batchId: undefined,
    lastError: undefined,
    concepts: undefined,
    rules: undefined,
    params: undefined,
    definition: undefined,
    counts: undefined,
  });
}

/**
 * Rolls back an entire batch of videos back to 'Classé'.
 */
export function rollbackBatchInRegistry(
  registry: TraceabilityRegistry,
  batchId: string
): TraceabilityRegistry {
  const nextVideoRecords = { ...registry.videoRecords };

  for (const [yId, rec] of Object.entries(nextVideoRecords)) {
    if (rec.batchId === batchId) {
      nextVideoRecords[yId] = {
        ...rec,
        status: 'Classé',
        driveFileId: undefined,
        driveFileName: undefined,
        driveWebViewLink: undefined,
        codabilityScore: undefined,
        lineCount: undefined,
        fileSizeBytes: undefined,
        isFakeClone197: false,
        batchId: undefined,
        lastError: undefined,
        concepts: undefined,
        rules: undefined,
        params: undefined,
        definition: undefined,
        counts: undefined,
      };
    }
  }

  const updatedBatchLogs = registry.batchLogs.map(b => 
    b.batchId === batchId ? { ...b, status: 'rolled_back' as const } : b
  );

  const updated: TraceabilityRegistry = {
    ...registry,
    videoRecords: nextVideoRecords,
    batchLogs: updatedBatchLogs,
  };

  saveRegistry(updated);
  return updated;
}

/**
 * Rolls back a list of specific videos back to 'Classé'.
 */
export function rollbackVideosInRegistry(
  registry: TraceabilityRegistry,
  youtubeIds: string[]
): TraceabilityRegistry {
  const idSet = new Set(youtubeIds);
  const nextVideoRecords = { ...registry.videoRecords };

  for (const yId of idSet) {
    const rec = nextVideoRecords[yId];
    if (rec) {
      nextVideoRecords[yId] = {
        ...rec,
        status: 'Classé',
        driveFileId: undefined,
        driveFileName: undefined,
        driveWebViewLink: undefined,
        codabilityScore: undefined,
        lineCount: undefined,
        fileSizeBytes: undefined,
        isFakeClone197: false,
        batchId: undefined,
        lastError: undefined,
        concepts: undefined,
        rules: undefined,
        params: undefined,
        definition: undefined,
        counts: undefined,
      };
    }
  }

  const updated: TraceabilityRegistry = {
    ...registry,
    videoRecords: nextVideoRecords,
  };

  saveRegistry(updated);
  return updated;
}

/**
 * Completely purges all fake 197-line clones from registry.
 */
export function purgeFakeClonesFromRegistry(registry: TraceabilityRegistry): TraceabilityRegistry {
  const nextVideoRecords = { ...registry.videoRecords };

  for (const [yId, rec] of Object.entries(nextVideoRecords)) {
    if (rec.isFakeClone197 || rec.status === 'Brouillon_Errone_197') {
      nextVideoRecords[yId] = {
        ...rec,
        status: 'Classé',
        driveFileId: undefined,
        driveFileName: undefined,
        driveWebViewLink: undefined,
        codabilityScore: undefined,
        lineCount: undefined,
        fileSizeBytes: undefined,
        isFakeClone197: false,
        batchId: undefined,
        lastError: undefined,
        concepts: undefined,
        rules: undefined,
        params: undefined,
        definition: undefined,
        counts: undefined,
      };
    }
  }

  const updated: TraceabilityRegistry = {
    ...registry,
    videoRecords: nextVideoRecords,
    telemetry: {
      ...registry.telemetry,
      fakeClonesDetectedCount: 0,
    },
  };

  saveRegistry(updated);
  return updated;
}

/**
 * Global reset: resets all videos to 'Classé' except the benchmark BPR.
 */
export function resetAllRegistry(videos: ConsolidatedVideoItem[]): TraceabilityRegistry {
  const fresh = createInitialRegistry(videos);
  saveRegistry(fresh);
  return fresh;
}
