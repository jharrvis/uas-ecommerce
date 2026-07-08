'use client'

interface TableControlsProps {
  search: string
  onSearchChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  page: number
  pageCount: number
  total: number
  filteredTotal: number
  onPageChange: (value: number) => void
}

export function getPageItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export default function TableControls({
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  page,
  pageCount,
  total,
  filteredTotal,
  onPageChange,
}: TableControlsProps) {
  const start = filteredTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, filteredTotal)

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
      <div className="flex-1">
        <label className="sr-only" htmlFor="table-search">Cari data</label>
        <input
          id="table-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari data..."
          className="w-full lg:max-w-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-sky-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {start}-{end} dari {filteredTotal}
          {filteredTotal !== total ? ` (total ${total})` : ''}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:border-sky-500"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>{size}/halaman</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 rounded-lg font-semibold"
        >
          Prev
        </button>
        <span className="font-semibold text-slate-700 dark:text-slate-300">{page}/{pageCount}</span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 rounded-lg font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  )
}
