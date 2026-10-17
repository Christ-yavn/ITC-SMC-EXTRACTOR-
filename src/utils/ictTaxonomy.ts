/**
 * HugoFX ICT/SMC Master Taxonomy & Drive Organization Engine
 * 
 * Classement chirurgical en 7 Piliers Majeurs et 25 Concepts / PD Arrays / Setups :
 * Permet l'organisation automatique en sous-dossiers hiérarchiques sur Google Drive :
 * HugoFX ICT Knowledge Workbench / [01_Pilier] / [Concept_Setup] / [Fiche.md]
 */

export interface IctPillar {
  id: string;
  folderName: string;
  title: string;
  description: string;
  color: string;
  badge: string;
}

export interface IctClassificationResult {
  pillarId: string;
  pillarFolder: string;
  pillarTitle: string;
  conceptCode: string;
  conceptFolder: string;
  conceptName: string;
  setupStrategy: string;
  pathSegments: string[];
  fullDrivePath: string;
  tags: string[];
}

export const ICT_PILLARS: Record<string, IctPillar> = {
  '01_STRUCTURE': {
    id: '01_STRUCTURE',
    folderName: '01_Structure_et_Cartographie_MTF',
    title: '1. Structure de Marché & Cartographie MTF',
    description: 'Cartographie directionnelle, swings institutionnels, dealing ranges et points pivots.',
    color: 'blue',
    badge: 'Structure',
  },
  '02_LIQUIDITE': {
    id: '02_LIQUIDITE',
    folderName: '02_Liquidite_et_Chasse_aux_Stops',
    title: '2. Liquidité & Chasse aux Stops',
    description: 'Pools BSL/SSL, balayages (sweeps), Turtle Soup et zones d\'inducement interbancaire.',
    color: 'cyan',
    badge: 'Liquidité',
  },
  '03_PD_ARRAYS': {
    id: '03_PD_ARRAYS',
    folderName: '03_PD_Arrays_et_Desequilibres',
    title: '3. PD Arrays & Déséquilibres de Prix',
    description: 'BPR, Fair Value Gaps (FVG), Inversion FVG, Order Blocks, Breakers et Consequent Encroachment.',
    color: 'emerald',
    badge: 'PD Arrays',
  },
  '04_TEMPS': {
    id: '04_TEMPS',
    folderName: '04_Modeles_Temporels_et_Killzones',
    title: '4. Temps, Sessions & Killzones',
    description: 'Modèle Silver Bullet, macros horaires IPDA, sessions London/NY et ouvertures de volatilité.',
    color: 'amber',
    badge: 'Temps & Macro',
  },
  '05_SETUPS': {
    id: '05_SETUPS',
    folderName: '05_Setups_et_Strategies_Execution',
    title: '5. Setups & Modèles d\'Exécution',
    description: 'Optimal Trade Entry (OTE 62%-79%), Model 2022, cycles AMD et Power of 3.',
    color: 'purple',
    badge: 'Setups & Exécution',
  },
  '06_TOPDOWN': {
    id: '06_TOPDOWN',
    folderName: '06_TopDown_DailyBias_et_MultiTF',
    title: '6. Analyse Top-Down & Biais Journalier',
    description: 'Alignement HTF/LTF, récit narratif institutionnel et anticipation du Daily Bias.',
    color: 'indigo',
    badge: 'Top-Down & Bias',
  },
  '07_PSYCHO_RISK': {
    id: '07_PSYCHO_RISK',
    folderName: '07_Psychologie_RiskManagement_et_Journal',
    title: '7. Psychologie, Risk Management & Journal',
    description: 'Discipline opératoire, dimensionnement des lots, ratios R:R et hygiène mentale du trader.',
    color: 'rose',
    badge: 'Psychologie & Risque',
  },
};

/**
 * Classifies any HugoFX video into the exact hierarchical folder path for Google Drive.
 */
