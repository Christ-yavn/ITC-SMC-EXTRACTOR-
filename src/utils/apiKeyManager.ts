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

export function getActiveApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hugo_fx_gemini_api_key');
    if (saved && saved.trim()) {
      return saved.trim();
    }
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return DEFAULT_PRO_KEY;
}

export function setCustomApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    const trimmed = key.trim();
    if (!trimmed) {
      localStorage.removeItem('hugo_fx_gemini_api_key');
    } else {
      localStorage.setItem('hugo_fx_gemini_api_key', trimmed);
    }
  }
}

export function hasCustomApiKey(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hugo_fx_gemini_api_key');
    return Boolean(saved && saved.trim());
  }
  return true;
}

export function getPreferredModel(): SupportedGeminiModel {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hugo_fx_gemini_model') as SupportedGeminiModel | null;
    if (saved && SUPPORTED_GEMINI_MODELS.includes(saved)) {
      return saved;
    }
  }
  return 'gemini-2.5-pro';
}

export function setPreferredModel(model: SupportedGeminiModel): void {
  if (typeof window !== 'undefined' && SUPPORTED_GEMINI_MODELS.includes(model)) {
    localStorage.setItem('hugo_fx_gemini_model', model);
  }
}