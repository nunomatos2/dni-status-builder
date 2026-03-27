import { supabase } from './supabase';
import { PILLARS } from '../types/dni';
import type { Session, Contributor } from '../types/dni';

export async function generateSummary(session: Session, contributors: Contributor[]): Promise<string> {
  const dateFormatted = new Date(session.date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  let notesBlock = '';
  for (const pillar of PILLARS) {
    const pillarContribs = contributors.filter(c => c.pillar === pillar.id);
    if (pillarContribs.length === 0) continue;

    notesBlock += `\n=== ${pillar.emoji} ${pillar.id} ===\n`;
    for (const c of pillarContribs) {
      notesBlock += `\n[${c.name}]\n`;
      if (c.content) notesBlock += `Progresso:\n${c.content}\n`;
      if (c.concerns) notesBlock += `Preocupações:\n${c.concerns}\n`;
      if (c.approvals) notesBlock += `Pedidos de aprovação:\n${c.approvals}\n`;
    }
  }

  const prompt = `És um especialista em comunicação executiva corporativa portuguesa. Tens à tua frente as notas de ponto de situação quinzenal da Direção de Novos Canais e Inovação (DNI) dos CTT — Correios de Portugal, preenchidas pelos líderes de cada pilar (os "2Ls").

O teu objetivo é gerar um ponto de situação executivo, em português de Portugal, com tom formal mas direto, destinado ao João Bento, CEO dos CTT.

Regras:
- Estrutura com secções claras por pilar (usa os emojis e IDs originais como cabeçalhos, ex: 🔬 INOVAR)
- Dentro de cada secção, sintetiza o progresso de forma coesa — não copies frases dos contribuintes, reescreve com voz executiva
- Quando há preocupações, destaca-as com "⚠️ Preocupações" em subsecção própria
- Quando há pedidos de aprovação, destaca-os com "✓ Pedidos de Aprovação" em subsecção própria
- Omite secções/pilares sem informação
- Começa com "João," e termina com "Um abraço,\\nNuno"
- Não uses markdown com asteriscos — usa apenas texto limpo com secções separadas por linha vazia
- Dados e métricas concretos devem ser preservados fielmente
- Tom: executivo, conciso, orientado para resultados e decisões

SESSÃO: ${session.name} — ${dateFormatted}
${notesBlock}`;

  const { data, error } = await supabase.functions.invoke('ai-summary', {
    body: { prompt },
  });

  if (error) throw new Error(error.message || 'Erro ao chamar a Edge Function');
  if (data?.error) throw new Error(data.error);
  if (!data?.text) throw new Error('Resposta vazia da IA');

  return data.text;
}
