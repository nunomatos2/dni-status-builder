import { useState, useEffect } from 'react';
import { getFeedback, updateFeedbackStatus } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import type { Feedback } from '../types/dni';

interface FeedbackCluster {
  theme: string;
  count: number;
  items: Feedback[];
  userStory: string;
}

export default function FeedbackView() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [clusters, setClusters] = useState<FeedbackCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [showImplemented, setShowImplemented] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await getFeedback();
      setFeedback(data);
    } catch (err) {
      console.error('Erro ao carregar feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const openFeedback = feedback.filter(f => f.status === 'open');
  const implementedFeedback = feedback.filter(f => f.status === 'implemented');
  const activeFeedback = showImplemented ? feedback : openFeedback;

  const markAsImplemented = async (ids: string[]) => {
    try {
      await updateFeedbackStatus(ids, 'implemented');
      setFeedback(prev => prev.map(f => ids.includes(f.id) ? { ...f, status: 'implemented' } : f));
      setClusters(prev => prev.map(cluster => ({
        ...cluster,
        items: cluster.items.map(f => ids.includes(f.id) ? { ...f, status: 'implemented' as const } : f),
      })));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const markAsOpen = async (ids: string[]) => {
    try {
      await updateFeedbackStatus(ids, 'open');
      setFeedback(prev => prev.map(f => ids.includes(f.id) ? { ...f, status: 'open' } : f));
      setClusters(prev => prev.map(cluster => ({
        ...cluster,
        items: cluster.items.map(f => ids.includes(f.id) ? { ...f, status: 'open' as const } : f),
      })));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const markClusterImplemented = (cluster: FeedbackCluster) => {
    const openIds = cluster.items.filter(f => f.status === 'open').map(f => f.id);
    if (openIds.length > 0) markAsImplemented(openIds);
  };

  const isClusterImplemented = (cluster: FeedbackCluster) =>
    cluster.items.every(f => f.status === 'implemented');

  const analyzeFeedback = async () => {
    if (openFeedback.length === 0) return;
    setAnalyzing(true);
    try {
      const feedbackList = openFeedback.map((f, i) =>
        `[${i + 1}] (vista: ${f.context_view}${f.context_session_name ? `, sessão: ${f.context_session_name}` : ''}${f.context_pillar ? `, pilar: ${f.context_pillar}` : ''}${f.context_contributor ? `, contribuinte: ${f.context_contributor}` : ''}) "${f.message}"`
      ).join('\n');

      const prompt = `Tens à tua frente uma lista de feedback de utilizadores de uma aplicação interna de gestão de pontos de situação quinzenais (DNI Status Builder).

Analisa todo o feedback e:
1. Agrupa em clusters temáticos (máximo 8 clusters)
2. Ordena por prioridade (mais menções = maior prioridade)
3. Para cada cluster, escreve uma user story concisa em formato "Como [persona], quero [funcionalidade], para que [benefício]"

Responde APENAS com JSON válido, sem markdown, neste formato exacto:
[{"theme":"nome do cluster","indices":[1,2,3],"userStory":"Como... quero... para que..."}]

Os índices referem-se aos números entre parêntesis retos no início de cada feedback.

FEEDBACK:
${feedbackList}`;

      const { data, error } = await supabase.functions.invoke('ai-summary', {
        body: { prompt },
      });

      if (error) throw error;
      if (!data?.text) throw new Error('Resposta vazia da IA');

      const parsed: { theme: string; indices: number[]; userStory: string }[] = JSON.parse(data.text);
      const result: FeedbackCluster[] = parsed.map(cluster => ({
        theme: cluster.theme,
        count: cluster.indices.length,
        items: cluster.indices.map(i => openFeedback[i - 1]).filter(Boolean),
        userStory: cluster.userStory,
      }));

      result.sort((a, b) => b.count - a.count);
      setClusters(result);
      setAnalyzed(true);
    } catch (err) {
      console.error('Erro ao analisar feedback:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="dot-pulse flex gap-2">
          <span className="w-3 h-3 rounded-full bg-primary-container" />
          <span className="w-3 h-3 rounded-full bg-primary-container" />
          <span className="w-3 h-3 rounded-full bg-primary-container" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 text-[11px] font-bold uppercase tracking-widest text-secondary/60">
        <span>DNI Status</span>
        <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
        <span className="text-on-surface">Feedback</span>
      </div>

      {/* Header */}
      <header className="max-w-4xl mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Feedback dos Utilizadores</h1>
        <p className="text-secondary text-sm leading-relaxed max-w-xl">
          Feedback contextualizado recolhido em toda a aplicação. Use a análise IA para identificar padrões e priorizar novas funcionalidades.
        </p>
        {feedback.length > 0 && (
          <div className="flex items-center gap-4 mt-4 text-[11px] font-bold uppercase tracking-widest">
            <span className="text-emerald">{openFeedback.length} em aberto</span>
            <span className="text-zinc-400">{implementedFeedback.length} implementado{implementedFeedback.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </header>

      {feedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-surface-low rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-3xl text-secondary">inbox</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Sem feedback ainda</h2>
          <p className="text-secondary text-sm max-w-sm">
            Os utilizadores podem enviar feedback através do botão no canto inferior direito de qualquer ecrã.
          </p>
        </div>
      ) : (
        <>
          {/* Actions bar */}
          <div className="mb-12 flex items-center gap-4 flex-wrap">
            <button
              onClick={analyzeFeedback}
              disabled={analyzing || openFeedback.length === 0}
              className="bg-linear-to-r from-primary-container to-primary text-on-primary px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {analyzing ? 'hourglass_top' : 'auto_awesome'}
              </span>
              {analyzing ? 'A analisar...' : analyzed ? 'Reanalisar com IA' : 'Analisar com IA'}
            </button>

            <button
              onClick={() => setShowImplemented(!showImplemented)}
              className={`px-4 py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 border transition-all ${
                showImplemented
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-zinc-200 text-secondary hover:text-on-surface hover:bg-surface-low'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {showImplemented ? 'visibility' : 'visibility_off'}
              </span>
              {showImplemented ? 'A mostrar implementados' : 'Mostrar implementados'}
            </button>
          </div>

          {/* Clusters */}
          {clusters.length > 0 && (
            <div className="mb-14">
              <h2 className="text-xl font-extrabold tracking-tight mb-6">Clusters de Feedback</h2>
              <div className="space-y-6">
                {clusters.map((cluster, i) => {
                  const clusterDone = isClusterImplemented(cluster);
                  return (
                    <div
                      key={i}
                      className={`bg-surface-lowest p-6 transition-opacity ${clusterDone ? 'opacity-50' : ''}`}
                      style={{ borderLeft: `4px solid ${clusterDone ? '#10b981' : '#b5000b'}` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[10px] font-bold text-on-primary px-2 py-0.5 rounded-sm ${clusterDone ? 'bg-emerald' : 'bg-primary-container'}`}>
                              {clusterDone ? '✓' : `#${i + 1}`}
                            </span>
                            <h3 className={`text-lg font-bold tracking-tight ${clusterDone ? 'line-through text-zinc-400' : ''}`}>{cluster.theme}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-secondary">
                            {cluster.count} menç{cluster.count !== 1 ? 'ões' : 'ão'}
                          </span>
                          {!clusterDone ? (
                            <button
                              onClick={() => markClusterImplemented(cluster)}
                              className="text-[10px] font-bold uppercase tracking-widest text-emerald hover:bg-emerald/10 px-2 py-1 rounded-sm flex items-center gap-1 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Implementado
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsOpen(cluster.items.map(f => f.id))}
                              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 px-2 py-1 rounded-sm flex items-center gap-1 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">undo</span>
                              Reabrir
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-surface-low px-4 py-3 mb-4 rounded-sm">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary block mb-1">User Story</span>
                        <p className="text-sm text-on-surface italic">{cluster.userStory}</p>
                      </div>

                      <div className="space-y-2">
                        {cluster.items.map(item => (
                          <div key={item.id} className="flex items-start gap-3 text-sm group">
                            <span className={`material-symbols-outlined text-xs mt-1 shrink-0 ${item.status === 'implemented' ? 'text-emerald' : 'text-zinc-400'}`}>
                              {item.status === 'implemented' ? 'check_circle' : 'chat_bubble_outline'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className={`${item.status === 'implemented' ? 'text-zinc-400 line-through' : 'text-on-surface'}`}>{item.message}</span>
                              <span className="text-[10px] text-zinc-400 ml-2">
                                {item.context_view}{item.context_contributor ? ` / ${item.context_contributor}` : ''}
                              </span>
                            </div>
                            {item.status === 'open' ? (
                              <button
                                onClick={() => markAsImplemented([item.id])}
                                className="opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase tracking-widest text-emerald hover:bg-emerald/10 px-1.5 py-0.5 rounded-sm transition-all shrink-0"
                              >
                                Feito
                              </button>
                            ) : (
                              <button
                                onClick={() => markAsOpen([item.id])}
                                className="opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 px-1.5 py-0.5 rounded-sm transition-all shrink-0"
                              >
                                Reabrir
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Raw feedback list */}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight mb-6">
              {showImplemented ? 'Todo o Feedback' : 'Feedback em Aberto'}
              <span className="text-secondary font-normal text-base ml-2">({activeFeedback.length})</span>
            </h2>
            {activeFeedback.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-3xl text-emerald mb-2 block">task_alt</span>
                <p className="text-sm text-secondary">Todo o feedback foi implementado!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeFeedback.map(f => (
                  <div
                    key={f.id}
                    className={`bg-surface-lowest p-5 group ${f.status === 'implemented' ? 'opacity-50' : ''}`}
                    style={{ borderLeft: `3px solid ${f.status === 'implemented' ? '#10b981' : '#d4d4d8'}` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-2 ${f.status === 'implemented' ? 'text-zinc-400 line-through' : 'text-on-surface'}`}>
                          {f.message}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-surface-low text-secondary rounded-sm">
                            {f.context_view}
                          </span>
                          {f.context_session_name && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-surface-low text-secondary rounded-sm">
                              {f.context_session_name}
                            </span>
                          )}
                          {f.context_pillar && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-surface-low text-secondary rounded-sm">
                              {f.context_pillar}
                            </span>
                          )}
                          {f.context_contributor && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-surface-low text-secondary rounded-sm">
                              {f.context_contributor}
                            </span>
                          )}
                          {f.status === 'implemented' && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-emerald/10 text-emerald rounded-sm">
                              Implementado
                            </span>
                          )}
                          <span className="text-[9px] text-zinc-400 tracking-widest ml-auto">
                            {formatDate(f.created_at)}
                          </span>
                        </div>
                      </div>
                      {f.status === 'open' ? (
                        <button
                          onClick={() => markAsImplemented([f.id])}
                          className="opacity-0 group-hover:opacity-100 text-[10px] font-bold uppercase tracking-widest text-emerald hover:bg-emerald/10 px-2 py-1 rounded-sm flex items-center gap-1 transition-all shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Implementado
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsOpen([f.id])}
                          className="opacity-0 group-hover:opacity-100 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 px-2 py-1 rounded-sm flex items-center gap-1 transition-all shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">undo</span>
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
