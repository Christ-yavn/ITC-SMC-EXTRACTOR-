/**
 * Benchmark fiche example for skk0sm6LN6M (Fair Value Gaps - FVG)
 * Compliant with strict XML and YAML schema, containing explicit [ABSENT] markers
 */

export const SAMPLE_EXTRACTED_FICHE_SKK0SM6LN6M = `# FICHE D'EXTRACTION TECHNIQUE - HUGOFX ICT/SMC

<METADONNEES_YAML>
id_fiche: "V_P1_05-S1"
video_id: "skk0sm6LN6M"
url: "https://www.youtube.com/watch?v=skk0sm6LN6M"
titre: "TOUT savoir sur les FAIR VALUE GAPS (FVG)"
date_publication: "2024-02-18"
duree_totale_s: 890
tranche_traitee: "00:00 - 14:50 (ENTIERE)"
famille: "FORMATION_A"
statut_fiche: "AUDITE_VALIDE"
notions_cles:
  - "Fair Value Gap (FVG)"
  - "Imbalance / Déséquilibre"
  - "Consequent Encroachment (50%)"
  - "Bougie de déplacement"
actifs_cites:
  - "EURUSD"
  - "GBPUSD"
timeframes_mentionnees:
  - "M15"
  - "M5"
  - "M1"
</METADONNEES_YAML>

---

<POSITION_CURSUS>
### 1. Prérequis Supposés Acquis
- Définition d'une bougie japonaise (Open, High, Low, Close).
- Notion de base de tendance de marché haussière / baissière.

### 2. Renvois et Citations
- Épisodes antérieurs cités : "Comme on l'a vu sur la structure de marché" (01:45)
- Épisodes futurs annoncés : "La combinaison avec les Order Blocks sera abordée dans la prochaine vidéo" (13:50)

### 3. Simplifications Pédagogiques Volontaires
- HugoFX se concentre uniquement sur le modèle à 3 bougies classique sans aborder les BPR (Balanced Price Ranges) ni les SIBI/BISI complexes. (03:10)

### 4. Brique Débloquée
- Capacité pour l'algorithme d'identifier automatiquement une zone de déséquilibre à 3 bougies et de calculer le seuil médian de 50% (Consequent Encroachment).
</POSITION_CURSUS>

---

<CORPUS_REGLES>
## UNITÉ D'ENSEIGNEMENT 1 : Identification Géométrique du Fair Value Gap (02:15 - 06:40)

### A. Définition selon HugoFX
- **Définition textuelle** (02:30) : "Un Fair Value Gap est une inefficience de prix créée par un mouvement unilatéral rapide où la mèche de la bougie 1 et la mèche de la bougie 3 ne se chevauchent pas."
- **Équivalent standard ICT** : [Fair Value Gap (FVG) / Single Print Imbalance]
- **Rôle marché** (03:45) : Le prix est attiré comme un aimant vers ce vide de liquidité pour le rééquilibrer avant de continuer son impulsion.

### B. Matrice des Conditions d'Identification
| N° | Condition Formelle | Paramètre / Règle Seuil | Timeframe Requise | Timestamp Absolu |
|:---|:---|:---|:---|:---|
| 1  | Séquence de 3 bougies consécutives | Bougie 2 = Grand corps de déplacement impulsif | M15, M5 ou M1 | (03:20) |
| 2  | Cas Haussier (Bullish FVG) | Low de la Bougie 3 strictement supérieur au High de la Bougie 1 | Idem | (04:12) |
| 3  | Cas Baissier (Bearish FVG) | High de la Bougie 3 strictement inférieur au Low de la Bougie 1 | Idem | (04:55) |
| 4  | Seuil Médian (Consequent Encroachment - CE) | 50% de la distance entre Borne Haute et Borne Basse du gap | Calcul mathématique | (06:15) |

### C. Règles d'Exécution Algorithmique
- **Déclencheur d'Entrée (Trigger)** (07:30) :
  - IF le prix revient tester la borne du FVG (ou le niveau 50% CE) THEN Entrée en position dans le sens du déséquilibre.
- **Placement du Stop Loss** (09:10) :
  - Règle exacte : Placé sous le Low de la bougie 2 (pour un achat) ou au-dessus du High de la bougie 2 (pour une vente).
  - Tolérance de pips : [ABSENT]
- **Objectifs de Take Profit** (10:20) :
  - TP1 : Dernier plus haut / plus bas swing opposé.
  - TP2 : [ABSENT]
- **Gestion du Breakeven** (11:05) :
  - Règle exacte : [ABSENT]
  - Sortie partielle : [ABSENT]

### D. Exceptions et Invalidation
- **Règle d'invalidation du FVG** (08:45) : Si une bougie clôture entièrement avec son corps au-delà de la borne opposée du FVG, le gap est considéré comme violé et invalidé.
- Filtre de spread : [ABSENT]
- Filtre de session horaire dans cette vidéo : [ABSENT]
</CORPUS_REGLES>

---

<EXEMPLES_GRAPHIQUES>
### Exemple 1 : Bullish FVG sur EURUSD M15 (09:40 - 11:30)
- **Actif & Contexte** : EURUSD M15.
- **Séquence** :
  1. (09:55) : Impulsion verte créant un FVG de 8 pips entre 1.0850 (High bougie 1) et 1.0858 (Low bougie 3).
  2. (10:40) : Retest au pip près sur les 50% (1.0854).
  3. (11:15) : Rejet immédiat avec bougie de confirmation.
- **Résultat** : Expansion haussière vers le plus haut de session.

### Exemple 2 : Erreur classique de l'amateur (12:00 - 13:20)
- **Cas d'échec expliqué** : Entrer sur un FVG situé en plein milieu d'un range sans direction claire.
</EXEMPLES_GRAPHIQUES>

---

<AUDIT_FIABILITE>
- **Taux de complétude des règles** : 75% (Les conditions géométriques et le SL sont clairs, mais la gestion de trade intermédiaire et les filtres horaires sont omis).
- **Éléments non résolus / [ABSENT]** :
  - Règle formelle de passage à Breakeven : [ABSENT]
  - Prises de bénéfices partielles : [ABSENT]
  - Tolérance d'écart de spread : [ABSENT]
- **Degré de confiance timestamps** : 98% (Vérifié visuellement sur la vidéo).
- **Directives pour le codeur** : Utiliser la formule standard CE = (High_B1 + Low_B3) / 2 pour le tracé de la médiane. Ne pas coder de BE automatique sans consolidation avec les autres épisodes.
</AUDIT_FIABILITE>`;
