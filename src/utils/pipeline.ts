/**
 * Pure domain logic for HugoFX Knowledge Extraction Pipeline (SCRIBE-ICT v3)
 */

export interface RawVideoItem {
  playlist: string;
  playlist_id?: string;
  playlist_name?: string;
  badge?: string;
  famille?: string;
  rang: number;
  video_id: string;
  url: string;
  titre: string;
  date_video: string;
  duree_s: number;
  description: string;
}

export interface ConsolidatedVideoItem {
  id_video: string;
  video_id: string;
  playlists: string[];
  playlist_names?: string[];
  titre: string;
  date_video: string;
  duree_s: number;
  famille: 'CONCEPTS_SETUPS' | 'FORMATION_A' | 'FORMATION_B' | 'FORMATION_2026' | 'FORMATION_DEBUTANT' | 'A_DETERMINER';
  valeur: 'ESSENTIEL' | 'SECONDAIRE' | 'DOUBLON_IGNORE' | 'A_EVALUER';
  statut: '0_A_PRECLASSER' | '1_PRECLASSE' | '2_A_EXTRAIRE' | '3_EXTRAIT' | '4_AUDITE' | 'REJETE';
  url: string;
  description: string;
  tranches_count: number;
}

export interface VideoSlice {
  slice_id: string;
  video_id: string;
  slice_index: number;
  total_slices: number;
  start_s: number;
  end_s: number;
  formatted_start: string;
  formatted_end: string;
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function deduplicateVideos(items: RawVideoItem[]): ConsolidatedVideoItem[] {
  const map = new Map<string, ConsolidatedVideoItem>();

  for (const item of items) {
    if (!item.video_id) continue;
    
    const existing = map.get(item.video_id);
    if (existing) {
      if (!existing.playlists.includes(item.playlist)) {
        existing.playlists.push(item.playlist);
      }
    } else {
      const sliceCount = Math.max(1, Math.ceil(item.duree_s / (35 * 60)));
      let famille: ConsolidatedVideoItem['famille'] = 'A_DETERMINER';
      if (item.playlist === 'P4') famille = 'FORMATION_B';
      else if (item.playlist === 'P1') famille = 'FORMATION_A';
      else if (item.playlist === 'P2') famille = 'CONCEPTS_SETUPS';
      else if (item.playlist === 'P3') famille = 'FORMATION_2026';

      map.set(item.video_id, {
        id_video: item.video_id,
        video_id: item.video_id,
        playlists: [item.playlist],
        titre: item.titre,
        date_video: item.date_video,
        duree_s: item.duree_s,
        famille,
        valeur: 'A_EVALUER',
        statut: '0_A_PRECLASSER',
        url: item.url || `https://www.youtube.com/watch?v=${item.video_id}`,
        description: item.description || '',
        tranches_count: sliceCount,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date_video.localeCompare(b.date_video));
}

export function calculateSlices(videoId: string, durationSeconds: number, maxSliceMinutes = 35): VideoSlice[] {
  const maxSliceSeconds = maxSliceMinutes * 60;
  if (durationSeconds <= 0) return [];
  if (durationSeconds <= maxSliceSeconds) {
    return [{
      slice_id: `${videoId}-S1`,
      video_id: videoId,
      slice_index: 1,
      total_slices: 1,
      start_s: 0,
      end_s: durationSeconds,
      formatted_start: '00:00',
      formatted_end: formatSeconds(durationSeconds),
    }];
  }

  const slices: VideoSlice[] = [];
  const total = Math.ceil(durationSeconds / maxSliceSeconds);
  for (let i = 0; i < total; i++) {
    const start_s = i * maxSliceSeconds;
    const end_s = Math.min((i + 1) * maxSliceSeconds, durationSeconds);
    slices.push({
      slice_id: `${videoId}-S${i + 1}`,
      video_id: videoId,
      slice_index: i + 1,
      total_slices: total,
      start_s,
      end_s,
      formatted_start: formatSeconds(start_s),
      formatted_end: formatSeconds(end_s),
    });
  }
  return slices;
}

export interface LinterV3Result {
  isV3: boolean;
  isValid: boolean;
  verdict: 'PRÊT_POUR_CODAGE_10_SUR_10' | 'RÉVISION_REQUISE';
  errors: string[];
  warnings: string[];
  checks: {
    causalStructure: boolean;
    allEightHumanSections: boolean;
    doubleFSM: boolean;
    fixturesOHLC: boolean;
    antiInventedScoring: boolean;
    rulesCoverage: boolean;
  };
  missingSections: string[];
  missingHumanSections: string[];
  missingRuleCitations: string[];
  counts: {
    countS: number;
    countF: number;
    countX: number;
    countP: number;
    countD: number;
    countR: number;
    countREJ: number;
    countAbsent: number;
  };
  rulesDefined: string[];
  parametersDefined: string[];
  decisionsDefined: string[];
  rejectionsDefined: string[];
}

export const HUMAN_LESSON_SECTIONS = [
  '### 1. Pourquoi ça existe',
  '### 2. Schéma annoté',
  '### 3. Méthode pas à pas',
  '### 4. Exemples commentés',
  '### 5. Contre-exemples',
  '### 6. Exécution',
  '### 7. Zones grises',
  '### 8. Erreurs fréquentes',
];

/**
 * Deterministic linter and validator for SCRIBE-ICT v3 fiches.
 */
export function lintFicheV3(content: string): LinterV3Result {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isV3 = content.includes('SCRIBE-ICT-v3') || content.includes('<<<CONCEPT_SPEC_V3');

  // 1. Causal Structure check (5 ordered sections)
  const sec1Match = content.match(/## I\.\s+REGISTRE DE PREUVES/i);
  const sec2Match = content.match(/## II\.\s+TABLE UNIQUE DES PARAMÈTRES/i);
  const sec3Match = content.match(/<<<CONCEPT_SPEC_V3/);
  const sec4Match = content.match(/## IV\.\s+LEÇON HUMAINE/i);
  const endMatch = content.match(/<<<FIN_FICHE_V3>>>/);

  const missingSections: string[] = [];
  if (!sec1Match) missingSections.push('Section I (REGISTRE DE PREUVES)');
  if (!sec2Match) missingSections.push('Section II (TABLE UNIQUE DES PARAMÈTRES)');
  if (!sec3Match) missingSections.push('Section III (<<<CONCEPT_SPEC_V3>>>)');
  if (!sec4Match) missingSections.push('Section IV (LEÇON HUMAINE CHIRURGICALE)');
  if (!endMatch) missingSections.push('Balise de fin (<<<FIN_FICHE_V3>>>)');

  let causalOrderOk = missingSections.length === 0;
  if (causalOrderOk) {
    const idx1 = content.indexOf(sec1Match![0]);
    const idx2 = content.indexOf(sec2Match![0]);
    const idx3 = content.indexOf(sec3Match![0]);
    const idx4 = content.indexOf(sec4Match![0]);
    const idxEnd = content.indexOf(endMatch![0]);

    if (!(idx1 < idx2 && idx2 < idx3 && idx3 < idx4 && idx4 < idxEnd)) {
      causalOrderOk = false;
      errors.push('Ordre causal transgressé : les 5 sections doivent apparaître strictement dans l\'ordre I -> II -> III -> IV -> Fin.');
    }
  } else {
    errors.push(`Sections causales obligatoires manquantes : ${missingSections.join(', ')}.`);
  }

  // 2. Check the 8 Human Lesson sections
  const missingHumanSections: string[] = [];
  for (const hSec of HUMAN_LESSON_SECTIONS) {
    // Normalization check for section title prefix
    const titleKey = hSec.slice(0, 10).toLowerCase();
    if (!content.toLowerCase().includes(titleKey)) {
      missingHumanSections.push(hSec);
    }
  }
  const allEightHumanSections = missingHumanSections.length === 0;
  if (!allEightHumanSections) {
    errors.push(`Sections humaines manquantes : ${missingHumanSections.join(', ')}.`);
  }

  // 3. Check Double FSM & Fixtures in spec
  const hasZoneFsm = content.includes('ZONE_FSM');
  const hasTradeFsm = content.includes('TRADE_FSM');
  const doubleFSM = hasZoneFsm && hasTradeFsm;
  if (!doubleFSM) {
    errors.push('Double Machine à États incomplète : ZONE_FSM et TRADE_FSM doivent être présentes dans la spécification.');
  }

  const fixturesOHLC = content.includes('"fixture_id"') || content.includes('fixture_id');
  if (!fixturesOHLC) {
    errors.push('Fixtures OHLC manquantes : la section B6 doit comporter au moins une fixture exécutable avec "fixture_id".');
  }

  // 4. Anti-invention: Check for invented score weights like "+40 pts" or "+30 pts"
  const inventedScorePattern = /\+\s*\d+\s*(?:pts|points)\b/i;
  const antiInventedScoring = !inventedScorePattern.test(content);
  if (!antiInventedScoring) {
    errors.push('Barème à points inventé détecté (ex. "+40 pts"). Le prompt interdit formellement d\'inventer des scores chiffrés sans citation orale.');
  }

  // 4b. Anti-Fake Clone Check (Rejet strict des clones simulés de 197 lignes)
  const isFakeCloneSignature = 
    content.includes("C'est la zone exacte où l'algorithme interbancaire vient rééquilibrer les ordres") ||
    (content.includes('SCRIBE-ICT-v3') && content.length < 8000);
  if (isFakeCloneSignature) {
    errors.push('SIMULATION_INTERDITE : Fiche clone générique ou taille anormale (< 8 000 caractères). Seule une vraie analyse multimodale Gemini est autorisée.');
  }

  // 4c. Temporal consistency check (supports MM:SS and HH:MM:SS, duree_secondes and duree_s)
  const durationMatch = content.match(/duree_(?:secondes|s):\s*(\d+)/);
  if (durationMatch) {
    const maxAllowedSeconds = parseInt(durationMatch[1], 10);
    // Find timestamps in Section I
    const sec1Text = sec1Match ? content.slice(content.indexOf(sec1Match[0]), sec2Match ? content.indexOf(sec2Match[0]) : content.length) : '';
    const tsMatches = sec1Text.match(/\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b/g) || [];
    for (const ts of tsMatches) {
      const parts = ts.split(':').map(Number);
      const totalSec = parts.length === 3
        ? (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
        : (parts[0] || 0) * 60 + (parts[1] || 0);
      if (totalSec > maxAllowedSeconds + 5) { // allow 5s buffer
        errors.push(`Incohérence temporelle : le timestamp ${ts} (${totalSec}s) dépasse la durée réelle de la vidéo (${maxAllowedSeconds}s).`);
        break;
      }
    }
  }

  // 5. Cross-coverage: Spec rules & params cited in Human Lesson
  // Extract defined rules & parameters (supports both P-CONCEPT-01 and P-01)
  const rulesDefined = Array.from(new Set(content.match(/\bR-(?:[A-Z0-9_]+-)?\d+\b/g) || []));
  const parametersDefined = Array.from(new Set(content.match(/\bP-(?:[A-Z0-9_]+-)?\d+\b/g) || []));
  const decisionsDefined = Array.from(new Set(content.match(/\bD-(?:[A-Z0-9_]+-)?\d+\b/g) || []));
  const rejectionsDefined = Array.from(new Set(content.match(/\bREJ-(?:[A-Z0-9_]+-)?\d+\b/g) || []));

  // Extract human lesson section text
  let humanLessonText = '';
  if (sec4Match) {
    const startIdx = content.indexOf(sec4Match[0]);
    const endIdx = endMatch ? content.indexOf(endMatch[0]) : content.length;
    humanLessonText = content.slice(startIdx, endIdx);
  } else {
    humanLessonText = content;
  }

  const missingRuleCitations: string[] = [];
  for (const r of rulesDefined) {
    if (!humanLessonText.includes(r)) {
      missingRuleCitations.push(r);
    }
  }
  for (const p of parametersDefined) {
    if (!humanLessonText.includes(p)) {
      missingRuleCitations.push(p);
    }
  }
  for (const rej of rejectionsDefined) {
    if (!humanLessonText.includes(rej)) {
      missingRuleCitations.push(rej);
    }
  }

  const totalDefined = rulesDefined.length + parametersDefined.length + rejectionsDefined.length;
  const coverageRatio = totalDefined > 0 ? (totalDefined - missingRuleCitations.length) / totalDefined : 1;
  const rulesCoverage = coverageRatio >= 0.8;

  if (!rulesCoverage && totalDefined > 0) {
    errors.push(`COUVERTURE_INSUFFISANTE : Moins de 80% des règles et paramètres sont cités dans la leçon humaine (${Math.round(coverageRatio * 100)}%). Manquants : ${missingRuleCitations.slice(0, 5).join(', ')}.`);
  } else if (missingRuleCitations.length > 0) {
    warnings.push(`Règles ou paramètres non cités dans la leçon humaine : ${missingRuleCitations.join(', ')}.`);
  }

  // Calculate proof counters
  const countS = new Set(content.match(/\bS-\d+\b/g) || []).size;
  const countF = new Set(content.match(/\bF-\d+\b/g) || []).size;
  const countX = new Set(content.match(/\bX-\d+\b/g) || []).size;
  const countP = parametersDefined.length;
  const countD = decisionsDefined.length;
  const countR = rulesDefined.length;
  const countREJ = rejectionsDefined.length;
  const countAbsent = (content.match(/\[ABSENT\]/g) || []).length;

  const isValid = errors.length === 0 && causalOrderOk && allEightHumanSections && doubleFSM && fixturesOHLC && antiInventedScoring && rulesCoverage && !isFakeCloneSignature;
  const verdict = isValid ? 'PRÊT_POUR_CODAGE_10_SUR_10' : 'RÉVISION_REQUISE';

  return {
    isV3,
    isValid,
    verdict,
    errors,
    warnings,
    checks: {
      causalStructure: causalOrderOk,
      allEightHumanSections,
      doubleFSM,
      fixturesOHLC,
      antiInventedScoring,
      rulesCoverage,
    },
    missingSections,
    missingHumanSections,
    missingRuleCitations,
    counts: {
      countS,
      countF,
      countX,
      countP,
      countD,
      countR,
      countREJ,
      countAbsent,
    },
    rulesDefined,
    parametersDefined,
    decisionsDefined,
    rejectionsDefined,
  };
}

/**
 * Universal validator backward-compatible with v2 while enforcing v3 rules.
 */
export function validateFicheContent(content: string): { isValid: boolean; missingSections: string[]; absentTagsCount: number } {
  // Strict check against fake simulation clones
  if (
    content.includes("C'est la zone exacte où l'algorithme interbancaire vient rééquilibrer les ordres") ||
    (content.includes('SCRIBE-ICT-v3') && content.length < 8000)
  ) {
    return {
      isValid: false,
      missingSections: ['SIMULATION_INTERDITE : Fiche clone ou taille < 8000 caractères non conforme'],
      absentTagsCount: 0,
    };
  }

  // If v3, use lintFicheV3
  if (content.includes('SCRIBE-ICT-v3') || content.includes('<<<CONCEPT_SPEC_V3')) {
    const res = lintFicheV3(content);
    return {
      isValid: res.isValid,
      missingSections: [...res.missingSections, ...res.missingHumanSections],
      absentTagsCount: res.counts.countAbsent,
    };
  }

  // Fallback Legacy v2 validation
  const requiredTags = [
    '<METADONNEES_YAML>',
    '</METADONNEES_YAML>',
    '<POSITION_CURSUS>',
    '<CORPUS_REGLES>',
    '<EXEMPLES_GRAPHIQUES>',
    '<AUDIT_FIABILITE>',
  ];

  const missingSections = requiredTags.filter(tag => !content.includes(tag));
  const absentMatches = content.match(/\[ABSENT\]/g);
  const absentTagsCount = absentMatches ? absentMatches.length : 0;

  return {
    isValid: missingSections.length === 0,
    missingSections,
    absentTagsCount,
  };
}

/**
 * Extracts Section IV (Leçon Humaine) cleanly from a v3 fiche.
 */
export function extractHumanLesson(content: string): string {
  const match = content.match(/## IV\.\s+LEÇON HUMAINE[^\n]*/i);
  if (!match) return content;
  const startIdx = content.indexOf(match[0]);
  const endMatch = content.match(/## V\.\s+RAPPORT DE CONTRÔLE|<<<FIN_FICHE_V3>>>/i);
  const endIdx = endMatch ? content.indexOf(endMatch[0]) : content.length;
  return content.slice(startIdx, endIdx).trim();
}

/**
 * Extracts Section II & III (Spécification Agentique) cleanly from a v3 fiche.
 */
export function extractAgentSpec(content: string): string {
  const matchStart = content.match(/## II\.\s+TABLE UNIQUE DES PARAMÈTRES/i);
  const startIdx = matchStart ? content.indexOf(matchStart[0]) : (content.indexOf('<<<CONCEPT_SPEC_V3') !== -1 ? content.indexOf('<<<CONCEPT_SPEC_V3') : 0);
  const matchEnd = content.match(/## IV\.\s+LEÇON HUMAINE/i);
  const endIdx = matchEnd ? content.indexOf(matchEnd[0]) : content.length;
  return content.slice(startIdx, endIdx).trim();
}

/**
 * Extracts Section I (Evidence Ledger) cleanly from a v3 fiche.
 */
export function extractEvidenceLedger(content: string): string {
  const matchStart = content.match(/## I\.\s+REGISTRE DE PREUVES/i);
  if (!matchStart) return '';
  const startIdx = content.indexOf(matchStart[0]);
  const matchEnd = content.match(/## II\.\s+TABLE UNIQUE DES PARAMÈTRES/i);
  const endIdx = matchEnd ? content.indexOf(matchEnd[0]) : content.length;
  return content.slice(startIdx, endIdx).trim();
}

/**
 * Concept classifier with strict word-boundary regexes
 * (Prevents naive substring matching like 'ob' in 'probabilité' or 'obligé').
 */
export function classifyConceptStrict(title: string): {
  conceptCode: string;
  conceptName: string;
  pillar: string;
} {
  const t = title.trim();

  if (/\b(bpr|balanced\s*price\s*range)\b/i.test(t)) {
    return {
      conceptCode: 'BPR',
      conceptName: 'Balanced Price Range (BPR)',
      pillar: 'ZONES_PD_ARRAYS',
    };
  }

  if (/\b(fvg|fair\s*value\s*gap|imbalance|desequilibre)\b/i.test(t)) {
    return {
      conceptCode: 'FVG',
      conceptName: 'Fair Value Gap (FVG)',
      pillar: 'ZONES_PD_ARRAYS',
    };
  }

  if (/\b(ob|order\s*block)\b/i.test(t)) {
    return {
      conceptCode: 'OB',
      conceptName: 'Order Block Institutionnel (OB)',
      pillar: 'ZONES_PD_ARRAYS',
    };
  }

  if (/\b(breaker|breaker\s*block|bb)\b/i.test(t)) {
    return {
      conceptCode: 'BREAKER',
      conceptName: 'Breaker Block (BB)',
      pillar: 'ZONES_PD_ARRAYS',
    };
  }

  if (/\b(sweep|turtle\s*soup|liquidite|liquidity|purge)\b/i.test(t)) {
    return {
      conceptCode: 'SWEEP',
      conceptName: 'Prise de Liquidité & Turtle Soup (SWEEP)',
      pillar: 'LIQUIDITE',
    };
  }

  if (/\b(mss|bos|choch|market\s*structure|cassure)\b/i.test(t)) {
    return {
      conceptCode: 'MSS',
      conceptName: 'Market Structure Shift & Break of Structure (MSS/BOS)',
      pillar: 'STRUCTURE',
    };
  }

  if (/\b(ote|optimal\s*trade\s*entry|fibonacci|retracement)\b/i.test(t)) {
    return {
      conceptCode: 'OTE',
      conceptName: 'Optimal Trade Entry (OTE 62%-79%)',
      pillar: 'ZONES_PD_ARRAYS',
    };
  }

  if (/\b(silver\s*bullet|judas|killzone|horaire|session|london|new\s*york)\b/i.test(t)) {
    return {
      conceptCode: 'SILVER_BULLET',
      conceptName: 'Modèle Temporel & Killzones ICT',
      pillar: 'TEMPS',
    };
  }

  return {
    conceptCode: 'ICT_CORE',
    conceptName: 'Mécanique Interbancaire & Principes ICT',
    pillar: 'FONDATION',
  };
}

export interface OhlcFixtureBar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  label?: string;
}

export interface OhlcFixtureExpectedEvent {
  t: number;
  event: string;
  zone_low?: number;
  zone_high?: number;
  ce_50?: number;
  reason?: string;
}

export interface OhlcFixture {
  fixture_id: string;
  description: string;
  bars: OhlcFixtureBar[];
  expected: OhlcFixtureExpectedEvent[];
}

export const DEFAULT_B6_FIXTURES: OhlcFixture[] = [
  {
    fixture_id: 'FX-BPR-01',
    description: 'Séquence Nominale : Sweep BSL -> Déplacement SIBI -> Zone BPR -> Retest 50% CE -> Signal Entrée',
    bars: [
      { t: 1, o: 1.0825, h: 1.0852, l: 1.0820, c: 1.0848, label: 'Expansion BISI' },
      { t: 2, o: 1.0848, h: 1.0865, l: 1.0840, c: 1.0842, label: 'Sweep BSL' },
      { t: 3, o: 1.0842, h: 1.0850, l: 1.0808, c: 1.0812, label: 'Déplacement SIBI' },
      { t: 4, o: 1.0812, h: 1.0826, l: 1.0802, c: 1.0822, label: 'Consolidation' },
      { t: 5, o: 1.0822, h: 1.0838, l: 1.0818, c: 1.0828, label: 'Retest 50% CE' },
      { t: 6, o: 1.0828, h: 1.0831, l: 1.0795, c: 1.0798, label: 'Départ & TP' },
    ],
    expected: [
      { t: 2, event: 'SWEEP_BSL', reason: 'Prise de liquidité haute (1.0865) suivie de rejet' },
      { t: 3, event: 'ZONE_FORMED', zone_low: 1.0825, zone_high: 1.0840, ce_50: 1.08325, reason: 'Recouvrement BISI/SIBI validé à la clôture t=3' },
      { t: 5, event: 'ENTRY_SIGNAL', ce_50: 1.08325, reason: 'Mèche teste 50% CE (1.0838 >= 1.08325) avec clôture sous le CE (1.0828)' },
      { t: 6, event: 'TARGET_REACHED', reason: 'Expansion baissière vers la liquidité externe (SSL)' },
    ],
  },
];

function toFiniteNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeFixtureObject(obj: any, index: number): OhlcFixture | null {
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.bars) || obj.bars.length < 2) {
    return null;
  }

  const rawEvents = Array.isArray(obj.expected)
    ? obj.expected
    : Array.isArray(obj.expected_events)
      ? obj.expected_events
      : [];

  const expected: OhlcFixtureExpectedEvent[] = rawEvents
    .filter((e: any) => e && typeof e === 'object')
    .map((e: any) => {
      const t = toFiniteNumber(e.t ?? e.bar, 1);
      const event = String(e.event || 'EVENT');
      const rawLow = e.zone_low ?? e.bottom;
      const rawHigh = e.zone_high ?? e.top;
      const zone_low = rawLow !== undefined && Number.isFinite(Number(rawLow)) ? Number(rawLow) : undefined;
      const zone_high = rawHigh !== undefined && Number.isFinite(Number(rawHigh)) ? Number(rawHigh) : undefined;
      const ce_50 = e.ce_50 !== undefined && Number.isFinite(Number(e.ce_50)) ? Number(e.ce_50) : undefined;

      let reason: string | undefined = typeof e.reason === 'string' ? e.reason : undefined;
      if (!reason) {
        const entryVal = e.entry_price ?? e.entry_filled_at;
        const exitVal = e.exit_price ?? e.price;
        if (entryVal !== undefined) {
          reason = `Entrée déclenchée @ ${entryVal}${e.stop_loss !== undefined ? ` | SL: ${e.stop_loss}` : ''}`;
        } else if (exitVal !== undefined) {
          reason = `Objectif atteint @ ${exitVal}`;
        } else if (zone_low !== undefined && zone_high !== undefined) {
          reason = `${e.direction ? `${e.direction} ` : ''}[${zone_low.toFixed(4)} – ${zone_high.toFixed(4)}]${ce_50 !== undefined ? ` (CE 50%: ${ce_50.toFixed(4)})` : ''}`;
        }
      }


      return {
        t,
        event,
        ...(zone_low !== undefined ? { zone_low } : {}),
        ...(zone_high !== undefined ? { zone_high } : {}),
        ...(ce_50 !== undefined ? { ce_50 } : {}),
        ...(reason !== undefined ? { reason } : {}),
      };
    });

  return {
    fixture_id: String(obj.fixture_id || `FX-0${index + 1}`),
    description: String(obj.description || 'Fixture OHLC déterministe extraite de B6'),
    bars: obj.bars.map((b: any, idx: number) => ({
      t: toFiniteNumber(b?.t, idx + 1),
      o: toFiniteNumber(b?.o, 1.08),
      h: toFiniteNumber(b?.h, 1.085),
      l: toFiniteNumber(b?.l, 1.075),
      c: toFiniteNumber(b?.c, 1.082),
      ...(typeof b?.label === 'string' ? { label: b.label } : {}),
    })),
    expected,
  };
}

export function parseFixturesFromContent(content?: string): OhlcFixture[] {
  if (!content) return DEFAULT_B6_FIXTURES;
  const parsed: OhlcFixture[] = [];
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const raw = JSON.parse(match[1]);
      const candidates = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray(raw.fixtures)
          ? raw.fixtures
          : [raw];
      for (const candidate of candidates) {
        const normalized = normalizeFixtureObject(candidate, parsed.length);
        if (normalized) {
          parsed.push(normalized);
        }
      }
    } catch {
      // Ignore malformed JSON blocks
    }
  }
  return parsed.length > 0 ? parsed : DEFAULT_B6_FIXTURES;
}


