export type Entry = {
  id: string;
  when: string; // YYYY-MM-DD HH:mm
  name: string;
  palette: string;
  code: string;
};

const KEY = "palettepad_entries_v1";

export function loadEntries(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveEntries(entries: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function nowStamp(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function toCsv(rows: Entry[]) {
  const header = ["SavedAt", "Name", "Palette", "ColorCode"];
  const data = rows.map((r) => [r.when, r.name, r.palette, r.code]);
  const all = [header, ...data]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  return new Blob([all], { type: "text/csv;charset=utf-8;" });
}
