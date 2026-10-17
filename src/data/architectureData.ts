/**
 * Architecture data, prompt templates, schemas, and specifications for HugoFX Knowledge Extraction
 */

import type { RawVideoItem } from '../utils/pipeline';

export const REFORMULATION = `Le système vise à convertir ~100+ vidéos de trading ICT/SMC de la chaîne HugoFX (4 playlists de déc. 2023 à sept. 2025) en fiches techniques ultra-déterministes (sans hallucination, tags [ABSENT], timestamps stricts) pour alimenter ensuite des LLMs de codage (Claude/Opus/Kimi) en spécifications d'indicateurs et algorithmes. Vous travaillez en budget zéro avec Google AI Pro, en privilégiant l'interface AI Studio (chat unitaire ou par tranche de ≤ 35 min). Les incertitudes critiques portent sur : l'ingestion native des URLs YouTube sous votre session AI Pro sans téléchargement local, le plafond réel des quotas quotidiens en Pro/Flash, la capacité à borner temporellement une vidéo directement dans l'interface, la précision effective des timestamps renvoyés, et la nature exacte des 4 playlists (dont P4 qui pourrait contenir une version intégrale redondante avec des épisodes découpés).`;

export const QUESTIONS_BLOQUANTES = [
  {
    num: 1,
    question: "AI Studio accepte-t-il directement les URL YouTube dans votre interface AI Pro ?",
    impact: "Si OUI : zéro téléchargement, coût bande-passante nul. Si NON : nécessité d'extraire l'audio via yt-dlp ou script gratuit pour upload manuel MP3/MP4.",
    hypothese: "On part sur le mode standard AI Studio où l'outil 'URL YouTube' ingère la vidéo/audio directement dans la fenêtre de contexte multimédia."
  },
  {
    num: 2,
    question: "La playlist P4 contient-elle un mix d'épisodes individuels et une compilation intégrale ?",
    impact: "Traiter les deux consommerait 30% à 50% de quota inutilement sur des doublons parfaits.",
    hypothese: "Les vidéos découpées priment pour la granularité des timestamps ; toute vidéo 'Formation Complète (3h+)' sera marquée DOUBLON_IGNORE après vérification des titres."
  },
  {
    num: 3,
    question: "Quelle est votre cadence d'exécution quotidienne souhaitée (manuel vs semi-automatisé) ?",
    impact: "L'interface AI Studio implique un copier-coller par vidéo/tranche. Au-delà de 5 fiches/jour, la fatigue humaine augmente le risque de saut d'étape.",
    hypothese: "Exécution par vagues de 3 à 5 vidéos par jour, en mode semi-manuel via l'interface web AI Studio sans dépendance d'API payante."
  },
  {
    num: 4,
    question: "Les fiches doivent-elles conserver le jargon propre à HugoFX ou normaliser directement vers le standard ICT de Michael J. Huddleston ?",
    impact: "Conditionne la reproductibilité algorithmique. HugoFX emploie des termes français ou des simplifications personnelles.",
    hypothese: "Double étiquetage systématique dans la fiche : 'Terme HugoFX' et 'Équivalent officiel ICT' avec note d'écart éventuelle."
  }
];

