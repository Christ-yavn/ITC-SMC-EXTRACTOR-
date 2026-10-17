import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { 
  Cloud, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Trash2, 
  FileSpreadsheet, 
  FileText, 
  FolderCheck,
  AlertCircle,
  FolderOpen,
  Search,
  LogOut,
  ShieldCheck,
  Zap,
  RotateCcw,
  AlertTriangle,
  Eye,
  Check,
  Github,
  FolderTree,
  FolderSync,
  Layers
} from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ConfirmModal } from '../components/ConfirmModal';
import { Drawer } from '../components/Drawer';
import { SmartFicheRenderer } from '../components/SmartFicheRenderer';
import { 
  googleSignIn, 
  googleLogout, 
  getOrCreateWorkbenchFolder, 
  listFolderFiles, 
  saveFileToDrive, 
  deleteDriveFile,
  batchDeleteDriveFiles,
  readDriveFileContent,
  reorganizeDriveFilesIntoTaxonomy,
  listDriveFilesRecursive,
  WORKBENCH_FOLDER_NAME
} from '../services/googleDriveService';
import { 
  formatDriveFileSize, 
  generateFicheDriveFileName, 
  DriveFileItem 
} from '../utils/driveHelpers';
import type { ConsolidatedVideoItem } from '../utils/pipeline';
import { 
  TraceabilityRegistry, 
  isDriveFileFakeClone197, 
  reconcileRegistryWithDrive,
  purgeFakeClonesFromRegistry,
  resetSingleVideoInRegistry,
  extractYoutubeIdFromDriveFileName
} from '../services/traceabilityRegistry';
import { classifyVideoTaxonomy, ICT_PILLARS } from '../utils/ictTaxonomy';

interface GoogleDriveProps {
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
  registry: TraceabilityRegistry;
  onUpdateRegistry: (reg: TraceabilityRegistry) => void;
  videos: ConsolidatedVideoItem[];
  showToast: (msg: string) => void;
  savedFiches?: Record<string, string>;
  onImportFiches?: (imported: Record<string, string>) => void;
  onPurgeLocalFiches?: () => void;
  onOpenGitHub?: () => void;
}

