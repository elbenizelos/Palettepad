import { useState } from 'react';
import Modal from '../common/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email?: string; phone?: string; notes?: string }) => void;
}

export default function AddClientModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, notes });
    onClose();
    setName(''); setEmail(''); setPhone(''); setNotes('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Client">
      <label className="block">
        <span className="text-sm font-medium">Name *</span>
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Phone</span>
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Notes</span>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button className="rounded-lg px-4 py-2 border" onClick={onClose}>Cancel</button>
        <button className="rounded-lg px-4 py-2 bg-black text-white" onClick={submit}>Save</button>
      </div>
    </Modal>
  );
}
