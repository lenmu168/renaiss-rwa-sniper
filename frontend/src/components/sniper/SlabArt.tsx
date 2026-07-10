import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { Card } from '@/lib/scan'

// 评级卡「卡砖」全息视觉：显示真实卡图，加载失败逐级回退，最终显示占位（无虚拟卡）
export function SlabArt({ card, accent }: { card: Card; accent: string }) {
  const sources = [card.image, card.imageFallback, card.imageStandalone].filter(
    Boolean
  ) as string[]
  const [idx, setIdx] = useState(0)
  const src = sources[idx]
  const exhausted = idx >= sources.length

  return (
    <div className="snp-slab snp-holo relative aspect-[3/4] w-full" style={{ background: '#0b0d16' }}>
      {!exhausted && src ? (
        <img
          src={src}
          alt={card.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ color: 'var(--snp-dim)' }}>
          <ImageOff size={26} />
          <span className="text-[11px]">暂无卡图</span>
        </div>
      )}

      {/* 全息底纹 */}
      <div className="snp-holo-grain" />

      {/* 评级徽标 */}
      <div
        className="snp-mono absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-bold"
        style={{ background: 'rgba(6,8,14,0.82)', color: accent, boxShadow: `0 0 0 1px ${accent}55` }}
      >
        {card.company} {card.grade}
      </div>

      {/* 年份徽标 */}
      {card.year && (
        <div
          className="snp-mono absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: 'rgba(6,8,14,0.72)', color: 'var(--snp-text)' }}
        >
          {card.year}
        </div>
      )}

      {/* 底部角标 */}
      <span
        className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full"
        style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
      />
    </div>
  )
}
