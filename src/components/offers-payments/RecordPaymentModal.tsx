import { useState } from 'react';

import Modal from '../common/Modal';
import DateTimeField from '../common/DateTimeField';
import type { Offer } from '../../types/biz';

interface Props {
  open: boolean;
  onClose: () => void;
  offers: Offer[];
  onSave: (data: {
    amount: number;
    method?: 'cash' | 'bank' | 'card' | 'other';
    paidAt: string;
    notes?: string;
    offerId?: string | null;
  }) => void;
}

export default function RecordPaymentModal({ open, onClose, offers, onSave }: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'cash' | 'bank' | 'card' | 'other' | ''>('');
  const [paidAt, setPaidAt] = useState<string>(new Date().toISOString());
  const [offerId, setOfferId] = useState<string | ''>('');
  const [notes, setNotes] = useState('');

  const submit = () => {
    if (isNaN(Number(amount)) || Number(amount) <= 0) return;
    onSave({
      amount: Number(amount),
      method: method || undefined,
      paidAt,
      notes: notes.trim() || undefined,
      offerId: offerId || null,
    });
    onClose();
    setAmount(0);
    setMethod('');
    setPaidAt(new Date().toISOString());
    setOfferId('');
    setNotes('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <label className="block">
        <span className="text-sm font-medium">Amount *</span>
        <input
          type="number"
          step="0.01"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Method</span>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
          >
            <option value="">—</option>
            <option value="cash">cash</option>
            <option value="bank">bank</option>
            <option value="card">card</option>
            <option value="other">other</option>
          </select>
        </label>

        <DateTimeField label="Paid At" value={paidAt} onChange={setPaidAt} />
      </div>

      <label className="block">
        <span className="text-sm font-medium">Link to Offer (optional)</span>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={offerId}
          onChange={(e) => setOfferId(e.target.value)}
        >
          <option value="">— none —</option>
          {offers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} — {o.amount} {o.currency}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button className="rounded-lg px-4 py-2 border" onClick={onClose}>
          Cancel
        </button>
        <button className="rounded-lg px-4 py-2 bg-black text-white" onClick={submit}>
          Save
        </button>
      </div>
    </Modal>
  );
}
