import React from 'react';
import { 
  Compass, 
  Layers, 
  HelpCircle, 
  FileCheck, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  Target, 
  Box, 
  Calendar, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  FolderOpen 
} from 'lucide-react';

import type { ConsolidatedVideoItem } from '../utils/pipeline';
import type { TraceabilityRegistry } from '../services/traceabilityRegistry';
import { classifyVideoTaxonomy } from '../utils/ictTaxonomy';

interface ConceptsProps {
  savedFichesCount: number;
  registry?: TraceabilityRegistry;
  videos?: ConsolidatedVideoItem[];
  savedFiches?: Record<string, string>;
}

export const Concepts: React.FC<ConceptsProps> = ({
  savedFichesCount,
  registry,
  videos = [],
  savedFiches = {},
}) => {
  const getPillarStats = (folderPrefixes: string | string[], fallbackValidated: number, fallbackTotal: number) => {
    if (!videos.length) {
      return { validatedCount: fallbackValidated, totalCount: fallbackTotal };
    }
    const prefixes = Array.isArray(folderPrefixes) ? folderPrefixes : [folderPrefixes];
    const matchingVideos = videos.filter((v) => {
      const cat = classifyVideoTaxonomy({
        titre: v.titre,
        famille: v.famille,
        playlists: v.playlists,
        description: savedFiches[v.video_id],
        video_id: v.video_id,
      });
      return prefixes.some((prefix) => cat.pillarFolder.startsWith(prefix));
    });
    const totalCount = Math.max(1, matchingVideos.length);
    const validatedCount = matchingVideos.filter((v) => {
      if (savedFiches[v.video_id]) return true;
      const rec = registry?.videoRecords[v.video_id];
      return Boolean(rec && !rec.isFakeClone197 && (rec.status === 'Extrait' || rec.status === 'Validé'));
    }).length;
    return { validatedCount, totalCount };
  };

  const s1 = getPillarStats('01_', 0, 5);
  const s2 = getPillarStats('02_', 1, 5);
  const s3 = getPillarStats('03_', savedFichesCount >= 1 ? 2 : 0, 7);
  const s4 = getPillarStats(['04_', '06_'], 0, 6);
  const s5 = getPillarStats('05_', 0, 5);
  const s6 = getPillarStats('07_', 0, 4);


  const conceptPillars = [
    {
      id: 'structure',
      name: '1. Structure de Marché (Market Structure)',
      description: 'Cartographie directionnelle fondamentale des mouvements institutionnels.',
      icon: TrendingUp,
      subConcepts: ['BOS (Break of Structure)', 'CHoCH (Change of Character)', 'MSS (Market Structure Shift)', 'Structure Interne vs Externe', 'Dealing Range'],
      validatedCount: s1.validatedCount,
      totalCount: s1.totalCount,
      status: s1.validatedCount > 0 ? 'En cours' : 'À consolider',
      accentColor: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      id: 'liquidite',
      name: '2. Liquidité & Chasse aux Stops',
      description: 'Carburant des algorithmes institutionnels (Order Routing & Liquidity Pools).',
      icon: Target,
      subConcepts: ['BSL (Buy-Side Liquidity)', 'SSL (Sell-Side Liquidity)', 'EQH / EQL (Equal Highs/Lows)', 'Inducement (Piège)', 'Liquidity Sweep'],
      validatedCount: s2.validatedCount,
      totalCount: s2.totalCount,
      status: s2.validatedCount > 0 ? 'En cours' : 'À faire',
      accentColor: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    },
    {
      id: 'zones',
      name: '3. Zones de Prix (PD Arrays & Imbalances)',
      description: 'Points de déséquilibre et empreintes algorithmiques majeures sur le carnet.',
      icon: Box,
      subConcepts: ['BPR (Balanced Price Range)', 'FVG (Fair Value Gap)', 'IFVG (Inversion FVG)', 'Order Block (OB)', 'Breaker Block', 'Mitigation Block', 'Consequent Encroachment (50% CE)'],
      validatedCount: s3.validatedCount,
      totalCount: s3.totalCount,
      status: s3.validatedCount > 0 ? 'MASTER.md Prêt' : 'À faire',
      accentColor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'temps',
      name: '4. Temps & Macro (Time & Price)',
      description: 'Alignement algorithmique avec les sessions majeures et les flux macroéconomiques.',
      icon: Calendar,
      subConcepts: ['Killzone Londres', 'Killzone New York', 'Open Asiatique', 'Daily Bias (Biais Journalier)', 'AMD (Accumulation Manipulation Distribution)', 'Power of 3 (PO3)'],
      validatedCount: s4.validatedCount,
      totalCount: s4.totalCount,
      status: s4.validatedCount > 0 ? 'En cours' : 'À faire',
      accentColor: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      id: 'setups',
      name: '5. Modèles d\'Exécution & Setups Standardisés',
      description: 'Règles déterministes d\'entrée, de gestion du risque et d\'invalidation.',
      icon: Zap,
      subConcepts: ['Modèle ICT 2022', 'Silver Bullet (10h-11h NY)', 'Judas Swing', 'London Breakout', 'Optimal Trade Entry (OTE 62%-79%)'],
      validatedCount: s5.validatedCount,
      totalCount: s5.totalCount,
      status: s5.validatedCount > 0 ? 'En cours' : 'À faire',
      accentColor: 'border-purple-200 bg-purple-50 text-purple-700',
    },
    {
      id: 'risque',
      name: '6. Risque & Psychologie Algorithmique',
      description: 'Dimensionnement dynamique des positions et règles strictes de non-intervention.',
      icon: ShieldCheck,
      subConcepts: ['Taille de Risque Fixe (% Equity)', 'Trailing Stop / Breakeven', 'Clôture Partielle (TP1 / TP2)', 'Filtre de News Économiques'],
      validatedCount: s6.validatedCount,
      totalCount: s6.totalCount,
      status: s6.validatedCount > 0 ? 'En cours' : 'Prioritaire',
      accentColor: 'border-red-200 bg-red-50 text-red-700',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Taxonomy Overview */}
      <div className="quant-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0F1420] border-l-4 border-l-blue-600">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Taxonomie Canonique ICT / SMC</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Les 6 Piliers d'Architecture des Connaissances
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Chaque pilier consolidera à terme les fiches unitaires en un document de synthèse unique MASTER.md.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3 py-1.5 rounded-xl font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 font-bold">
            {savedFichesCount} fiches rédigées réparties
          </span>
        </div>
      </div>

      {/* Grid of the 6 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conceptPillars.map((pillar) => {
          const Icon = pillar.icon;
          const pct = Math.round((pillar.validatedCount / pillar.totalCount) * 100);

          return (
            <div
              key={pillar.id}
              className="quant-card p-5 flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all bg-white dark:bg-[#0F1420]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className={`p-2 rounded-xl border ${pillar.accentColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${pillar.accentColor}`}>
                    {pillar.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {pillar.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                {/* Sub-concepts pill tags */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Concepts clés du pilier :
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {pillar.subConcepts.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress gauge for pillar */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Couverture Formelle</span>
                  <span className="text-slate-900 dark:text-white font-bold tabular-nums">
                    {pillar.validatedCount} / {pillar.totalCount} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-black/40 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-white/5">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
