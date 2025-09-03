import React from 'react';

interface Props {
  label: string;
  value: string; // ISO string
  onChange: (iso: string) => void;
  required?: boolean;
}

export default function DateTimeField({ label, value, onChange, required }: Props) {
  // Convert ISO -> 'yyyy-MM-ddThh:mm'
  const localValue = React.useMemo(() => {
    try {
      if (!value) return '';
      const d = new Date(value);
      const pad = (n: number) => String(n).padStart(2, '0');
      const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes()
      )}`;
      return s;
    } catch {
      return '';
    }
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; // local string
    onChange(v ? new Date(v).toISOString() : '');
  };

  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="datetime-local"
        value={localValue}
        onChange={handle}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
      />
    </label>
  );
}
