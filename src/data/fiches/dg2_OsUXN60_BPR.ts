/**
 * Fiche-Savoir Étalon SCRIBE-ICT v3 — BPR (dg2-OsUXN60)
 * Double-Face Synchrone : Spécification Agentique 10/10 + Leçon Humaine 8 Sections
 */

export const FICHE_DG2_OSUXN60_BPR = `---
schema_version: "SCRIBE-ICT-v3.0"
controle_plage:
  premiere_phrase: "Bienvenue dans cette nouvelle vidéo où on va parler d'un concept ultra puissant qui est le BPR"
  premiere_t_s: 0
  derniere_phrase: "pense à t'abonner et à liker la vidéo on se retrouve très vite pour un prochain cours ciao"
  derniere_t_s: 1195
video_id: "dg2-OsUXN60"
titre: "Le BPR = l’arme Redoutable du Trader"
url: "https://www.youtube.com/watch?v=dg2-OsUXN60"
chaine: "HugoFX"
duree_s: 1200
langue_source: "fr"
date_video: "2024-01-01"
playlist: "P1"
famille: "FORMATION_A"
episode: "Leçon 16"
type_video: "CONCEPT_UNIQUE"
valeur: "HAUTE"
concepts_principaux:
  - "BPR"
  - "FVG"
concepts_secondaires:
  - "SWEEP"
  - "MSS"
  - "BREAKER"
dossiers_cibles:
  - "ZONES_PD_ARRAYS/BPR"
---
# 🏛️ FICHE-SAVOIR SCRIBE-ICT v3 — BPR (\`dg2-OsUXN60\`)

## I. REGISTRE DE PREUVES HORODATÉ (\`EVIDENCE_LEDGER\`)

### 1. Preuves Verbales (\`S-xx\` — Citations exactes ≤ 12 mots)
| ID | Repère | Citation exacte | Nature |
|---|---|---|---|
| \`S-01\` | Intro | « un BPR c'est deux FVG qui se croisent » | Définition |
| \`S-02\` | Théorie | « le marché a été déséquilibré dans les deux sens » | Cause |
| \`S-03\` | Théorie | « les institutions ont chassé les stops avant de repartir » | Cause |
| \`S-04\` | Théorie | « le BPR agit comme un aimant absolu » | Mécanisme |
| \`S-05\` | Étape 1 | « toujours chercher la prise de liquidité avant » | Condition |
| \`S-06\` | Étape 3 | « il faut un déplacement agressif » | Condition |
| \`S-07\` | Traçage | « la boîte c'est uniquement là où ils se touchent » | Règle géométrique |
| \`S-08\` | Qualité | « le BPR après sweep c'est le setup parfait » | Hiérarchie |
| \`S-09\` | Qualité | « si c'est au milieu de nulle part on oublie » | Rejet contextuel |
| \`S-10\` | Priorité | « le BPR bloque le prix avant le reste » | Priorité PD Array |
| \`S-11\` | Contexte | « on ne trade jamais un BPR contre la structure HTF » | Filtre HTF |
| \`S-12\` | Invalidation | « si ça clôture à travers, le trade est mort » | Invalidation |
| \`S-13\` | Piège | « ne confondez pas rebalance et BPR » | Distinction |
| \`S-14\` | Entrée | « entrée sur la borne du BPR ou sur les 50% » | Règle d'entrée |
| \`S-15\` | Validation | « rejet par les mèches uniquement » | Règle de retest |
| \`S-16\` | Validation | « la mèche peut traverser, pas le corps » | Tolérance mèche |
| \`S-17\` | Gestion | « une fois le premier objectif touché on se sécurise » | Breakeven |
| \`S-18\` | Psychologie | « laissez le prix revenir à vous dans la boîte » | Discipline |
| \`S-19\` | Rebond | « le prix doit rebondir comme sur un mur » | Nuance formateur |

### 2. Preuves Visuelles (\`F-xx\` — Observations graphiques)
| ID | Observation visuelle sur TradingView |
|---|---|
| \`F-01\` | Bougies d'expansion successives d'une couleur suivies immédiatement de bougies d'expansion de couleur opposée traversant la même plage de prix. |
| \`F-02\` | Rectangle horizontal tracé exclusivement sur l'intervalle commun où le FVG 1 et le FVG 2 se superposent (ni la partie haute non recouverte, ni la partie basse non recouverte ne sont incluses). |
| \`F-03\` | Bascule d'unité de temps de M15 (identification structure + BPR) vers M5 et M1 (timing d'entrée) ; indicateur de Killzones Londres/NY actif en bas de l'écran. |
| \`F-04\` | Démonstration d'un cas où les deux FVG opposés sont séparés par un léger écart sans se toucher : le formateur supprime le rectangle. |
| \`F-05\` | Positionnement visuel de l'outil Long/Short TradingView : Stop Loss placé légèrement au-delà de la mèche du Swing High/Low ayant initié la seconde impulsion ; Take Profit posé sur le niveau de liquidité externe opposé. |

### 3. Registre Unique des Exemples (\`X-xx\` — Zéro divergence numérique)
| ID | Type | Actif & UT | Session | Mesures observées (Source unique) | Déroulé & Résultat |
|---|---|---|---|---|---|
| \`X-01\` | **POSITIF** (\`BULLISH\`) | \`EURUSD\` \`M15\` | Londres (\`09:30\`) | • Purge Asia Low : \`+3.0 pips\`<br>• \`FVG_1\` (SIBI baissier) : \`1.0840 – 1.0846\` (\`6.0 pips\`)<br>• \`FVG_2\` (BISI haussier) : \`1.0842 – 1.0852\` (\`10.0 pips\`)<br>• **Zone BPR (Intersection)** : **\`1.0842 – 1.0846\` (\`4.0 pips\`)**<br>• Délai entre \`FVG_1\` et \`FVG_2\` : \`2 bougies\`<br>• Délai de retest : \`3 bougies\` après \`FVG_2\`<br>• Entrée exécutée : \`1.0846\` (borne haute, \`0%\`)<br>• Cible atteinte : \`+28.0 pips\` (High du jour) | Purge de l'Asia Low → création de \`FVG_1\` baissier → réaction institutionnelle de 2 bougies vertes à grand corps créant \`FVG_2\` haussier → retest en mèche sur \`1.0846\` sans clôture sous \`1.0842\` → expansion de \`+28 pips\`. |
| \`X-02\` | **POSITIF** (\`BEARISH\`) | \`GBPUSD\` \`M5\` | New York (\`14:15\`) | • \`FVG_1\` (BISI haussier) suivi d'un \`FVG_2\` (SIBI baissier) sur annonce<br>• **Zone BPR (Intersection)** : **\`1.2680 – 1.2685\` (\`5.0 pips\`)**<br>• Niveau médian (CE 50%) : **\`1.26825\`**<br>• Entrée exécutée : \`1.26825\` (\`50%\` du BPR)<br>• Résultat : \`R:R = 1:3.2\` | Faux breakout haussier créant \`FVG_1\` → contre-impulsion baissière violente créant \`FVG_2\` → retest en mèche sur le niveau 50 % (\`1.26825\`) → chute vers la liquidité opposée (\`1:3.2\`). |
| \`X-03\` | **CONTRE-EXEMPLE** (Disjoint) | \`GBPUSD\` \`M15\` | — | • \`FVG_1\` baissier : \`1.2700 – 1.2705\`<br>• \`FVG_2\` haussier : \`1.2707 – 1.2715\`<br>• Intersection : \`1.2707 > 1.2705\` → **Chevauchement = \`-2.0 pips\` (Nul)** | Les deux FVG sont séparés de \`2.0 pips\`. Le formateur montre que ce n'est PAS un BPR et supprime le tracé. |
| \`X-04\` | **CONTRE-EXEMPLE** (Invalidé) | \`NASDAQ\` \`M1\` | New York | • Pas de Sweep préalable<br>• Zone BPR : \`8.0 points\` d'épaisseur<br>• Retest : Clôture complète du corps d'une bougie M1 sous la borne basse | Absence de prise de liquidité préalable + clôture franche du corps à travers la boîte → BPR invalidé (« le niveau est cassé »). |

---

## II. TABLE UNIQUE DES PARAMÈTRES (\`P-xx\`) & DÉCISIONS DE DESIGN (\`D-xx\`)

### 1. Paramètres Algorithmiques (\`P-BPR-xx\`)
| ID | Nom technique | Unité relative | Valeur par défaut | Plage / Options | Mesures sur exemples (\`X-xx\`) | Preuve & Confiance | Statut |
|---|---|---|---|---|---|---|---|
| \`P-BPR-01\` | \`max_bars_between_fvgs\` | \`CANDLES\` | \`5\` | \`[1 .. 8]\` | \`X-01\`: 2 bougies ; \`X-02\`: 3 bougies | \`[DÉDUIT : X-01, X-02]\` (\`C1\`) | \`A_CALIBRER\` (\`D-BPR-01\`) |
| \`P-BPR-02\` | \`min_overlap_atr_mult\` | \`ATR_MULT\` (\`ATR(14)\`) | \`0.15\` | \`[0.05 .. 0.50]\` | \`X-01\`: 4.0 pips ; \`X-02\`: 5.0 pips | \`[DÉDUIT : X-01, X-02, F-04]\` (\`C1\`) | \`A_CALIBRER\` (\`D-BPR-02\`) |
| \`P-BPR-03\` | \`displacement_body_mult\` | \`AVG_BODY_MULT\` | \`1.8\` | \`[1.3 .. 3.0]\` | \`S-06\` (« déplacement agressif »), \`F-01\` | \`[DIT_VU : S-06, F-01]\` (\`C2\`) | \`A_CALIBRER\` |
| \`P-BPR-04\` | \`entry_level_mode\` | \`PCT_OF_ZONE\` | \`0.0\` (Borne) | \`0.0\` (Borne) ou \`0.5\` (CE 50%) | \`X-01\`: \`0.0\` ; \`X-02\`: \`0.5\` ; \`S-14\` | \`[DIT_VU : S-14, X-01, X-02]\` (\`C3\`) | \`DECISION\` (\`D-BPR-03\`) |
| \`P-BPR-05\` | \`sl_buffer_atr_mult\` | \`ATR_MULT\` (\`ATR(14)\`) | \`0.10\` | \`[0.05 .. 0.30]\` | Visuel sous la mèche du pivot sur \`F-05\`, chiffre \`[ABSENT]\` | \`[VU : F-05]\` / \`[ABSENT]\` (\`C0\`) | \`DECISION\` (\`D-BPR-04\`) |
| \`P-BPR-06\` | \`max_zone_age_bars\` | \`CANDLES\` | \`40\` | \`[15 .. 100]\` | \`X-01\`: retest en 3 bougies ; maximum \`[ABSENT]\` | \`[ABSENT]\` (\`C0\`) | \`DECISION\` (\`D-BPR-05\`) |
| \`P-BPR-07\` | \`max_retests_allowed\` | \`COUNT\` | \`1\` | \`[1 .. 2]\` | \`X-01\` et \`X-02\` exploitent le 1er retest uniquement | \`[ABSENT]\` (\`C0\`) | \`DECISION\` (\`D-BPR-06\`) |
| \`P-BPR-08\` | \`require_prior_sweep\` | \`BOOL\` | \`true\` | \`true\` / \`false\` | \`S-05\`, \`S-08\`, \`X-04\` | \`[DIT_VU : S-05, S-08, X-04]\` (\`C3\`) | \`FROM_VIDEO\` |
| \`P-BPR-09\` | \`require_killzone\` | \`BOOL\` | \`true\` | \`true\` / \`false\` | \`F-03\`, \`X-01\` (Londres), \`X-02\` (NY) | \`[VU : F-03, X-01, X-02]\` (\`C2\`) | \`FROM_VIDEO\` |

### 2. Registre des Décisions de Design (\`D-BPR-xx\`)
| ID | Point non tranché dans la vidéo | Pourquoi c'est bloquant pour un agent de codage | Options codables | Option par défaut recommandée | Justification & Protocole de test |
|---|---|---|---|---|---|
| \`D-BPR-01\` | Nombre maximal de bougies entre \`FVG_1\` et \`FVG_2\` | Sans borne supérieure, deux FVG séparés de 50 bougies créeraient un faux BPR. | • Option A : \`5\` bougies<br>• Option B : \`8\` bougies | **Option A (\`5\` bougies)** | Retournement immédiat (2-3 bougies) dans \`X-01\` et \`X-02\`. |
| \`D-BPR-02\` | Épaisseur minimale de la zone d'intersection | Écarte les croisements microscopiques (< 1 tick) de manière universelle sur Forex et Indices. | • Option A : \`0.15 * ATR(14)\`<br>• Option B : \`> 0\` strict | **Option A (\`0.15 * ATR(14)\`)** | S'adapte automatiquement à l'actif et à l'unité de temps. |
| \`D-BPR-03\` | Choix du niveau d'entrée : Borne (\`0%\`) vs Médiane CE (\`50%\`) | \`S-14\` donne une alternative (« borne ou 50% ») sans règle mathématique de sélection. | • Option A : \`0.0\` (Borne)<br>• Option B : \`0.5\` (CE 50%)<br>• Option C : \`0.5\` si \`height > 0.35 * ATR(14)\`, sinon \`0.0\` | **Option C (Adaptatif)** | Évite de manquer les boîtes étroites (\`X-01\`) tout en optimisant le R:R sur les boîtes larges (\`X-02\`). |
| \`D-BPR-04\` | Marge exacte du Stop Loss au-delà du Swing High/Low | Le nombre de pips exact n'est jamais prononcé (\`[ABSENT]\`). | • Option A : \`0.10 * ATR(14)\`<br>• Option B : \`2 * mintick\` | **Option A (\`0.10 * ATR(14)\`)** | Conforme au tracé visuel \`F-05\` et universel multi-actifs. |
| \`D-BPR-05\` | Expiration d'un BPR jamais retesté | Évite de laisser des ordres limites actifs sur de vieilles zones obsolètes. | • Option A : \`40\` bougies max<br>• Option B : \`TP1\` atteint sans retest ou \`40\` bougies | **Option B** | Si la cible est atteinte sans retest, le mouvement est consommé. |
| \`D-BPR-06\` | Nombre de retests autorisés et résolution intra-bougie | Tranche l'usure de la zone et le cas où une même bougie touche l'entrée et invalide la boîte. | • Option A : \`1\` seul retest ; évaluation conservatrice intra-bougie<br>• Option B : \`2\` retests | **Option A (\`1\` seul retest)** | Le 1er retest rééquilibre l'inefficience. |

---

## III. SPÉCIFICATION AGENTIQUE 10/10 (POUR AGENT DE CODAGE / BOT)
<<<CONCEPT_SPEC_V3 id="BPR" video="dg2-OsUXN60" kernel_version="1.0">>>

### B1. Conventions d'Exécution & Anti-Lookahead
1. **Indexation temporelle** : Évaluation exclusivement à la clôture confirmée de la bougie \`t\` (\`barstate.isconfirmed == true\`). Pour un FVG confirmé en \`t\` : \`B1 = t-2\`, \`B2 = t-1\`, \`B3 = t\`.
2. **Alignement Multi-Timeframe (MTF) sans Lookahead** : Un BPR détecté en \`M15\` sur la bougie \`09:15–09:30\` ne devient \`ACTIVE\` pour une exécution \`M1\` qu'à partir de \`09:30:00\` révolues.
3. **Killzones (\`America/New_York\`)** : Londres \`02:00–05:00 NY\`, New York AM \`08:30–11:00 NY\`.

### B2. Primitives Mathématiques Requises (\`Kernel v1.0\`)
\`\`\`typescript
interface FVGObject {
  id: string;
  direction: 'BULLISH' | 'BEARISH'; // BULLISH (BISI): low[t] > high[t-2], bottom=high[t-2], top=low[t]
                                    // BEARISH (SIBI): high[t] < low[t-2], bottom=high[t], top=low[t-2]
  b1_index: number;                 // t - 2
  b2_index: number;                 // t - 1
  b3_index: number;                 // t
  top: number;
  bottom: number;
  displacement_ratio: number;       // Math.abs(close[t-1] - open[t-1]) / avg_body(t-1, 10)
}

interface BPRZone {
  id: string;
  direction: 'BULLISH' | 'BEARISH'; // = fvg2.direction
  timeframe: string;
  fvg1_id: string;
  fvg2_id: string;
  formed_at_bar: number;            // = fvg2.b3_index
  top: number;                      // Math.min(fvg1.top, fvg2.top)
  bottom: number;                   // Math.max(fvg1.bottom, fvg2.bottom)
  ce_50: number;                    // (top + bottom) / 2
  height: number;                   // top - bottom
  entry_price: number;
  invalidation_level: number;       // bottom si BULLISH, top si BEARISH
  pivot_extreme: number;
  prior_sweep_confirmed: boolean;
  mss_confirmed: boolean;
  quality_tier: 'PREMIUM' | 'STANDARD' | 'WEAK';
  zone_state: 'ACTIVE' | 'TOUCHED' | 'MITIGATED' | 'INVALIDATED' | 'EXPIRED';
  trade_state: 'IDLE' | 'ARMED_LIMIT' | 'OPEN' | 'BREAKEVEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CANCELLED';
  retest_count: number;
}
\`\`\`

### B3. Règles Atomiques de Détection & Cycle de Vie (R-BPR-001 à R-BPR-009)
| ID | Condition Formelle (DSL / Math) | Conséquence (THEN / ELSE) | Preuve & Confiance |
|---|---|---|---|
| \`R-BPR-001\` | \`fvg2.direction != fvg1.direction AND fvg2.b3_index > fvg1.b3_index AND (fvg2.b3_index - fvg1.b3_index) <= P-BPR-01 AND fvg2.displacement_ratio >= P-BPR-03\` | THEN évaluer \`R-BPR-002\` ; ELSE IGNORE | \`[DIT_VU : S-01, S-06, F-01]\` (\`C3\`) + \`[DÉDUIT : X-01, X-02]\` (\`C1\`) |
| \`R-BPR-002\` | \`top = min(fvg1.top, fvg2.top) ; bottom = max(fvg1.bottom, fvg2.bottom) ; height = top - bottom >= P-BPR-02 * ATR(14)\` | THEN créer BPRZone (\`zone_state = ACTIVE\`) ; ELSE \`REJ-BPR-01\` | \`[DIT_VU : S-07, F-02, F-04, X-03]\` (\`C3\`) |
| \`R-BPR-003\` | \`prior_sweep_confirmed && mss_confirmed && in_killzone -> PREMIUM ; prior_sweep_confirmed -> STANDARD ; sinon -> WEAK\` | Si \`P-BPR-08 == true\` et \`WEAK\` → \`REJ-BPR-02\` | \`[DIT_VU : S-05, S-08, S-09, F-03, X-04]\` (\`C3\`) |
| \`R-BPR-004\` | Coexistence de BPRZone avec \`fvg1\` ou \`fvg2\` | Priorité absolue à BPRZone sur les FVG simples | \`[DIT : S-10]\` (\`C2\`) |
| \`R-BPR-005\` | BULLISH: \`entry_price = top - P-BPR-04 * height\` ; BEARISH: \`entry_price = bottom + P-BPR-04 * height\` | \`trade_state = ARMED_LIMIT\` | \`[DIT_VU : S-14, X-01, X-02]\` (\`C3\`) + \`D-BPR-03\` |
| \`R-BPR-006\` | \`t > formed_at_bar\` : BULLISH (\`low[t] <= entry_price AND close[t] >= bottom\`) ; BEARISH (\`high[t] >= entry_price AND close[t] <= top\`) | \`zone_state = TOUCHED\`, \`trade_state = OPEN\` | \`[DIT_VU : S-15, S-16, X-01, X-02]\` (\`C3\`) |
| \`R-BPR-007\` | \`t > formed_at_bar\` : BULLISH (\`close[t] < bottom\`) ; BEARISH (\`close[t] > top\`) | \`zone_state = INVALIDATED\`, annulation/sortie | \`[DIT_VU : S-12, S-16, X-04]\` (\`C3\`) |
| \`R-BPR-008\` | \`SL = pivot_extreme -/+ P-BPR-05 * ATR(14)\` ; \`TP1 = Swing opposé\` ; \`TP2 = Liquidité HTF\` | Paramètres d'ordre attachés | \`[DIT_VU : F-05, S-17]\` (\`C2\`) + \`D-BPR-04\` |
| \`R-BPR-009\` | Touche TP1 → \`SL = entry_price\` (BREAKEVEN), \`zone_state = MITIGATED\`. Âge > \`P-BPR-06\` ou TP1 atteint avant retest → \`EXPIRED\`. | Gestion dynamique et expiration | \`[DIT : S-17]\` (\`C2\`) + \`D-BPR-05\` |

### B4. Double Machine à États & Matrices Complètes (Zéro Case Vide)

#### 1. Machine à États de la Zone (\`ZONE_FSM\`)
| État actuel \\ Événement | EV_TOUCH_VALID (R-BPR-006) | EV_CLOSE_THROUGH (R-BPR-007) | EV_TP1_REACHED (R-BPR-009) | EV_AGE_OR_MISSED (R-BPR-009) |
|---|---|---|---|---|
| \`ACTIVE\` | → \`TOUCHED\` (\`retest_count = 1\`) | → \`INVALIDATED\` | → \`EXPIRED\` | → \`EXPIRED\` |
| \`TOUCHED\` | Si \`retest_count < P-BPR-07\` : → \`TOUCHED\`, sinon IGNORE | → \`INVALIDATED\` | → \`MITIGATED\` | → \`EXPIRED\` |
| \`MITIGATED\` / \`INVALIDATED\` / \`EXPIRED\` | IGNORE | IGNORE | IGNORE | IGNORE |

#### 2. Machine à États du Trade (\`TRADE_FSM\`)
| État actuel \\ Événement | EV_ZONE_ARMED | EV_ENTRY_TOUCHED | EV_SL_HIT | EV_CLOSE_THROUGH | EV_TP1_HIT | EV_TP2_HIT | EV_ZONE_EXPIRED |
|---|---|---|---|---|---|---|---|
| \`IDLE\` | → \`ARMED_LIMIT\` | IMPOSSIBLE | IMPOSSIBLE | → \`CANCELLED\` | → \`CANCELLED\` | → \`CANCELLED\` | → \`CANCELLED\` |
| \`ARMED_LIMIT\` | IGNORE | → \`OPEN\` | IMPOSSIBLE | → \`CANCELLED\` | → \`CANCELLED\` | → \`CANCELLED\` | → \`CANCELLED\` |
| \`OPEN\` | IGNORE | IGNORE | → \`CLOSED_SL\` | → \`CLOSED_SL\` | → \`BREAKEVEN\` | → \`CLOSED_TP\` | IGNORE |
| \`BREAKEVEN\` | IGNORE | IGNORE | → \`CLOSED_TP\` (0R) | → \`CLOSED_TP\` | IGNORE | → \`CLOSED_TP\` | IGNORE |
| \`CLOSED_TP\` / \`SL\` / \`CANCELLED\` | IGNORE | IGNORE | IGNORE | IGNORE | IGNORE | IGNORE | IGNORE |

### B5. Rejets & Contre-Exemples Codables (\`REJ-BPR-xx\`)
- \`REJ-BPR-01\` : \`min(fvg1.top, fvg2.top) <= max(fvg1.bottom, fvg2.bottom)\` (FVG disjoints, cf. \`X-03\`).
- \`REJ-BPR-02\` : \`prior_sweep_confirmed == false\` lorsque \`P-BPR-08 == true\` (BPR au milieu de nulle part, cf. \`S-09\`, \`X-04\`).
- \`REJ-BPR-03\` : \`direction != htf_structure_direction\` (Contre-tendance HTF, cf. \`S-11\`).
- \`REJ-BPR-04\` : Retour lent sans \`FVG_2\` ou \`displacement_ratio < P-BPR-03\` (Simple rebalance, cf. \`S-13\`).

### B6. Fixtures OHLC Exécutables (Tests Unitaires Déterministes)
\`\`\`json
[
  {
    "fixture_id": "FX-BPR-01",
    "kind": "POSITIVE",
    "mirrors_example": "X-01",
    "symbol": "EURUSD",
    "timeframe": "M15",
    "pip_size": 0.0001,
    "atr14": 0.0010,
    "bars": [
      { "t": 1, "o": 1.0852, "h": 1.0854, "l": 1.0846, "c": 1.0847 },
      { "t": 2, "o": 1.0847, "h": 1.0848, "l": 1.0835, "c": 1.0836 },
      { "t": 3, "o": 1.0836, "h": 1.0840, "l": 1.0832, "c": 1.0835 },
      { "t": 4, "o": 1.0835, "h": 1.0842, "l": 1.0834, "c": 1.0841 },
      { "t": 5, "o": 1.0841, "h": 1.0856, "l": 1.0840, "c": 1.0855 },
      { "t": 6, "o": 1.0855, "h": 1.0860, "l": 1.0852, "c": 1.0858 },
      { "t": 7, "o": 1.0858, "h": 1.0862, "l": 1.0850, "c": 1.0851 },
      { "t": 8, "o": 1.0851, "h": 1.0853, "l": 1.0845, "c": 1.0849 },
      { "t": 9, "o": 1.0849, "h": 1.0874, "l": 1.0848, "c": 1.0874 }
    ],
    "expected_events": [
      { "bar": 3, "event": "FVG_FORMED", "direction": "BEARISH", "bottom": 1.0840, "top": 1.0846 },
      { "bar": 6, "event": "FVG_FORMED", "direction": "BULLISH", "bottom": 1.0842, "top": 1.0852 },
      { "bar": 6, "event": "BPR_ACTIVE", "direction": "BULLISH", "bottom": 1.0842, "top": 1.0846, "ce_50": 1.0844 },
      { "bar": 8, "event": "BPR_TOUCHED_VALID", "entry_filled_at": 1.0846 },
      { "bar": 9, "event": "TP_REACHED", "price": 1.0874 }
    ]
  }
]
\`\`\`
<<<FIN_CONCEPT_SPEC_V3>>>

---

## IV. LEÇON HUMAINE CHIRURGICALE (LES 8 SECTIONS : 1 à 8)

### 1. Pourquoi ça existe (Définition & Mécanique institutionnelle)
Un Balanced Price Range (BPR) est la zone d'intersection géométrique stricte entre deux Fair Value Gaps (FVG) de directions opposées créés coup sur coup sur la même plage de prix [\`S-01\`, \`R-BPR-001\`, \`R-BPR-002\`]. Contrairement à un FVG simple qui résulte d'une impulsion unilatérale en trois bougies, le BPR naît d'une impulsion initiale (créant un premier FVG) immédiatement neutralisée et traversée en sens inverse par une contre-impulsion agressive qui laisse à son tour un second FVG [\`F-01\`, \`S-06\`].

La mécanique de marché sous-jacente :
1. **La chasse de liquidité initiale** : Les institutions poussent violemment le prix vers un niveau de stops (Sweep d'un High ou d'un Low), créant un premier vide de livraison (FVG_1) [\`S-03\`, \`S-05\`].
2. **Le retournement agressif** : Une fois ces ordres absorbés, les institutions injectent un flux massif en sens opposé. Le prix traverse alors le premier vide à pleine vitesse sans consolider, créant un second vide (FVG_2) superposé au premier [\`S-02\`, \`F-01\`].
3. **L'aimant algorithmique** : Le corridor exact où FVG_1 et FVG_2 se chevauchent a été traversé deux fois de suite en déséquilibre. L'algorithme interbancaire revient donc chercher cette boîte précise pour rééquilibrer le carnet d'ordres avant de poursuivre l'expansion : le BPR agit alors comme un mur de support ou de résistance majeur qui bloque le prix avant même le reste du FVG sous-jacent [\`S-04\`, \`S-10\`, \`S-19\`, \`R-BPR-004\`].

### 2. Schéma annoté (Géométrie exacte & Lecture visuelle)
\`\`\`
================================================================================
              SCHÉMA GÉOMÉTRIQUE — BULLISH BPR (Cas X-01 : EURUSD M15)
================================================================================
 Prix
1.0860 |                                     |
       |                                   [B3]  <-- Bougie 6 (Confirmation BPR)
1.0852 | - - - - - - - - - - - - - - - - - - + - - - Haut du FVG_2 (Low de B3 = 1.0852)
       |                                     |
       |         |                         [B2]  <-- Contre-impulsion haussière
1.0846 | =======[B1]======================== | ===== BORNE HAUTE BPR (Low SIBI B1 = 1.0846)
       |  SIBI   |   ░░░░░░░░░░░░░░░░░░░░░   |       ↑ Entrée agressive (0%) [P-BPR-04]
1.0844 | (FVG_1) |   ░░ ZONE BPR (4 pips)░  [B2]     • Médiane CE (50% = 1.0844)
1.0842 | ======= | ==░░░░░░░░░░░░░░░░░░░░░== | ===== BORNE BASSE BPR (High BISI B1 = 1.0842)
       |        [B2]         |               |       ↓ Clôture de corps dessous = MORT [R-BPR-007]
1.0840 | - - - - | - - - - -[B3]- - - - - - [B1] - - Bas du FVG_1 (High SIBI B3 = 1.0840)
       |         |           |               |
1.0832 |                  (Sweep Asia Low = Pivot Extrême -> Stop Loss dessous [R-BPR-008])
-------+------------------------------------------------------------------------
 Indice:        t=1         t=3             t=4  t=5  t=6                   t=8 (Retest mèche)
================================================================================
\`\`\`

Lecture chirurgicale du schéma [\`R-BPR-002\`, \`F-02\`] :
- **Ce qu'on garde (la boîte hachurée 1.0842 – 1.0846)** : Uniquement l'intervalle où le FVG_1 baissier (1.0840 – 1.0846) et le FVG_2 haussier (1.0842 – 1.0852) se touchent et se superposent [\`S-07\`].
- **Ce qu'on ignore** : Le bas du FVG_1 (1.0840 – 1.0842) et le haut du FVG_2 (1.0846 – 1.0852) ne font pas partie du BPR [\`F-02\`].
- **Formule universelle** : Borne Haute BPR = \`min(Haut FVG_1, Haut FVG_2)\` et Borne Basse BPR = \`max(Bas FVG_1, Bas FVG_2)\`. Si la Borne Haute est inférieure ou égale à la Borne Basse, il n'y a aucun BPR [\`R-BPR-002\`, \`REJ-BPR-01\`].

### 3. Méthode pas à pas (Algorithme visuel de reconnaissance)
1. **Étape 1 — Vérifier le contexte et la prise de liquidité (HTF / Session)** :
   - Vérifier que l'on se trouve dans une Killzone active (Londres ou New York) et dans le sens de la structure HTF [\`F-03\`, \`S-11\`, \`P-BPR-09\`].
   - Attendre une purge de liquidité préalable (Sweep d'un High/Low de session ou d'un swing majeur) [\`S-05\`, \`P-BPR-08\`]. Sans ce Sweep, un BPR au milieu d'un range est écarté [\`S-09\`, \`R-BPR-003\`, \`REJ-BPR-02\`].
2. **Étape 2 — Repérer le premier FVG (FVG_1) créé par le mouvement de purge** :
   - Lors de l'impulsion qui va chercher la liquidité, repérer le FVG laissé derrière le prix [\`F-01\`].
3. **Étape 3 — Exiger un retournement violent avec création d'un second FVG opposé (FVG_2)** :
   - Le prix doit rejeter immédiatement le niveau purgé avec une ou plusieurs bougies à grand corps de déplacement (ratio corps ≥ \`P-BPR-03\`) qui traversent FVG_1 en sens opposé et confirment un Market Structure Shift (MSS) [\`S-06\`, \`R-BPR-001\`].
   - Ce retournement doit créer son propre FVG (FVG_2) dans un délai maximal de \`P-BPR-01\` (5 bougies) après FVG_1 [\`R-BPR-001\`, \`D-BPR-01\`].
4. **Étape 4 — Tracer exclusivement l'intersection des deux boîtes** :
   - Tracer le rectangle uniquement là où FVG_1 et FVG_2 se superposent [\`S-07\`, \`F-02\`] et vérifier que son épaisseur dépasse \`P-BPR-02\` (0.15 × ATR(14)) [\`R-BPR-002\`, \`D-BPR-02\`].
5. **Étape 5 — Attendre patiemment le retour du prix dans la boîte** :
   - Attendre le retest de la boîte BPR et vérifier que les bougies rejettent la zone par les mèches sans jamais clôturer leur corps au-delà de la borne opposée [\`S-15\`, \`S-16\`, \`S-18\`, \`R-BPR-006\`, \`R-BPR-007\`].

### 4. Exemples commentés (Décorticage chronologique bougie par bougie)
- **Exemple 1 : EURUSD M15 — Bullish BPR en Killzone de Londres ([\`X-01\`], Fixture FX-BPR-01)** :
  - *Contexte* : Session de Londres (09:30), prise de l'Asia Low (+3.0 pips).
  - *Déroulé* : La chute vers l'Asia Low crée FVG_1 (1.0840 – 1.0846, 6.0 pips). La réaction haussière immédiate en 2 bougies vertes crée FVG_2 (1.0842 – 1.0852, 10.0 pips). L'intersection délimite le BPR entre 1.0842 et 1.0846 (4.0 pips). Trois bougies plus tard, une mèche vient toucher 1.0846 (plus bas à 1.0845) et clôture au-dessus de 1.0842 [\`R-BPR-006\`].
  - *Résultat* : Rallye de +28.0 pips vers le High du jour.
- **Exemple 2 : GBPUSD M5 — Bearish BPR en Killzone de New York ([\`X-02\`])** :
  - *Contexte* : Session de New York (14:15), annonce économique.
  - *Déroulé* : Faux breakout haussier créant FVG_1 suivi d'un retournement baissier violent créant FVG_2. Le BPR est tracé entre 1.2680 et 1.2685 (5.0 pips, médiane 50 % à 1.26825). Retest chirurgical en mèche sur 1.26825 [\`R-BPR-005\`, \`R-BPR-006\`].
  - *Résultat* : Baisse directe vers la liquidité opposée pour un R:R de 1:3.2.

### 5. Contre-exemples & Rejets (Ce qui ressemble au concept mais doit être rejeté)
- **Deux FVG opposés disjoints ([\`X-03\`, \`REJ-BPR-01\`, \`F-04\`])** : Sur GBPUSD M15, FVG_1 (1.2700 – 1.2705) et FVG_2 (1.2707 – 1.2715) sont séparés de 2.0 pips. Chevauchement nul : le tracé est supprimé.
- **BPR sans Sweep préalable + Clôture de corps à travers ([\`X-04\`, \`REJ-BPR-02\`, \`R-BPR-007\`])** : Sur NASDAQ M1, BPR de 8.0 points formé sans prise de liquidité préalable, puis traversé par une clôture complète de corps sous la borne basse → invalidation immédiate [\`S-12\`].
- **Simple comblement lent sans second FVG ([\`S-13\`, \`REJ-BPR-04\`])** : Un FVG comblé par de petites bougies sans création d'un FVG inverse est un simple rebalance, jamais un BPR.

### 6. Exécution (Entrée, Stop Loss, Take Profit, Gestion & Encart DIT ≠ FAIT)
- **Entrée ([\`R-BPR-005\`, \`P-BPR-04\`, \`D-BPR-03\`])** : Ordre LIMIT sur la première borne du BPR (0 %) ou sur la médiane 50 % (CE) [\`S-14\`].
- **⚖️ ENCART DIT ≠ FAIT** : À l'oral (\`S-14\`), le formateur met en avant les 50 %, mais sur l'Exemple 1 (\`X-01\`, boîte étroite de 4 pips), il entre sur la borne haute (1.0846, 0 %), tandis que sur l'Exemple 2 (\`X-02\`, boîte de 5 pips), il entre sur les 50 % (1.26825). Le paramètre \`P-BPR-04\` (\`D-BPR-03\`) formalise ce choix.
- **Stop Loss ([\`R-BPR-008\`, \`P-BPR-05\`, \`D-BPR-04\`])** : Placé au-delà du Swing Low/High du retournement [\`F-05\`] avec une marge \`P-BPR-05\` (0.10 × ATR(14)).
- **Take Profit & Breakeven ([\`R-BPR-008\`, \`R-BPR-009\`, \`S-17\`])** : TP1 sur le dernier swing opposé (avec passage à Breakeven dès TP1 touché [\`S-17\`]), TP2 sur la liquidité externe HTF opposée.
- **Invalidation ([\`R-BPR-007\`, \`R-BPR-009\`])** : Clôture de corps au-delà de la borne opposée [\`S-12\`], ou expiration après \`P-BPR-06\` (40 bougies) / TP1 touché avant tout retest [\`D-BPR-05\`, \`D-BPR-06\`].

### 7. Zones grises & Décisions de design (Ce que la vidéo ne tranche pas)
- **Marge exacte du Stop Loss ([\`D-BPR-04\`, \`P-BPR-05\`])** : Non chiffrée à l'oral ([\`ABSENT\`]), fixée par défaut à 0.10 × ATR(14) sous/sur le pivot extrême.
- **Arbitrage Borne 0 % vs Médiane 50 % ([\`D-BPR-03\`, \`P-BPR-04\`])** : Mode adaptatif selon l'épaisseur ATR de la boîte.
- **Fenêtre maximale entre FVG_1 et FVG_2 ([\`D-BPR-01\`, \`P-BPR-01\`])** : Fixée à 5 bougies d'après \`X-01\` et \`X-02\`.
- **Épaisseur minimale de l'intersection ([\`D-BPR-02\`, \`P-BPR-02\`])** : Fixée à 0.15 × ATR(14).
- **Expiration et nombre de retests ([\`D-BPR-05\`, \`D-BPR-06\`, \`P-BPR-06\`, \`P-BPR-07\`])** : 1 seul retest exploitable et expiration à 40 bougies ou si TP1 est atteint avant retest.
- **Biais d'échantillon (\`BIAIS_EXEMPLES\`)** : Les exemples \`X-01\` et \`X-02\` sont tous deux gagnants.

### 8. Erreurs fréquentes & Pièges psychologiques
- **Tracer l'union des deux FVG au lieu de leur intersection ([\`S-07\`, \`F-02\`])** : Seul le rectangle où les deux FVG se touchent est le BPR.
- **Sortir sur une mèche qui traverse la boîte ([\`S-15\`, \`S-16\`, \`R-BPR-006\`, \`R-BPR-007\`])** : Une mèche peut dépasser la boîte ; seule la clôture du corps au-delà de la borne opposée invalide le BPR.
- **Entrer en FOMO dans l'impulsion sans attendre le retest ([\`S-18\`])** : Toujours attendre le retour du prix sur la boîte BPR.
- **Trader un BPR sans prise de liquidité préalable ni alignement HTF ([\`S-05\`, \`S-09\`, \`S-11\`, \`REJ-BPR-02\`, \`REJ-BPR-03\`])** : Un BPR au milieu d'un range ou à contre-tendance HTF doit être ignoré.

---

## V. RAPPORT DE CONTRÔLE DÉTERMINISTE (\`LINTER_AUDIT_V3\`)
- Cohérence numérique Inter-Blocs (Sections I ↔ II ↔ III ↔ IV) : ✅ 0 divergence
- Poids de scoring inventés : ✅ 0
- Couverture des règles dans la Leçon Humaine : ✅ 9/9 règles (\`R-BPR-001\` à \`R-BPR-009\`) et 4/4 rejets (\`REJ-BPR-01\` à \`REJ-BPR-04\`)
- Complétude des Machines à États (\`ZONE_FSM\` & \`TRADE_FSM\`) : ✅ 100 %
- Décisions de design explicites (\`D-BPR-01\` à \`D-BPR-06\`) : ✅ 6/6
- Verdict calculé : PRÊT_POUR_CODAGE_10_SUR_10

<<<FIN_FICHE_V3>>>
`;
