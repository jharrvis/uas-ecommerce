'use client'

interface ViolationBadgeProps {
  count: number
}

export default function ViolationBadge({ count }: ViolationBadgeProps) {
  if (count === 0) return null

  const color =
    count >= 5  ? 'bg-red-500/20 border-red-500/40 text-red-400' :
    count >= 3  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                  'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${color}`}>
      <span>🚨</span>
      {count} pelanggaran tercatat
    </div>
  )
}
