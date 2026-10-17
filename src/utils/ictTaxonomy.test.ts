import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyVideoTaxonomy, ICT_PILLARS } from './ictTaxonomy.ts';

test('classifyVideoTaxonomy correctly maps BPR to 03_PD_Arrays_et_Desequilibres/BPR_Balanced_Price_Range', () => {
  const bprVideo = {
    titre: 'Le BPR = l’arme Redoutable du Trader',
    video_id: 'dg2-OsUXN60',
  };
  const result = classifyVideoTaxonomy(bprVideo);
  assert.equal(result.pillarId, '03_PD_ARRAYS');
  assert.equal(result.conceptCode, 'BPR');
  assert.equal(result.conceptFolder, 'BPR_Balanced_Price_Range');
  assert.deepEqual(result.pathSegments, ['03_PD_Arrays_et_Desequilibres', 'BPR_Balanced_Price_Range']);
});

test('classifyVideoTaxonomy correctly maps FVG to 03_PD_Arrays_et_Desequilibres/FVG_Fair_Value_Gaps', () => {
  const fvgVideo = {
    titre: 'TOUT savoir sur les FAIR VALUE GAPS (FVG)',
    video_id: 'skk0sm6LN6M',
  };
  const result = classifyVideoTaxonomy(fvgVideo);
  assert.equal(result.pillarId, '03_PD_ARRAYS');
  assert.equal(result.conceptCode, 'FVG');
  assert.equal(result.conceptFolder, 'FVG_Fair_Value_Gaps');
});

test('classifyVideoTaxonomy correctly maps Order Blocks without false positives on words like probabilité', () => {
  const obVideo = {
    titre: 'Identifier les MEILLEURS ORDER BLOCKS (SMC)',
    video_id: 'HI8LFZ1unE4',
  };
  const result = classifyVideoTaxonomy(obVideo);
  assert.equal(result.pillarId, '03_PD_ARRAYS');
  assert.equal(result.conceptCode, 'OB');
  assert.equal(result.conceptFolder, 'OB_Order_Blocks');

  // Negative test: "probabilité" must not match Order Block
  const probaVideo = {
    titre: 'Ce Setup ICT a 80% de probabilité',
    video_id: 'test_proba',
  };
  const probaResult = classifyVideoTaxonomy(probaVideo);
  assert.notEqual(probaResult.conceptCode, 'OB');
});

test('classifyVideoTaxonomy correctly maps Daily Bias to 06_TopDown_DailyBias_et_MultiTF', () => {
  const biasVideo = {
    titre: 'Le SECRET sur le BIAIS DAILY enfin partagé !',
    video_id: 'DOKhK8TFre8',
  };
  const result = classifyVideoTaxonomy(biasVideo);
  assert.equal(result.pillarId, '06_TOPDOWN');
  assert.equal(result.conceptCode, 'DAILY_BIAS');
});

test('classifyVideoTaxonomy correctly maps Psychology to 07_Psychologie_RiskManagement_et_Journal', () => {
  const psychoVideo = {
    titre: 'La Psychologie du Trader Rentable',
    video_id: 'test_psycho',
  };
  const result = classifyVideoTaxonomy(psychoVideo);
  assert.equal(result.pillarId, '07_PSYCHO_RISK');
  assert.equal(result.conceptCode, 'RISK_PSYCHO');
});

test('classifyVideoIntoTaxonomy returns folderName alias matching pillarFolder across all 7 pillars', async () => {
  const { classifyVideoIntoTaxonomy } = await import('./ictTaxonomy.ts');
  const bpr = classifyVideoIntoTaxonomy('Le BPR = l’arme Redoutable du Trader');
  assert.equal(bpr.folderName, '03_PD_Arrays_et_Desequilibres');
  assert.equal(bpr.pillarFolder, '03_PD_Arrays_et_Desequilibres');

  const psycho = classifyVideoIntoTaxonomy('La Psychologie du Trader Rentable');
  assert.ok(psycho.folderName.startsWith('07_'));

  const bias = classifyVideoIntoTaxonomy('Le SECRET sur le BIAIS DAILY enfin partagé !');
  assert.ok(bias.folderName.startsWith('06_'));
});

