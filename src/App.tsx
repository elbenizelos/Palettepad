import { useEffect, useMemo, useState } from "react";

import { palettes } from "./data/palettes";
import Dashboard from "./components/Dashboard"; // <- central dashboard
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

// One-click Offer Builder
import OfferBuilder from "./components/offers-payments/OfferBuilder";

type Section = "dashboard" | "palettes" | "biz" | "offer-builder";

export default function App() {
  // ───────────────── PalettePad state ─────────────────
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

    const found = list.find(
      (x) => x.code.toLowerCase() === code.trim().toLowerCase()
    );
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

  // ─────────────── Sections ───────────────
  const [section, setSection] = useState<Section>("dashboard");
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  const renderOffersPayments = () =>
    activeClientId ? (
      <ClientDetailPage
        clientId={activeClientId}
        onBack={() => setActiveClientId(null)}
      />
    ) : (
      <ClientsPage onOpenClient={setActiveClientId} />
    );

  const renderOfferBuilder = () => <OfferBuilder />;

  // ─────────────── Render ───────────────
  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">PalettePad</h1>

        <div className="flex gap-2">
          <button
            className={`rounded-xl px-4 py-2 border ${
              section === "dashboard"
                ? "bg-sky-400 text-slate-900 border-sky-500"
                : "border-slate-700"
            }`}
            onClick={() => setSection("dashboard")}
          >
            Dashboard
          </button>

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

          <button
            className={`rounded-xl px-4 py-2 border ${
              section === "offer-builder"
                ? "bg-sky-400 text-slate-900 border-sky-500"
                : "border-slate-700"
            }`}
            onClick={() => setSection("offer-builder")}
          >
            Offer Builder
          </button>
        </div>
      </header>

      {section === "dashboard" && (
        <Dashboard
          name={name}
          setName={setName}
          palette={palette}
          setPalette={setPalette}
          code={code}
          setCode={setCode}
          swatch={swatch}
          entries={entries}
          paletteNames={paletteNames}
          list={list}
          handleSave={handleSave}
          handleDelete={handleDelete}
          handleExport={handleExport}
          handleWipe={handleWipe}
        />
      )}

      {section === "palettes" && (
        <Dashboard
          name={name}
          setName={setName}
          palette={palette}
          setPalette={setPalette}
          code={code}
          setCode={setCode}
          swatch={swatch}
          entries={entries}
          paletteNames={paletteNames}
          list={list}
          handleSave={handleSave}
          handleDelete={handleDelete}
          handleExport={handleExport}
          handleWipe={handleWipe}
        />
      )}

      {section === "biz" && renderOffersPayments()}
      {section === "offer-builder" && renderOfferBuilder()}
    </div>
  );
}
