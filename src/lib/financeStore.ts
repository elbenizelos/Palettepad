import { supabase } from './supabase';
import type { Client, Offer, Payment, ID } from '../types/biz';

function uid(prefix = 'id'): ID {
  return `${prefix}_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`;
}

// ── Clients ─────────────────────────────────────────────────────
export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data?.map(c => ({ ...c, createdAt: c.created_at })) ?? [];
}

export async function getClient(id: ID): Promise<Client | undefined> {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, createdAt: data.created_at } : undefined;
}

export async function addClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const row = { id: uid('cl'), ...data };
  const { error } = await supabase.from('clients').insert(row);
  if (error) throw error;
  return { ...row, createdAt: new Date().toISOString() };
}

export async function deleteClient(id: ID): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error; // cascades offers & payments
}

// ── Offers ──────────────────────────────────────────────────────
export async function listOffers(clientId?: ID): Promise<Offer[]> {
  let q = supabase.from('offers').select('*').order('date_offered', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(o => ({
    id: o.id, clientId: o.client_id, title: o.title, description: o.description ?? undefined,
    amount: o.amount, currency: o.currency, status: o.status, dateOffered: o.date_offered
  }));
}

export async function addOffer(data: Omit<Offer, 'id'>): Promise<Offer> {
  const row = {
    id: uid('of'),
    client_id: data.clientId,
    title: data.title,
    description: data.description ?? null,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    date_offered: data.dateOffered
  };
  const { error } = await supabase.from('offers').insert(row);
  if (error) throw error;
  return { ...data, id: row.id };
}

export async function deleteOffer(id: ID): Promise<void> {
  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) throw error; // cascades payments by FK
}

// ── Payments (history) ──────────────────────────────────────────
export async function listPayments(clientId?: ID): Promise<Payment[]> {
  let q = supabase.from('payments').select('*').order('paid_at', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(p => ({
    id: p.id, clientId: p.client_id, offerId: p.offer_id,
    amount: p.amount, method: p.method ?? undefined, paidAt: p.paid_at, notes: p.notes ?? undefined
  }));
}

export async function addPayment(data: Omit<Payment, 'id'>): Promise<Payment> {
  const row = {
    id: uid('pay'),
    client_id: data.clientId,
    offer_id: data.offerId ?? null,
    amount: data.amount,
    method: data.method ?? null,
    paid_at: data.paidAt,
    notes: data.notes ?? null
  };
  const { error } = await supabase.from('payments').insert(row);
  if (error) throw error;
  return { ...data, id: row.id };
}

export async function deletePayment(id: ID): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

// ── Aggregates ──────────────────────────────────────────────────
export async function clientTotals(clientId: ID) {
  const [offers, payments] = await Promise.all([listOffers(clientId), listPayments(clientId)]);
  const offered = offers.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const outstanding = offered - paid;
  const currency = offers[0]?.currency ?? 'EUR';
  return { offered, paid, outstanding, currency };
}
