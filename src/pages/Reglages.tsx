import React, { useState } from 'react';
import { 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Table, 
  ShieldAlert, 
  Sparkles,
  Layers,
  HelpCircle,
  Sliders,
  FolderSync,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Zap
} from 'lucide-react';
import { 
  PILOTE_PROTOCOL, 
  RISQUES_ET_PARADES, 
  REGISTRY_COLUMNS,
  WORKFLOW_STEPS 
} from '../data/architectureData';
import { SCRIBE_ICT_V2_PROMPT } from '../data/scribePromptV2';
import { 
  getActiveApiKey, 
  setActiveApiKey, 
  testGeminiApiKey, 
  ApiTestResult 
} from '../utils/apiKeyManager';

interface ReglagesProps {
  onExportTSV: () => void;
  totalVideosCount: number;
  dailyQuotaLimit: number;
  onUpdateDailyQuotaLimit: (limit: number) => void;
  onResetToZero?: () => void;
  onLoadSampleFiche?: () => void;
  onPurgeFakeClones?: () => void;
}

export const Reglages: React.FC<ReglagesProps> = ({ 
  onExportTSV, 
  totalVideosCount,
  dailyQuotaLimit,
  onUpdateDailyQuotaLimit,
  onResetToZero,
  onLoadSampleFiche,
  onPurgeFakeClones,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'apiKey': true,
    'quota': true,
    'export': true,
    'prompt_v2': false,
    'tranches': false,
    'pilote': false,
    'risques': false,
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // API Key state
  const [apiKey, setApiKey] = useState<string>(() => getActiveApiKey());
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKey.trim();
    setActiveApiKey(trimmed);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(apiKey.trim());
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Erreur inconnue lors du test',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header Banner */}
      <div className="quant-card p-6 bg-white dark:bg-[#0F1420] border-l-4 border-l-blue-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Panneau de Configuration & Sécurité</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Paramètres du Moteur Algorithmique
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Gestion des clés d'inférence Gemini Pro, quotas journaliers, garde-fous et exports Google Sheets.
          </p>
        </div>
      </div>

      <div className="space-y-4">

        {/* Section Clé API Google AI Studio / Gemini Pro */}
        <div className="quant-card overflow-hidden bg-white dark:bg-[#0F1420]">
          <button
            type="button"
            onClick={() => toggleSection('apiKey')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Key className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Clé API Google AI Studio (Compte Pro)</h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Actif
                </span>
                <span className="text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-bold border border-blue-200 dark:border-blue-500/20">
                  gemini-2.5-pro | gemini-3.1-pro-preview | gemini-3-flash-preview | gemini-2.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Clé configurée et synchronisée pour les appels d'extraction et de classification avec cascade multi-modèles.
              </p>
            </div>
            {openSections['apiKey'] ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
          </button>

          {openSections['apiKey'] && (
            <div className="p-5 pt-0 border-t border-slate-100 dark:border-white/[0.08] space-y-4 text-xs font-mono text-slate-700 dark:text-slate-300">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-start gap-3">
                <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-sans">
                  <span className="font-bold">Configuration persistante : </span>
                  Si le champ ci-dessous est vide, le serveur Express utilise automatiquement la variable <code className="font-mono font-bold">GEMINI_API_KEY</code> de l'environnement (<code className="font-mono">.env</code>). Vous pouvez aussi saisir une clé personnalisée et tester la connectivité réelle sur les 4 modèles Gemini.
                </div>
              </div>

              {/* Key Input & Actions */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Clé API active :</span>
                  <span className="text-slate-400 font-normal">
                    {apiKey ? `Réf : ...${apiKey.slice(-6)}` : 'Clé serveur (.env) par défaut'}
                  </span>
                </label>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Collez votre clé API Gemini (commençant par AQ... ou AIza...)"
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title={showApiKey ? 'Masquer la clé' : 'Afficher la clé'}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                      <span>{isSaved ? 'Enregistrée !' : 'Enregistrer'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(apiKey, 'api_key_copy')}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                      title="Copier la clé"
                    >
                      {copiedKey === 'api_key_copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTestingKey}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
                      <span>{isTestingKey ? 'Test...' : 'Tester'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.model && (
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      Modèle : {testResult.model}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Capacité & Cadence API Gemini (Mode Illimité) */}
        <div className="quant-card overflow-hidden bg-white dark:bg-[#0F1420]">
          <button
            type="button"
            onClick={() => toggleSection('quota')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Capacité & Cadence API Gemini</h4>
                <span className="font-mono text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mode Illimité (100% Capacité Clé)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Plafond artificiel (105 req/j) supprimé. Cadence autorégulée avec Auto-Retry en cas de 429.</p>
            </div>
            {openSections['quota'] ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
          </button>

          {openSections['quota'] && (
            <div className="p-5 pt-0 border-t border-slate-100 dark:border-white/[0.08] space-y-4 text-xs font-mono text-slate-700 dark:text-slate-300">
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl space-y-2 font-sans">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-xs font-mono uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Cadence Maximale Débloquée</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Toute limitation artificielle (105, 50 ou 20 requêtes/jour) a été retirée du moteur. Vous utilisez l'intégralité du quota de votre clé API Gemini. Si l'API renvoie un code <span className="font-mono font-bold text-amber-600 dark:text-amber-400">HTTP 429 (Too Many Requests)</span>, le moteur n'interrompt pas le lot et lance un compte à rebours visible (15s, 30s, 60s, 90s) avec bouton pour passer la vidéo ou stopper à la demande.
                </p>
              </div>

              {/* Maintenance Tools (avec accent Rouge sur réinitialiser) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 pt-3">
                <span className="text-slate-600 font-semibold">Actions d'entretien :</span>
                <div className="flex items-center gap-2">
                  {onPurgeFakeClones && (
                    <button
                      type="button"
                      onClick={onPurgeFakeClones}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Purger les fiches simulées (&lt; 15 Ko)</span>
                    </button>
                  )}
                  {onResetToZero && (
                    <button
                      type="button"
                      onClick={onResetToZero}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                    >
                      Réinitialiser à zéro (0/106)
                    </button>
                  )}
                  {onLoadSampleFiche && (
                    <button
                      type="button"
                      onClick={onLoadSampleFiche}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                    >
                      Charger l'étalon FVG
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section SCRIBE-ICT Prompt */}
        <div className="quant-card overflow-hidden bg-white dark:bg-[#0F1420]">
          <button
            type="button"
            onClick={() => toggleSection('prompt_v2')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Prompt Système Déterministe : SCRIBE-ICT v3</h4>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200">
                  Version Double-Face 10/10
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Règle d'ordre causal autorégressif, étiquettes [DIT/VU/ABSENT], double FSM mathématique et zero inventé.
              </p>
            </div>
            {openSections['prompt_v2'] ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
          </button>

          {openSections['prompt_v2'] && (
            <div className="p-5 pt-0 border-t border-slate-100 dark:border-white/[0.08] space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Spécification complète SCRIBE-ICT v3 prête à copier.</span>
                <button
                  type="button"
                  onClick={() => handleCopy(SCRIBE_ICT_V2_PROMPT, 'scribe_copy')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition-colors cursor-pointer"
                >
                  {copiedKey === 'scribe_copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copier le prompt SCRIBE-ICT v3</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                {SCRIBE_ICT_V2_PROMPT}
              </pre>
            </div>
          )}
        </div>

        {/* Section Export TSV */}
        <div className="quant-card overflow-hidden bg-white dark:bg-[#0F1420]">
          <button
            type="button"
            onClick={() => toggleSection('export')}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Export Registre Google Sheets (TSV)</h4>
              <p className="text-xs text-slate-500 mt-0.5">Télécharger la base complète des 106 vidéos dédoublonnées avec statuts.</p>
            </div>
            {openSections['export'] ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
          </button>

          {openSections['export'] && (
            <div className="p-5 pt-0 border-t border-slate-100 dark:border-white/[0.08] space-y-4 text-xs font-mono text-slate-700 dark:text-slate-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/5">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Registre Maître (106 Vidéos Uniques)</span>
                  <p className="text-slate-500 mt-0.5">Fichier délimité par tabulations compatible Google Sheets / Excel.</p>
                </div>
                <button
                  type="button"
                  onClick={onExportTSV}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger TSV Local</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