export const WORKFLOW_STEPS = [
  {
    id: 1,
    titre: "Constitution du Registre Maître",
    outil: "Google Apps Script + Google Sheet (YouTube Data API v3)",
    entree: "4 IDs de playlists (P1, P2, P3, P4)",
    sortie: "Feuille '00_REGISTRE' remplie : playlist, rang, video_id, url, titre, date_video, duree_s, description.",
    coutQuota: "0 token LLM (Quota YouTube API gratuit : 4 appels playlistItems.list = ~20 crédits sur 10 000/jour)",
    detail: "Collecte brute, calcul automatique de la colonne 'tranches' (duree_s / 2100), et consolidation des doublons de video_id."
  },
  {
    id: 2,
    titre: "Pré-classement & Filtrage Texte Seul (MODE=CARTE)",
    outil: "AI Studio (Modèle Gemini 2.5 Flash en texte)",
    entree: "Texte seul : Titre + Description + Chapitres YouTube (fournis dans le prompt)",
    sortie: "Colonnes Sheet complétées : FAMILLE, TYPE (Concept/Setup/Analyse/Psychologie), VALEUR (Essentiel/Secondaire/Bruit), RESUME_400C.",
    coutQuota: "Très faible (~800 tokens par vidéo en Flash, 0 vidéo chargée). 100 vidéos traitables en 1h sans entamer le quota Pro.",
    detail: "Élimine immédiatement les vidéos 'Analyse de ma semaine', récapitulatifs sans règles, ou vlogs pour ne garder que le contenu à règles réelles."
  },
  {
    id: 3,
    titre: "Phase Pilote sur 3 Échantillons Ciblés",
    outil: "AI Studio (Gemini 2.5 Pro vs Gemini 2.5 Flash)",
    entree: "1 concept atomique (<15m), 1 setup complet (20-30m), 1 tranche de cours magistral (35m)",
    sortie: "3 Fiches v1 rédigées + Grille d'évaluation comparative (fidélité, exhaustivité, exactitude timestamps).",
    coutQuota: "6 requêtes vidéo au total. Décide du choix Pro ou Flash pour chaque type de vidéo.",
    detail: "Calibration du ratio coût/qualité et validation des réglages de fenêtres de prompt."
  },
  {
    id: 4,
    titre: "Vagues d'Extraction Séquentielles (MODE=EXTRACTION)",
    outil: "AI Studio (Pro pour les Setups/Formations, Flash pour concepts simples)",
    entree: "Vidéo YouTube (ou tranche temporelle spécifiée) + Prompt Système + Contexte Registre",
    sortie: "Fiche markdown complète avec blocs XML stricts et YAML d'en-tête, prête pour l'arborescence.",
    coutQuota: "1 requête par tranche de 35 min (~30k à 80k tokens multimédia audio/vidéo). Vagues séquentielles : 1. Concepts/Setups -> 2. Formation A -> 3. Formation B.",
    detail: "Application stricte de la règle anti-hallucination [ABSENT] et saisie de la 'Position dans le cursus'."
  },
  {
    id: 5,
    titre: "Audit de Surface & Consolidation Chronologique",
    outil: "NotebookLM / AI Studio (Prompt d'audit différentiel)",
    entree: "Ensemble des fiches d'une même notion (ex. toutes les fiches mentionnant 'Fair Value Gap' triées par date_video)",
    sortie: "Document de synthèse d'évolution : '02_Concepts/<ID>/MASTER.md' consignant la dernière version des règles du formateur et les corrections historiques.",
    coutQuota: "Texte pur (~10k à 25k tokens texte), exécuté à la fin de chaque vague.",
    detail: "Résout les contradictions temporelles (ex: 'en 2024 Hugo n'utilisait que le M5, en 2025 il ajoute le M15 pour le biais')."
  },
  {
    id: 6,
    titre: "Archivage & Préparation Spécifications de Codage",
    outil: "Google Drive (arborescence structurée) + Git / Markdown",
    entree: "Fiches validées + MASTER.md",
    sortie: "Fiches prêtes pour ingestion par Claude 3.7 Sonnet / Opus / Kimi dans l'étape ultérieure de génération PineScript / MQL5 / Python.",
    coutQuota: "0 LLM (stockage de fichiers structurés).",
    detail: "Chaque concept dispose de son dossier standardisé avec cas limites et règles d'invalidation explicites."
  }
];

