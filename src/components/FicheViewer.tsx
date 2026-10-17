import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Bot, 
  ShieldCheck, 
  FileCode, 
  Copy, 
  Check, 
  Cloud, 
  AlertTriangle, 
  CheckCircle2, 
  Columns, 
  Sparkles,
  Download
} from 'lucide-react';
import { 
  lintFicheV3, 
  extractHumanLesson, 
  extractAgentSpec, 
  extractEvidenceLedger,
  LinterV3Result 
} from '../utils/pipeline';
import { SmartFicheRenderer } from './SmartFicheRenderer';
import { IctCandleChartSvg } from './IctCandleChartSvg';

interface FicheViewerProps {
  content: string;
  videoId?: string;
  videoTitle?: string;
  isLoading?: boolean;
  onSaveToDrive?: () => void;
  showToast: (msg: string) => void;
}

type TabType = 'human' | 'agent' | 'linter' | 'split' | 'raw';

export const FicheViewer: React.FC<FicheViewerProps> = ({
  content,
  videoId,
  videoTitle,
  isLoading,
  onSaveToDrive,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('human');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Linting and parsing
  const linterResult: LinterV3Result = useMemo(() => lintFicheV3(content), [content]);
  const humanLesson = useMemo(() => extractHumanLesson(content), [content]);
  const agentSpec = useMemo(() => extractAgentSpec(content), [content]);
  const evidenceLedger = useMemo(() => extractEvidenceLedger(content), [content]);

  const copyToClipboard = (text: string, key: string, msg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(msg);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyAgentPack = () => {
    const pack = `// SPÉCIFICATION TECHNIQUE POUR AGENT DE CODAGE (CURSOR / CLAUDE 3.7 SONNET / OPUS / GEMINI PRO)
// SOURCE : HUGOFX WORKBENCH - ${videoId || 'CONCEPT'} - ${videoTitle || ''}
// INSTRUCTION : Implémente ce concept en Pine Script v6 / Python en respectant rigoureusement les paramètres P-xx, les règles R-xx, les deux FSMs (ZONE_FSM et TRADE_FSM), l'évaluation à la clôture sans lookahead, et valide ton code sur les Fixtures OHLC de la section B6. Zéro invention.

${agentSpec || content}
`;
    copyToClipboard(pack, 'agent_pack', 'Spécification Agent 10/10 copiée !');
  };

  const totalIssues = linterResult.errors.length + linterResult.missingRuleCitations.length;

  return (
    <div className="space-y-5 font-sans">
      
      {/* Top Studio Control Bar */}
      <div className="bg-[#0D121F] p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {videoId || 'SPEC'}
            </span>
            {linterResult.isValid ? (
              <button
                type="button"
                onClick={() => setActiveTab('linter')}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                title="Tous les contrôles déterministes SCRIBE-ICT v3 sont validés"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Conforme SCRIBE-ICT v3 ({linterResult.counts.countR}R / {linterResult.counts.countP}P)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('linter')}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                title="Cliquez pour inspecter le diagnostic du Linter Déterministe"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Révision Requise ({totalIssues} anomalie{totalIssues > 1 ? 's' : ''})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onSaveToDrive && (
              <button
                type="button"
                onClick={onSaveToDrive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-mono border border-white/10 transition-colors cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sauvegarder Drive</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyAgentPack}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs font-mono shadow-md shadow-indigo-500/25 border border-indigo-400/30 transition-all cursor-pointer"
            >
              {copiedKey === 'agent_pack' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié pour l'Agent !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier pour Claude/Opus</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('human')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'human'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📖 Vue Cours Humain (8 Sections)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'agent'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>🤖 Vue Spec & Algorithme 10/10</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('linter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'linter'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${linterResult.isValid ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>🛡️ Preuves & Linter Déterministe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'split'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-purple-400" />
            <span>⚡ Vue Split Côte-à-Côte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>📄 Markdown Brut</span>
          </button>
        </div>
      </div>

      {/* Loading or Empty State */}
      {isLoading ? (
        <div className="bg-[#070A12] p-12 rounded-2xl border border-white/10 text-center space-y-3 font-mono">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-white">Lecture de la fiche en direct depuis Google Drive...</h4>
          <p className="text-xs text-slate-400">Récupération des métadonnées et du code SCRIBE-ICT v3</p>
        </div>
      ) : !content ? (
        <div className="bg-[#070A12] p-12 rounded-2xl border border-white/10 text-center space-y-3 font-mono">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Fiche non encore extraite</h4>
          <p className="text-xs text-slate-400">Cette vidéo est classée mais n'a pas encore été analysée via l'API Gemini.</p>
        </div>
      ) : (
        <>
          {/* Main Tab Content */}
          {activeTab === 'human' && (
            <div className="bg-[#070A12] p-6 rounded-2xl border border-white/10 shadow-inner">
              <SmartFicheRenderer content={humanLesson || content} />
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="bg-[#070A12] p-6 rounded-2xl border border-white/10 shadow-inner space-y-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs font-mono text-indigo-200">
                <strong>Face Agentique 10/10 :</strong> Spécification formelle prête pour Cursor, Claude 3.7 Sonnet ou Python. Double FSM, Anti-lookahead strict, Primitives géométriques et Fixtures de tests déterministes.
              </div>
              <IctCandleChartSvg content={content} concept={videoId || 'ICT'} />
              <SmartFicheRenderer content={agentSpec || content} />
            </div>
          )}

          {activeTab === 'linter' && (
            <div className="bg-[#070A12] p-6 rounded-2xl border border-white/10 shadow-inner space-y-6">
              {/* Linter V3 Audit Grid */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${linterResult.isValid ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Diagnostic du Linter Déterministe SCRIBE-ICT v3 ({linterResult.verdict})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                      {linterResult.counts.countR} Règles R-xx
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                      {linterResult.counts.countP} Paramètres P-xx
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      {linterResult.counts.countS + linterResult.counts.countF} Preuves (S+F)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs">
                  {[
                    { key: 'causalStructure', label: 'Ordre Causal I → II → III → IV → V', ok: linterResult.checks.causalStructure },
                    { key: 'allEightHumanSections', label: '8 Sections Humaines Chirurgicales', ok: linterResult.checks.allEightHumanSections },
                    { key: 'doubleFSM', label: 'Double FSM (ZONE_FSM & TRADE_FSM)', ok: linterResult.checks.doubleFSM },
                    { key: 'fixturesOHLC', label: 'Fixtures OHLC Exécutables (B6)', ok: linterResult.checks.fixturesOHLC },
                    { key: 'antiInventedScoring', label: 'Zéro Barème Inventé (+pts interdit)', ok: linterResult.checks.antiInventedScoring },
                    { key: 'rulesCoverage', label: 'Couverture R-xx / P-xx ≥ 80%', ok: linterResult.checks.rulesCoverage },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                        item.ok
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {item.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-semibold text-[11px]">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Errors and missing citations */}
                {(linterResult.errors.length > 0 || linterResult.missingRuleCitations.length > 0) && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 font-mono text-xs text-amber-200">
                    <div className="font-bold flex items-center gap-2 text-amber-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Anomalies détectées par le Linter V3 :</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      {linterResult.errors.map((err, i) => (
                        <li key={`err_${i}`}>{err}</li>
                      ))}
                      {linterResult.missingRuleCitations.map((mc, i) => (
                        <li key={`mc_${i}`}>Règle sans citation horodatée explicite : {mc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Interactive B6 Replay */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Replay Interactif des Fixtures OHLC (Section B6)
                </h4>
                <IctCandleChartSvg content={content} concept={videoId || 'ICT'} />
              </div>

              {/* Evidence Ledger C */}
              {evidenceLedger && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <SmartFicheRenderer content={evidenceLedger} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Human Lesson Column */}
              <div className="bg-[#070A12] p-5 rounded-2xl border border-white/10 shadow-inner space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs text-indigo-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    Leçon Humaine (8 Sections)
                  </span>
                  <span className="text-[10px] text-slate-500">Pour le trader</span>
                </div>
                <SmartFicheRenderer content={humanLesson || content} />
              </div>

              {/* Agent Spec Column */}
              <div className="bg-[#070A12] p-5 rounded-2xl border border-white/10 shadow-inner space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs text-cyan-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Bot className="w-3.5 h-3.5" />
                    Spécification Agentique 10/10
                  </span>
                  <span className="text-[10px] text-slate-500">Pour le code</span>
                </div>
                <SmartFicheRenderer content={agentSpec || content} />
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="bg-[#070A12] p-4 rounded-2xl border border-white/10 shadow-inner">
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto">
                {content}
              </pre>
            </div>
          )}
        </>
      )}

      {/* Footer Copy Helper */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <span>Taille : {content.length.toLocaleString('fr-FR')} caractères</span>
        <button
          onClick={() => copyToClipboard(content, 'full_markdown', 'Fiche Markdown complète copiée !')}
          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copier tout le document Markdown</span>
        </button>
      </div>

    </div>
  );
};

