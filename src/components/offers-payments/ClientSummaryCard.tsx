import { useEffect, useState } from 'react';
import { clientTotals } from '../../lib/financeStore';

export default function ClientSummaryCard({ clientId }: { clientId: string }) {
  const [t, setT] = useState<{ offered: number; paid: number; outstanding: number; currency: string } | null>(null);

  useEffect(() => {
    (async () => setT(await clientTotals(clientId)))();
  }, [clientId]);

  if (!t) return <div className="rounded-2xl border p-4 text-sm text-neutral-500">Loading…</div>;

  return (
    <div className="rounded-2xl border p-4 grid grid-cols-3 gap-3 text-sm">
      <div>
        <div className="text-neutral-500">Offered</div>
        <div className="font-semibold">{t.offered.toFixed(2)} {t.currency}</div>
      </div>
      <div>
        <div className="text-neutral-500">Paid</div>
        <div className="font-semibold">{t.paid.toFixed(2)} {t.currency}</div>
      </div>
      <div>
        <div className="text-neutral-500">Outstanding</div>
        <div className="font-semibold">{t.outstanding.toFixed(2)} {t.currency}</div>
      </div>
    </div>
  );
}