export const REGISTRY_COLUMNS = [
  { name: "id_fiche", type: "Texte (PK)", description: "Identifiant unique : V{rang_global}-S{tranche}, ex: V014-S1", allowed: "V001-S1 à V999-Sn" },
  { name: "video_id", type: "Texte", description: "ID natif YouTube (11 caractères)", allowed: "Ex: dQw4w9WgXcQ" },
  { name: "url", type: "URL", description: "Lien complet vers la vidéo", allowed: "https://youtube.com/watch?v=..." },
  { name: "titre", type: "Texte", description: "Titre exact de la vidéo issu de l'API YouTube", allowed: "Texte brut sans modification" },
  { name: "playlists", type: "Texte", description: "Playlists d'origine (séparées par une virgule si doublon)", allowed: "P1, P2, P3, P4 ou combinaisons" },
  { name: "date_video", type: "Date ISO", description: "Date exacte de mise en ligne (YYYY-MM-DD)", allowed: "2023-12-01 à 2025-09-30" },
  { name: "duree_s", type: "Entier", description: "Durée totale de la vidéo en secondes", allowed: ">= 1" },
  { name: "plage_tranche", type: "Texte", description: "Horodatage de début et fin de la tranche traitée", allowed: "00:00-35:00, 35:00-70:00, ou ENTIERE" },
  { name: "famille", type: "Enum", description: "Classification thématique structurelle", allowed: "CONCEPTS_SETUPS | FORMATION_A | FORMATION_B | ANALYSES_DIVERS" },
  { name: "type_contenu", type: "Enum", description: "Nature pédagogique du contenu", allowed: "THEORIE_PURE | SETUP_COMPLET | BACKTEST_DEMO | PSYCHO_GESTION | DOUBLON" },
  { name: "valeur", type: "Enum", description: "Pertinence pour les spécifications de trading", allowed: "ESSENTIEL (Règles exécutables) | SECONDAIRE (Complément d'exemples) | BRUIT_REJETE" },
  { name: "statut", type: "Enum", description: "État d'avancement du traitement", allowed: "0_COLLECTE | 1_PRECLASSE | 2_A_EXTRAIRE | 3_FICHE_GENEREE | 4_AUDITE_VALIDE" },
  { name: "modele_utilise", type: "Enum", description: "Modèle LLM ayant réalisé l'extraction", allowed: "GEMINI_2_5_PRO | GEMINI_2_5_FLASH" },
  { name: "lien_fiche_drive", type: "URL Drive", description: "Chemin ou URL du fichier Markdown final", allowed: "Chemin relatif dans ICT_SMC_Library/" }
];

