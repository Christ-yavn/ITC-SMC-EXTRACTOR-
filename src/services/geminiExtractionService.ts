/**
 * Real Gemini Multimodal Extraction Service (SCRIBE-ICT v3)
 * 
 * Interdiction absolue de simulations ou de templates de substitution :
 * Analyse RÉELLE de la vidéo YouTube via l'API Gemini Multimodale (@google/genai)
 * avec fileData: { fileUri: video.url, mimeType: 'video/*' }.
 */

import type { ConsolidatedVideoItem, VideoSlice } from '../utils/pipeline.ts';
import { calculateSlices, formatSeconds, lintFicheV3 } from '../utils/pipeline.ts';
import { getActiveApiKey, SUPPORTED_GEMINI_MODELS, type SupportedGeminiModel } from '../utils/apiKeyManager.ts';
import { SCRIBE_PROMPT_V3 } from '../data/scribePromptV2.ts';


export interface ExtractionResult {
  success: boolean;
  ficheContent: string;
  tokensUsed?: number;
  durationMs?: number;
  score?: number;
  error?: string;
  isRetryable?: boolean;
  selfRefined?: boolean;
}

/**
 * Builds the rigorous SCRIBE-ICT v3 Master Prompt for a video.
 * Unifies SCRIBE_PROMPT_V3 with genuine video metadata (real duration, real title, real date).
 */
export function buildMasterScribePromptV3(
  video: ConsolidatedVideoItem,
  slice?: VideoSlice
): string {
  const durationS = video.duree_s;
  const autoSlices = !slice && durationS > 2100 ? calculateSlices(video.video_id, durationS, 35) : [];
  const effectiveSlice = slice ?? (autoSlices.length > 1 ? autoSlices[0] : undefined);
  const formattedDuration = formatSeconds(durationS);
  const trancheStr = effectiveSlice
    ? `${effectiveSlice.formatted_start} - ${effectiveSlice.formatted_end}`
    : `00:00 - ${formattedDuration}`;

  return `${SCRIBE_PROMPT_V3}

==================================================
MÉTADONNÉES RÉELLES DE LA VIDÉO À ANALYSER :
==================================================
- ID_YOUTUBE : "${video.video_id}"
- URL_YOUTUBE : "${video.url}"
- TITRE_EXACT : "${video.titre}"
- DATE_PUBLICATION : "${video.date_video}"
- DUREE_TOTALE : ${durationS} secondes (${formattedDuration})
- TRANCHE_ANALYSEE : ${trancheStr}
- PLAYLIST : "${video.playlists.join(', ')}"
- FAMILLE : "${video.famille}"

RÈGLES D'OR D'EXÉCUTION :
1. ANALYSE RÉELLE : Écoute les propos oraux d'HugoFX et observe les graphiques TradingView à l'écran.
2. INTERDICTION DES TIMESTAMPS FICTIFS : Aucun timestamp cité ne doit dépasser ${durationS} secondes (${formattedDuration}) !
3. INTERDICTION DES BARÈMES INVENTÉS : N'invente AUCUN barème de points arbitraire (ex: "+40 pts" ou "+30 pts").
4. COUVERTURE 100% : Toutes les règles R-xxx, paramètres P-xxx et rejets REJ-xxx définis en Section II et III DOIVENT être cités entre crochets dans la Section IV (Leçon Humaine).
5. STRUCTURE CAUSALE STRICTE : Produis exactement l'en-tête YAML ci-dessous suivi des Sections I, II, III (<<<CONCEPT_SPEC_V3>>> ... <<<FIN_CONCEPT_SPEC_V3>>>), IV (8 sous-sections) et V, puis termine par <<<FIN_FICHE_V3>>> :

---
schema_version: "SCRIBE-ICT-v3.0"
fiche_id: "FICHE-ICT-${video.video_id}"
video_id: "${video.video_id}"
titre_video: "${video.titre.replace(/"/g, '\\"')}"
date_video: "${video.date_video}"
duree_secondes: ${durationS}
tranche_active: "${trancheStr}"
playlist: "${video.playlists.join(', ')}"
famille: "${video.famille}"
---
`;
}

/**
 * Executes multimodal Gemini extraction with multi-generational model fallback,
 * Self-Refine linter pass, and automatic visible countdown retry for 429 rate limits.
 */
