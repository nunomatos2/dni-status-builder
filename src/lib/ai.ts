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
      if (c.concerns) notesBlock += `Preocupa\u00e7\u00f5es:\n${c.concerns}\n`;
      if (c.approvals) notesBlock += `Pedidos de aprova\u00e7\u00e3o:\n${c.approvals}\n`;
    }
  }

  const prompt = `\u00c9s um especialista em comunica\u00e7\u00e3o executiva corporativa portuguesa. Tens \u00e0 tua frente as notas de ponto de situa\u00e7\u00e3o quinzenal da Dire\u00e7\u00e3o de Novos Canais e Inova\u00e7\u00e3o (DNI) dos CTT \u2014 Correios de Portugal, preenchidas pelos l\u00edderes de cada pilar (os "2Ls").

O teu objetivo \u00e9 gerar um ponto de situa\u00e7\u00e3o executivo, em portugu\u00eas de Portugal, com tom formal mas direto, destinado ao Jo\u00e3o Bento, CEO dos CTT.

Regras:
- Estrutura com sec\u00e7\u00f5es claras por pilar (usa os emojis e IDs originais como cabe\u00e7alhos, ex: \u{1F52C} INOVAR)
- Dentro de cada sec\u00e7\u00e3o, sintetiza o progresso de forma coesa \u2014 n\u00e3o copies frases dos contribuintes, reescreve com voz executiva
- Quando h\u00e1 preocupa\u00e7\u00f5es, destaca-as com "\u26a0\ufe0f Preocupa\u00e7\u00f5es" em subsec\u00e7\u00e3o pr\u00f3pria
- Quando h\u00e1 pedidos de aprova\u00e7\u00e3o, destaca-os com "\u2713 Pedidos de Aprova\u00e7\u00e3o" em subsec\u00e7\u00e3o pr\u00f3pria
- Omite sec\u00e7\u00f5es/pilares sem informa\u00e7\u00e3o
- Come\u00e7a com "Jo\u00e3o," e termina com "Um abra\u00e7o,\\nNuno"
- N\u00e3o uses markdown com asteriscos \u2014 usa apenas texto limpo com sec\u00e7\u00f5es separadas por linha vazia
- Dados e m\u00e9tricas concretos devem ser preservados fielmente
- Tom: executivo, conciso, orientado para resultados e decis\u00f5es

SESS\u00c3O: ${session.name} \u2014 ${dateFormatted}
${notesBlock}`;

  const { data, error } = await supabase.functions.invoke('ai-summary', {
    body: { prompt },
  });

  if (error) throw new Error(error.message || 'Erro ao chamar a Edge Function');
  if (data?.error) throw new Error(data.error);
  if (!data?.text) throw new Error('Resposta vazia da IA');

  return data.text;
}
