import { useState } from 'react';

import Modal from '../common/Modal';
import type { OfferStatus } from '../../types/biz';
import DateTimeField from '../common/DateTimeField';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string; description?: string; amount: number; currency: string; status: OfferStatus; dateOffered: string;
  }) => void;
}

const statuses: OfferStatus[] = ['sent', 'accepted', 'rejected', 'invoiced', 'paid', 'expired'];

export default function AddOfferModal({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('EUR');
  const [status, setStatus] = useState<OfferStatus>('sent');
  const [dateOffered, setDateOffered] = useState<string>(new Date().toISOString());

  const submit = () => {
    if (!title.trim() || isNaN(Number(amount))) return;
    onSave({ title: title.trim(), description: description.trim() || undefined, amount: Number(amount), currency, status, dateOffered });
    onClose();
    setTitle(''); setDescription(''); setAmount(0); setCurrency('EUR'); setStatus('sent'); setDateOffered(new Date().toISOString());
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Offer">
      <label className="block">
        <span className="text-sm font-medium">Title *</span>
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Amount (€) *</span>
          <input type="number" step="0.01" className="mt-1 w-full rounded-lg border px-3 py-2" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Currency</span>
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={currency} onChange={e => setCurrency(e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Status</span>
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={status} onChange={e => setStatus(e.target.value as OfferStatus)}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <DateTimeField label="Date Offered" value={dateOffered} onChange={setDateOffered} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button className="rounded-lg px-4 py-2 border" onClick={onClose}>Cancel</button>
        <button className="rounded-lg px-4 py-2 bg-black text-white" onClick={submit}>Save</button>
      </div>
    </Modal>
  );
}