export const SYSTEM_PROMPT_V1 = `Tu es l'Architecte d'Extraction de Connaissances Spécialiste du Trading Algorithmique ICT / Smart Money Concepts (SMC).
Ta mission est de transcrire avec une rigueur mathématique et déterministe les enseignements des vidéos du formateur "HugoFX" en fiches de spécifications brutes.

==================================================
RÈGLES ANTI-HALLUCINATION ABSOLUES (NON NÉGOCIABLES) :
==================================================
1. STRICTE VÉRITÉ D'EXTRACTION : Tu ne dois décrire QUE ce qui est explicitement dit, écrit ou tracé sur les graphiques de la vidéo (ou de la tranche spécifiée).
2. INTERDICTION D'INTERPOLATION : N'ajoute AUCUN concept de trading théorique (Michael Huddleston, ICT officiel, Babypips) qui ne soit pas formulé dans l'enregistrement. Si une information classique manque (ex: placement exact du Stop Loss, règle d'invalidation, gestion du breakeven), tu écris impérativement le mot-clé : [ABSENT].
3. AUCUN EMPRUNT EXTERNE : N'utilise aucun savoir tiré d'autres épisodes même si le formateur dit "comme on l'a vu la semaine dernière". Reste circonscrit à la vidéo présente.
4. RÈGLE DES TIMESTAMPS : Chaque règle, schéma, condition d'entrée ou de sortie doit être horodaté avec son timestamp précis au format (MM:SS) ou (HH:MM:SS) rapporté au temps absolu de la vidéo intégrale. Ne devine jamais un timestamp.
5. RESPECT DU JARGON DU FORMATEUR : Utilise la nomenclature exacte d'HugoFX (ex: "liquidité interne/externe", "CHoCH", "BOS", "OB", "FVG", "Sweep"). Si un terme standard ICT existe, mentionne-le entre crochets comme équivalent sans remplacer ses termes.

==================================================
MODES DE FONCTIONNEMENT (INDICATEUR DE MODE) :
==================================================
L'utilisateur te précisera dans son message le mode requis :

--------------------------------------------------
[MODE=CARTE]
--------------------------------------------------
Objectif : Évaluation rapide sur métadonnées (titre, description, chapitres) sans analyse vidéo approfondie pour décider de la rétention.
Format attendu : Un bloc XML strict <CARTE_METADONNEES> contenant :
- FAMILLE_SUGGEREE : [CONCEPTS_SETUPS | FORMATION_A | FORMATION_B | HORS_SUJET]
- TYPE_CONTENU : [THEORIE_PURE | SETUP_COMPLET | ANALYSE_LIVE | PSYCHOLOGIE]
- VALEUR_SPEC : [ESSENTIEL | SECONDAIRE | REJET]
- CONCEPTS_DETECTES : [Liste des concepts identifiés]
- DOSSIERS_CIBLES : [Chemin dans l'arborescence ICT_SMC_Library/...]
- RESUME_CLASSIFICATION : [Court résumé technique de 400 caractères maximum expliquant le contenu attendu].

--------------------------------------------------
[MODE=EXTRACTION]
--------------------------------------------------
Objectif : Production de la Fiche Technique Complète de la vidéo ou de sa tranche.
Tu dois restituer la fiche structurée selon les 5 balises XML obligatoires :
1. <METADONNEES_YAML> : Dictionnaire YAML valide avec identifiants, dates, source et index des notions.
2. <POSITION_CURSUS> : Analyse de la progression didactique (obligatoire pour les formations).
3. <CORPUS_REGLES> : Décomposition en Unités d'Enseignement (UE), chaque UE contenant Définition, Conditions IF/THEN, Règles d'invalidation, et tags [ABSENT].
4. <EXEMPLES_GRAPHIQUES> : Décodage des démonstrations sur les charts (paires, timeframes, déroulé bougie par bougie avec timestamps).
5. <AUDIT_FIABILITE> : Taux de complétude des règles, ambiguïtés relevées, points non tranchés par le formateur.`;

