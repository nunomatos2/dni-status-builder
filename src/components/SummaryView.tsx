import { useState, useEffect } from 'react';
import { generateSummary } from '../lib/ai';
import type { Session, Contributor } from '../types/dni';

interface SummaryViewProps {
  session: Session;
  contributors: Contributor[];
}

export default function SummaryView({ session, contributors }: SummaryViewProps) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    setSummary('');
    try {
      const text = await generateSummary(session, contributors);
      setSummary(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar resumo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generate(); }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 text-[11px] font-bold uppercase tracking-widest text-secondary/60">
        <span>Sessões</span>
        <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
        <span>{session.name}</span>
        <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
        <span className="text-on-surface">Resumo</span>
      </div>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Visualização de Resumo</h1>
        <p className="text-secondary text-sm">{session.name} — {formatDate(session.date)}</p>
      </header>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-3 py-8">
          <div className="dot-pulse flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
          </div>
          <span className="text-sm text-secondary italic">A gerar síntese executiva...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-surface-lowest p-8 border-t-[3px] border-error">
          <p className="text-error text-sm font-medium mb-4">{error}</p>
          <button
            onClick={generate}
            className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline underline-offset-4"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Summary */}
      {summary && !loading && (
        <>
          <div className="bg-surface-lowest p-8 md:p-10 border-t-[3px] border-primary-container">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-surface">
              {summary}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-8 flex-wrap">
            <button
              onClick={handleCopy}
              className={`px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald text-white'
                  : 'bg-linear-to-r from-primary-container to-primary text-on-primary hover:opacity-90'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copiado!' : 'Copiar para Outlook'}
            </button>

            <button
              onClick={generate}
              className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-secondary hover:text-on-surface border border-zinc-200 rounded-sm flex items-center gap-2 transition-all hover:bg-surface-low"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Regenerar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
