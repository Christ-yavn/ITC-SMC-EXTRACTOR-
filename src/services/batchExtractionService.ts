/**
 * Batch Extraction Service (SCRIBE-ICT v3 - REAL GEMINI MULTIMODAL API)
 * 
 * SUPPRESSION TOTALE DU GÉNÉRATEUR FACTICE :
 * Aucune interpolation de chaîne statique n'est tolérée.
 * Seul un appel réel à l'API Gemini Multimodale (@google/genai) produit une fiche.
 * Si l'appel échoue, la vidéo passe au statut 'Erreur' sans aucune fiche factice.
 */

import type { ConsolidatedVideoItem, VideoSlice } from '../utils/pipeline.ts';
import { extractFicheWithGemini, type ExtractionResult } from './geminiExtractionService.ts';
import { classifyConceptStrict } from '../utils/pipeline.ts';


export { classifyConceptStrict };

export interface BatchItemExecution {
  video: ConsolidatedVideoItem;
  slice?: VideoSlice;
  model?: 'gemini-2.5-pro' | 'gemini-2.5-flash' | string;
  onProgress?: (message: string) => void;
  abortSignal?: AbortSignal;
}

/**
 * Extracts a video using the genuine Gemini Multimodal API.
 * Returns the authentic SCRIBE-ICT v3 fiche content.
 * Throws a descriptive error if extraction fails (no fake fallback).
 */
export async function executeRealGeminiExtraction(
  params: BatchItemExecution
): Promise<ExtractionResult> {
  const { video, slice, model, onProgress, abortSignal } = params;

  if (onProgress) {
    onProgress(`Lancement de l'analyse multimodale Gemini (${model || 'gemini-2.5-pro'}) sur "${video.titre}" [${video.video_id}]...`);
  }

  const result = await extractFicheWithGemini(video, {
    slice,
    model,
    onProgress,
    abortSignal,
  });

  if (!result.success) {
    throw new Error(result.error || `Échec de l'extraction multimodale Gemini pour la vidéo ${video.video_id}`);
  }

  return result;
}

