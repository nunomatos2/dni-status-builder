import { createClient } from '@supabase/supabase-js';
import type { Session, Contributor } from '../types/dni';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  const { data, error } = await supabase
    .from('dni_contributors')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
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
