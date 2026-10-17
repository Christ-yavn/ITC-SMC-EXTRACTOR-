import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Code2, 
  Terminal, 
  Eye, 
  Quote, 
  Sparkles, 
  AlertTriangle, 
  Layers, 
  ShieldCheck,
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react';

interface SmartFicheRendererProps {
  content: string;
  className?: string;
}

/**
 * Transforms trading tags and identifiers into styled badges
 */
export const renderStyledText = (text: string): React.ReactNode => {
  // Regex to match trading tokens:
  // 1. [DIT_VU : ...]
  // 2. [DIT : ...] or [DIT «...»]
  // 3. [VU : ...]
  // 4. [DÉDUIT : ...] or [DEDUIT : ...]
  // 5. [ABSENT]
  // 6. R-xxx-xxx rule identifiers
  // 7. P-xxx-xx parameter identifiers
  // 8. D-xxx-xx design decision identifiers
  // 9. C3, C2, C1, C0 confidence markers
  // 10. `inline code`
  // 11. **bold**
  
  const tokenRegex = /(\[DIT_VU[^\]]*\]|\[DIT[^\]]*\]|\[VU[^\]]*\]|\[DÉDUIT[^\]]*\]|\[DEDUIT[^\]]*\]|\[ABSENT\]|\bR-(?:[A-Z0-9_]+-)?\d+\b|\bP-(?:[A-Z0-9_]+-)?\d+\b|\bD-(?:[A-Z0-9_]+-)?\d+\b|\bC[0-3]\b|`[^`]+`|\*\*[^*]+\*\*)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('[DIT_VU')) {
      return (
        <span 
          key={index}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs"
        >
          <Quote className="w-3 h-3 text-emerald-400 shrink-0" />
          <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>{part.slice(1, -1)}</span>
        </span>
      );
    }

    if (part.startsWith('[DIT')) {
      return (
        <span 
          key={index}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
        >
          <Quote className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{part.slice(1, -1)}</span>
        </span>
      );
    }

    if (part.startsWith('[VU')) {
      return (
        <span 
          key={index}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
        >
          <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>{part.slice(1, -1)}</span>
        </span>
      );
    }

    if (part.startsWith('[DÉDUIT') || part.startsWith('[DEDUIT')) {
      return (
        <span 
          key={index}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25"
        >
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
          <span>{part.slice(1, -1)}</span>
        </span>
      );
    }

    if (part === '[ABSENT]') {
      return (
        <span 
          key={index}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30"
        >
          <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
          <span>ABSENT</span>
        </span>
      );
    }

    if (/^R-(?:[A-Z0-9_]+-)?\d+$/.test(part)) {
      return (
        <span 
          key={index}
          className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
        >
          {part}
        </span>
      );
    }

    if (/^P-(?:[A-Z0-9_]+-)?\d+$/.test(part)) {
      return (
        <span 
          key={index}
          className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30"
        >
          {part}
        </span>
      );
    }

    if (/^D-(?:[A-Z0-9_]+-)?\d+$/.test(part)) {
      return (
        <span 
          key={index}
          className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
        >
          {part}
        </span>
      );
    }

    if (/^C[0-3]$/.test(part)) {
      const colors = {
        C3: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        C2: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        C1: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        C0: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      }[part] || 'bg-slate-500/20 text-slate-300';
      return (
        <span 
          key={index}
          className={`inline-block mx-0.5 px-1 py-0.2 rounded text-[10px] font-mono font-bold border ${colors}`}
        >
          {part}
        </span>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code 
          key={index}
          className="mx-0.5 px-1.5 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-white/[0.08] text-blue-800 dark:text-blue-200 border border-slate-200 dark:border-white/[0.08]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

export const SmartFicheRenderer: React.FC<SmartFicheRendererProps> = ({ content, className = '' }) => {
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  // Parse lines into logical blocks: headings, tables, code blocks, yaml frontmatter, and paragraphs
  const lines = content.split('\n');
  const blocks: Array<
    | { type: 'yaml'; raw: string }
    | { type: 'heading'; level: number; text: string }
    | { type: 'table'; headers: string[]; rows: string[][] }
    | { type: 'code'; language: string; code: string; id: string }
    | { type: 'callout'; tag: string; title: string; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list-item'; text: string }
    | { type: 'divider' }
  > = [];

  let inYaml = false;
  let yamlBuffer: string[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // YAML Frontmatter handling
    if (i === 0 && line.trim() === '---') {
      inYaml = true;
      continue;
    }
    if (inYaml) {
      if (line.trim() === '---') {
        inYaml = false;
        blocks.push({ type: 'yaml', raw: yamlBuffer.join('\n') });
        yamlBuffer = [];
      } else {
        yamlBuffer.push(line);
      }
      continue;
    }

    // Code block handling
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = line.replace('```', '').trim() || 'plaintext';
        codeBuffer = [];
      } else {
        inCode = false;
        const codeText = codeBuffer.join('\n');
        blocks.push({ 
          type: 'code', 
          language: codeLang, 
          code: codeText, 
          id: `code_${i}_${codeText.length}` 
        });
        codeBuffer = [];
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Table handling
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      // Check if it's separator line (e.g. |---|---|)
      const isSeparator = cells.every(c => /^:?-+:?$/.test(c));

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        tableRows = [];
      } else if (!isSeparator) {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      inTable = false;
      blocks.push({ type: 'table', headers: tableHeaders, rows: tableRows });
      tableHeaders = [];
      tableRows = [];
    }

    // Dividers
    if (line.trim() === '---' || line.trim() === '***') {
      blocks.push({ type: 'divider' });
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: line.replace('# ', '') });
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.replace('## ', '') });
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: line.replace('### ', '') });
      continue;
    }
    if (line.startsWith('#### ')) {
      blocks.push({ type: 'heading', level: 4, text: line.replace('#### ', '') });
      continue;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      blocks.push({ type: 'list-item', text: line.trim().substring(2) });
      continue;
    }

    // Regular text (skip pure empty lines)
    if (line.trim().length > 0) {
      blocks.push({ type: 'paragraph', text: line });
    }
  }

  // Flush trailing table
  if (inTable && tableHeaders.length > 0) {
    blocks.push({ type: 'table', headers: tableHeaders, rows: tableRows });
  }

  return (
    <div className={`space-y-4 font-sans text-slate-800 dark:text-slate-300 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'yaml':
            return (
              <div 
                key={idx}
                className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-mono text-xs text-blue-900 dark:text-blue-300 shadow-inner"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/5 mb-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    En-tête YAML & Métadonnées Cursus
                  </span>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                    SCRIBE-ICT v3
                  </span>
                </div>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-[11px] text-slate-700 dark:text-slate-300">
                  {block.raw}
                </pre>
              </div>
            );

          case 'heading': {
            if (block.level === 1) {
              return (
                <div key={idx} className="pt-4 pb-2 border-b border-slate-200 dark:border-white/10">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    {renderStyledText(block.text)}
                  </h1>
                </div>
              );
            }
            if (block.level === 2) {
              return (
                <div key={idx} className="pt-6 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-blue-600 shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {renderStyledText(block.text)}
                    </h2>
                  </div>
                </div>
              );
            }
            if (block.level === 3) {
              return (
                <div key={idx} className="pt-3 pb-1">
                  <h3 className="text-sm sm:text-base font-bold text-blue-800 dark:text-blue-200 tracking-wide flex items-center gap-2">
                    <span className="text-xs text-blue-600">§</span>
                    {renderStyledText(block.text)}
                  </h3>
                </div>
              );
            }
            return (
              <h4 key={idx} className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 pt-2">
                {renderStyledText(block.text)}
              </h4>
            );
          }

          case 'table':
            return (
              <div 
                key={idx}
                className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 shadow-xs my-3"
              >
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.04] border-b border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-semibold text-[11px] uppercase tracking-wider">
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-2.5 px-3 whitespace-nowrap font-mono">
                          {renderStyledText(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {block.rows.map((row, rIdx) => (
                      <tr 
                        key={rIdx}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 px-3 align-top leading-relaxed text-xs">
                            {renderStyledText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'code':
            return (
              <div 
                key={idx}
                className="rounded-xl border border-white/10 bg-[#090D16] overflow-hidden my-3 shadow-lg"
              >
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{block.language || 'code'}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(block.code, block.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {copiedBlockId === block.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-300/90 whitespace-pre leading-relaxed max-h-[460px] overflow-y-auto">
                  {block.code}
                </pre>
              </div>
            );

          case 'list-item':
            return (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-2" />
                <div className="flex-1 text-slate-700 dark:text-slate-300">
                  {renderStyledText(block.text)}
                </div>
              </div>
            );

          case 'divider':
            return <hr key={idx} className="border-t border-slate-200 dark:border-white/10 my-4" />;

          case 'paragraph':
          default:
            return (
              <p key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {renderStyledText(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};
