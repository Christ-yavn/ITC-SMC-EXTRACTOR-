import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { SCRIBE_PROMPT_V3 } from './src/data/scribePromptV2.ts';
import { calculateSlices, lintFicheV3 } from './src/utils/pipeline.ts';
import { DEFAULT_PRO_KEY, SUPPORTED_GEMINI_MODELS } from './src/utils/apiKeyManager.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/gemini/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-2.5-pro',
    supportedModels: ['gemini-2.5-pro', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash'],
  });
});

// Real Multimodal Gemini Extraction Handler with Multi-Generational Fallback & Self-Refine
async function handleGeminiExtraction(req: express.Request, res: express.Response) {
  const rawBodyKey = typeof req.body.apiKey === 'string' ? req.body.apiKey.trim() : '';
  const customKey = rawBodyKey && rawBodyKey !== DEFAULT_PRO_KEY ? rawBodyKey : '';
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY non configurée. Renseignez votre clé API Google AI Studio dans Réglages.' });
  }

  const { video, slice: reqSlice, videoMetadata: reqVideoMetadata, repairContext } = req.body;
  if (!video || !video.url || !video.video_id) {
    return res.status(400).json({ error: 'Données vidéo manquantes ou invalides.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const durationS = typeof video.duree_s === 'number' && video.duree_s > 0 ? video.duree_s : 0;
    const autoSlices = !reqSlice && durationS > 2100 ? calculateSlices(video.video_id, durationS, 35) : [];
    const slice = reqSlice || (autoSlices.length > 1 ? autoSlices[0] : undefined);
    const formattedDuration = `${Math.floor(durationS / 60)}:${(durationS % 60).toString().padStart(2, '0')}`;
    const trancheStr = slice ? `${slice.formatted_start} - ${slice.formatted_end}` : `00:00 - ${formattedDuration}`;

    const basePrompt = `${SCRIBE_PROMPT_V3}

==================================================
MÉTADONNÉES RÉELLES DE LA VIDÉO :
==================================================
- ID_YOUTUBE : "${video.video_id}"
- TITRE_EXACT : "${video.titre}"
- DATE_PUBLICATION : "${video.date_video || '2024'}"
- DURÉE_TOTALE : ${durationS} secondes (${formattedDuration})
- TRANCHE_ANALYSEE : ${trancheStr}
- PLAYLIST : "${(video.playlists || []).join(', ')}"
- FAMILLE : "${video.famille || 'CONCEPTS_SETUPS'}"

RÈGLES D'OR ABSOLUES :
1. ANALYSE RÉELLE : Écoute les propos oraux d'HugoFX et observe les graphiques TradingView à l'écran. 
2. INTERDICTION DES TIMESTAMPS FICTIFS : Aucun timestamp cité ne doit dépasser ${durationS} secondes (${formattedDuration}) !
3. INTERDICTION DES BARÈMES INVENTÉS : N'invente AUCUN barème de points arbitraire (ex: "+40 pts" ou "+30 pts").
4. COUVERTURE 100% : Toutes les règles R-xxx, paramètres P-xxx et rejets REJ-xxx définis en Section II et III DOIVENT être cités entre crochets dans la Section IV (Leçon Humaine).
5. STRUCTURE CAUSALE STRICTE : Respecte l'ordre exact ci-dessous.

STRUCTURE OBLIGATOIRE DE LA FICHE :

---
schema_version: "SCRIBE-ICT-v3.0"
fiche_id: "FICHE-ICT-${video.video_id}"
video_id: "${video.video_id}"
titre_video: "${video.titre.replace(/"/g, '\\"')}"
date_video: "${video.date_video || '2024'}"
duree_secondes: ${durationS}
tranche_active: "${trancheStr}"
playlist: "${(video.playlists || []).join(', ')}"
famille: "${video.famille || 'CONCEPTS_SETUPS'}"
---

## I. REGISTRE DE PREUVES HORODATÉ (EVIDENCE_LEDGER)
### 1. Preuves Verbales (S-01 à S-nn)
Tableau markdown des citations orales textuelles avec horodatage réel [MM:SS] (≤ 12 mots par citation).
### 2. Preuves Visuelles (F-01 à F-nn)
Tableau markdown des éléments observés à l'écran (Timeframe, Outil TradingView, Bougies observées, Niveaux de prix réels).
### 3. Tableau des Divergences ⚖️ DIT ≠ FAIT (X-01 à X-nn)
Différences entre la règle théorique énoncée à l'oral et l'exécution réelle observée sur le graphique.

## II. TABLE UNIQUE DES PARAMÈTRES (P-xx) & DÉCISIONS DE DESIGN (D-xx)
Tableau exhaustif de chaque paramètre avec tag source : [DIT], [VU], [DÉDUIT], ou [ABSENT -> D-xx].

<<<CONCEPT_SPEC_V3>>>
## III. SPÉCIFICATION AGENTIQUE FORMELLE (10/10 POUR AGENTS DE CODAGE)
### B1. Géométrie OHLC Explicite
Formules mathématiques précises distinguant corps (Math.max(O,C) - Math.min(O,C)) et mèches (High, Low).
### B2. Règles Atomiques (R-xxx-001 à R-xxx-nnn)
Chaque règle avec condition formelle, action_si_vrai, action_si_faux et source.
### B3. Double Machine à États Finis
- ZONE_FSM : États complets (INEXISTANT -> CANDIDAT -> FORMÉ -> ACTIF -> MITIGÉ_PARTIEL -> MITIGÉ_TOTAL -> INVALIDÉ -> EXPIRÉ)
- TRADE_FSM : États complets (IDLE -> ARMED -> ORDER_PLACED -> OPEN -> BE_PROTECTED -> CLOSED_TP/SL/CANCELLED)
### B4. Résolution des Conflits Intrabar & Anti-Lookahead MTF
Priorité pessimiste/conservatrice si High et Low touchent deux seuils sur la même bougie.
### B5. Squelette Exécutable
Code Pine Script v5 ou Python typé sans aucun "pass" ni "TODO".
### B6. Fixtures de Tests OHLC (JSON)
Au moins 2 séquences de test JSON avec "fixture_id", OHLC explicites et issue attendue.
<<<FIN_CONCEPT_SPEC_V3>>>

## IV. LEÇON HUMAINE EXPERTE (8 SECTIONS POUR LE TRADER)
### 1. Pourquoi ça existe (Logique institutionnelle & Smart Money)
### 2. Schéma annoté (Représentation ASCII/Mermaid des bougies et niveaux)
### 3. Méthode pas à pas (Checklist d'exécution séquentielle)
### 4. Exemples commentés (Cas réels de la vidéo avec prix et timestamps vérifiés)
### 5. Contre-exemples & Rejets (Faux signaux et configurations à proscrire)
### 6. Exécution concrète (Entrée, SL, TP, BE) + Encart ⚖️ DIT ≠ FAIT
### 7. Zones grises & Décisions de design (Ce que le formateur ne tranche pas et la solution retenue)
### 8. Erreurs fréquentes & Pièges psychologiques (Biais, FOMO, gestion du risque)

<<<FIN_FICHE_V3>>>
`;

    const buildSelfRefineSuffix = (errors: string[], missingRuleCitations: string[], draft: string) => `

==================================================
AUTO-REPAIR LINTER DÉTERMINISTE (SELF-REFINE SCRIBE-ICT v3) :
==================================================
Le brouillon précédent présente des non-conformités détectées par lintFicheV3 :
- Erreurs : ${errors.join(' | ') || 'Aucune'}
- Règles / Paramètres non cités dans la Section IV (Leçon Humaine) : ${missingRuleCitations.join(', ') || 'Aucun'}

BROUILLON À CORRIGER :
${draft}

INSTRUCTION DE RÉPARATION :
Régénère la fiche COMPLÈTE corrigée (de --- jusqu'à <<<FIN_FICHE_V3>>>) en corrigeant toutes les erreurs ci-dessus et en citant explicitement chaque règle R-xx, paramètre P-xx et rejet REJ-xx entre crochets dans la Section IV.
`;

    const prompt = repairContext && repairContext.previousDraft
      ? basePrompt + buildSelfRefineSuffix(
          repairContext.errors || [],
          repairContext.missingRuleCitations || [],
          repairContext.previousDraft
        )
      : basePrompt;

    // Multi-generational Fallback Model Pipeline: requested -> gemini-2.5-pro -> gemini-3.1-pro-preview -> gemini-3-flash-preview -> gemini-2.5-flash
    const requestedModel = req.body.model || process.env.GEMINI_MODEL || 'gemini-2.5-pro';
    const fallbackCandidates = [
      requestedModel,
      ...SUPPORTED_GEMINI_MODELS.filter(m => m !== requestedModel),
    ];

    const videoMetadata =
      reqVideoMetadata && typeof reqVideoMetadata.startOffset === 'string' && typeof reqVideoMetadata.endOffset === 'string'
        ? reqVideoMetadata
        : slice && typeof slice.start_s === 'number' && typeof slice.end_s === 'number'
          ? { startOffset: `${slice.start_s}s`, endOffset: `${slice.end_s}s` }
          : undefined;


    const videoPart: Record<string, unknown> = {
      fileData: {
        fileUri: video.url,
        mimeType: 'video/*',
      },
      ...(videoMetadata ? { videoMetadata } : {}),
    };

    let response: any = null;
    let successfulModel = requestedModel;
    let lastError: Error | null = null;

    for (const candidate of fallbackCandidates) {
      try {
        successfulModel = candidate;
        response = await ai.models.generateContent({
          model: candidate,
          contents: [
            {
              role: 'user',
              parts: [
                videoPart as any,
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 65536,
          },
        });

        if (response && response.text) {
          break; // Succeeded!
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message || '';
        const is404 = errMsg.includes('404') || errMsg.toLowerCase().includes('not found') || errMsg.includes('models/');
        if (is404) {
          console.warn(`[Gemini API] Modèle ${candidate} non trouvé (404). Tentative avec le modèle de secours...`);
          continue; // Try next fallback candidate
        }
        // If not a 404, re-throw to allow 429 rate limit or network handling
        throw lastError;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Aucune réponse n'a pu être générée par l'API Gemini.");
    }

    let ficheContent = response.text || '';
    let tokensUsed = response.usageMetadata?.totalTokenCount || 15000;
    let selfRefined = Boolean(repairContext);

    // Execute lintFicheV3 and run 1 automatic Self-Refine pass if invalid
    let lintResult = lintFicheV3(ficheContent);
    if (!lintResult.isValid && !selfRefined) {
      try {
        const refinePrompt = basePrompt + buildSelfRefineSuffix(
          lintResult.errors,
          lintResult.missingRuleCitations,
          ficheContent
        );
        const refineResponse = await ai.models.generateContent({
          model: successfulModel,
          contents: [
            {
              role: 'user',
              parts: [
                videoPart as any,
                {
                  text: refinePrompt,
                },
              ],
            },
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 65536,
          },
        });
        if (refineResponse && refineResponse.text) {
          ficheContent = refineResponse.text;
          tokensUsed += refineResponse.usageMetadata?.totalTokenCount || 0;
          selfRefined = true;
          lintResult = lintFicheV3(ficheContent);
        }
      } catch (refineErr) {
        console.warn('[Gemini API] Avertissement lors de la passe Self-Refine:', refineErr);
      }
    }

    res.json({
      success: true,
      ficheContent,
      tokensUsed,
      modelUsed: successfulModel,
      selfRefined,
      lintResult,
    });
  } catch (err: unknown) {
    console.error('Gemini extraction error:', err);
    const errMsg = err instanceof Error ? err.message : "Erreur lors de l'extraction Gemini";
    let statusCode = (err as any)?.status || (err as any)?.statusCode || 500;
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota') || errMsg.toLowerCase().includes('too many requests')) {
      statusCode = 429;
    } else if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
      statusCode = 404;
    }
    res.status(statusCode).json({
      error: errMsg,
      statusCode,
    });
  }
}

app.post('/api/gemini/extract', handleGeminiExtraction);
app.post('/api/extract-gemini', handleGeminiExtraction);

// GitHub Repository Status Endpoint
app.get('/api/github/status', async (req, res) => {
  try {
    const { execFileSync } = await import('child_process');
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: __dirname }).toString().trim();
    const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: __dirname }).toString().trim();
    let remote = '';
    try {
      remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], { cwd: __dirname }).toString().trim();
    } catch {}
    res.json({
      initialized: true,
      branch,
      commit,
      remoteUrl: remote.replace(/https:\/\/[^@]+@/, 'https://'),
    });
  } catch (err: unknown) {
    res.json({
      initialized: false,
      error: err instanceof Error ? err.message : 'Git non initialisé',
    });
  }
});