export const FICHE_TEMPLATE_MARKDOWN = `# FICHE D'EXTRACTION TECHNIQUE - HUGOFX ICT/SMC

<METADONNEES_YAML>
id_fiche: "V000-S1"
video_id: "VIDEO_ID_YOUTUBE"
url: "https://www.youtube.com/watch?v=VIDEO_ID_YOUTUBE"
titre: "[TITRE EXACT DE LA VIDEO]"
date_publication: "YYYY-MM-DD"
duree_totale_s: 0
tranche_traitee: "00:00 - 35:00"
famille: "CONCEPTS_SETUPS | FORMATION_A | FORMATION_B"
statut_fiche: "EXTRAIT_NON_AUDITE"
notions_cles:
  - "Concept 1"
  - "Concept 2"
actifs_cites:
  - "EURUSD"
  - "NAS100"
timeframes_mentionnees:
  - "H4"
  - "M15"
  - "M1"
</METADONNEES_YAML>

---

<POSITION_CURSUS>
### 1. Prérequis Supposés Acquis
- [Concepts considérés comme déjà maîtrisés par l'audience, ou [ABSENT] si non précisé]

### 2. Renvois et Citations
- Épisodes antérieurs cités : [ex: "Épisode sur les Order Blocks" (04:12) / [ABSENT]]
- Épisodes futurs annoncés : [ex: "On verra la prise de liquidité au prochain cours" (31:20) / [ABSENT]]

### 3. Simplifications Pédagogiques Volontaires
- [Cas où le formateur concède simplifier une règle pour les débutants, ex: "Pour l'instant ne regardez que le corps de bougie" (14:30) / [ABSENT]]

### 4. Compétence / Brique Débloquée
- [Ce que l'apprenant ou l'algorithme est censé pouvoir exécuter de manière autonome à l'issue de cette tranche]
</POSITION_CURSUS>

---

<CORPUS_REGLES>
## UNITÉ D'ENSEIGNEMENT 1 : [Nom du Concept / Setup] (Timestamp de début - fin)

### A. Définition Opérationnelle selon HugoFX
- **Définition textuelle** (MM:SS) : [Formulation exacte du formateur]
- **Équivalent ICT Standard** : [Nom standard ou [NON_APPLICABLE]]
- **Objectif de marché** (MM:SS) : [Pourquoi ce phénomène se produit selon lui]

### B. Matrice des Conditions d'Identification (Setup / Pattern)
| N° | Condition Formelle | Paramètre / Seuil | Timeframe Requise | Timestamp |
|:---|:---|:---|:---|:---|
| 1  | Condition A (ex: Balayage de liquidité) | Baisse sous le plus bas asiatique | M15 / M5 | (08:24) |
| 2  | Déplacement institutionnel | FVG créé avec momentum | M1 | (11:05) |
| 3  | Clôture de confirmation | Corps de bougie au-delà du swing | M1 | (13:40) |

### C. Règles d'Exécution Algorithmique
- **Déclencheur d'Entrée (Trigger)** (MM:SS) :
  - IF [Condition précise validée] THEN Entrée [Marché / Ordre Limite sur 50% FVG / etc.]
- **Placement du Stop Loss (Invalidation)** (MM:SS) :
  - Règle exacte : [Au-dessus du wick / Sous l'Order Block / [ABSENT]]
- **Objectifs de Take Profit & Sortie** (MM:SS) :
  - TP1 : [ex: Plus haut opposé / [ABSENT]]
  - TP2 / Runner : [Règle ou [ABSENT]]
- **Gestion du Risque & Breakeven** (MM:SS) :
  - Règle de passage à BE : [ex: Après cassure du premier BOS interne / [ABSENT]]
  - Clôture partielle : [ex: 50% à 2R / [ABSENT]]

### D. Exceptions et Filtres Négatifs (Quand NE PAS prendre le trade)
- Filtre 1 (MM:SS) : [ex: À l'approche d'une annonce économique majeure NFP / CPI]
- Filtre 2 (MM:SS) : [ex: Si la Killzone de Londres n'a pas pris de liquidité préalable]
- Cas d'invalidation anticipée (MM:SS) : [Règle ou [ABSENT]]
</CORPUS_REGLES>

---

<EXEMPLES_GRAPHIQUES>
### Exemple 1 : Cas d'école Haussier (MM:SS - MM:SS)
- **Actif & Date** : [ex: EURUSD - Session NY 14 Mai]
- **Timeframe supérieure (HTF)** : [Contexte M15/H1 décrit]
- **Timeframe d'entrée (LTF)** : [Signal M1 décrit]
- **Chronologie bougie par bougie** :
  1. (18:12) : Prise de liquidité du Sell-Side Liquidity (SSL).
  2. (19:45) : Changement de caractère (CHoCH) avec bougie impulsive verte.
  3. (21:30) : Retest du FVG formé sur la bougie impulsive.
- **Résultat affiché sur le chart** : [Trade gagnant 1:3 RR / Exécution en direct / Backtest]

### Exemple 2 : Cas de Piège ou Faux Signal (MM:SS - MM:SS)
- **Raison de l'échec expliquée par le formateur** : [ex: "Ici l'OB n'était pas valide car déjà mitigé" / [ABSENT]]
</EXEMPLES_GRAPHIQUES>

---

<AUDIT_FIABILITE>
- **Complétude des règles de codage** : [Évaluation 0-100% pour une spécification logicielle autonome]
- **Éléments non résolus / [ABSENT]** :
  - [Liste synthétique de ce qui manque pour coder sans inventer : ex. Gestion du spread, tolérance de pips, sortie de secours]
- **Degré de confiance dans les timestamps** : [Élevé / Moyen / Vérifié manuellement]
- **Note pour le modèle de codage (Claude/Opus)** : [Directives d'attention spécifiques]
</AUDIT_FIABILITE>`;

