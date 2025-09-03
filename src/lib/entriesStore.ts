import { supabase } from './supabase';
import type { Entry, ID } from '../types/biz';

export function nowStamp(): string {
  return new Date().toISOString();
}

export function toCsv(rows: Entry[]): Blob {
  const header = ['when','name','palette','code'];
  const body = rows.map(r => [r.when, r.name, r.palette, r.code].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv = [header.join(','), ...body].join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

function uid(prefix='en'): ID {
  return `${prefix}_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`;
}

export async function listEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('when', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(e => ({
    id: e.id, when: e.when, name: e.name, palette: e.palette, code: e.code
  }));
}

export async function addEntry(row: Omit<Entry,'id'>): Promise<Entry> {
  const rec = { id: uid(), ...row };
  const { error } = await supabase.from('entries').insert(rec);
  if (error) throw error;
  return { ...rec };
}

export async function deleteEntry(id: ID): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

export async function clearEntries(): Promise<void> {
  const { error } = await supabase.from('entries').delete().neq('id',''); // delete all
  if (error) throw error;
}
