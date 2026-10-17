import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  deduplicateVideos, 
  calculateSlices, 
  validateFicheContent,
  lintFicheV3 
} from './pipeline.ts';
import type { RawVideoItem } from './pipeline.ts';
import { FICHE_DG2_OSUXN60_BPR } from '../data/fiches/dg2_OsUXN60_BPR.ts';

test('deduplicateVideos merges playlists and sorts chronologically', () => {
  const sample: RawVideoItem[] = [
    {
      playlist: 'P2',
      rang: 1,
      video_id: 'vid123',
      url: 'https://youtube.com/watch?v=vid123',
      titre: 'Killzones SMC',
      date_video: '2024-05-10',
      duree_s: 1200,
      description: 'PrÃ©sentation des Killzones'
    },
    {
      playlist: 'P4',
      rang: 5,
      video_id: 'vid123',
      url: 'https://youtube.com/watch?v=vid123',
      titre: 'Killzones SMC (rediff)',
      date_video: '2024-05-10',
      duree_s: 1200,
      description: 'MÃªme vidÃ©o dans P4'
    },
    {
      playlist: 'P1',
      rang: 1,
      video_id: 'vid001',
      url: 'https://youtube.com/watch?v=vid001',
      titre: 'Introduction Order Block',
      date_video: '2023-12-01',
      duree_s: 900,
      description: 'Intro OB'
    }
  ];

  const deduped = deduplicateVideos(sample);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].video_id, 'vid001');
  assert.equal(deduped[1].video_id, 'vid123');
  assert.deepEqual(deduped[1].playlists, ['P2', 'P4']);
});

test('calculateSlices slices videos longer than 35 minutes (2100s)', () => {
  const shortSlices = calculateSlices('v_short', 1500, 35);
  assert.equal(shortSlices.length, 1);
  assert.equal(shortSlices[0].slice_id, 'v_short-S1');
  assert.equal(shortSlices[0].start_s, 0);
  assert.equal(shortSlices[0].end_s, 1500);

  const longSlices = calculateSlices('v_long', 5400, 35);
  assert.equal(longSlices.length, 3);
  assert.equal(longSlices[0].slice_id, 'v_long-S1');
  assert.equal(longSlices[1].slice_id, 'v_long-S2');
  assert.equal(longSlices[2].slice_id, 'v_long-S3');
});

test('lintFicheV3 validates benchmark FICHE_DG2_OSUXN60_BPR with 10/10 verdict', () => {
  const result = lintFicheV3(FICHE_DG2_OSUXN60_BPR);
  assert.equal(result.isV3, true);
  assert.equal(result.isValid, true);
  assert.equal(result.verdict, 'PRÃŠT_POUR_CODAGE_10_SUR_10');
  assert.equal(result.checks.causalStructure, true);
  assert.equal(result.checks.allEightHumanSections, true);
  assert.equal(result.checks.doubleFSM, true);
  assert.equal(result.checks.fixturesOHLC, true);
  assert.equal(result.checks.antiInventedScoring, true);
  assert.equal(result.checks.rulesCoverage, true);
  assert.equal(result.errors.length, 0);

  // Check extracted counts
  assert.ok(result.counts.countS >= 18, `Expected >= 18 S citations, got ${result.counts.countS}`);
  assert.ok(result.counts.countF >= 5, `Expected >= 5 F visual proofs, got ${result.counts.countF}`);
  assert.ok(result.counts.countX >= 4, `Expected >= 4 X examples, got ${result.counts.countX}`);
  assert.ok(result.counts.countP >= 9, `Expected >= 9 P parameters, got ${result.counts.countP}`);
  assert.ok(result.counts.countD >= 6, `Expected >= 6 D decisions, got ${result.counts.countD}`);
  assert.ok(result.counts.countR >= 9, `Expected >= 9 R rules, got ${result.counts.countR}`);
});

test('lintFicheV3 rejects a fiche with invented scoring points', () => {
  const badFicheWithPoints = FICHE_DG2_OSUXN60_BPR + '\nCritÃ¨re de scoring inventÃ© : +40 pts si confluence\n';
  const result = lintFicheV3(badFicheWithPoints);
  assert.equal(result.checks.antiInventedScoring, false);
  assert.equal(result.isValid, false);
  assert.equal(result.verdict, 'RÃ‰VISION_REQUISE');
  assert.ok(result.errors.some(e => e.includes('BarÃ¨me Ã  points inventÃ©')));
});

test('lintFicheV3 rejects a fiche with a missing human section', () => {
  // Remove section 5 Contre-exemples
  const badFicheMissingSection = FICHE_DG2_OSUXN60_BPR.replace('### 5. Contre-exemples', '### 5. SupprimÃ©');
  const result = lintFicheV3(badFicheMissingSection);
  assert.equal(result.checks.allEightHumanSections, false);
  assert.equal(result.isValid, false);
  assert.equal(result.verdict, 'RÃ‰VISION_REQUISE');
  assert.ok(result.missingHumanSections.some(s => s.includes('Contre-exemples')));
});

