/**
 * Pure helper utilities for Google Drive file operations and formatting.
 */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
}

/**
 * Builds a valid multipart/related body for Google Drive v3 upload API.
 */
export function buildMultipartBody(
  metadata: Record<string, unknown>,
  content: string,
  contentType = 'text/markdown; charset=UTF-8',
  boundary = '-------314159265358979323846'
): { body: string; contentTypeHeader: string } {
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${contentType}\r\n\r\n` +
    content +
    closeDelimiter;

  return {
    body,
    contentTypeHeader: `multipart/related; boundary=${boundary}`,
  };
}

/**
 * Human-readable file size formatter.
 */
export function formatDriveFileSize(bytes?: number | string): string {
  if (bytes === undefined || bytes === null || bytes === '') return '-';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num <= 0) return '0 B';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sanitizes file names to be safe across filesystems and Google Drive.
 */
export function sanitizeDriveFileName(name: string, extension = 'md'): string {
  const clean = name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim()
    .replace(/\s+/g, ' ');
  const suffix = extension.startsWith('.') ? extension : `.${extension}`;
  if (clean.endsWith(suffix)) {
    return clean;
  }
  return `${clean}${suffix}`;
}

/**
 * Standardizes filename for a HugoFX fiche.
 */
export function generateFicheDriveFileName(videoId: string, title?: string): string {
  if (!title) {
    return `HugoFX_Fiche_${videoId}.md`;
  }
  // Shorten title to 50 chars max for clean filename
  const shortTitle = title.slice(0, 50).trim();
  return sanitizeDriveFileName(`HugoFX_Fiche_${videoId}_${shortTitle}`, 'md');
}

/**
 * Parses Drive API response error messages into friendly descriptions.
 */
export function parseDriveError(error: unknown): string {
  if (!error) return 'Erreur inconnue lors de l\'opération Google Drive';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const errObj = error as { message?: string; error?: { message?: string; status?: string } };
    if (errObj.error?.message) return errObj.error.message;
    if (errObj.message) return errObj.message;
  }
  return 'Erreur de communication avec Google Drive';
}
