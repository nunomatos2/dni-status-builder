import { createClient } from '@supabase/supabase-js';
import type { Session, Contributor, Feedback } from '../types/dni';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Verifique o ficheiro .env.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('dni_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSession(name: string, date: string): Promise<Session> {
  const { data, error } = await supabase
    .from('dni_sessions')
    .insert({ name, date })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('dni_sessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getContributors(sessionId: string): Promise<Contributor[]> {
  const { data, error } = await supabase
    .from('dni_contributors')
    .select('*')
    .eq('session_id', sessionId)
    .order('pillar');
  if (error) throw error;
  return data ?? [];
}

export async function upsertContributor(contributor: Partial<Contributor> & { session_id: string; name: string; pillar: string }): Promise<Contributor> {
  const payload = {
    ...contributor,
    updated_at: new Date().toISOString(),
  };
  const query = contributor.id
    ? supabase.from('dni_contributors').update(payload).eq('id', contributor.id)
    : supabase.from('dni_contributors').insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteContributor(id: string): Promise<void> {
  const { error } = await supabase
    .from('dni_contributors')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getPreviousContribution(name: string, pillar: string, currentSessionId: string): Promise<Contributor | null> {
  const { data, error } = await supabase
    .from('dni_contributors')
    .select('*, dni_sessions!inner(created_at)')
    .eq('name', name)
    .eq('pillar', pillar)
    .neq('session_id', currentSessionId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSessionSummary(id: string, summary: string): Promise<Session> {
  const { data, error } = await supabase
    .from('dni_sessions')
    .update({ summary })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitFeedback(feedback: Omit<Feedback, 'id' | 'created_at'>): Promise<Feedback> {
  const { data, error } = await supabase
    .from('dni_feedback')
    .insert(feedback)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFeedback(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('dni_feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