test('validateFicheContent backward-compatibility works on both v2 and v3', () => {
  const v3Res = validateFicheContent(FICHE_DG2_OSUXN60_BPR);
  assert.equal(v3Res.isValid, true);

  const legacyV2 = `
<METADONNEES_YAML>id: test</METADONNEES_YAML>
<POSITION_CURSUS>cursus</POSITION_CURSUS>
<CORPUS_REGLES>regles</CORPUS_REGLES>
<EXEMPLES_GRAPHIQUES>exemples</EXEMPLES_GRAPHIQUES>
<AUDIT_FIABILITE>audit</AUDIT_FIABILITE>
`;
  const legacyRes = validateFicheContent(legacyV2);
  assert.equal(legacyRes.isValid, true);
});

test('classifyConceptStrict strictly matches concepts with word boundaries', async () => {
  const { classifyConceptStrict } = await import('./pipeline.ts');
  
  // Anti-false positive test: 'ob' inside words must NEVER match Order Block
  const proba = classifyConceptStrict('Ce Setup ICT a 80% de probabilitÃ©');
  assert.notEqual(proba.conceptCode, 'OB');

  const oblige = classifyConceptStrict('Tu es OBLIGÃ‰ de ConnaÃ®tre cette StratÃ©gie');
  assert.notEqual(oblige.conceptCode, 'OB');

  const objectif = classifyConceptStrict('Quel Objectif Choisir');
  assert.notEqual(objectif.conceptCode, 'OB');

  // Real matches
  const realOb = classifyConceptStrict('Identifier un Order Block Valide');
  assert.equal(realOb.conceptCode, 'OB');

  const realBpr = classifyConceptStrict('Le BPR = l\'arme Redoutable du Trader');
  assert.equal(realBpr.conceptCode, 'BPR');

  const realFvg = classifyConceptStrict('Comprendre le Fair Value Gap FVG');
  assert.equal(realFvg.conceptCode, 'FVG');
});

test('lintFicheV3 strictly rejects fake clone template signature (SIMULATION_INTERDITE)', () => {
  const fakeClone = `---
schema_version: "SCRIBE-ICT-v3.0"
video_id: "fake_test"
duree_secondes: 1200
---
## I. REGISTRE DE PREUVES HORODATÃ‰
S-01 Ã  00:01:45 : "C'est la zone exacte oÃ¹ l'algorithme interbancaire vient rÃ©Ã©quilibrer les ordres"
`;
  const result = lintFicheV3(fakeClone);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('SIMULATION_INTERDITE')));
});

test('lintFicheV3 rejects temporal inconsistency when timestamp exceeds video duration', () => {
  const ficheWithBadTimestamp = `---
schema_version: "SCRIBE-ICT-v3.0"
video_id: "short_vid"
duree_secondes: 300
---
## I. REGISTRE DE PREUVES HORODATÃ‰
### 1. Preuves Verbales
S-01 [08:30] : Citation impossible car la vidÃ©o fait 5 minutes
## II. TABLE UNIQUE DES PARAMÃˆTRES
<<<CONCEPT_SPEC_V3>>>
ZONE_FSM
TRADE_FSM
{"fixture_id": "F1"}
<<<FIN_CONCEPT_SPEC_V3>>>
## IV. LEÃ‡ON HUMAINE EXPERTE
### 1. Pourquoi Ã§a existe
### 2. SchÃ©ma annotÃ©
### 3. MÃ©thode pas Ã  pas
### 4. Exemples commentÃ©s
### 5. Contre-exemples
### 6. ExÃ©cution
### 7. Zones grises
### 8. Erreurs frÃ©quentes
<<<FIN_FICHE_V3>>>
`;
  const result = lintFicheV3(ficheWithBadTimestamp);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('IncohÃ©rence temporelle')));
});

