import { useEffect, useState } from "react";
import type { Client, Offer, Payment } from "../../types/biz";

import {
  getClient,
  listOffers,
  listPayments,
  addOffer,
  addPayment,
  clientTotals,
  deleteOffer,
  deletePayment,
} from "../../lib/financeStore";
import AddOfferModal from "./AddOfferModal";
import RecordPaymentModal from "./RecordPaymentModal";
import ClientSummaryCard from "./ClientSummaryCard";

export default function ClientDetailPage({
  clientId,
  onBack,
}: {
  clientId: string;
  onBack: () => void;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState({
    offered: 0,
    paid: 0,
    outstanding: 0,
    currency: "EUR",
  });
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // 🔧 add these:
  const [openOffer, setOpenOffer] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, o, p, t] = await Promise.all([
          getClient(clientId),
          listOffers(clientId),
          listPayments(clientId),
          clientTotals(clientId),
        ]);
        setClient(c ?? null);
        setOffers(o);
        setPayments(p);
        setTotals(t);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, tick]);

  const saveOffer = async (data: any) => {
    await addOffer({ clientId, ...data });
    setTick((t) => t + 1);
  };

  const savePayment = async (data: any) => {
    await addPayment({ clientId, ...data });
    setTick((t) => t + 1);
  };

  const removeOffer = async (id: string, title: string) => {
    if (!confirm(`Delete offer "${title}"? This will also delete related payments.`)) return;
    await deleteOffer(id);
    setTick((t) => t + 1);
  };

  const removePayment = async (id: string) => {
    if (!confirm("Delete this payment?")) return;
    await deletePayment(id);
    setTick((t) => t + 1);
  };

  if (loading) {
    return (
      <div>
        <button className="mb-3 rounded-lg border px-3 py-1" onClick={onBack}>
          ← Back
        </button>
        <div className="rounded-xl border p-4 text-sm text-neutral-500">Loading…</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <button className="mb-3 rounded-lg border px-3 py-1" onClick={onBack}>
          ← Back
        </button>
        <div>Client not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button className="rounded-lg border px-3 py-1" onClick={onBack}>
          ← Back
        </button>
        <h2 className="text-xl font-semibold">{client.name}</h2>
      </div>

      {/* Summary */}
      <ClientSummaryCard clientId={clientId} />

      <div className="flex gap-3">
        <button
          className="rounded-xl bg-black text-white px-4 py-2"
          onClick={() => setOpenOffer(true)}
        >
          + Add Offer
        </button>
        <button
          className="rounded-xl border px-4 py-2"
          onClick={() => setOpenPay(true)}
        >
          + Record Payment
        </button>
      </div>

      {/* Offers */}
      <section>
        <h3 className="font-semibold mb-2">Offers</h3>
        <div className="rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/40">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3">{o.title}</td>
                  <td className="p-3">
                    {o.amount.toFixed(2)} {o.currency}
                  </td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3">{new Date(o.dateOffered).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-red-600 hover:text-white"
                      onClick={() => removeOffer(o.id, o.title)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td className="p-3 text-neutral-500" colSpan={5}>
                    No offers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payments (history) */}
      <section>
        <h3 className="font-semibold mb-2">Payments</h3>
        <div className="rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/40">
              <tr>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Method</th>
                <th className="text-left p-3">Linked Offer</th>
                <th className="text-left p-3">Paid At</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const linked = offers.find((o) => o.id === p.offerId);
                return (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      {p.amount.toFixed(2)} {totals.currency}
                    </td>
                    <td className="p-3">{p.method ?? "—"}</td>
                    <td className="p-3">{linked ? linked.title : "—"}</td>
                    <td className="p-3">{new Date(p.paidAt).toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-red-600 hover:text-white"
                        onClick={() => removePayment(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td className="p-3 text-neutral-500" colSpan={5}>
                    No payments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      <AddOfferModal
        open={openOffer}
        onClose={() => setOpenOffer(false)}
        onSave={saveOffer}
      />
      <RecordPaymentModal
        open={openPay}
        onClose={() => setOpenPay(false)}
        onSave={savePayment}
        offers={offers}
      />
    </div>
  );
}
