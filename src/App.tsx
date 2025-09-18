import { useEffect, useMemo, useState } from "react";

import { palettes, type PaletteColor } from "./data/palettes";
import ColorCombobox from "./components/ColorCombobox";
import type { Entry } from "./types/biz";
import {
  listEntries,
  addEntry,
  deleteEntry,
  clearEntries,
  toCsv,
  nowStamp,
} from "./lib/entriesStore";

// Offers & Payments (existing)
import ClientsPage from "./components/offers-payments/ClientsPage";
import ClientDetailPage from "./components/offers-payments/ClientDetailPage";

// NEW: One-click Offer Builder page
import OfferBuilder from "./components/offers-payments/OfferBuilder";

type Section = "palettes" | "biz" | "offer-builder";

export default function App() {
  // ───────────────── PalettePad state (colors) ─────────────────
  const paletteNames = useMemo(() => Object.keys(palettes), []);
  const [name, setName] = useState("");
  const [palette, setPalette] = useState(paletteNames[0] ?? "");
  const [code, setCode] = useState("");
  const [swatch, setSwatch] = useState<string | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const list = useMemo(() => palettes[palette] ?? [], [palette]);

  // Load entries (async)
  useEffect(() => {
    (async () => {
      try {
        const rows = await listEntries();
        setEntries(rows);
      } catch (e) {
        console.error("Failed to load entries", e);
      }
    })();
  }, []);

  // Preview swatch
  useEffect(() => {
    const raw = code.trim();
    if (/^#?[0-9a-f]{6}$/i.test(raw)) {
      setSwatch(raw.startsWith("#") ? raw : `#${raw}`);
      return;
    }
    const found = list.find((x) => x.code.toLowerCase() === raw.toLowerCase());
    setSwatch(found?.hex ?? null);
  }, [code, list]);

  async function handleSave() {
    if (!name.trim()) return alert("Please enter the client/project name.");
    if (!palette) return alert("Pick a palette.");
    if (!code.trim()) return alert("Pick or type a color code.");

    const found = list.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    const finalCode = found ? found.code : code.trim();

    const row: Omit<Entry, "id"> = {
      when: nowStamp(),
      name: name.trim(),
      palette,
      code: finalCode,
    };

    try {
      const saved = await addEntry(row);
      setEntries((prev) => [saved, ...prev]);
      setCode("");
    } catch (e) {
      console.error("Save failed", e);
      alert("Could not save entry.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
      alert("Could not delete entry.");
    }
  }

  function handleExport() {
    if (entries.length === 0) return alert("Nothing to export.");
    const blob = toCsv(entries);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palettepad-color-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleWipe() {
    if (!confirm("Delete ALL entries?")) return;
    try {
      await clearEntries();
      setEntries([]);
    } catch (e) {
      console.error("Wipe failed", e);
      alert("Could not delete all entries.");
    }
  }

  // ─────────────── Sections: Palettes | Biz | Offer Builder ───────────────
  const [section, setSection] = useState<Section>("palettes");
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  const renderPalettePad = () => (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-2xl">
      <h1 className="text-xl font-bold">🎨 PalettePad</h1>
      <p className="mt-1 text-sm text-slate-400">
        Write the client’s name, choose the palette, then search/select the color code.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Client / Project Name</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400"
            placeholder="e.g., Giannis Papadopoulos"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Palette</label>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400"
            value={palette}
            onChange={(e) => setPalette(e.target.value)}
          >
            {paletteNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-slate-400">
            Switching palette updates the suggestions for the color field.
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-slate-300">Color Code (type to search)</label>
          <ColorCombobox
            value={code}
            onChange={setCode}
            paletteList={list}
            onPick={(item?: PaletteColor) => setSwatch(item?.hex ?? null)}
            placeholder="e.g., NCS S 0502-Y or RAL 7016"
          />
          <div className="mt-2 flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg border border-black/40"
              style={{
                background: swatch ?? "linear-gradient(45deg, #0f172a, #1f2937)",
              }}
              title={swatch ?? "Preview"}
            />
            <div className="text-sm text-slate-300">{swatch ? "Preview" : "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-xl bg-sky-400 px-4 py-2 font-semibold text-slate-900 hover:bg-sky-300"
          onClick={handleSave}
        >
          Save Entry
        </button>
        <button
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 hover:bg-slate-800"
          onClick={() => {
            setName("");
            setCode("");
          }}
        >
          Clear
        </button>

        <span className="ml-auto" />

        <button
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 hover:bg-slate-800"
          onClick={handleExport}
        >
          Export CSV
        </button>
        <button
          className="rounded-xl border border-red-700 bg-transparent px-4 py-2 text-red-400 hover:bg-red-900/20"
          onClick={handleWipe}
        >
          Delete All
        </button>
      </div>

      <div className="mt-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-4 text-center text-slate-400">
            No entries yet. Save your first record above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse overflow-hidden rounded-xl border border-slate-800">
              <thead className="bg-slate-900 text-left text-sm">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Saved</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Palette</th>
                  <th className="px-3 py-2">Color Code</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((r, i) => (
                  <tr key={r.id} className="odd:bg-slate-950">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 text-slate-300">{r.when}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.palette}</td>
                    <td className="px-3 py-2">{r.code}</td>
                    <td className="px-3 py-2">
                      <button
                        className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800"
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-sm text-slate-400">
              Entries: <span className="font-semibold text-slate-200">{entries.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOffersPayments = () =>
    activeClientId ? (
      <ClientDetailPage clientId={activeClientId} onBack={() => setActiveClientId(null)} />
    ) : (
      <ClientsPage onOpenClient={setActiveClientId} />
    );

  const renderOfferBuilder = () => <OfferBuilder />;

  // ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">PalettePad</h1>

        <div className="flex gap-2">
          <button
            className={`rounded-xl px-4 py-2 border ${
              section === "palettes"
                ? "bg-sky-400 text-slate-900 border-sky-500"
                : "border-slate-700"
            }`}
            onClick={() => setSection("palettes")}
          >
            Color Palettes
          </button>

          <button
            className={`rounded-xl px-4 py-2 border ${
              section === "biz"
                ? "bg-sky-400 text-slate-900 border-sky-500"
                : "border-slate-700"
            }`}
            onClick={() => setSection("biz")}
          >
            Offers & Payments
          </button>

          {/* NEW: Offer Builder tab */}
          <button
            className={`rounded-xl px-4 py-2 border ${
              section === "offer-builder"
                ? "bg-sky-400 text-slate-900 border-sky-500"
                : "border-slate-700"
            }`}
            onClick={() => setSection("offer-builder")}
            title="Create a full price offer from keywords (αστάρι, 3 χέρια, χρώμα, τρίψιμο...)"
          >
            Offer Builder
          </button>
        </div>
      </header>

      {section === "palettes" && renderPalettePad()}
      {section === "biz" && renderOffersPayments()}
      {section === "offer-builder" && renderOfferBuilder()}
    </div>
  );
}