test('rollbackBatchInRegistry cleanly resets videos in batch back to ClassÃ© and clears Drive file ID', async () => {
  const { createInitialRegistry, updateVideoTrace, rollbackBatchInRegistry } = await import('../services/traceabilityRegistry.ts');
  const mockVideos = [
    { video_id: 'V1', titre: 'T1', playlists: ['P1'], duree_s: 600, url: 'https://youtube.com/watch?v=V1' },
    { video_id: 'V2', titre: 'T2', playlists: ['P1'], duree_s: 800, url: 'https://youtube.com/watch?v=V2' },
  ];

  let reg = createInitialRegistry(mockVideos as any);
  reg = updateVideoTrace(reg, 'V1', {
    status: 'ValidÃ©',
    batchId: 'batch_123',
    driveFileId: 'drive_file_abc',
    codabilityScore: 10.0,
  });

  assert.equal(reg.videoRecords['V1'].status, 'ValidÃ©');
  assert.equal(reg.videoRecords['V1'].driveFileId, 'drive_file_abc');

  const rolledBack = rollbackBatchInRegistry(reg, 'batch_123');
  assert.equal(rolledBack.videoRecords['V1'].status, 'ClassÃ©');
  assert.equal(rolledBack.videoRecords['V1'].driveFileId, undefined);
  assert.equal(rolledBack.videoRecords['V1'].batchId, undefined);
  assert.equal(rolledBack.videoRecords['V2'].status, 'ClassÃ©');
});

test('rollbackVideosInRegistry resets specified videos back to ClassÃ©', async () => {
  const { createInitialRegistry, updateVideoTrace, rollbackVideosInRegistry } = await import('../services/traceabilityRegistry.ts');
  const mockVideos = [
    { video_id: 'V1', titre: 'T1', playlists: ['P1'], duree_s: 600, url: 'https://youtube.com/watch?v=V1' },
    { video_id: 'V2', titre: 'T2', playlists: ['P1'], duree_s: 800, url: 'https://youtube.com/watch?v=V2' },
  ];

  let reg = createInitialRegistry(mockVideos as any);
  reg = updateVideoTrace(reg, 'V1', { status: 'ValidÃ©', driveFileId: 'f1' });
  reg = updateVideoTrace(reg, 'V2', { status: 'ValidÃ©', driveFileId: 'f2' });

  const rolledBack = rollbackVideosInRegistry(reg, ['V1']);
  assert.equal(rolledBack.videoRecords['V1'].status, 'ClassÃ©');
  assert.equal(rolledBack.videoRecords['V1'].driveFileId, undefined);
  assert.equal(rolledBack.videoRecords['V2'].status, 'ValidÃ©');
});

test('traceability registry records enforce zero-storage: contains light metadata without full markdown body', async () => {
  const { createInitialRegistry, updateVideoTrace } = await import('../services/traceabilityRegistry.ts');
  const mockVideos = [
    { video_id: 'V_TEST', titre: 'T', playlists: ['P1'], duree_s: 1200, url: 'https://youtube.com/watch?v=V_TEST' },
  ];
  let reg = createInitialRegistry(mockVideos as any);
  reg = updateVideoTrace(reg, 'V_TEST', {
    status: 'ValidÃ©',
    codabilityScore: 10.0,
    fileSizeBytes: 24500,
    driveFileId: 'drive_xyz',
    driveFileName: 'FICHE-ICT-V_TEST.md',
    batchId: 'batch_alpha',
  });

  const record = reg.videoRecords['V_TEST'];
  assert.ok(record);
  // Must NOT contain full markdown body
  assert.equal((record as any).content, undefined);
  assert.equal((record as any).ficheContent, undefined);
  assert.equal(record.fileSizeBytes, 24500);
  assert.equal(record.driveFileId, 'drive_xyz');
});

test('lintFicheV3 supports both P-01 / R-01 and P-CONCEPT-01 / R-CONCEPT-01 plus HH:MM:SS timestamps and duree_s', () => {
  // Replace P-BPR-01 with P-01 and R-BPR-001 with R-01 in benchmark fiche
  const modifiedFiche = FICHE_DG2_OSUXN60_BPR
    .replace(/duree_secondes:\s*\d+/, 'duree_s: 3600')
    .replace(/P-BPR-01/g, 'P-01')
    .replace(/R-BPR-001/g, 'R-01');

  const resValid = lintFicheV3(modifiedFiche);
  assert.equal(resValid.isValid, true);
  assert.ok(resValid.parametersDefined.includes('P-01'));
  assert.ok(resValid.rulesDefined.includes('R-01'));

  // Inject an out-of-bounds HH:MM:SS timestamp (01:05:30 = 3930s > 3600s) in Section I
  const outOfBoundsHhMmSs = modifiedFiche.replace(
    '## I. REGISTRE DE PREUVES HORODATÃ‰',
    '## I. REGISTRE DE PREUVES HORODATÃ‰\nS-99 [01:05:30] : Timestamp hors durÃ©e'
  );
  const resInvalid = lintFicheV3(outOfBoundsHhMmSs);
  assert.equal(resInvalid.isValid, false);
  assert.ok(resInvalid.errors.some(e => e.includes('01:05:30') && e.includes('3930s')));
});