export function classifyVideoTaxonomy(video: {
  titre: string;
  famille?: string;
  playlists?: string[];
  description?: string;
  video_id?: string;
}): IctClassificationResult {
  const t = video.titre || '';
  const desc = video.description || '';
  const fullText = `${t} ${desc}`;

  // 1. SPECIFICITY: Balanced Price Range (BPR)
  if (/\b(bpr|balanced\s*price\s*range)\b/i.test(t)) {
    return {
      pillarId: '03_PD_ARRAYS',
      pillarFolder: ICT_PILLARS['03_PD_ARRAYS'].folderName,
      pillarTitle: ICT_PILLARS['03_PD_ARRAYS'].title,
      conceptCode: 'BPR',
      conceptFolder: 'BPR_Balanced_Price_Range',
      conceptName: 'Balanced Price Range (BPR)',
      setupStrategy: 'Double Déséquilibre Opposé & Rééquilibrage Interbancaire',
      pathSegments: [ICT_PILLARS['03_PD_ARRAYS'].folderName, 'BPR_Balanced_Price_Range'],
      fullDrivePath: `${ICT_PILLARS['03_PD_ARRAYS'].folderName}/BPR_Balanced_Price_Range`,
      tags: ['PD_ARRAY', 'BPR', 'IMBALANCE', 'OVERLAPPING_GAPS'],
    };
  }

  // 2. SPECIFICITY: Inversion Fair Value Gap (IFVG)
  if (/\b(ifvg|inversion\s*fvg|inversion\s*fair\s*value\s*gap)\b/i.test(t)) {
    return {
      pillarId: '03_PD_ARRAYS',
      pillarFolder: ICT_PILLARS['03_PD_ARRAYS'].folderName,
      pillarTitle: ICT_PILLARS['03_PD_ARRAYS'].title,
      conceptCode: 'IFVG',
      conceptFolder: 'IFVG_Inversion_Fair_Value_Gaps',
      conceptName: 'Inversion Fair Value Gap (IFVG)',
      setupStrategy: 'Traversée Violente & Rôle Inversé Support/Résistance',
      pathSegments: [ICT_PILLARS['03_PD_ARRAYS'].folderName, 'IFVG_Inversion_Fair_Value_Gaps'],
      fullDrivePath: `${ICT_PILLARS['03_PD_ARRAYS'].folderName}/IFVG_Inversion_Fair_Value_Gaps`,
      tags: ['PD_ARRAY', 'IFVG', 'INVERSION', 'REVERSAL'],
    };
  }

  // 3. SPECIFICITY: Fair Value Gap (FVG)
  if (/\b(fvg|fair\s*value\s*gap|imbalance|déséquilibre|desequilibre)\b/i.test(t)) {
    return {
      pillarId: '03_PD_ARRAYS',
      pillarFolder: ICT_PILLARS['03_PD_ARRAYS'].folderName,
      pillarTitle: ICT_PILLARS['03_PD_ARRAYS'].title,
      conceptCode: 'FVG',
      conceptFolder: 'FVG_Fair_Value_Gaps',
      conceptName: 'Fair Value Gap (FVG / SIBI / BISI)',
      setupStrategy: 'Attraction Algorithmique & Remplissage du Déséquilibre',
      pathSegments: [ICT_PILLARS['03_PD_ARRAYS'].folderName, 'FVG_Fair_Value_Gaps'],
      fullDrivePath: `${ICT_PILLARS['03_PD_ARRAYS'].folderName}/FVG_Fair_Value_Gaps`,
      tags: ['PD_ARRAY', 'FVG', 'SIBI', 'BISI', 'CONSEQUENT_ENCROACHMENT'],
    };
  }

  // 4. SPECIFICITY: Breaker Block (BB)
  if (/\b(breaker|breaker\s*block|bb)\b/i.test(t)) {
    return {
      pillarId: '03_PD_ARRAYS',
      pillarFolder: ICT_PILLARS['03_PD_ARRAYS'].folderName,
      pillarTitle: ICT_PILLARS['03_PD_ARRAYS'].title,
      conceptCode: 'BREAKER',
      conceptFolder: 'BB_Breaker_Blocks',
      conceptName: 'Breaker Block Institutionnel (BB)',
      setupStrategy: 'Order Block Échoué après Prise de Liquidité (Stop-Run)',
      pathSegments: [ICT_PILLARS['03_PD_ARRAYS'].folderName, 'BB_Breaker_Blocks'],
      fullDrivePath: `${ICT_PILLARS['03_PD_ARRAYS'].folderName}/BB_Breaker_Blocks`,
      tags: ['PD_ARRAY', 'BREAKER', 'STOP_RUN', 'HIGH_PROBABILITY'],
    };
  }

  // 5. SPECIFICITY: Order Block (OB) with strict word boundaries
  if (/\b(obs?|order\s*blocks?|blocs?\s*d'ordres?)\b/i.test(t)) {
    return {
      pillarId: '03_PD_ARRAYS',
      pillarFolder: ICT_PILLARS['03_PD_ARRAYS'].folderName,
      pillarTitle: ICT_PILLARS['03_PD_ARRAYS'].title,
      conceptCode: 'OB',
      conceptFolder: 'OB_Order_Blocks',
      conceptName: 'Order Block Institutionnel (OB)',
      setupStrategy: 'Dernière Bougie Contraire avant Impulsion Institutionnelle',
      pathSegments: [ICT_PILLARS['03_PD_ARRAYS'].folderName, 'OB_Order_Blocks'],
      fullDrivePath: `${ICT_PILLARS['03_PD_ARRAYS'].folderName}/OB_Order_Blocks`,
      tags: ['PD_ARRAY', 'ORDER_BLOCK', 'INSTITUTIONAL_FOOTPRINT'],
    };
  }

  // 6. SPECIFICITY: Liquidity Sweep / Turtle Soup / BSL / SSL
  if (/\b(sweep|turtle\s*soup|liquidite|liquidity|purge|chasse\s*aux\s*stops|bsl|ssl)\b/i.test(t)) {
    return {
      pillarId: '02_LIQUIDITE',
      pillarFolder: ICT_PILLARS['02_LIQUIDITE'].folderName,
      pillarTitle: ICT_PILLARS['02_LIQUIDITE'].title,
      conceptCode: 'LIQUIDITY_SWEEP',
      conceptFolder: 'Sweeps_Pools_et_Turtle_Soup',
      conceptName: 'Prise de Liquidité & Turtle Soup',
      setupStrategy: 'Manipulation au-delà des Highs/Lows et Réintégration Rapide',
      pathSegments: [ICT_PILLARS['02_LIQUIDITE'].folderName, 'Sweeps_Pools_et_Turtle_Soup'],
      fullDrivePath: `${ICT_PILLARS['02_LIQUIDITE'].folderName}/Sweeps_Pools_et_Turtle_Soup`,
      tags: ['LIQUIDITY', 'SWEEP', 'TURTLE_SOUP', 'BSL', 'SSL'],
    };
  }

  // 7. SPECIFICITY: Market Structure Shift (MSS) / BOS / CHoCH
  if (/\b(mss|bos|choch|market\s*structure|cassure\s*de\s*structure|changement\s*de\s*caractere)\b/i.test(t)) {
    return {
      pillarId: '01_STRUCTURE',
      pillarFolder: ICT_PILLARS['01_STRUCTURE'].folderName,
      pillarTitle: ICT_PILLARS['01_STRUCTURE'].title,
      conceptCode: 'MSS',
      conceptFolder: 'MSS_et_Break_of_Structure',
      conceptName: 'Market Structure Shift (MSS & BOS)',
      setupStrategy: 'Clôture de Corps au-delà du Swing Clé avec Déplacement',
      pathSegments: [ICT_PILLARS['01_STRUCTURE'].folderName, 'MSS_et_Break_of_Structure'],
      fullDrivePath: `${ICT_PILLARS['01_STRUCTURE'].folderName}/MSS_et_Break_of_Structure`,
      tags: ['STRUCTURE', 'MSS', 'BOS', 'CHOCH', 'DISPLACEMENT'],
    };
  }

  // 8. SPECIFICITY: Silver Bullet & Killzones / Horaires
  if (/\b(silver\s*bullet|killzone|killzones|session|sessions|london|new\s*york|horaire|horaires|horloge)\b/i.test(t)) {
    return {
      pillarId: '04_TEMPS',
      pillarFolder: ICT_PILLARS['04_TEMPS'].folderName,
      pillarTitle: ICT_PILLARS['04_TEMPS'].title,
      conceptCode: 'SILVER_BULLET',
      conceptFolder: 'Silver_Bullet_et_Killzones',
      conceptName: 'Modèle Temporel & Killzones ICT',
      setupStrategy: 'Fenêtres Algorithmiques IPDA & Fenêtre Silver Bullet (1h)',
      pathSegments: [ICT_PILLARS['04_TEMPS'].folderName, 'Silver_Bullet_et_Killzones'],
      fullDrivePath: `${ICT_PILLARS['04_TEMPS'].folderName}/Silver_Bullet_et_Killzones`,
      tags: ['TIME', 'KILLZONE', 'SILVER_BULLET', 'MACRO', 'IPDA'],
    };
  }

  // 9. SPECIFICITY: Optimal Trade Entry (OTE 62%-79%) / Fibonacci
  if (/\b(ote|optimal\s*trade\s*entry|fibonacci|retracement|fibo)\b/i.test(t)) {
    return {
      pillarId: '05_SETUPS',
      pillarFolder: ICT_PILLARS['05_SETUPS'].folderName,
      pillarTitle: ICT_PILLARS['05_SETUPS'].title,
      conceptCode: 'OTE',
      conceptFolder: 'OTE_Optimal_Trade_Entry',
      conceptName: 'Optimal Trade Entry (OTE 62%-79%)',
      setupStrategy: 'Retracement Profond en Zone d\'Escompte / Prime après MSS',
      pathSegments: [ICT_PILLARS['05_SETUPS'].folderName, 'OTE_Optimal_Trade_Entry'],
      fullDrivePath: `${ICT_PILLARS['05_SETUPS'].folderName}/OTE_Optimal_Trade_Entry`,
      tags: ['SETUP', 'OTE', 'FIBONACCI', 'DISCOUNT_PREMIUM'],
    };
  }

  // 10. SPECIFICITY: Daily Bias / Top Down / Multi-Timeframe
  if (/\b(biais|bias|daily\s*bias|top\s*down|multi\s*timeframe|mtf|unites\s*de\s*temps)\b/i.test(t)) {
    return {
      pillarId: '06_TOPDOWN',
      pillarFolder: ICT_PILLARS['06_TOPDOWN'].folderName,
      pillarTitle: ICT_PILLARS['06_TOPDOWN'].title,
      conceptCode: 'DAILY_BIAS',
      conceptFolder: 'Daily_Bias_et_Top_Down',
      conceptName: 'Daily Bias & Alignement Top-Down',
      setupStrategy: 'Anticipation de la Bougie Journalière & Clôture HTF',
      pathSegments: [ICT_PILLARS['06_TOPDOWN'].folderName, 'Daily_Bias_et_Top_Down'],
      fullDrivePath: `${ICT_PILLARS['06_TOPDOWN'].folderName}/Daily_Bias_et_Top_Down`,
      tags: ['TOP_DOWN', 'DAILY_BIAS', 'HTF_LTF', 'NARRATIVE'],
    };
  }

  // 11. SPECIFICITY: Setups généraux, Modèle 2022, AMD, Stratégies
  if (/\b(setup|setups|strategie|stratégie|model\s*2022|modele|amd|power\s*of\s*3|po3)\b/i.test(t)) {
    return {
      pillarId: '05_SETUPS',
      pillarFolder: ICT_PILLARS['05_SETUPS'].folderName,
      pillarTitle: ICT_PILLARS['05_SETUPS'].title,
      conceptCode: 'SETUP_EXECUTION',
      conceptFolder: 'Modeles_Execution_et_Strategies',
      conceptName: 'Modèles d\'Exécution & Stratégies ICT',
      setupStrategy: 'Combinaison Sweep + MSS + PD Array pour Entrée Chirurgicale',
      pathSegments: [ICT_PILLARS['05_SETUPS'].folderName, 'Modeles_Execution_et_Strategies'],
      fullDrivePath: `${ICT_PILLARS['05_SETUPS'].folderName}/Modeles_Execution_et_Strategies`,
      tags: ['SETUP', 'EXECUTION', 'MODEL_2022', 'AMD', 'STRATEGY'],
    };
  }

  // 12. SPECIFICITY: Psychologie, Discipline, Risk Management, Calcul de Lot
  if (/\b(psychologie|psycho|discipline|emotion|emotions|risque|risk|gestion|perte|perdre|gagner|vivre\s*du\s*trading|rentable)\b/i.test(t)) {
    return {
      pillarId: '07_PSYCHO_RISK',
      pillarFolder: ICT_PILLARS['07_PSYCHO_RISK'].folderName,
      pillarTitle: ICT_PILLARS['07_PSYCHO_RISK'].title,
      conceptCode: 'RISK_PSYCHO',
      conceptFolder: 'Psychologie_et_Risk_Management',
      conceptName: 'Psychologie & Gestion du Risque',
      setupStrategy: 'Règles de Préservation du Capital & Gestion Émotionnelle',
      pathSegments: [ICT_PILLARS['07_PSYCHO_RISK'].folderName, 'Psychologie_et_Risk_Management'],
      fullDrivePath: `${ICT_PILLARS['07_PSYCHO_RISK'].folderName}/Psychologie_et_Risk_Management`,
      tags: ['PSYCHOLOGY', 'RISK_MANAGEMENT', 'CAPITAL_PRESERVATION', 'DISCIPLINE'],
    };
  }

  // Default clean Foundation category
  return {
    pillarId: '01_STRUCTURE',
    pillarFolder: ICT_PILLARS['01_STRUCTURE'].folderName,
    pillarTitle: ICT_PILLARS['01_STRUCTURE'].title,
    conceptCode: 'FONDATION_ICT',
    conceptFolder: 'Fondations_et_Concepts_Generaux',
    conceptName: 'Fondations Algorithmiques & Mécanique ICT',
    setupStrategy: 'Compréhension du Flux d\'Ordres et Logique Institutionnelle',
    pathSegments: [ICT_PILLARS['01_STRUCTURE'].folderName, 'Fondations_et_Concepts_Generaux'],
    fullDrivePath: `${ICT_PILLARS['01_STRUCTURE'].folderName}/Fondations_et_Concepts_Generaux`,
    tags: ['FOUNDATION', 'ICT_CORE', 'SMART_MONEY'],
  };
}

/**
 * Convenience wrapper for classifying by title and optional markdown/description content.
 */
export function classifyVideoIntoTaxonomy(
  titre: string,
  description?: string
): IctClassificationResult & { folderName: string } {
  const result = classifyVideoTaxonomy({ titre, description });
  return {
    ...result,
    folderName: result.pillarFolder,
  };
}

/**
 * Generates a clean, standardized filename for Google Drive export.
 */
export function generateFicheDriveFileName(videoId: string, rawTitle: string): string {
  const cleanTitle = (rawTitle || 'Fiche_Technique')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100)
    .trim();
  return `HugoFX_Fiche_${videoId}_${cleanTitle}.md`;
}

