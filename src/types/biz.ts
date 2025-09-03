export type ID = string;

export type PaymentMethod = 'cash' | 'bank' | 'card' | 'other';
export type OfferStatus = 'sent' | 'accepted' | 'rejected' | 'invoiced' | 'paid' | 'expired';

export interface Client {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  /** ISO datetime string */
  createdAt?: string;
}

export interface Offer {
  id: ID;
  clientId: ID;
  title: string;
  description?: string;
  amount: number;
  currency: string;      // e.g., 'EUR'
  status: OfferStatus;
  dateOffered: string;   // ISO
}

export interface Payment {
  id: ID;
  clientId: ID;
  offerId?: ID | null;
  amount: number;
  method?: PaymentMethod;
  paidAt: string;        // ISO
  notes?: string;
}

/** Color log entry (for PalettePad) */
export interface Entry {
  id: ID;
  when: string;          // ISO
  name: string;
  palette: string;
  code: string;
}

/* Optional helper types for inserts */
export type NewClient = Omit<Client, 'id' | 'createdAt'>;
export type NewOffer = Omit<Offer, 'id'>;
export type NewPayment = Omit<Payment, 'id'>;
