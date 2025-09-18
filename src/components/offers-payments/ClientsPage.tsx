import { useEffect, useMemo, useState } from 'react';
import type { Client } from '../../types/biz';
import { addClient, listClients, clientTotals } from '../../lib/financeStore';
import AddClientModal from './AddClientModal';

type Props = {
  onOpenClient: (id: string) => void;
  /** Optional: when provided, enables Quick Offer buttons to open the Offer Builder and prefill */
  onCreateOffer?: (client?: Client) => void;
};

export default function ClientsPage({ onOpenClient, onCreateOffer }: Props) {
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

  function prefillAndMaybeOpenOfferBuilder(client?: Client) {
    // Always set a localStorage prefill for robustness/fallback.
    try {
      localStorage.setItem(
        'offerBuilderPrefill',
        JSON.stringify({
          customer: client?.name ?? '',
          project: '',
          notes: client?.notes ?? '',
        })
      );
    } catch {
      /* ignore */
    }
    // Prefer parent handler if provided (recommended).
    if (onCreateOffer) {
      onCreateOffer(client);
      return;
    }
    // Fallback UX if parent hasn’t wired the handler yet.
    alert('Prefill saved. Open the “Offer Builder” tab to create the offer.');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 flex items-center gap-3">
          <input
            placeholder="Search clients…"
            className="flex-1 rounded-xl border px-3 py-2"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* NEW: Quick Offer button (no client prefill) */}
          <button
            className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
            onClick={() => prefillAndMaybeOpenOfferBuilder(undefined)}
            title="Open Offer Builder to create a new offer"
          >
            ✨ Quick Offer
          </button>

          <button className="rounded-xl bg-black text-white px-4 py-2" onClick={() => setOpenAdd(true)}>
            + Add Client
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div
            key={c.id}
            className="text-left rounded-2xl border p-4 hover:shadow-md transition"
          >
            <div className="font-semibold text-base">{c.name}</div>
            {c.email && <div className="text-sm text-neutral-500">{c.email}</div>}
            {c.phone && <div className="text-sm text-neutral-500">{c.phone}</div>}
            <ClientTotalsInline clientId={c.id} />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onOpenClient(c.id)}
                className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
              >
                View
              </button>
              {/* NEW: Offer button per client */}
              <button
                onClick={() => prefillAndMaybeOpenOfferBuilder(c)}
                className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                title="Create an offer for this client"
              >
                Offer
              </button>
            </div>
          </div>
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