export const GoogleDrive: React.FC<GoogleDriveProps> = ({
  currentUser,
  accessToken,
  onAuthSuccess,
  onAuthLogout,
  registry,
  onUpdateRegistry,
  videos,
  showToast,
  savedFiches,
  onImportFiches,
  onPurgeLocalFiches,
  onOpenGitHub,
}) => {
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<Array<DriveFileItem & { folderPath?: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('TOUS');

  // Reorganization in subfolders state
  const [isReorganizing, setIsReorganizing] = useState<boolean>(false);
  const [reorganizeMsg, setReorganizeMsg] = useState<string>('');

  // Delete Confirmation Modal state
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Purge modal state
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // Lazy preview state
  const [previewFile, setPreviewFile] = useState<DriveFileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Load drive files when authenticated
  useEffect(() => {
    if (currentUser && accessToken) {
      loadDriveData();
    } else {
      setDriveFiles([]);
      setFolderId(null);
    }
  }, [currentUser, accessToken]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        showToast(`Connecté à Google Drive en permanence (${result.user.displayName || result.user.email})`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Échec de la connexion';
      showToast(`Erreur : ${message}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      onAuthLogout();
      showToast('Déconnecté de Google Drive');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la déconnexion';
      showToast(message);
    }
  };

  const loadDriveData = async () => {
    setIsLoadingFiles(true);
    try {
      const targetFolderId = await getOrCreateWorkbenchFolder();
      setFolderId(targetFolderId);
      
      // Load files recursively so files in subfolders (PD Arrays, Setups, etc.) are included
      const files = await listDriveFilesRecursive(targetFolderId);
      setDriveFiles(files);

      // Reconcile with Traceability Registry
      const { updatedRegistry, fakeClonesFound } = reconcileRegistryWithDrive(registry, files);
      onUpdateRegistry(updatedRegistry);

      if (fakeClonesFound.length > 0) {
        showToast(`Détection : ${fakeClonesFound.length} fichiers clones (197 lignes) trouvés sur Google Drive.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des fichiers Drive';
      showToast(message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Reorganize files into fine-grained 7 Pillars & 25 Concepts hierarchy
  const handleReorganizeDrive = async () => {
    if (!folderId) return;
    setIsReorganizing(true);
    setReorganizeMsg('Création de l\'arborescence détaillée (7 Piliers & 25 Concepts / PD Arrays)...');
    try {
      showToast('Organisation en sous-dossiers structurés en cours sur Google Drive...');
      const { movedCount, errors } = await reorganizeDriveFilesIntoTaxonomy(
        folderId,
        videos,
        (msg) => setReorganizeMsg(msg)
      );
      showToast(`Arborescence ordonnée : ${movedCount} fichier(s) classé(s) dans leurs sous-dossiers respectifs !`);
      await loadDriveData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du classement';
      showToast(message);
    } finally {
      setIsReorganizing(false);
      setReorganizeMsg('');
    }
  };

  // Detect fake clones
  const fakeClones = useMemo(() => {
    return driveFiles.filter(isDriveFileFakeClone197);
  }, [driveFiles]);

  // Purge all fake 197-line clones
  const handlePurgeFakeClones = async () => {
    if (fakeClones.length === 0) return;
    setIsPurging(true);

    try {
      showToast(`Suppression de ${fakeClones.length} fichiers erronés sur Google Drive...`);
      const fileIds = fakeClones.map(f => f.id);
      const { deleted } = await batchDeleteDriveFiles(fileIds);

      // Update registry
      const cleaned = purgeFakeClonesFromRegistry(registry);
      onUpdateRegistry(cleaned);

      showToast(`Nettoyage achevé : ${deleted} fichiers erronés supprimés de Google Drive et remis en 'À extraire'.`);
      setIsPurgeConfirmOpen(false);
      await loadDriveData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la purge';
      showToast(message);
    } finally {
      setIsPurging(false);
    }
  };

  // Preview file on the fly (Lazy load without saving to localStorage)
  const handlePreviewFile = async (file: DriveFileItem) => {
    setPreviewFile(file);
    setIsLoadingPreview(true);
    try {
      const content = await readDriveFileContent(file.id);
      setPreviewContent(content);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lecture fichier';
      showToast(message);
      setPreviewContent(`Erreur : ${message}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Delete confirmed file
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      showToast(`Fichier "${fileToDelete.name}" supprimé de Google Drive.`);
      
      // Update registry if matching video
      const yId = extractYoutubeIdFromDriveFileName(fileToDelete.name, videos.map(v => v.video_id));
      if (yId) {
        const cleaned = resetSingleVideoInRegistry(registry, yId);
        onUpdateRegistry(cleaned);
      }

      setFileToDelete(null);
      await loadDriveData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      showToast(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export 106 Videos Master Registry as TSV into Google Drive
  const handleExportTSVToDrive = async () => {
    setIsActionInProgress(true);
    try {
      const headers = [
        'id_fiche',
        'video_id',
        'url',
        'titre',
        'playlists',
        'famille',
        'duree_s',
        'date_video',
        'statut_registre'
      ];
      const rows = videos.map(v => {
        const trace = registry.videoRecords[v.video_id];
        const status = trace ? trace.status : 'Classé';
        return [
          v.video_id,
          v.video_id,
          v.url,
          `"${v.titre.replace(/"/g, '""')}"`,
          v.playlists.join('; '),
          v.famille,
          v.duree_s,
          v.date_video,
          status
        ].join('\t');
      });
      const tsvContent = [headers.join('\t'), ...rows].join('\n');
      const fileName = 'HugoFX_Registre_Master_106_Videos.tsv';

      await saveFileToDrive(fileName, tsvContent, folderId || undefined, 'text/tab-separated-values');
      showToast('Registre Master TSV exporté avec succès sur Google Drive !');
      await loadDriveData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'export TSV';
      showToast(message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  const filteredFiles = useMemo(() => {
    return driveFiles.filter(f => {
      const q = searchFilter.toLowerCase();
      const matchesSearch = !q || f.name.toLowerCase().includes(q) || (f.folderPath && f.folderPath.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      if (selectedPillarFilter === 'TOUS') return true;
      if (selectedPillarFilter === 'RACINE') return !f.folderPath || f.folderPath === 'Racine';
      return Boolean(f.folderPath && f.folderPath.startsWith(selectedPillarFilter));
    });
  }, [driveFiles, searchFilter, selectedPillarFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. AUTO-SYNC & PERSISTENT STATUS BANNER */}
      <div className="quant-card p-6 bg-white dark:bg-[#0F1420] border-l-4 border-l-blue-600 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Cloud className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Coffre Google Drive & Registre de Traçabilité Léger
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Votre session reste <strong className="text-slate-900 dark:text-white">toujours connectée</strong>. Les fichiers .md sont stockés exclusivement sur Google Drive (zéro saturation mémoire dans l'application).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser && accessToken ? (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connecté en permanence</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Non connecté</span>
              </span>
            )}
          </div>
        </div>

        {/* Action / Status highlight */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-medium">
            <Zap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Dossier Cloud Dédié :</strong> {WORKBENCH_FOLDER_NAME}
            </span>
          </div>
          {currentUser && folderId && (
            <a
              href={`https://drive.google.com/drive/folders/${folderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ouvrir dans Google Drive</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. PURGE BANNER FOR 105 FAKE CLONES (197 LINES) */}
      {currentUser && fakeClones.length > 0 && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-rose-950/20 border border-red-200 dark:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-red-950 dark:text-rose-200">
                  {fakeClones.length} fichiers erronés (clones de 197 lignes à 0.5/10) détectés sur Google Drive
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
                  ACTION REQUISE
                </span>
              </div>
              <p className="text-xs text-red-800 dark:text-rose-300 max-w-2xl leading-relaxed">
                Ces 105 fichiers sont des copies statiques issues de l'ancien générateur simulé (197 lignes, durées 1200s fictives et citations génériques). Votre vraie fiche étalon BPR (<code className="font-bold">dg2-OsUXN60</code>, 320 lignes) sera bien conservée intacte.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purger les {fakeClones.length} fiches erronées</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SIGN IN / CONNECT VIEW */}
      {!currentUser ? (
        <div className="quant-card p-10 text-center space-y-6 max-w-xl mx-auto bg-white dark:bg-[#0F1420]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-md">
            <Cloud className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Connectez Google Drive une seule fois
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Vos identifiants sont mémorisés dans votre navigateur. Vous n'aurez plus besoin de vous reconnecter à chaque session.
            </p>
          </div>
          <div className="pt-2">
            <GoogleSignInButton onClick={handleSignIn} isLoading={isSigningIn} />
          </div>
        </div>
      ) : (
        /* 4. CONNECTED DRIVE EXPLORER */
        <div className="space-y-4">
          
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0F1420] p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer les fichiers du coffre..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReorganizeDrive}
                disabled={isReorganizing || isLoadingFiles}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-semibold shadow-xs transition-colors cursor-pointer"
                title="Ranger automatiquement les fiches dans l'arborescence fine (7 Piliers & 25 Concepts / PD Arrays / Setups / Stratégies)"
              >
                <FolderTree className={`w-3.5 h-3.5 ${isReorganizing ? 'animate-spin' : ''}`} />
                <span>{isReorganizing ? 'Classement...' : 'Classer dans l\'Arborescence ICT'}</span>
              </button>

              {onOpenGitHub && (
                <button
                  type="button"
                  onClick={onOpenGitHub}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-mono font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Pousser le projet complet et les fiches sur GitHub"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Push GitHub</span>
                </button>
              )}

              <button
                type="button"
                onClick={loadDriveData}
                disabled={isLoadingFiles}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 border border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>

              <button
                type="button"
                onClick={handleExportTSVToDrive}
                disabled={isActionInProgress}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 border border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Exporter Registre TSV</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Reorganization in progress banner */}
          {reorganizeMsg && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 rounded-2xl text-xs font-mono text-blue-800 dark:text-blue-300 flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{reorganizeMsg}</span>
            </div>
          )}

          {/* Pillar / Classification Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedPillarFilter('TOUS')}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-colors ${
                selectedPillarFilter === 'TOUS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
              }`}
            >
              Tous ({driveFiles.length})
            </button>
            {Object.entries(ICT_PILLARS).map(([key, pillar]) => {
              const count = driveFiles.filter(f => f.folderPath && f.folderPath.startsWith(pillar.folderName)).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPillarFilter(pillar.folderName)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-colors flex items-center gap-1.5 ${
                    selectedPillarFilter === pillar.folderName
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  <span>{pillar.badge}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedPillarFilter === pillar.folderName ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Files List Table */}
          <div className="bg-white dark:bg-[#0F1420] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-white/[0.02]">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Fichiers dans votre dossier Drive ({filteredFiles.length})
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {fakeClones.length > 0 && <span className="text-red-600 font-bold mr-3">{fakeClones.length} erronés</span>}
                {filteredFiles.length - fakeClones.length} authentiques
              </span>
            </div>

            {isLoadingFiles ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-mono">Chargement des fichiers depuis Google Drive...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FolderOpen className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Aucun fichier dans ce dossier Google Drive
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Lancez le mode automatique pour commencer l'extraction multimodale réelle des 106 vidéos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {filteredFiles.map((file) => {
                  const isClone = isDriveFileFakeClone197(file);
                  const isBpr = file.name.includes('dg2-OsUXN60');

                  return (
                    <div 
                      key={file.id}
                      className={`p-4 px-6 flex items-center justify-between gap-4 transition-colors ${
                        isClone 
                          ? 'bg-red-50/30 hover:bg-red-50/60 dark:bg-rose-950/10' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isClone 
                            ? 'bg-red-100 text-red-600 border border-red-200' 
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {file.name}
                            </span>
                            {isClone ? (
                              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200 shrink-0">
                                Clone 197 lignes (0.5/10)
                              </span>
                            ) : isBpr ? (
                              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                BPR Étalon (10/10)
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                SCRIBE-ICT v3 (10/10)
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono text-slate-500">
                            {file.folderPath && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 max-w-sm truncate" title={file.folderPath}>
                                <FolderOpen className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="truncate">{file.folderPath}</span>
                              </span>
                            )}
                            <span>Taille : {formatDriveFileSize(file.size)}</span>
                            {file.modifiedTime && (
                              <span>Modifié : {new Date(file.modifiedTime).toLocaleString('fr-FR')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Preview on the fly */}
                        <button
                          type="button"
                          onClick={() => handlePreviewFile(file)}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Aperçu à la demande"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Open on Google Drive */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Ouvrir sur Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {/* Delete from Drive */}
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Supprimer du Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Delete Single File Modal */}
      <ConfirmModal
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le fichier de Google Drive ?"
        description={`Êtes-vous sûr de vouloir supprimer définitivement "${fileToDelete?.name}" de votre Google Drive ? Cette action est irréversible.`}
        confirmLabel={isDeleting ? 'Suppression...' : 'Supprimer'}
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Purge All 105 Fake Clones Modal */}
      <ConfirmModal
        isOpen={isPurgeConfirmOpen}
        onClose={() => setIsPurgeConfirmOpen(false)}
        onConfirm={handlePurgeFakeClones}
        title={`Purger les ${fakeClones.length} fiches erronées ?`}
        description={`Cette action va supprimer définitivement les ${fakeClones.length} fichiers clones statiques (197 lignes) de votre Google Drive et remettre les vidéos correspondantes au statut 'À extraire' dans votre registre. Votre vraie fiche BPR étalon sera conservée.`}
        confirmLabel={isPurging ? 'Purge en cours...' : `Supprimer les ${fakeClones.length} clones`}
        isDestructive={true}
        isLoading={isPurging}
      />

      {/* Lazy Preview Drawer (Does NOT store in localStorage) */}
      <Drawer
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name || 'Aperçu du fichier Drive'}
        subtitle={`Lecture à la volée depuis Google Drive • ${formatDriveFileSize(previewFile?.size)}`}
      >
        {isLoadingPreview ? (
          <div className="p-12 text-center text-slate-500 space-y-2 font-mono">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs">Téléchargement du contenu depuis Google Drive...</p>
          </div>
        ) : (
          <SmartFicheRenderer content={previewContent} />
        )}
      </Drawer>

    </div>
  );
};
