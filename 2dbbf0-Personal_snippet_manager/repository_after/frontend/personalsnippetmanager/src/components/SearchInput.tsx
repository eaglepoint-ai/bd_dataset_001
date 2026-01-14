type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchInput({ value, onChange }: Props) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Search
      </label>

      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by title or content..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-slate-400"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          ⌕
        </span>
      </div>
    </div>
  );
}
