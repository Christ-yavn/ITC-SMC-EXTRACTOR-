import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, AlertTriangle, BookmarkCheck, Terminal } from 'lucide-react';
import { validateFicheContent } from '../utils/pipeline';

interface AddFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ficheContent: string, videoId: string) => void;
}

export const AddFicheModal: React.FC<AddFicheModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [content, setContent] = useState<string>('');
  const validation = useMemo(() => validateFicheContent(content), [content]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!validation.isValid) return;
    const match = content.match(/video_id:\s*"([^"]+)"/);
    const videoId = match ? match[1] : 'VIDEO_INCONNUE';
    onSave(content, videoId);
    setContent('');
    onClose();
  };

  const validationMessage = validation.isValid
    ? 'Fiche complète et valide (Standard SCRIBE-ICT v3)'
    : validation.missingSections.length > 0
    ? `Sections manquantes : ${validation.missingSections.join(', ')}`
    : 'Contenu vide ou incomplet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B0E17] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-10 overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/40">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Enregistrer une Fiche d'AI Studio
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Collez le résultat généré par Gemini pour vérifier les balises et l'archiver.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Validation Feedback Banner */}
          <div className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-mono ${
            validation.isValid 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
              : 'bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
          }`}>
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="font-semibold">{validationMessage}</span>
            </div>
            <span className="text-[10px] bg-white dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 font-bold">
              {validation.absentTagsCount} [ABSENT]
            </span>
          </div>

          {/* Text Area */}
          <div className="space-y-1.5 font-mono">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Contenu Markdown de la Fiche :
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Collez ici la réponse de Gemini (avec le frontmatter YAML, le registre de preuves, la spécification agentique <<<CONCEPT_SPEC_V3>>> et la leçon humaine)..."
              rows={12}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>{content.length.toLocaleString('fr-FR')} caractères détectés</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">Standard SCRIBE-ICT v3</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/95 dark:bg-black/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!validation.isValid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Enregistrer dans la Bibliothèque</span>
          </button>
        </div>

      </div>
    </div>
  );
};
