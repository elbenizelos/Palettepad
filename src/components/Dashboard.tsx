import type { Entry } from "../types/biz";
import type { PaletteColor } from "../data/palettes"; // bring in correct type

type DashboardProps = {
  name: string;
  setName: (val: string) => void;
  palette: string;
  setPalette: (val: string) => void;
  code: string;
  setCode: (val: string) => void;
  swatch: string | null;
  paletteNames: string[];
  entries: Entry[];
  list: PaletteColor[];  // ✅ use the real type
  handleSave: () => void;
  handleExport: () => void;
  handleWipe: () => void;
  handleDelete: (id: string) => void;
};


export default function Dashboard({
  name,
  setName,
  palette,
  setPalette,
  code,
  setCode,
  swatch,
  paletteNames,
  entries,
  list,
  handleSave,
  handleExport,
  handleWipe,
  handleDelete,
}: DashboardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-2xl">
      <h1 className="text-xl font-bold">📊 Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">
        Quick access to offers, clients, and palettes.
      </p>

      {/* Quick stats so props are "used" */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg bg-slate-900/70 p-3">
          <div className="text-slate-400">Entries</div>
          <div className="font-semibold text-slate-200">{entries.length}</div>
        </div>
        <div className="rounded-lg bg-slate-900/70 p-3">
          <div className="text-slate-400">Palette Codes</div>
          <div className="font-semibold text-slate-200">{list.length}</div>
        </div>
        <div className="rounded-lg bg-slate-900/70 p-3">
          <div className="text-slate-400">Latest</div>
          <div className="font-semibold text-slate-200">
            {entries[0]?.code ?? "—"}
          </div>
        </div>
      </div>

      {/* Example section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Color Palette Quick Add</h2>

        <div className="mb-2">
          <label className="block text-sm">Client / Project Name</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter client/project"
          />
        </div>

        <div className="mb-2">
          <label className="block text-sm">Palette</label>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
            value={palette}
            onChange={(e) => setPalette(e.target.value)}
          >
            {paletteNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="block text-sm">Color Code</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. RAL 7016"
          />
        </div>

        {swatch && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-8 w-8 rounded-lg border border-black/40"
              style={{ background: swatch }}
            />
            <span className="text-sm">{swatch}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="rounded-xl bg-sky-400 px-4 py-2 text-slate-900 font-semibold hover:bg-sky-300"
          >
            Save Entry
          </button>
          <button
            onClick={handleExport}
            className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Export CSV
          </button>
          <button
            onClick={handleWipe}
            className="rounded-xl border border-red-700 px-4 py-2 text-red-400 hover:bg-red-900/20"
          >
            Delete All
          </button>
        </div>
      </div>

      {/* Placeholder for future entries list */}
      {entries.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Recent Entries</h3>
          <ul className="space-y-1 text-sm">
            {entries.slice(0, 5).map((e) => (
              <li key={e.id} className="flex justify-between">
                <span>{e.name} — {e.code}</span>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