export const PILOTE_PROTOCOL = {
  objectifs: "Valider la faisabilité technique sur AI Studio (ingestion vidéo, respect strict des timestamps, détection du mot-clé [ABSENT]) et arbitrer définitivement entre Gemini 2.5 Pro et Gemini 2.5 Flash.",
  echantillons: [
    {
      type: "Concept Atomique Court (< 15 min)",
      objectif: "Tester la capacité d'extraction d'une règle unitaire isolée (ex: Définition précise d'un Fair Value Gap ou d'un Order Block).",
      criteresValidation: "Tous les seuils chiffrés doivent être captés, zéro remplissage d'éléments absents."
    },
    {
      type: "Setup Complet avec Entrée/Sortie (20-30 min)",
      objectif: "Tester l'articulation multi-timeframes (HTF biais -> LTF entrée -> SL/TP) et la matrice de décision.",
      criteresValidation: "La table IF/THEN doit être complète et les timestamps de chaque étape du trade doivent correspondre exactement aux images."
    },
    {
      type: "Tranche de 35 min de la Formation Structurée",
      objectif: "Tester la section 'Position dans le cursus' (renvois didactiques, prérequis, simplifications pédagogiques).",
      criteresValidation: "Détection claire des références aux épisodes précédents/suivants sans halluciner leur contenu."
    }
  ],
  grilleMesures: [
    "Précision des timestamps (écart moyen en secondes par rapport à la vidéo réelle)",
    "Fidélité au strict énoncé (présence de balises [ABSENT] plutôt qu'invention)",
    "Temps de réponse et consommation de tokens de l'interface",
    "Stabilité du parsing XML/YAML en sortie",
    "Clarté des règles IF/THEN pour une transcription algorithmique"
  ],
  regleDecisionProFlash: "Si Flash obtient une note de précision des timestamps >= 90% et ne tente jamais de déduire un SL non mentionné, Flash est retenu pour les phases 2 et 4 (économie massive de quota). Si Flash hallucine des détails de trading classiques pour combler les vides, Pro est imposé pour toute la bibliothèque."
};

