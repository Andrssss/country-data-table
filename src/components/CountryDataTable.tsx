import { useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";

const ALL_COUNTRIES = gql`
  query AllCountries {
    countries {
      code
      name
      currency
      continent { code name }
    }
  }
`;
type GqlCountry = {
  code: string;
  name: string;
  currency: string | null;
  continent: { code: string; name: string };
};
type AllCountriesData = { countries: GqlCountry[] };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const codeIncludes = (code: string, q: string) =>
  !q.trim() || code.toLowerCase().includes(q.trim().toLowerCase());

const nameIncludes = (name: string, q: string) =>
  !q.trim() || norm(name).includes(norm(q));

const PAGE_SIZES = [10, 20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

export default function CountryDataTable() {
  const { data, loading, error } = useQuery<AllCountriesData>(ALL_COUNTRIES);
  const all = (data?.countries ?? []).map((c) => ({
    code: c.code,
    name: c.name,
    currency: c.currency,
    continentCode: c.continent.code,
    continentName: c.continent.name,
  }));

  const [state, setState] = useState({
    page: 1,
    pageSize: 10 as PageSize,
    codeQuery: "",
    nameQuery: "",
    continent: "ALL",
    currency: "ALL",
  });
  const set = <K extends keyof typeof state>(k: K, v: (typeof state)[K]) =>
    setState((s) => ({ ...s, page: k === "page" ? (v as number) : 1, [k]: v }));

  const continents = useMemo(() => {
    const m = new Map<string, string>();
    all.forEach((c) => m.set(c.continentCode, c.continentName));
    return [...m.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const currencies = useMemo(() => {
    const s = new Set<string>();
    all.forEach((c) => c.currency && s.add(c.currency));
    return [...s].sort();
  }, [all]);

  const filtered = useMemo(() => {
    return all
      .filter((c) => state.continent === "ALL" || c.continentCode === state.continent)
      .filter((c) => state.currency === "ALL" || (c.currency ?? "") === state.currency)
      .filter((c) => codeIncludes(c.code, state.codeQuery))
      .filter((c) => nameIncludes(c.name, state.nameQuery));
  }, [all, state]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  const page = Math.min(state.page, pageCount);
  const start = (page - 1) * state.pageSize;
  const paged = filtered.slice(start, start + state.pageSize);

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Hiba: {error.message}</div>;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Countries</h1>
        <p className="text-sm text-gray-600">Total entries: <span className="font-medium">{all.length}</span></p>
      </div>

      {/* filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Code contains (pl. A → AF, AX)"
            value={state.codeQuery}
            onChange={(e) => set("codeQuery", e.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Name (ékezet nélkül is jó)"
            value={state.nameQuery}
            onChange={(e) => set("nameQuery", e.target.value)}
          />
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={state.continent}
            onChange={(e) => set("continent", e.target.value)}
          >
            <option value="ALL">All continents</option>
            {continents.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={state.currency}
            onChange={(e) => set("currency", e.target.value)}
          >
            <option value="ALL">All currencies</option>
            {currencies.map((cur) => (
              <option key={cur} value={cur}>{cur}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={state.pageSize}
            onChange={(e) => set("pageSize", Number(e.target.value) as PageSize)}
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>

      {/* table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Country</th>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Continent</th>
              <th className="px-4 py-3 text-left font-semibold">Currency</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => (
              <tr key={c.code} className="odd:bg-white even:bg-gray-50">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.code}</td>
                <td className="px-4 py-2">{`${c.continentCode} — ${c.continentName}`}</td>
                <td className="px-4 py-2">{c.currency ?? "—"}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={4}>No results.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* navigation logic */}
      <div className="flex items-center justify-between text-sm">
        <div>
          Showing <span className="font-medium">{filtered.length ? start + 1 : 0}</span>–
          <span className="font-medium">{Math.min(start + state.pageSize, filtered.length)}</span>{" "}
          of <span className="font-medium">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => set("page", Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span>Page <span className="font-medium">{page}</span> / {Math.max(1, Math.ceil(filtered.length / state.pageSize))}</span>
          <button
            className="rounded-md border bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => set("page", Math.min(Math.ceil(filtered.length / state.pageSize), page + 1))}
            disabled={page >= Math.ceil(filtered.length / state.pageSize)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
