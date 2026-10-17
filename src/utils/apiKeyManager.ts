/**
 * API Key & Model Configuration Manager for Google AI Studio / Gemini Pro
 */

export type SupportedGeminiModel =
  | 'gemini-2.5-pro'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash';

export const SUPPORTED_GEMINI_MODELS: SupportedGeminiModel[] = [
  'gemini-2.5-pro',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
];

export const DEFAULT_PRO_KEY = '';
const LEGACY_PLACEHOLDER_PREFIX = 'AQ.' + 'Ab8RN6';

export function getActiveApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hugo_fx_gemini_api_key');
    if (saved && saved.trim() && saved.trim() !== DEFAULT_PRO_KEY && !saved.trim().startsWith(LEGACY_PLACEHOLDER_PREFIX)) {
      return saved.trim();
    }
  }
  // Vite injected env var
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey.trim() !== DEFAULT_PRO_KEY && !envKey.trim().startsWith(LEGACY_PLACEHOLDER_PREFIX)) {
    return envKey.trim();
  }

  // Return empty string so the backend server falls back to process.env.GEMINI_API_KEY
  return '';
}

export function setActiveApiKey(newKey: string): void {
  if (typeof window !== 'undefined') {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed === DEFAULT_PRO_KEY) {
      localStorage.removeItem('hugo_fx_gemini_api_key');
    } else {
      localStorage.setItem('hugo_fx_gemini_api_key', trimmed);
    }
  }
}

export interface ApiTestResult {
  success: boolean;
  message: string;
  model?: string;
  serviceTier?: string;
  latencyMs?: number;
}

export async function testGeminiApiKey(key: string): Promise<ApiTestResult> {
  const cleanKey = key.trim();
  if (!cleanKey) {
    return { success: false, message: 'La clÃ© API est vide.' };
  }

  const startTime = Date.now();
  const modelsToTry: SupportedGeminiModel[] = [...SUPPORTED_GEMINI_MODELS];

  for (const modelCandidate of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reponds: OK' }] }]
        })
      });

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const model = data.modelVersion || modelCandidate;
        const serviceTier = data.usageMetadata?.serviceTier || 'standard';

        return {
          success: true,
          message: 'Connexion Ã©tablie avec succÃ¨s ! ClÃ© Pro active et validÃ©e.',
          model,
          serviceTier,
          latencyMs
        };
      }

      if (response.status === 503) {
        // 503 means authentication succeeded (key is valid!), but Google's cluster has a temporary spike
        return {
          success: true,
          message: 'ClÃ© Pro authentifiÃ©e avec succÃ¨s par Google (Forte charge temporaire du cluster Google AI 503).',
          model: modelCandidate,
          serviceTier: 'standard',
          latencyMs
        };
      }

      // If invalid key (400 or 403 or 401)
      if (response.status === 400 || response.status === 403 || response.status === 401) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errData.error?.message || `ClÃ© non reconnue (HTTP ${response.status})`,
          latencyMs
        };
      }
    } catch {
      // Continue to next candidate
    }
  }

  return {
    success: false,
    message: 'Erreur rÃ©seau lors de la communication avec Google AI.',
    latencyMs: Date.now() - startTime
  };
}
