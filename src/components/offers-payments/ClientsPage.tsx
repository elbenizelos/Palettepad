import { useEffect, useMemo, useState } from 'react';
import type { Client } from '../../types/biz';
import { addClient, listClients, clientTotals } from '../../lib/financeStore';
import AddClientModal from './AddClientModal';

export default function ClientsPage({ onOpenClient }: { onOpenClient: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      const rows = await listClients();
      setClients(rows);
    })();
  }, [tick]);

  const filtered = useMemo(
    () => clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())),
    [clients, q]
  );

  const create = async (data: { name: string; email?: string; phone?: string; notes?: string }) => {
    await addClient(data);
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          placeholder="Search clients…"
          className="flex-1 rounded-xl border px-3 py-2"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className="rounded-xl bg-black text-white px-4 py-2" onClick={() => setOpenAdd(true)}>
          + Add Client
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => onOpenClient(c.id)}
            className="text-left rounded-2xl border p-4 hover:shadow-md transition"
          >
            <div className="font-semibold text-base">{c.name}</div>
            {c.email && <div className="text-sm text-neutral-500">{c.email}</div>}
            {c.phone && <div className="text-sm text-neutral-500">{c.phone}</div>}
            <ClientTotalsInline clientId={c.id} />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-neutral-500">No clients yet. Click “Add Client”.</div>
        )}
      </div>

      <AddClientModal open={openAdd} onClose={() => setOpenAdd(false)} onSave={create} />
    </div>
  );
}

function ClientTotalsInline({ clientId }: { clientId: string }) {
  const [t, setT] = useState<{ offered: number; paid: number; outstanding: number; currency: string } | null>(null);
  useEffect(() => {
    (async () => setT(await clientTotals(clientId)))();
  }, [clientId]);
  if (!t) return <div className="mt-3 text-sm text-neutral-500">…</div>;
  return (
    <div className="mt-3 text-sm grid grid-cols-3 gap-3">
      <div><div className="text-neutral-500">Offered</div><div className="font-medium">{t.offered.toFixed(2)}</div></div>
      <div><div className="text-neutral-500">Paid</div><div className="font-medium">{t.paid.toFixed(2)}</div></div>
      <div><div className="text-neutral-500">Outst.</div><div className="font-medium">{t.outstanding.toFixed(2)}</div></div>
    </div>
  );
}
