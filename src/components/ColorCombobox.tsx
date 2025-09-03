import { useEffect, useMemo, useState } from "react";
import { Combobox } from "@headlessui/react";
import type { PaletteColor } from "../data/palettes";

type Props = {
  value: string;                      // current text/code
  onChange: (v: string) => void;      // update text/code
  paletteList: PaletteColor[];        // items to suggest
  onPick?: (item?: PaletteColor) => void; // notify when a suggestion is picked (to update swatch)
  placeholder?: string;
};

export default function ColorCombobox({
  value,
  onChange,
  paletteList,
  onPick,
  placeholder = "Type code or name…",
}: Props) {
  const [query, setQuery] = useState(value);

  useEffect(() => setQuery(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paletteList.slice(0, 100);
    return paletteList
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.name && c.name.toLowerCase().includes(q))
      )
      .slice(0, 100);
  }, [paletteList, query]);

  return (
    <Combobox
      value={value || ""}
      onChange={(v: string | null) => {
        const pickedCode = v ?? "";
        onChange(pickedCode);
        const picked = paletteList.find((c) => c.code === pickedCode);
        onPick?.(picked);
      }}
    >
      <div className="relative">
        <Combobox.Input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400"
          // displayValue is fine even for string; it prevents uncontrolled warnings
          displayValue={() => value}
          onChange={(e) => {
            const txt = e.target.value;
            setQuery(txt);
            onChange(txt);
            onPick?.(); // typing free text: no picked item yet
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {filtered.length > 0 && (
          <Combobox.Options className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            {filtered.map((item) => (
              // Use the STRING code as the option value
              <Combobox.Option
                key={item.code}
                value={item.code}
                className="cursor-pointer border-b border-slate-800 px-4 py-2 ui-active:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.code}</div>
                    {item.name && (
                      <div className="text-sm text-slate-400">{item.name}</div>
                    )}
                  </div>
                  {item.hex && (
                    <div
                      className="h-7 w-7 rounded-md border border-black/40"
                      style={{ background: item.hex }}
                    />
                  )}
                </div>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
