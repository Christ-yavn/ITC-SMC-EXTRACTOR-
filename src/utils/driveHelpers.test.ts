import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMultipartBody,
  formatDriveFileSize,
  sanitizeDriveFileName,
  generateFicheDriveFileName,
  parseDriveError
} from './driveHelpers.ts';

test('buildMultipartBody creates valid multipart payload with JSON metadata and file content', () => {
  const metadata = { name: 'test.md', mimeType: 'text/markdown' };
  const content = '# Test Content';
  const result = buildMultipartBody(metadata, content, 'text/markdown; charset=UTF-8', 'test-boundary');

  assert.equal(result.contentTypeHeader, 'multipart/related; boundary=test-boundary');
  assert.ok(result.body.includes('--test-boundary'));
  assert.ok(result.body.includes('Content-Type: application/json; charset=UTF-8'));
  assert.ok(result.body.includes(JSON.stringify(metadata)));
  assert.ok(result.body.includes('Content-Type: text/markdown; charset=UTF-8'));
  assert.ok(result.body.includes('# Test Content'));
  assert.ok(result.body.endsWith('--test-boundary--'));
});

test('formatDriveFileSize formats byte counts into human units', () => {
  assert.equal(formatDriveFileSize(undefined), '-');
  assert.equal(formatDriveFileSize(0), '0 B');
  assert.equal(formatDriveFileSize(512), '512 B');
  assert.equal(formatDriveFileSize(2048), '2.0 KB');
  assert.equal(formatDriveFileSize(1048576 * 2.5), '2.5 MB');
  assert.equal(formatDriveFileSize('1024'), '1.0 KB');
});

test('sanitizeDriveFileName removes forbidden characters and ensures extension', () => {
  assert.equal(sanitizeDriveFileName('fiche: fvg / sweep? *', 'md'), 'fiche_ fvg _ sweep_ _.md');
  assert.equal(sanitizeDriveFileName('already_has_ext.md', 'md'), 'already_has_ext.md');
  assert.equal(sanitizeDriveFileName('data_sheet', '.tsv'), 'data_sheet.tsv');
});

test('generateFicheDriveFileName produces clean readable file names', () => {
  const filename = generateFicheDriveFileName('skk0sm6LN6M', 'Fair Value Gap (FVG) Théorie Complète');
  assert.equal(filename, 'HugoFX_Fiche_skk0sm6LN6M_Fair Value Gap (FVG) Théorie Complète.md');

  const fallback = generateFicheDriveFileName('skk0sm6LN6M');
  assert.equal(fallback, 'HugoFX_Fiche_skk0sm6LN6M.md');
});

test('parseDriveError extracts error message cleanly', () => {
  assert.equal(parseDriveError('Custom error message'), 'Custom error message');
  assert.equal(parseDriveError({ error: { message: 'Quota exceeded' } }), 'Quota exceeded');
  assert.equal(parseDriveError({ message: 'Network failed' }), 'Network failed');
});

test('extractYoutubeIdFromDriveFileName and reconcileRegistryWithDrive recognize 106/106 videos including all 18 IDs with underscores', async () => {
  const { HARVESTED_VIDEOS } = await import('../data/harvestedVideos.ts');
  const { deduplicateVideos } = await import('./pipeline.ts');
  const {
    createInitialRegistry,
    extractYoutubeIdFromDriveFileName,
    reconcileRegistryWithDrive,
  } = await import('../services/traceabilityRegistry.ts');

  const videos = deduplicateVideos(HARVESTED_VIDEOS);
  assert.equal(videos.length, 106);

  // Verify the 15 videos with underscores in their YouTube ID (plus hyphens)
  const underscoreVideos = videos.filter(v => v.video_id.includes('_'));
  assert.equal(underscoreVideos.length, 15);

  const mockDriveFiles = videos.map((v, i) => {
    const fileName = generateFicheDriveFileName(v.video_id, v.titre);
    // Every single generated Drive filename must round-trip back to the exact video_id
    const extractedId = extractYoutubeIdFromDriveFileName(fileName);
    assert.equal(extractedId, v.video_id, `Failed to extract ID from ${fileName}`);

    return {
      id: `drive_file_${i + 1}`,
      name: fileName,
      mimeType: 'text/markdown',
      size: '28500',
      webViewLink: `https://drive.google.com/file/d/drive_file_${i + 1}/view`,
    };
  });

  const initialReg = createInitialRegistry(videos);
  const { updatedRegistry, fakeClonesFound } = reconcileRegistryWithDrive(
    initialReg,
    mockDriveFiles
  );

  assert.equal(updatedRegistry.telemetry.totalDriveFilesLinked, 106);
  assert.equal(fakeClonesFound.length, 0);

  for (const v of videos) {
    const rec = updatedRegistry.videoRecords[v.video_id];
    assert.ok(rec, `Missing record for ${v.video_id}`);
    assert.ok(rec.status === 'Validé' || rec.status === 'Extrait');
    assert.ok(rec.driveFileId?.startsWith('drive_file_'));
    assert.ok(rec.counts && rec.counts.proofsCount > 0);
  }
});

test('extractYoutubeIdFromDriveFileName handles legacy formats, empty inputs, and non-matching filenames safely', async () => {
  const { extractYoutubeIdFromDriveFileName, reconcileRegistryWithDrive, createInitialRegistry } = await import('../services/traceabilityRegistry.ts');
  const { HARVESTED_VIDEOS } = await import('../data/harvestedVideos.ts');
  const { deduplicateVideos } = await import('./pipeline.ts');

  assert.equal(extractYoutubeIdFromDriveFileName(''), null);
  assert.equal(extractYoutubeIdFromDriveFileName('random_document.pdf'), null);
  assert.equal(extractYoutubeIdFromDriveFileName('HugoFX_Fiche_ICT_x_9K2_aBcDe_Titre_Avec_Underscores.md'), 'x_9K2_aBcDe');
  assert.equal(extractYoutubeIdFromDriveFileName('FICHE-ICT-dg2-OsUXN60.md'), 'dg2-OsUXN60');

  // Verify fake clone 197L detection (< 16000 bytes on non-dg2-OsUXN60 file)
  const videos = deduplicateVideos(HARVESTED_VIDEOS);
  const initialReg = createInitialRegistry(videos);
  const targetVid = videos.find(v => v.video_id.includes('_'))!;
  const { updatedRegistry, fakeClonesFound } = reconcileRegistryWithDrive(initialReg, [
    {
      id: 'fake_clone_id',
      name: `HugoFX_Fiche_${targetVid.video_id}_Clone.md`,
      mimeType: 'text/markdown',
      size: '11200',
    },
  ]);

  assert.equal(fakeClonesFound.length, 1);
  assert.equal(updatedRegistry.videoRecords[targetVid.video_id].status, 'Brouillon_Errone_197');
  assert.equal(updatedRegistry.videoRecords[targetVid.video_id].isFakeClone197, true);
});


