import React, { useState, useEffect } from 'react';
import { 
  X, 
  Github, 
  GitBranch, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Key,
  FolderSync
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedFiches: Record<string, string>;
  showToast: (msg: string) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  savedFiches,
  showToast,
}) => {
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('hugo_fx_github_token') || '';
  });
  const [repoName, setRepoName] = useState<string>(() => {
    return localStorage.getItem('hugo_fx_github_repo') || 'ict-smc-extractor';
  });
  const [branch, setBranch] = useState<string>('main');
  const [includeFiches, setIncludeFiches] = useState<boolean>(true);
  const [commitMessage, setCommitMessage] = useState<string>('feat: synchronisation fiches ICT/SMC 10/10 et architecture');
  const [showToken, setShowToken] = useState<boolean>(false);

  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [gitStatus, setGitStatus] = useState<{
    initialized: boolean;
    branch?: string;
    commit?: string;
    remoteUrl?: string;
  } | null>(null);

  const [pushResult, setPushResult] = useState<{
    success: boolean;
    repoUrl?: string;
    commitHash?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch local git status
  const fetchGitStatus = async () => {
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGitStatus();
      setPushResult(null);
    }
  }, [isOpen]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePush = async () => {
    const cleanToken = token.trim();
    const cleanRepo = repoName.trim();

    if (!cleanToken) {
      showToast('Veuillez renseigner votre Personal Access Token (PAT) GitHub.');
      return;
    }
    if (!cleanRepo) {
      showToast('Veuillez renseigner le nom de votre repository GitHub.');
      return;
    }

    // Save preferences
    localStorage.setItem('hugo_fx_github_token', cleanToken);
    localStorage.setItem('hugo_fx_github_repo', cleanRepo);

    setIsPushing(true);
    setPushResult(null);

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken: cleanToken,
          repoName: cleanRepo,
          branch,
          commitMessage,
          fiches: includeFiches ? savedFiches : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Erreur push HTTP ${res.status}`);
      }

      setPushResult({
        success: true,
        repoUrl: data.repoUrl,
        commitHash: data.commitHash,
        message: data.message,
      });

      showToast(`⚡ Projet complet poussé avec succès sur GitHub !`);
      fetchGitStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec du push GitHub';
      setPushResult({
        success: false,
        error: msg,
      });
      showToast(msg);
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  const fichesCount = Object.keys(savedFiches).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0F1420] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Synchronisation & Push GitHub
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Git Engine v2.34
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Poussez l'intégralité du code et de vos {fichesCount} fiches vers votre repository GitHub en un clic.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans text-xs">
          
          {/* Git local status bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Branche active :</span>
              <span className="font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                {gitStatus?.branch || 'main'}
              </span>
            </div>
            {gitStatus?.commit && (
              <div className="text-slate-500">
                Dernier commit : <code className="font-bold text-blue-600">{gitStatus.commit}</code>
              </div>
            )}
          </div>

          {/* Form inputs */}
          <div className="space-y-4">
            
            {/* GitHub Token PAT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Personal Access Token (PAT GitHub) :</span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=HugoFX-ICT-Workbench"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono font-normal normal-case"
                >
                  <span>Créer un token GitHub (scope repo)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_... ou github_pat_..."
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Repo Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nom du Repository GitHub :
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="ex: ict-smc-extractor ou CHRIST/ict-smc"
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Branche Cible :
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Options */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeFiches}
                  onChange={(e) => setIncludeFiches(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Exporter et committer les {fichesCount} fiche(s) .md dans le sous-dossier <code className="font-bold">/fiches</code></span>
              </label>
            </div>

            {/* Push Result Banner */}
            {pushResult && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                pushResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                {pushResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-bold text-xs">{pushResult.message || pushResult.error}</p>
                  {pushResult.repoUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={pushResult.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Voir le Repository sur GitHub</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual terminal command accordion */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>Commandes terminal manuelles prêtes à l'emploi :</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(`git remote add origin https://github.com/${repoName}.git\ngit branch -M ${branch}\ngit push -u origin ${branch}`, 'cli_copy')}
                className="hover:text-blue-600 cursor-pointer flex items-center gap-1"
              >
                {copiedKey === 'cli_copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'cli_copy' ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
{`git remote add origin https://github.com/${repoName}.git
git branch -M ${branch}
git push -u origin ${branch}`}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handlePush}
            disabled={isPushing}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isPushing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <UploadCloud className="w-4 h-4 text-white" />
            )}
            <span>{isPushing ? 'Envoi en cours vers GitHub...' : 'Pousser le projet complet sur GitHub'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