test('extractFicheLightMetrics extracts rules, params, concepts, definition, and counts for Zero-Storage', async () => {
  const { extractFicheLightMetrics } = await import('../services/traceabilityRegistry.ts');
  const metrics = extractFicheLightMetrics(FICHE_DG2_OSUXN60_BPR, 'Le BPR = l\'arme Redoutable du Trader');

  assert.equal(metrics.codabilityScore, 10.0);
  assert.ok(metrics.rules && metrics.rules.length >= 9);
  assert.ok(metrics.params && metrics.params.length >= 9);
  assert.ok(metrics.concepts && metrics.concepts.includes('BPR'));
  assert.ok(metrics.counts && metrics.counts.proofsCount >= 20);
  assert.ok(metrics.definition && metrics.definition.length > 10);
});

test('apiKeyManager never returns fake DEFAULT_PRO_KEY by default and exposes 4 official Gemini models', async () => {
  const { getActiveApiKey, SUPPORTED_GEMINI_MODELS } = await import('./apiKeyManager.ts');
  assert.equal(getActiveApiKey(), '');
  assert.deepEqual(SUPPORTED_GEMINI_MODELS, [
    'gemini-2.5-pro',
    'gemini-3.1-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
  ]);
});

test('parseFixturesFromContent parses B6 JSON array with expected_events from FICHE_DG2_OSUXN60_BPR without falling back to default', async () => {
  const { parseFixturesFromContent } = await import('./pipeline.ts');
  const fixtures = parseFixturesFromContent(FICHE_DG2_OSUXN60_BPR);

  assert.equal(fixtures.length, 1);
  const fx = fixtures[0];
  assert.equal(fx.fixture_id, 'FX-BPR-01');
  assert.equal(fx.bars.length, 9);
  assert.equal(fx.bars[0].t, 1);
  assert.equal(fx.bars[8].t, 9);
  assert.equal(fx.bars[8].c, 1.0874);

  // Verify all 5 expected_events from FICHE_DG2_OSUXN60_BPR are normalized
  assert.equal(fx.expected.length, 5);
  const bprActive = fx.expected.find(e => e.event === 'BPR_ACTIVE');
  assert.ok(bprActive, 'Expected BPR_ACTIVE event in parsed fixture');
  assert.equal(bprActive.t, 6);
  assert.equal(bprActive.zone_low, 1.0842);
  assert.equal(bprActive.zone_high, 1.0846);
  assert.equal(bprActive.ce_50, 1.0844);

  const bprTouched = fx.expected.find(e => e.event === 'BPR_TOUCHED_VALID');
  assert.ok(bprTouched);
  assert.equal(bprTouched.t, 8);
  assert.ok(bprTouched.reason?.includes('1.0846'));
});


test('parseFixturesFromContent handles { fixtures: [...] } wrapper and non-numeric OHLC values without NaN', async () => {
  const { parseFixturesFromContent } = await import('./pipeline.ts');
  const wrappedMd = `
\`\`\`json
{
  "fixtures": [
    {
      "fixture_id": "FX-WRAP-01",
      "bars": [
        {"t": "1", "o": "invalid", "h": 1.10, "l": 1.05, "c": 1.08},
        {"t": 2, "o": 1.08, "h": null, "l": 1.06, "c": 1.09}
      ],
      "expected_events": [
        {"bar": "2", "event": "BPR_ACTIVE", "bottom": "1.0700", "top": "1.0800", "ce_50": 1.0750}
      ]
    }
  ]
}
\`\`\`
`;
  const fixtures = parseFixturesFromContent(wrappedMd);
  assert.equal(fixtures.length, 1);
  assert.equal(fixtures[0].fixture_id, 'FX-WRAP-01');
  assert.ok(Number.isFinite(fixtures[0].bars[0].o));
  assert.ok(Number.isFinite(fixtures[0].bars[1].h));
  assert.equal(fixtures[0].expected[0].t, 2);
  assert.equal(fixtures[0].expected[0].zone_low, 1.07);
  assert.equal(fixtures[0].expected[0].zone_high, 1.08);
});

test('buildMasterScribePromptV3 automatically computes 35-minute active slice for videos > 2100s', async () => {
  const { buildMasterScribePromptV3 } = await import('../services/geminiExtractionService.ts');
  const longVideo = {
    video_id: 'LONG_VID_01',
    url: 'https://www.youtube.com/watch?v=LONG_VID_01',
    titre: 'Masterclass BPR & FVG Longue',
    date_video: '2024-06-01',
    duree_s: 5400,
    playlists: ['P1'],
    famille: 'CONCEPTS_SETUPS',
    rangs: { P1: 1 },
    description: 'Long video',
  };

  const prompt = buildMasterScribePromptV3(longVideo as any);
  assert.ok(prompt.includes('tranche_active: "00:00 - 35:00"'));
  assert.ok(prompt.includes('TRANCHE_ANALYSEE : 00:00 - 35:00'));
});