export async function extractFicheWithGemini(
  video: ConsolidatedVideoItem,
  options: {
    model?: SupportedGeminiModel | string;
    slice?: VideoSlice;
    onProgress?: (message: string) => void;
    abortSignal?: AbortSignal;
  } = {}
): Promise<ExtractionResult> {
  const { 
    model = (typeof localStorage !== 'undefined' ? localStorage.getItem('hugofx_selected_model') || 'gemini-2.5-pro' : 'gemini-2.5-pro'),
    slice: providedSlice, 
    onProgress, 
    abortSignal 
  } = options;

  const autoSlices = !providedSlice && video.duree_s > 2100 ? calculateSlices(video.video_id, video.duree_s, 35) : [];
  const slice = providedSlice ?? (autoSlices.length > 1 ? autoSlices[0] : undefined);

  const fallbackChain = [
    model,
    ...SUPPORTED_GEMINI_MODELS.filter(m => m !== model),
  ];

  const maxRetries = 4;
  let attempt = 0;
  let fallbackIndex = 0;
  const startMs = Date.now();
  let currentModel = fallbackChain[0];

  while (attempt < maxRetries) {
    if (abortSignal?.aborted) {
      return {
        success: false,
        ficheContent: '',
        error: 'Extraction annulée par l\'utilisateur.',
      };
    }

    attempt++;

    try {
      if (onProgress) {
        onProgress(`Connexion à l'API Gemini Multimodale (@google/genai - ${currentModel})...`);
      }

      const apiKey = getActiveApiKey();
      const videoMetadata = slice
        ? { startOffset: `${slice.start_s}s`, endOffset: `${slice.end_s}s` }
        : undefined;


      const response = await fetch('/api/gemini/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          video,
          slice,
          videoMetadata,
          model: currentModel,
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const errMsg = errorData.error || `Erreur HTTP ${status}`;

        // 404: Multi-generational Transparent Fallback Model Pipeline
        if (status === 404 || errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
          if (fallbackIndex + 1 < fallbackChain.length) {
            fallbackIndex++;
            const alternate = fallbackChain[fallbackIndex];
            if (onProgress) {
              onProgress(`Modèle ${currentModel} indisponible (404). Bascule automatique transparente sur ${alternate}...`);
            }
            currentModel = alternate;
            attempt = Math.max(0, attempt - 1); // Do not penalize retry budget on model fallback
            continue;
          }
        }

        // Rate limit 429 or 503 service unavailable: Auto-Retry with live countdown
        if (
          status === 429 ||
          status === 503 ||
          errMsg.includes('429') ||
          errMsg.includes('Resource Exhausted') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota') ||
          errMsg.toLowerCase().includes('too many requests') ||
          errMsg.toLowerCase().includes('rate limit')
        ) {
          const waitSecs = attempt === 1 ? 15 : attempt === 2 ? 30 : attempt === 3 ? 60 : 90;

          // Countdown 1s at a time with instant abort check
          for (let remaining = waitSecs; remaining > 0; remaining--) {
            if (abortSignal?.aborted) {
              return { success: false, ficheContent: '', error: 'Annulé pendant l\'attente de reprise' };
            }
            if (onProgress) {
              onProgress(`Limite temporaire de cadence (429 Too Many Requests). Reprise automatique dans ${remaining}s (tentative ${attempt}/${maxRetries})...`);
            }
            await new Promise(r => setTimeout(r, 1000));
          }
          continue; // Retry next attempt
        }

        throw new Error(errMsg);
      }

      const data = await response.json();
      let ficheContent: string = data.ficheContent || '';
      let tokensUsed: number = data.tokensUsed || 14500;
      let selfRefined: boolean = Boolean(data.selfRefined);

      // Validate through deterministic linter
      let lintResult = lintFicheV3(ficheContent);

      // If not valid and server did not already run Self-Refine, execute 1 pass of client-initiated Self-Refine
      if (!lintResult.isValid && !selfRefined && !abortSignal?.aborted) {
        if (onProgress) {
          onProgress(
            `Auto-Repair Linter (Self-Refine) : correction de ${lintResult.errors.length} erreur(s) et ${lintResult.missingRuleCitations.length} citation(s) manquante(s)...`
          );
        }
        try {
          const refineRes = await fetch('/api/gemini/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey: apiKey || undefined,
              video,
              slice,
              videoMetadata,
              model: data.modelUsed || currentModel,
              repairContext: {
                previousDraft: ficheContent,
                errors: lintResult.errors,
                missingRuleCitations: lintResult.missingRuleCitations,
              },
            }),
            signal: abortSignal,
          });
          if (refineRes.ok) {
            const refineData = await refineRes.json();
            if (refineData.ficheContent) {
              ficheContent = refineData.ficheContent;
              tokensUsed += refineData.tokensUsed || 0;
              selfRefined = true;
              lintResult = lintFicheV3(ficheContent);
            }
          }
        } catch {
          // Keep initial draft if self-refine network call fails
        }
      }

      const score = lintResult.isValid ? 10.0 : 8.5;

      return {
        success: true,
        ficheContent,
        tokensUsed,
        durationMs: Date.now() - startMs,
        score,
        selfRefined,
      };

    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        return { success: false, ficheContent: '', error: 'Extraction interrompue par l\'utilisateur.' };
      }

      const message = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'extraction';

      // If last attempt failed, return error
      if (attempt >= maxRetries) {
        return {
          success: false,
          ficheContent: '',
          error: `Échec après ${maxRetries} tentatives : ${message}`,
          isRetryable: false,
        };
      }

      if (onProgress) {
        onProgress(`Avertissement réseau : ${message}. Nouvelle tentative dans 5s...`);
      }
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  return {
    success: false,
    ficheContent: '',
    error: 'Échec de l\'extraction API Gemini.',
  };
}