export const RISQUES_ET_PARADES = [
  {
    nom: "Épuisement du quota quotidien (Rate limits AI Studio Pro)",
    severite: "Élevée",
    impact: "Blocage de l'avancement pendant 24 heures en pleine session d'extraction.",
    parade: "Séparer strictement les étapes : le pré-classement (Étape 2) se fait à 100% en texte pur sur métadonnées (coût quasi-nul). L'analyse vidéo est contingentée à 3 à 5 vidéos prioritaires par jour. Si le quota Pro est atteint, bascule automatique sur Flash pour les concepts élémentaires."
  },
  {
    nom: "Hallucination de règles techniques (Invention de paramètres par le LLM)",
    severite: "Critique",
    impact: "Spécifications de code corrompues entraînant des indicateurs faux ou des pertes en trading réel.",
    parade: "Imposition rigoureuse du token [ABSENT] dans le prompt système. Si HugoFX ne dit pas explicitement où mettre le SL, le LLM doit interdire tout conseil générique et écrire [ABSENT]. Un script de validation vérifie que le champ ne contient pas de prose spéculative."
  },
  {
    nom: "Décalage ou imprécision des Timestamps (Drift temporel)",
    severite: "Moyenne",
    impact: "Impossibilité pour l'humain d'auditer rapidement la séquence graphique correspondante.",
    parade: "Toujours injecter la durée totale exacte et la date dans l'en-tête du prompt. Sur les vidéos longues découpées en tranches, exiger les timestamps en temps absolu de la vidéo complète (ex: tranche S2 commençant à 35:00 comportera des timestamps '38:15', jamais '03:15')."
  },
  {
    nom: "Doublons de vidéos & Versions Intégrales redondantes",
    severite: "Moyenne",
    impact: "Gaspillage de 20% à 40% des requêtes sur des vidéos déjà analysées ou ré-uploadées.",
    parade: "Algorithme de dédoublonnage strict dans le Google Sheet sur la clé unique 'video_id'. Toute vidéo présente dans 2 playlists conserve ses 2 provenances mais n'a qu'une seule fiche d'extraction. Pour les masterclasses compilées (vidéos de 2h-4h regroupant des épisodes), détection par comparaison des titres et marquage en 'DOUBLON_IGNORE'."
  },
  {
    nom: "Dérive doctrinale et contradictions temporelles du formateur",
    severite: "Élevée",
    impact: "Règles contradictoires entre une vidéo de décembre 2023 et une vidéo de septembre 2025.",
    parade: "Consolidation obligatoirement chronologique (ordonnancement strict par date de mise en ligne). La règle la plus récente supplante l'ancienne. Création systématique d'un fichier 'MASTER.md' par concept consignant l'historique des révisions du formateur ('Évolution v2024 vs v2025')."
  }
];

export const MOCK_REGISTRY_SAMPLE: RawVideoItem[] = [
  {
    playlist: "P4",
    rang: 1,
    video_id: "EP1_STRUCTURE",
    url: "https://www.youtube.com/watch?v=EP1_STRUCTURE",
    titre: "FORMATION ICT ÉPISODE 1 : La Véritable Structure de Marché (BOS & CHoCH)",
    date_video: "2024-01-15",
    duree_s: 1450,
    description: "Dans ce premier épisode de la formation complète, découvrez comment identifier un Break of Structure (BOS) valide..."
  },
  {
    playlist: "P4",
    rang: 2,
    video_id: "EP2_LIQUIDITE",
    url: "https://www.youtube.com/watch?v=EP2_LIQUIDITE",
    titre: "FORMATION ICT ÉPISODE 2 : Liquidité Interne vs Externe & Sweeps",
    date_video: "2024-01-22",
    duree_s: 1820,
    description: "Comprendre où se situent les stops des traders particuliers et comment l'algorithme interbancaire vient les chercher."
  },
  {
    playlist: "P1",
    rang: 12,
    video_id: "FVG_MASTERCLASS",
    url: "https://www.youtube.com/watch?v=FVG_MASTERCLASS",
    titre: "La Règle Ultime du Fair Value Gap (Ne vous faites plus avoir)",
    date_video: "2024-03-04",
    duree_s: 1100,
    description: "Explication détaillée de la mitigation des déséquilibres de prix (Imbalance/FVG) en M15 et M5."
  },
  {
    playlist: "P2",
    rang: 5,
    video_id: "FVG_MASTERCLASS",
    url: "https://www.youtube.com/watch?v=FVG_MASTERCLASS",
    titre: "La Règle Ultime du Fair Value Gap (Rediffusion Playlist Setups)",
    date_video: "2024-03-04",
    duree_s: 1100,
    description: "Doublon présent dans la playlist Setups."
  },
  {
    playlist: "P3",
    rang: 8,
    video_id: "KILLZONE_LONDON",
    url: "https://www.youtube.com/watch?v=KILLZONE_LONDON",
    titre: "Mon Setup Préféré sur la Killzone de Londres (Stratégie Complète)",
    date_video: "2024-05-18",
    duree_s: 3850,
    description: "Masterclass de plus d'une heure sur le timing de session européenne et l'expansion New Yorkaise."
  }
];
