import { useState, useEffect } from 'react';
import { getFeedback } from '../lib/supabase';
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

  const analyzeFeedback = async () => {
    if (feedback.length === 0) return;
    setAnalyzing(true);
    try {
      const feedbackList = feedback.map((f, i) =>
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
        items: cluster.indices.map(i => feedback[i - 1]).filter(Boolean),
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
          {/* AI Analysis */}
          <div className="mb-12">
            <button
              onClick={analyzeFeedback}
              disabled={analyzing}
              className="bg-linear-to-r from-primary-container to-primary text-on-primary px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {analyzing ? 'hourglass_top' : 'auto_awesome'}
              </span>
              {analyzing ? 'A analisar...' : analyzed ? 'Reanalisar com IA' : 'Analisar com IA'}
            </button>
          </div>

          {/* Clusters */}
          {clusters.length > 0 && (
            <div className="mb-14">
              <h2 className="text-xl font-extrabold tracking-tight mb-6">Clusters de Feedback</h2>
              <div className="space-y-6">
                {clusters.map((cluster, i) => (
                  <div
                    key={i}
                    className="bg-surface-lowest p-6"
                    style={{ borderLeft: '4px solid #b5000b' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-bold text-on-primary bg-primary-container px-2 py-0.5 rounded-sm">
                            #{i + 1}
                          </span>
                          <h3 className="text-lg font-bold tracking-tight">{cluster.theme}</h3>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-secondary shrink-0">
                        {cluster.count} menç{cluster.count !== 1 ? 'ões' : 'ão'}
                      </span>
                    </div>

                    <div className="bg-surface-low px-4 py-3 mb-4 rounded-sm">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary block mb-1">User Story</span>
                      <p className="text-sm text-on-surface italic">{cluster.userStory}</p>
                    </div>

                    <div className="space-y-2">
                      {cluster.items.map(item => (
                        <div key={item.id} className="flex items-start gap-3 text-sm">
                          <span className="material-symbols-outlined text-xs text-zinc-400 mt-1 shrink-0">chat_bubble_outline</span>
                          <div>
                            <span className="text-on-surface">{item.message}</span>
                            <span className="text-[10px] text-zinc-400 ml-2">
                              {item.context_view}{item.context_contributor ? ` / ${item.context_contributor}` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw feedback list */}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight mb-6">
              Todo o Feedback
              <span className="text-secondary font-normal text-base ml-2">({feedback.length})</span>
            </h2>
            <div className="space-y-3">
              {feedback.map(f => (
                <div
                  key={f.id}
                  className="bg-surface-lowest p-5"
                  style={{ borderLeft: '3px solid #d4d4d8' }}
                >
                  <p className="text-sm text-on-surface mb-2">{f.message}</p>
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
                    <span className="text-[9px] text-zinc-400 tracking-widest ml-auto">
                      {formatDate(f.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
