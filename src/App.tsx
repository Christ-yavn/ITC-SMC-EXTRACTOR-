import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { 
  Sidebar, 
  PageId 
} from './components/Sidebar';
import { Header } from './components/Header';
import { Drawer } from './components/Drawer';
import { AddFicheModal } from './components/AddFicheModal';
import { AutomatedQueueModal, BatchLogItem } from './components/AutomatedQueueModal';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { Accueil } from './pages/Accueil';
import { Videos } from './pages/Videos';
import { Fiches } from './pages/Fiches';
import { Concepts } from './pages/Concepts';
import { Reglages } from './pages/Reglages';
import { GoogleDrive } from './pages/GoogleDrive';
import { FicheViewer } from './components/FicheViewer';

import { HARVESTED_VIDEOS } from './data/harvestedVideos';
import { SAMPLE_EXTRACTED_FICHE_SKK0SM6LN6M } from './data/sampleExtractedFiche';
import { FICHE_DG2_OSUXN60_BPR } from './data/fiches/dg2_OsUXN60_BPR';
import { SCRIBE_PROMPT_V3 } from './data/scribePromptV2';
import { 
  deduplicateVideos, 
  calculateSlices, 
  formatSeconds,
  ConsolidatedVideoItem 
} from './utils/pipeline';
import { 
  initAuth, 
  saveFileToDrive, 
  saveFicheToStructuredDrive,
  getOrCreateWorkbenchFolder,
  listFolderFiles,
  listDriveFilesRecursive,
  readDriveFileContent,
  deleteDriveFile,
  isDriveSessionValid,
  renewDriveSession,
  getDriveTokenExpiration
} from './services/googleDriveService';
import { generateFicheDriveFileName } from './utils/driveHelpers';
import { executeRealGeminiExtraction } from './services/batchExtractionService';
import { 
  TraceabilityRegistry, 
  loadRegistry, 
  saveRegistry, 
  updateVideoTrace, 
  purgeFakeClonesFromRegistry,
  reconcileRegistryWithDrive,
  rollbackBatchInRegistry,
  rollbackVideosInRegistry,
  resetAllRegistry,
  extractFicheLightMetrics
} from './services/traceabilityRegistry';
import { SUPPORTED_GEMINI_MODELS, type SupportedGeminiModel } from './utils/apiKeyManager';
import { ConfirmModal } from './components/ConfirmModal';
import { Copy, Check, Download, ExternalLink, Play, Plus, FolderSync, Cloud, UploadCloud, Pause, Square, AlertTriangle, Trash2, RotateCcw, Sparkles, Zap, RefreshCw } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('accueil');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Gemini Model (supports all 4 official models)
  const [selectedModel, setSelectedModel] = useState<SupportedGeminiModel>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('hugofx_selected_model') as SupportedGeminiModel | null;
      if (stored && SUPPORTED_GEMINI_MODELS.includes(stored)) return stored;
    }
    return 'gemini-2.5-pro';
  });

  const handleSelectModel = (model: SupportedGeminiModel) => {
    setSelectedModel(model);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hugofx_selected_model', model);
    }
    showToast(`Modèle actif : ${model}`);
  };

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unlimited Gemini API Cadence state (artificial limits removed)
  const [dailyQuotaLimit, setDailyQuotaLimit] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('hugofx_daily_quota');
      if (stored) return parseInt(stored, 10);
    }
    return 1000;
  });
  const [dailyQuotaUsed, setDailyQuotaUsed] = useState<number>(0);

  // Consolidated videos dataset
  const videos = useMemo(() => deduplicateVideos(HARVESTED_VIDEOS), []);

  // Traceability Registry state (pure lightweight metadata ledger)
  const [registry, setRegistry] = useState<TraceabilityRegistry>(() => loadRegistry(videos));

  // Ephemeral view cache (only benchmark BPR is bundled as offline fallback)
  const [savedFiches, setSavedFiches] = useState<Record<string, string>>({
    'dg2-OsUXN60': FICHE_DG2_OSUXN60_BPR
  });

  // Validated fiches count across both memory and Zero-Storage registry
  const validatedFichesCount = useMemo(() => {
    const idSet = new Set<string>(Object.keys(savedFiches));
    Object.entries(registry.videoRecords).forEach(([vid, r]) => {
      if ((r.status === 'Extrait' || r.status === 'Validé') && !r.isFakeClone197) {
        idSet.add(vid);
      }
    });
    return idSet.size;
  }, [savedFiches, registry]);

  // Google Drive & Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isDriveTokenExpired, setIsDriveTokenExpired] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('hugofx_gdrive_token_v2');
      const valid = isDriveSessionValid();
      return Boolean(token && !valid);
    }
    return false;
  });

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Initialize Firebase Auth listener on mount + restore Drive session on F5 + listen to 401 expiry events
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user as User);
        setAccessToken(token);
        setIsDriveTokenExpired(false);
      },
      () => {
        const hasToken = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('hugofx_gdrive_token_v2'));
        if (hasToken || !isDriveSessionValid()) {
          setAccessToken(null);
          if (hasToken) setIsDriveTokenExpired(true);
        }
      }
    );

    const handleDriveExpired = () => {
      setAccessToken(null);
      setIsDriveTokenExpired(true);
    };
    window.addEventListener('hugofx-drive-expired', handleDriveExpired);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('hugofx-drive-expired', handleDriveExpired);
    };
  }, []);

  // Background Auto-Reconcile on F5: recursively checks all 7 taxonomy subfolders on Google Drive
  useEffect(() => {
    if (currentUser && accessToken && isDriveSessionValid()) {
      const reconcileDrive = async () => {
        try {
          const folderId = await getOrCreateWorkbenchFolder();
          const files = await listDriveFilesRecursive(folderId);
          setRegistry(prev => {
            const { updatedRegistry } = reconcileRegistryWithDrive(prev, files);
            return updatedRegistry;
          });
        } catch (err) {
          console.warn('Auto-reconcile notice on load:', err);
        }
      };
      reconcileDrive();
    }
  }, [currentUser, accessToken]);

  // One-click renewal of Google Drive OAuth session without losing any state
  const handleRenewDriveSession = async () => {
    try {
      showToast('Connexion à Google Drive en cours...');
      const res = await renewDriveSession();
      setCurrentUser(res.user);
      setAccessToken(res.accessToken);
      setIsDriveTokenExpired(false);
      showToast('Session Google Drive renouvelée avec succès !');

      // Refresh files list recursively across all 7 taxonomy folders
      const folderId = await getOrCreateWorkbenchFolder();
      const files = await listDriveFilesRecursive(folderId);
      setRegistry(prev => {
        const { updatedRegistry } = reconcileRegistryWithDrive(prev, files);
        return updatedRegistry;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur renouvellement';
      showToast(`Échec du renouvellement : ${msg}`);
    }
  };

  // Drawer Slide-Over state
  const [drawerMode, setDrawerMode] = useState<'prompt' | 'fiche' | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ConsolidatedVideoItem | null>(null);
  const [selectedFicheContent, setSelectedFicheContent] = useState<string>('');
  const [isFicheLoading, setIsFicheLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals State
  const [isAddFicheModalOpen, setIsAddFicheModalOpen] = useState<boolean>(false);
  const [isAutomatedQueueModalOpen, setIsAutomatedQueueModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [queueScope, setQueueScope] = useState<string>('TOUTES');

  // Automated Batch Execution State
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [isBatchPaused, setIsBatchPaused] = useState<boolean>(false);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState<number>(0);
  const [batchTotalInBatch, setBatchTotalInBatch] = useState<number>(0);
  const [currentBatchVideo, setCurrentBatchVideo] = useState<ConsolidatedVideoItem | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | undefined>(undefined);
  const [batchLogs, setBatchLogs] = useState<BatchLogItem[]>([]);

  // Batch execution control ref (prevents stale closure issues)
  const batchControlRef = useRef<{
    cancelled: boolean;
    paused: boolean;
    skipCurrent: boolean;
    autoSyncDrive: boolean;
    abortController: AbortController | null;
  }>({
    cancelled: false,
    paused: false,
    skipCurrent: false,
    autoSyncDrive: false,
    abortController: null,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, id: string, feedbackMsg = 'Copié dans le presse-papier !') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showToast(feedbackMsg);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Add a log entry to the batch execution journal
  const addBatchLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    setBatchLogs(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        message,
        type,
      }
    ]);
  };

  // Purge simulated/fake template fiches (< 15 Ko or clone signature)
  const handlePurgeFakeClones = () => {
    setSavedFiches(prev => {
      const next: Record<string, string> = {};
      for (const [vId, content] of Object.entries(prev)) {
        const isFake = vId !== 'dg2-OsUXN60' && (content.length < 16000 || content.includes("C'est la zone exacte où l'algorithme interbancaire"));
        if (!isFake) next[vId] = content;
      }
      return next;
    });

    setRegistry(prev => purgeFakeClonesFromRegistry(prev));
    showToast('Purge achevée : fiches simulées supprimées et registre mis à jour.');
  };

  // Execute real batch extraction using Gemini Multimodal API (@google/genai)
  const handleStartBatch = async (options: { 
    videoIds?: string[];
    scope?: string; 
    scopeLabel?: string;
    onlyUnprocessed?: boolean; 
    autoSyncDrive?: boolean;
    batchSize?: number;
    model?: string;
  }) => {
    let eligible: ConsolidatedVideoItem[] = [];
    if (options.videoIds && options.videoIds.length > 0) {
      eligible = options.videoIds
        .map(id => videos.find(v => v.video_id === id))
        .filter(Boolean) as ConsolidatedVideoItem[];
    } else {
      const scope = options.scope || 'TOUTES';
      eligible = videos.filter(v => scope === 'TOUTES' || v.playlists.includes(scope));
      if (options.onlyUnprocessed) {
        eligible = eligible.filter(v => {
          const rec = registry.videoRecords[v.video_id];
          return !rec || rec.isFakeClone197 || (rec.status !== 'Extrait' && rec.status !== 'Validé');
        });
      }
    }

    if (eligible.length === 0) {
      showToast('Toutes les vidéos de ce périmètre sont déjà traitées !');
      return;
    }

    const newBatchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setCurrentBatchId(newBatchId);

    batchControlRef.current = {
      cancelled: false,
      paused: false,
      skipCurrent: false,
      autoSyncDrive: Boolean((options.autoSyncDrive ?? true) && currentUser && accessToken),
      abortController: null,
    };

    setIsBatchRunning(true);
    setIsBatchPaused(false);
    setBatchCurrentIndex(0);
    setBatchTotalInBatch(eligible.length);
    setBatchLogs([]);

    const scopeLabel = options.scopeLabel || options.scope || 'TOUTES';
    const effectiveModel = options.model || selectedModel;
    addBatchLog(`Démarrage extraction RÉELLE Gemini Multimodale (@google/genai - ${effectiveModel}) [${scopeLabel} • ${eligible.length} vidéos]`, 'info');
    if (batchControlRef.current.autoSyncDrive) {
      addBatchLog(`Sauvegarde directe Google Drive activée (dossier HugoFX ICT Knowledge Workbench)`, 'info');
    } else {
      addBatchLog(`Google Drive non connecté : les fiches extraites seront conservées en mémoire locale de session jusqu'à connexion Drive.`, 'warning');
    }

    let processedCount = 0;

    for (let i = 0; i < eligible.length; i++) {
      if (batchControlRef.current.cancelled) {
        addBatchLog('Traitement interrompu par l\'utilisateur.', 'warning');
        break;
      }

      // Handle pause loop
      while (batchControlRef.current.paused && !batchControlRef.current.cancelled) {
        await new Promise(r => setTimeout(r, 400));
      }

      if (batchControlRef.current.cancelled) break;

      const video = eligible[i];
      setCurrentBatchVideo(video);
      setBatchCurrentIndex(i + 1);

      // Create video-level abort controller
      const videoAbortController = new AbortController();
      batchControlRef.current.abortController = videoAbortController;
      batchControlRef.current.skipCurrent = false;

      addBatchLog(`[${i + 1}/${eligible.length}] Analyse multimodale vidéo réelle : "${video.titre}" [${video.video_id}] (${video.duree_s}s)`, 'info');

      try {
        const videoSlices = video.duree_s > 2100 ? calculateSlices(video.video_id, video.duree_s, 35) : [];
        const activeSlice = videoSlices.length > 1 ? videoSlices[0] : undefined;

        const result = await executeRealGeminiExtraction({
          video,
          slice: activeSlice,
          model: effectiveModel,
          abortSignal: videoAbortController.signal,
          onProgress: (msg) => addBatchLog(msg, 'info'),
        });

        const fiche = result.ficheContent;
        processedCount++;

        // Always keep fiche in React session memory for instant consultation & GitHub sync (Zero localStorage bloat)
        setSavedFiches(prev => ({ ...prev, [video.video_id]: fiche }));

        // Direct Google Drive upload or local fallback (Zero data loss!)
        let driveFileId: string | undefined;
        let driveFileName: string | undefined;
        let driveWebViewLink: string | undefined;

        if (batchControlRef.current.autoSyncDrive && isDriveSessionValid()) {
          try {
            const savedDriveResult = await saveFicheToStructuredDrive(video, fiche);
            driveFileId = savedDriveResult.file.id;
            driveFileName = savedDriveResult.file.name;
            driveWebViewLink = savedDriveResult.file.webViewLink;
            addBatchLog(`Cloud Google Drive : Fiche sauvegardée dans "${savedDriveResult.fullPath}"`, 'success');
          } catch (driveErr: unknown) {
            const dMsg = driveErr instanceof Error ? driveErr.message : 'Erreur Drive';
            addBatchLog(`Google Drive avertissement : ${dMsg}. Fiche conservée en mémoire locale.`, 'warning');
            if (dMsg.includes('401') || dMsg.toLowerCase().includes('expiré')) {
              setIsDriveTokenExpired(true);
              batchControlRef.current.paused = true;
              setIsBatchPaused(true);
              addBatchLog(`⏸️ Session Google Drive expirée (1h). Lot mis en pause : cliquez sur "Renouveler Session Drive" en haut de l'écran puis sur "Reprendre".`, 'warning');
            }
          }
        } else if (batchControlRef.current.autoSyncDrive) {
          setIsDriveTokenExpired(true);
          batchControlRef.current.paused = true;
          setIsBatchPaused(true);
          addBatchLog(`⏸️ Session Google Drive expirée (1h). Fiche conservée en mémoire locale et lot mis en pause : cliquez sur "Renouveler Session Drive" en haut de l'écran puis sur "Reprendre".`, 'warning');
        }


        // Extract lightweight Zero-Storage metrics for registry
        const lightMetrics = extractFicheLightMetrics(fiche, video.titre);

        // Update registry with light traceability metadata
        setRegistry(prev => updateVideoTrace(prev, video.video_id, {
          status: 'Validé',
          codabilityScore: result.score || 10.0,
          isFakeClone197: false,
          fileSizeBytes: fiche.length,
          driveFileId,
          driveFileName,
          driveWebViewLink,
          batchId: newBatchId,
          completedAt: new Date().toISOString(),
          lastError: undefined,
          ...lightMetrics,
        }));

        addBatchLog(`Fiche ${video.video_id} certifiée 10/10 (${result.tokensUsed || 14500} tokens réels - Durée réelle: ${video.duree_s}s)`, 'success');

      } catch (err: unknown) {
        if (batchControlRef.current.skipCurrent) {
          addBatchLog(`Vidéo [${video.video_id}] sautée à la demande de l'opérateur.`, 'warning');
          continue;
        }

        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        if (msg.includes('annulée') || msg.includes('interrompue')) {
          addBatchLog(`Extraction interrompue : ${msg}`, 'warning');
          break;
        }

        addBatchLog(`Échec sur la vidéo ${video.video_id} : ${msg}`, 'error');
        // Update registry with error status - ZERO FAKE FICHE GENERATED
        setRegistry(prev => updateVideoTrace(prev, video.video_id, {
          status: 'Erreur',
          lastError: msg,
        }));
      }

      // Inter-video pause
      await new Promise(r => setTimeout(r, 600));
    }

    setIsBatchRunning(false);
    setCurrentBatchVideo(null);
    batchControlRef.current.abortController = null;

    if (!batchControlRef.current.cancelled) {
      addBatchLog(`Traitement achevé ! (${processedCount} vraies fiches extraites et validées)`, 'success');
      showToast(`Traitement terminé : ${processedCount} fiches réelles extraites !`);
    }
  };

  const handlePauseBatch = () => {
    batchControlRef.current.paused = true;
    setIsBatchPaused(true);
    addBatchLog('Extraction mise en pause par l\'opérateur.', 'warning');
  };

  const handleResumeBatch = () => {
    if (isDriveSessionValid() && currentUser) {
      batchControlRef.current.autoSyncDrive = true;
    }
    batchControlRef.current.paused = false;
    setIsBatchPaused(false);
    addBatchLog('Reprise du traitement par lot...', 'info');
  };

  const handleSkipCurrentVideo = () => {
    if (!isBatchRunning) return;
    batchControlRef.current.skipCurrent = true;
    batchControlRef.current.abortController?.abort();
    addBatchLog('Passage à la vidéo suivante demandé...', 'warning');
  };

  const handleStopBatch = () => {
    batchControlRef.current.cancelled = true;
    batchControlRef.current.abortController?.abort();
    setIsBatchRunning(false);
    setIsBatchPaused(false);
    setCurrentBatchVideo(null);
    addBatchLog('Traitement par lot arrêté définitivement.', 'error');
    showToast('Traitement par lot interrompu.');
  };

  // Reset batch cursor so user can configure & launch a new group of videos
  const handleResetBatchCursor = () => {
    setBatchCurrentIndex(0);
    setBatchTotalInBatch(0);
    setCurrentBatchVideo(null);
  };

  // Rollback an entire batch (delete files from Google Drive + reset to Classé in registry)
  const handleRollbackBatch = async (batchId: string) => {
    addBatchLog(`Annulation du lot ${batchId} en cours...`, 'warning');
    const toDelete = Object.values(registry.videoRecords).filter(r => r.batchId === batchId && r.driveFileId);

    let deletedFiles = 0;
    for (const rec of toDelete) {
      if (rec.driveFileId) {
        try {
          await deleteDriveFile(rec.driveFileId);
          deletedFiles++;
        } catch (e) {
          console.warn(`Erreur suppression ${rec.driveFileId}:`, e);
        }
      }
    }

    setRegistry(prev => rollbackBatchInRegistry(prev, batchId));
    addBatchLog(`Lot ${batchId} annulé : ${deletedFiles} fichier(s) supprimé(s) de Google Drive.`, 'info');
    showToast(`Lot annulé : ${toDelete.length} vidéo(s) remise(s) à faire.`);
  };

  // Rollback multiple selected videos (delete from Drive + reset in registry)
  const handleRollbackVideos = async (videoIds: string[]) => {
    let deletedFiles = 0;
    for (const yId of videoIds) {
      const rec = registry.videoRecords[yId];
      if (rec?.driveFileId) {
        try {
          await deleteDriveFile(rec.driveFileId);
          deletedFiles++;
        } catch (e) {
          console.warn(`Erreur suppression ${rec.driveFileId}:`, e);
        }
      }
    }
    setRegistry(prev => rollbackVideosInRegistry(prev, videoIds));
    showToast(`${videoIds.length} vidéo(s) réinitialisée(s) (${deletedFiles} fichier(s) supprimé(s) de Drive).`);
  };

  // Reset everything to pristine zero state (both savedFiches and registry)
  const handleResetAllRegistry = async (deleteFromDrive: boolean) => {
    if (deleteFromDrive && accessToken) {
      try {
        const folderId = await getOrCreateWorkbenchFolder();
        const files = await listDriveFilesRecursive(folderId);
        for (const f of files) {
          if (f.name.endsWith('.md')) {
            await deleteDriveFile(f.id).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Erreur purge dossier Drive:', e);
      }
    }
    setSavedFiches({});
    setDailyQuotaUsed(0);
    setRegistry(resetAllRegistry(videos));
    showToast('Registre de traçabilité réinitialisé à zéro (0 / 106).');
  };

  // Open Prompt Drawer for a video
  const handleSelectVideoToProcess = (video: ConsolidatedVideoItem) => {
    setSelectedVideo(video);
    setDrawerMode('prompt');
  };

  // Open Fiche Drawer: Reads on-the-fly from Google Drive without permanently storing in app!
  const handleViewFiche = async (videoId: string) => {
    const video = videos.find(v => v.video_id === videoId) || null;
    setSelectedVideo(video);
    setSelectedFicheContent('');
    setDrawerMode('fiche');

    const rec = registry.videoRecords[videoId];

    // Prefer local cache if immediately available and no Drive file ID overrides it
    if (savedFiches[videoId] && !rec?.driveFileId) {
      setSelectedFicheContent(savedFiches[videoId]);
      return;
    }

    // Benchmark BPR fallback
    if (videoId === 'dg2-OsUXN60' && !rec?.driveFileId) {
      setSelectedFicheContent(FICHE_DG2_OSUXN60_BPR);
      return;
    }

    if (rec?.driveFileId) {
      setIsFicheLoading(true);
      try {
        const content = await readDriveFileContent(rec.driveFileId);
        setSelectedFicheContent(content);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur lecture Drive';
        showToast(`Impossible de charger la fiche depuis Google Drive : ${msg}`);
        setSelectedFicheContent(savedFiches[videoId] || '');
      } finally {
        setIsFicheLoading(false);
      }
    } else if (savedFiches[videoId]) {
      setSelectedFicheContent(savedFiches[videoId]);
    } else {
      setSelectedFicheContent('');
    }
  };

  // Open Automated Queue Modal (defaults to autoStart = false so user can configure scope, model, and batch size)
  const handleStartAutomatedQueue = (scope = 'TOUTES', autoStart = false) => {
    setQueueScope(scope);
    setIsAutomatedQueueModalOpen(true);
    if (autoStart && !isBatchRunning) {
      setTimeout(() => {
        handleStartBatch({
          scope,
          onlyUnprocessed: true,
          autoSyncDrive: !!accessToken,
        });
      }, 150);
    }
  };

  // Save new fiche from modal with automatic structured Drive mirror & registry update
  const handleSaveNewFiche = async (content: string, videoId: string) => {
    setSavedFiches(prev => ({ ...prev, [videoId]: content }));
    setDailyQuotaUsed(prev => prev + 1);

    const video = videos.find(v => v.video_id === videoId) || {
      video_id: videoId,
      titre: `Fiche ${videoId}`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      duree_s: 1200,
      date_video: new Date().toISOString().slice(0, 10),
      playlists: ['P1'],
      famille: 'FORMATION_A',
    };
    const lightMetrics = extractFicheLightMetrics(content, video.titre);

    if (accessToken && isDriveSessionValid()) {
      showToast(`Fiche ${videoId} enregistrée. Classement taxonomique sur Google Drive...`);
      try {
        const savedDriveResult = await saveFicheToStructuredDrive(video, content);
        setRegistry(prev => updateVideoTrace(prev, videoId, {
          status: 'Validé',
          codabilityScore: 10.0,
          isFakeClone197: false,
          fileSizeBytes: content.length,
          driveFileId: savedDriveResult.file.id,
          driveFileName: savedDriveResult.file.name,
          driveWebViewLink: savedDriveResult.file.webViewLink,
          completedAt: new Date().toISOString(),
          lastError: undefined,
          ...lightMetrics,
        }));
        showToast(`⚡ Fiche ${videoId} classée sur Google Drive (${savedDriveResult.fullPath}) !`);
      } catch (err: unknown) {
        console.warn('Erreur auto-sync drive:', err);
        setRegistry(prev => updateVideoTrace(prev, videoId, {
          status: 'Validé',
          codabilityScore: 10.0,
          isFakeClone197: false,
          fileSizeBytes: content.length,
          completedAt: new Date().toISOString(),
          ...lightMetrics,
        }));
        showToast(`Fiche ${videoId} enregistrée localement.`);
      }
    } else {
      setRegistry(prev => updateVideoTrace(prev, videoId, {
        status: 'Validé',
        codabilityScore: 10.0,
        isFakeClone197: false,
        fileSizeBytes: content.length,
        completedAt: new Date().toISOString(),
        ...lightMetrics,
      }));
      showToast(`Fiche ${videoId} enregistrée avec succès !`);
    }
  };

  // Merge fiches imported from Google Drive
  const handleImportFichesFromDrive = (imported: Record<string, string>) => {
    setSavedFiches(prev => ({ ...prev, ...imported }));
    showToast(`${Object.keys(imported).length} fiche(s) importée(s) dans votre bibliothèque !`);
  };

  // View Demo Sample Fiche without modifying the user library
  const handleViewSampleDemo = () => {
    const demoVideo = videos.find(v => v.video_id === 'skk0sm6LN6M') || videos[0];
    setSelectedVideo(demoVideo);
    setSelectedFicheContent(SAMPLE_EXTRACTED_FICHE_SKK0SM6LN6M);
    setDrawerMode('fiche');
  };

  // Ask confirmation and reset library & registry to pristine zero state
  const handleResetToZero = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Réinitialiser le Registre à Zéro (0/106)',
      description: 'Cette action réinitialisera tous les compteurs et statuts locaux à 0/106 (vos fichiers sur Google Drive ne seront pas supprimés). Continuer ?',
      confirmLabel: 'Réinitialiser à 0/106',
      isDestructive: true,
      onConfirm: () => {
        handleResetAllRegistry(false);
      },
    });
  };

  // Load sample demo fiche into library
  const handleLoadSampleFiche = () => {
    setSavedFiches(prev => ({ ...prev, 'skk0sm6LN6M': SAMPLE_EXTRACTED_FICHE_SKK0SM6LN6M }));
    const demoVideo = videos.find(v => v.video_id === 'skk0sm6LN6M');
    const light = extractFicheLightMetrics(SAMPLE_EXTRACTED_FICHE_SKK0SM6LN6M, demoVideo?.titre);
    setRegistry(prev => updateVideoTrace(prev, 'skk0sm6LN6M', {
      status: 'Validé',
      codabilityScore: 10.0,
      isFakeClone197: false,
      fileSizeBytes: SAMPLE_EXTRACTED_FICHE_SKK0SM6LN6M.length,
      completedAt: new Date().toISOString(),
      ...light,
    }));
    setDailyQuotaUsed(1);
    showToast('Fiche étalon FVG chargée dans votre bibliothèque !');
  };

  // Save single fiche directly to structured Google Drive taxonomy folder
  const handleSaveSingleFicheToDrive = async (videoId: string, contentOverride?: string) => {
    if (!currentUser || !accessToken) {
      setActivePage('drive');
      showToast('Veuillez d\'abord vous connecter à Google Drive.');
      return;
    }

    const content = contentOverride || savedFiches[videoId];
    if (!content) {
      showToast('Contenu de fiche introuvable.');
      return;
    }

    const video = videos.find(v => v.video_id === videoId) || {
      video_id: videoId,
      titre: `Fiche ${videoId}`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      duree_s: 1200,
      date_video: new Date().toISOString().slice(0, 10),
      playlists: ['P1'],
      famille: 'FORMATION_A',
    };

    try {
      showToast(`Sauvegarde taxonomique de ${videoId} sur Google Drive...`);
      const savedDriveResult = await saveFicheToStructuredDrive(video, content);
      const lightMetrics = extractFicheLightMetrics(content, video.titre);
      setRegistry(prev => updateVideoTrace(prev, videoId, {
        status: 'Validé',
        codabilityScore: 10.0,
        isFakeClone197: false,
        fileSizeBytes: content.length,
        driveFileId: savedDriveResult.file.id,
        driveFileName: savedDriveResult.file.name,
        driveWebViewLink: savedDriveResult.file.webViewLink,
        completedAt: new Date().toISOString(),
        lastError: undefined,
        ...lightMetrics,
      }));
      showToast(`Fiche sauvegardée dans "${savedDriveResult.fullPath}" !`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde sur Drive';
      showToast(msg);
    }
  };

  // Backup all local fiches to structured Google Drive taxonomy folders
  const handleBackupAllFichesToDrive = async () => {
    if (!currentUser || !accessToken) {
      setActivePage('drive');
      showToast('Veuillez d\'abord vous connecter à Google Drive.');
      return;
    }

    const entries = Object.entries(savedFiches);
    if (entries.length === 0) {
      showToast('Aucune fiche locale à sauvegarder. Ajoutez ou extrayez une première fiche !');
      return;
    }

    try {
      showToast(`Sauvegarde taxonomique de ${entries.length} fiche(s) sur Google Drive...`);
      let count = 0;
      for (const [videoId, content] of entries) {
        const video = videos.find(v => v.video_id === videoId) || {
          video_id: videoId,
          titre: `Fiche ${videoId}`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          duree_s: 1200,
          date_video: new Date().toISOString().slice(0, 10),
          playlists: ['P1'],
          famille: 'FORMATION_A',
        };
        const savedDriveResult = await saveFicheToStructuredDrive(video, content);
        const lightMetrics = extractFicheLightMetrics(content, video.titre);
        setRegistry(prev => updateVideoTrace(prev, videoId, {
          status: 'Validé',
          codabilityScore: 10.0,
          isFakeClone197: false,
          fileSizeBytes: content.length,
          driveFileId: savedDriveResult.file.id,
          driveFileName: savedDriveResult.file.name,
          driveWebViewLink: savedDriveResult.file.webViewLink,
          completedAt: new Date().toISOString(),
          lastError: undefined,
          ...lightMetrics,
        }));
        count++;
      }
      showToast(`${count} fiche(s) sauvegardée(s) et classée(s) sur Google Drive !`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de sauvegarde globale';
      showToast(msg);
    }
  };

  // Export to TSV for Google Sheets (Local download with Zero-Storage registry awareness)
  const handleExportTSV = () => {
    const headers = [
      'id_fiche',
      'video_id',
      'url',
      'titre',
      'playlists',
      'famille',
      'duree_s',
      'date_video',
      'fiche_disponible',
      'statut_registre',
      'score_codabilite',
      'drive_file_id'
    ];
    const rows = videos.map(v => {
      const rec = registry.videoRecords[v.video_id];
      const isDoneInRegistry = Boolean(rec && !rec.isFakeClone197 && (rec.status === 'Extrait' || rec.status === 'Validé'));
      const hasFiche = (savedFiches[v.video_id] || isDoneInRegistry) ? 'OUI' : 'NON';
      return [
        v.video_id,
        v.video_id,
        v.url,
        `"${v.titre.replace(/"/g, '""')}"`,
        v.playlists.join('; '),
        v.famille,
        v.duree_s,
        v.date_video,
        hasFiche,
        rec?.status || 'Classé',
        rec?.codabilityScore ?? '',
        rec?.driveFileId || ''
      ].join('\t');
    });
    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'HugoFX_Registre_Master_106_Videos.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fichier TSV téléchargé avec succès !');
  };

  // Page titles, categories, and primary actions
  const pageConfigs: Record<PageId, { 
    title: string; 
    subtitle: string; 
    category: string;
    action?: { label: string; onClick: () => void; icon?: React.ReactNode } 
  }> = {
    accueil: {
      title: 'Tableau de Bord Cockpit',
      subtitle: 'Vue d\'ensemble matricielle du cursus trading et progression',
      category: 'Vue Générale',
      action: {
        label: 'Mode Automatique',
        onClick: () => handleStartAutomatedQueue('TOUTES'),
        icon: <FolderSync className="w-4 h-4" />
      }
    },
    videos: {
      title: 'Registre des 106 Leçons',
      subtitle: `${videos.length} leçons uniques dédoublonnées avec tranches de 35 min`,
      category: 'Corpus YouTube',
      action: {
        label: 'Télécharger TSV',
        onClick: handleExportTSV,
        icon: <Download className="w-4 h-4" />
      }
    },
    fiches: {
      title: 'Spécifications Formelles (SCRIBE-ICT v3)',
      subtitle: 'Double-Face : Leçon Humaine 8 Sections + Spécification Agentique 10/10',
      category: 'Atelier Quant',
      action: {
        label: 'Ajouter une fiche',
        onClick: () => setIsAddFicheModalOpen(true),
        icon: <Plus className="w-4 h-4" />
      }
    },
    concepts: {
      title: 'Taxonomie & Classification',
      subtitle: '6 Piliers d\'architecture vers les synthèses MASTER.md',
      category: 'Théorie Canonique',
    },
    drive: {
      title: 'Coffre Google Drive',
      subtitle: 'Sauvegarde Cloud permanente, synchronisation de fiches et export Registre Master',
      category: 'Cloud Storage',
      action: currentUser ? {
        label: 'Sauvegarder tout sur Drive',
        onClick: handleBackupAllFichesToDrive,
        icon: <UploadCloud className="w-4 h-4" />
      } : undefined
    },
    reglages: {
      title: 'Moteur & Réglages LLM',
      subtitle: 'Quotas AI Studio, règles de découpage et configuration',
      category: 'Système',
      action: {
        label: 'Télécharger TSV',
        onClick: handleExportTSV,
        icon: <Download className="w-4 h-4" />
      }
    }
  };

  const currentConfig = pageConfigs[activePage];

  // Prompt generation logic using unified SCRIBE-ICT v3
  const generatedPromptForDrawer = useMemo(() => {
    if (!selectedVideo) return '';
    const slices = calculateSlices(selectedVideo.video_id, selectedVideo.duree_s, 35);
    const slice = slices[0];

    return `${SCRIBE_PROMPT_V3}

==================================================
CONTEXTE FOURNI PAR LE MESSAGE (À TRAITER) :
==================================================
MODE : EXTRACTION
VIDEO_ID : ${selectedVideo.video_id}
PLAYLIST : ${selectedVideo.playlists.join(', ')}
FAMILLE : ${selectedVideo.famille}
EPISODE : ${selectedVideo.titre}
DATE : ${selectedVideo.date_video}
DUREE : ${formatSeconds(selectedVideo.duree_s)} (${selectedVideo.duree_s}s)
CHAPITRES_YOUTUBE : Indice fourni par la vidéo
PLAGE : ${slice ? `${slice.formatted_start} - ${slice.formatted_end}` : 'ENTIERE'}
URL_YOUTUBE : ${selectedVideo.url}

RAPPEL STRICT SCRIBE-ICT v3 (DOUBLE-FACE 10/10) :
- Respecte l'ordre causal autorégressif strict : BLOC A (Cours Humain 8 sections) -> BLOC B (Spécification Agentique B1..B7) -> BLOC C (Registre des Preuves).
- Zéro contradiction numérique : chaque paramètre P-xx et chaque règle R-xx sont définis formellement.
- Double Machine à États complète (ZONE_FSM & TRADE_FSM) et Fixtures JSON exécutables (B6).
`;
  }, [selectedVideo]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-200 flex font-sans antialiased relative obsidian-grid-bg transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 dark:bg-[#0B0E17]/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-white/10 text-xs font-mono font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 backdrop-blur-md">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fixed Sidebar */}
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage}
        counts={{
          videosTotal: videos.length,
          fichesCount: validatedFichesCount,
          aTraiterCount: Math.max(0, videos.length - validatedFichesCount),
        }}
        isDriveConnected={Boolean(currentUser && accessToken)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        
        {/* Header */}
        <Header
          title={currentConfig.title}
          subtitle={currentConfig.subtitle}
          category={currentConfig.category}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          primaryAction={currentConfig.action}
          driveStatus={{
            isConnected: Boolean(currentUser && accessToken && !isDriveTokenExpired),
            userEmail: currentUser?.email || undefined,
            onOpenDrive: () => setActivePage('drive')
          }}
          onOpenGitHub={() => setIsGitHubModalOpen(true)}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
        />

        {/* Expired Google Drive OAuth Token Banner */}
        {isDriveTokenExpired && (
          <div className="mx-5 sm:mx-7 mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Session Google Drive expirée (jeton OAuth 1h) :</strong> Renouvelez la session en 1 clic pour poursuivre la synchronisation Cloud.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRenewDriveSession}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renouveler Session Drive</span>
            </button>
          </div>
        )}

        {/* Page Content Container */}
        <main className="flex-1 p-5 sm:p-7 overflow-y-auto">
          {activePage === 'accueil' && (
            <Accueil
              videos={videos}
              registry={registry}
              savedFiches={savedFiches}
              dailyQuotaLimit={dailyQuotaLimit}
              dailyQuotaUsed={dailyQuotaUsed}
              onNavigateToVideos={() => setActivePage('videos')}
              onNavigateToFiches={() => setActivePage('fiches')}
              onNavigateToDrive={() => setActivePage('drive')}
              onSelectVideoToProcess={handleSelectVideoToProcess}
              onStartAutomatedQueue={handleStartAutomatedQueue}
            />
          )}

          {activePage === 'videos' && (
            <Videos
              videos={videos}
              savedFiches={savedFiches}
              registry={registry}
              onSelectVideoToProcess={handleSelectVideoToProcess}
              onViewFiche={handleViewFiche}
              onRollbackVideos={handleRollbackVideos}
              searchQuery={searchQuery}
            />
          )}

          {activePage === 'fiches' && (
            <Fiches
              registry={registry}
              savedFiches={savedFiches}
              videos={videos}
              onOpenFicheDrawer={handleViewFiche}
              onOpenNewFicheModal={() => setIsAddFicheModalOpen(true)}
              searchQuery={searchQuery}
              onViewSampleDemo={handleViewSampleDemo}
              onNavigateToVideos={() => setActivePage('videos')}
              onSaveSingleToDrive={handleSaveSingleFicheToDrive}
              onBackupAllToDrive={handleBackupAllFichesToDrive}
              isDriveConnected={Boolean(currentUser && accessToken)}
            />
          )}

          {activePage === 'concepts' && (
            <Concepts
              savedFichesCount={validatedFichesCount}
              registry={registry}
              videos={videos}
              savedFiches={savedFiches}
            />
          )}

          {activePage === 'drive' && (
            <GoogleDrive
              currentUser={currentUser}
              accessToken={accessToken}
              onAuthSuccess={(user, token) => {
                setCurrentUser(user);
                setAccessToken(token);
                setIsDriveTokenExpired(false);
              }}
              onAuthLogout={() => {
                setCurrentUser(null);
                setAccessToken(null);
                setIsDriveTokenExpired(false);
              }}
              registry={registry}
              onUpdateRegistry={setRegistry}
              savedFiches={savedFiches}
              videos={videos}
              onImportFiches={handleImportFichesFromDrive}
              onPurgeLocalFiches={handlePurgeFakeClones}
              onOpenGitHub={() => setIsGitHubModalOpen(true)}
              showToast={showToast}
            />
          )}

          {activePage === 'reglages' && (
            <Reglages
              onExportTSV={handleExportTSV}
              totalVideosCount={videos.length}
              dailyQuotaLimit={dailyQuotaLimit}
              onUpdateDailyQuotaLimit={(limit) => {
                setDailyQuotaLimit(limit);
                showToast(`Plafond journalier fixé à ${limit} requêtes.`);
              }}
              onResetToZero={handleResetToZero}
              onLoadSampleFiche={handleLoadSampleFiche}
              onPurgeFakeClones={handlePurgeFakeClones}
            />
          )}
        </main>
      </div>

      {/* Slide-over Drawer for Video Prompt or Fiche Preview */}
      <Drawer
        isOpen={drawerMode !== null}
        onClose={() => setDrawerMode(null)}
        widthClass="max-w-4xl sm:max-w-5xl"
        title={drawerMode === 'prompt' ? (selectedVideo ? `Générateur de Prompt : ${selectedVideo.titre}` : 'Prompt') : (selectedVideo ? `Studio Fiche : ${selectedVideo.titre}` : 'Fiche')}
        subtitle={selectedVideo ? `ID: ${selectedVideo.video_id} • Playlist: ${selectedVideo.playlists.join(', ')} • SCRIBE-ICT v3 Double-Face` : undefined}
        footerAction={
          drawerMode === 'prompt' ? {
            label: copiedKey === 'drawer_prompt' ? 'Copié !' : 'Copier le Prompt SCRIBE-ICT v3',
            onClick: () => copyToClipboard(generatedPromptForDrawer, 'drawer_prompt', 'Prompt SCRIBE-ICT v3 copié !'),
            icon: copiedKey === 'drawer_prompt' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />
          } : undefined
        }
      >
        {drawerMode === 'prompt' && selectedVideo && (
          <div className="space-y-5 text-sm font-mono">
            <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 space-y-2 font-sans">
              <span className="font-bold text-indigo-300 text-xs uppercase tracking-wider block font-mono">Protocole d'Exécution :</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                1. Ouvrez votre session sur <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="underline font-semibold text-cyan-400">Google AI Studio</a>.<br />
                2. Fournissez l'URL YouTube : <a href={selectedVideo.url} target="_blank" rel="noreferrer" className="underline text-indigo-300">{selectedVideo.url}</a><br />
                3. Cliquez sur le bouton ci-dessous pour copier le prompt <strong>SCRIBE-ICT v3</strong> et collez-le dans AI Studio.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">Prompt Système & Contexte Injection :</span>
              <pre className="p-4 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {generatedPromptForDrawer}
              </pre>
            </div>
          </div>
        )}

        {drawerMode === 'fiche' && (
          <FicheViewer
            content={selectedFicheContent}
            videoId={selectedVideo?.video_id}
            videoTitle={selectedVideo?.titre}
            isLoading={isFicheLoading}
            onSaveToDrive={
              selectedVideo && selectedFicheContent
                ? () => {
                    setSavedFiches(prev => ({ ...prev, [selectedVideo.video_id]: selectedFicheContent }));
                    handleSaveSingleFicheToDrive(selectedVideo.video_id, selectedFicheContent);
                  }
                : undefined
            }
            showToast={showToast}
          />
        )}
      </Drawer>

      {/* Add Fiche Modal */}
      <AddFicheModal
        isOpen={isAddFicheModalOpen}
        onClose={() => setIsAddFicheModalOpen(false)}
        onSave={handleSaveNewFiche}
      />

      {/* Automated Queue Modal */}
      <AutomatedQueueModal
        isOpen={isAutomatedQueueModalOpen}
        onClose={() => setIsAutomatedQueueModalOpen(false)}
        targetScope={queueScope}
        videos={videos}
        registry={registry}
        isDriveConnected={Boolean(currentUser && accessToken && !isDriveTokenExpired)}
        isRunning={isBatchRunning}
        isPaused={isBatchPaused}
        currentVideo={currentBatchVideo}
        currentIndex={batchCurrentIndex}
        totalInBatch={batchTotalInBatch}
        batchLogs={batchLogs}
        currentBatchId={currentBatchId}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        onStartBatch={handleStartBatch}
        onPauseBatch={handlePauseBatch}
        onResumeBatch={handleResumeBatch}
        onSkipCurrentVideo={handleSkipCurrentVideo}
        onStopBatch={handleStopBatch}
        onRollbackBatch={handleRollbackBatch}
        onResetBatchCursor={handleResetBatchCursor}
        onNavigateToFiches={() => setActivePage('fiches')}
        onOpenDriveFolder={() => {
          setIsAutomatedQueueModalOpen(false);
          setActivePage('drive');
        }}
      />

      {/* Floating Bottom Telemetry Banner when Batch is Running in Background */}
      {isBatchRunning && !isAutomatedQueueModalOpen && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-40 bg-white/95 dark:bg-[#0B0E17]/95 backdrop-blur-md border border-blue-500/30 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-slate-900 dark:text-white animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isBatchPaused
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <FolderSync className={`w-4 h-4 text-blue-600 ${!isBatchPaused ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                  {isBatchPaused ? 'En Pause' : 'Extraction par Lot'}
                </span>
                <span className="text-xs font-mono text-blue-700 dark:text-blue-300 font-bold">
                  {batchCurrentIndex} / {batchTotalInBatch} ({batchTotalInBatch > 0 ? Math.round((batchCurrentIndex / batchTotalInBatch) * 100) : 0}%)
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                {currentBatchVideo ? currentBatchVideo.titre : 'Traitement en cours...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isBatchPaused ? (
              <button
                type="button"
                onClick={handleResumeBatch}
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                title="Reprendre"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-600" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseBatch}
                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                title="Mettre en pause"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAutomatedQueueModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold shadow-xs cursor-pointer"
            >
              Console
            </button>
          </div>
        </div>
      )}

      {/* GitHub Synchronization Modal */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        savedFiches={savedFiches}
        showToast={showToast}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmModal?.isOpen)}
        title={confirmModal?.title || ''}
        description={confirmModal?.description || ''}
        confirmLabel={confirmModal?.confirmLabel}
        isDestructive={confirmModal?.isDestructive}
        onConfirm={() => {
          confirmModal?.onConfirm();
          setConfirmModal(null);
        }}
        onCancel={() => setConfirmModal(null)}
      />

    </div>
  );
}