// GitHub Push Endpoint (hardened with execFileSync against shell injection)
app.post('/api/github/push', async (req, res) => {
  const { githubToken, repoName, branch = 'main', commitMessage = 'Sync from HugoFX ICT Knowledge Workbench', fiches } = req.body;

  if (!githubToken || !repoName) {
    return res.status(400).json({ error: 'Token GitHub (PAT) et nom du repository requis.' });
  }

  const safeBranch = String(branch || 'main').trim();
  if (!/^[a-zA-Z0-9._/-]+$/.test(safeBranch)) {
    return res.status(400).json({ error: 'Nom de branche Git invalide.' });
  }

  try {
    const { execFileSync } = await import('child_process');
    const fs = await import('fs');
    const pathMod = await import('path');

    // 1. Verify GitHub token & get authenticated user
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken.trim()}`,
        'User-Agent': 'HugoFX-Workbench',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) {
      const errJson = await userRes.json().catch(() => ({}));
      return res.status(401).json({ error: `Token GitHub invalide ou expiré: ${errJson.message || userRes.statusText}` });
    }

    const userData = await userRes.json();
    const userLogin = userData.login;

    // Full target repo (owner/repo)
    let fullRepo = String(repoName).trim();
    if (!fullRepo.includes('/')) {
      fullRepo = `${userLogin}/${fullRepo}`;
    }
    if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(fullRepo)) {
      return res.status(400).json({ error: 'Nom de repository GitHub invalide.' });
    }

    // 2. Check if repo exists on GitHub, or create it
    const checkRepoRes = await fetch(`https://api.github.com/repos/${fullRepo}`, {
      headers: {
        'Authorization': `Bearer ${githubToken.trim()}`,
        'User-Agent': 'HugoFX-Workbench',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (checkRepoRes.status === 404) {
      // Auto-create repository
      const repoShortName = fullRepo.split('/')[1];
      const createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken.trim()}`,
          'User-Agent': 'HugoFX-Workbench',
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          name: repoShortName,
          description: 'HugoFX ICT/SMC Knowledge Architecture Workbench - Fiches de Spécifications 10/10 et Algorithmes',
          private: false,
          auto_init: false,
        }),
      });

      if (!createRepoRes.ok) {
        const createErr = await createRepoRes.json().catch(() => ({}));
        return res.status(500).json({ error: `Impossible de créer le repository sur GitHub: ${createErr.message || createRepoRes.statusText}` });
      }
    }

    // 3. Export all in-memory fiches into fiches/ folder so they are committed
    if (fiches && typeof fiches === 'object') {
      const fichesDir = pathMod.join(__dirname, 'fiches');
      if (!fs.existsSync(fichesDir)) {
        fs.mkdirSync(fichesDir, { recursive: true });
      }
      for (const [vId, content] of Object.entries(fiches)) {
        const safeId = String(vId).replace(/[^a-zA-Z0-9_-]/g, '_');
        if (typeof content === 'string' && content.length > 0 && safeId) {
          const cleanFicheName = `HugoFX_Fiche_${safeId}.md`;
          fs.writeFileSync(pathMod.join(fichesDir, cleanFicheName), content, 'utf-8');
        }
      }
    }

    // 4. Git commit & push using execFileSync (zero shell interpolation)
    execFileSync('git', ['config', 'user.name', 'HugoFX ICT Studio'], { cwd: __dirname });
    execFileSync('git', ['config', 'user.email', String(userData.email || 'developer@hugofx.com')], { cwd: __dirname });
    execFileSync('git', ['add', '.'], { cwd: __dirname });

    const statusOutput = execFileSync('git', ['status', '--porcelain'], { cwd: __dirname }).toString().trim();
    if (statusOutput.length > 0) {
      execFileSync('git', ['commit', '-m', String(commitMessage)], { cwd: __dirname });
    }

    // Remote push using authenticated URL
    try {
      execFileSync('git', ['remote', 'remove', 'origin'], { cwd: __dirname, stdio: 'ignore' });
    } catch {}

    const authRemoteUrl = `https://x-access-token:${githubToken.trim()}@github.com/${fullRepo}.git`;
    execFileSync('git', ['remote', 'add', 'origin', authRemoteUrl], { cwd: __dirname });
    execFileSync('git', ['branch', '-M', safeBranch], { cwd: __dirname });
    execFileSync('git', ['push', '-u', 'origin', safeBranch, '--force'], { cwd: __dirname, stdio: 'pipe' });

    // Sanitize remote URL in git config so token is NOT stored on disk
    execFileSync('git', ['remote', 'set-url', 'origin', `https://github.com/${fullRepo}.git`], { cwd: __dirname });

    const latestCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: __dirname }).toString().trim();

    res.json({
      success: true,
      repoUrl: `https://github.com/${fullRepo}`,
      commitHash: latestCommit,
      branch: safeBranch,
      message: `Projet et fiches poussés avec succès sur https://github.com/${fullRepo} (branche ${safeBranch}) !`,
    });
  } catch (err: unknown) {
    console.error('GitHub push error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Erreur lors du push GitHub',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
