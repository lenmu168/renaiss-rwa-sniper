import { ExternalLink } from 'lucide-react'
import { type Card, GAME_META, fmtUsd, discount } from '@/lib/scan'
import { SlabArt } from './SlabArt'

const ACCENTS = {
  grail: { color: '#ffb62e', glow: 'rgba(255, 182, 46, 0.16)', ring: 'rgba(255, 182, 46, 0.35)', label: '天命神卡' },
  fancy: { color: '#ff2f8e', glow: 'rgba(255, 47, 142, 0.16)', ring: 'rgba(255, 47, 142, 0.35)', label: '特种靓号' },
  chain: { color: '#22e0e0', glow: 'rgba(34, 224, 224, 0.14)', ring: 'rgba(34, 224, 224, 0.32)', label: '连号序列' },
} as const

export function CardTile({
  card,
  tier,
  index,
}: {
  card: Card
  tier: keyof typeof ACCENTS
  index: number
}) {
  const accent = ACCENTS[tier]
  const game = GAME_META[card.game]
  const disc = discount(card)

  const Root: React.ElementType = card.url ? 'a' : 'div'
  const rootProps = card.url
    ? { href: card.url, target: '_blank', rel: 'noreferrer' }
    : {}

  return (
    <Root
      {...rootProps}
      className={`snp-card snp-rise snp-panel relative block overflow-hidden p-4${
        card.url ? ' snp-clickable' : ''
      }`}
      style={{
        animationDelay: `${Math.min(index * 55, 700)}ms`,
        boxShadow: `0 0 0 1px ${accent.ring}, 0 20px 50px -24px ${accent.glow}`,
        borderColor: accent.ring,
      }}
    >
      {/* 顶部霓虹条 */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)` }}
      />

      {/* NEW 徽标 */}
      {card.isNew && (
        <div
          className="snp-blink absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider"
          style={{ background: accent.color, color: '#0a0a0f' }}
        >
          NEW 新挂单
        </div>
      )}

      {/* 点击打开外链指示 */}
      {card.url && (
        <div
          className="snp-openhint absolute right-3 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
          style={{
            top: card.isNew ? '2.4rem' : '0.75rem',
            background: 'rgba(10,10,15,0.72)',
            color: accent.color,
            boxShadow: `0 0 0 1px ${accent.ring}`,
          }}
        >
          <ExternalLink size={11} strokeWidth={2.5} />
          打开
        </div>
      )}

      {/* 卡砖全息图 */}
      <div className="mb-3">
        <SlabArt card={card} accent={accent.color} />
      </div>

      {/* 证书号头 */}
      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold" style={{ color: 'var(--snp-dim)' }}>
        <span className="rounded px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.06)', color: game.color }}>
          {game.short}
        </span>
        <span>{card.company} 认证 · {accent.label}</span>
      </div>

      <div className="snp-mono text-[26px] font-medium leading-none tracking-tight" style={{ color: accent.color }}>
        #{card.cert}
      </div>

      {/* 卡名 */}
      <div className="mt-2.5 line-clamp-2 min-h-[38px] text-[13px] leading-tight" style={{ color: 'var(--snp-text)' }}>
        {card.name}
      </div>

      {/* 估值 / 挂单价 / 溢价折价 */}
      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold" style={{ color: 'var(--snp-dim)' }}>市价估值 FMV</div>
          <span className="snp-mono text-xl font-bold" style={{ color: '#fff' }}>
            {fmtUsd(card.fmvUsd)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          {disc && (
            <span
              className="snp-mono rounded-md px-2 py-0.5 text-[11px] font-black"
              style={
                disc.kind === 'discount'
                  ? { background: 'rgba(16,185,129,0.16)', color: '#34d399', boxShadow: '0 0 12px -4px #34d399' }
                  : { background: 'rgba(255,107,129,0.14)', color: '#ff8fa3' }
              }
            >
              {disc.kind === 'discount' ? '▼ 折价 ' : '▲ 溢价 '}
              {Math.abs(disc.pct).toFixed(0)}%
            </span>
          )}
          {card.askUSDT ? (
            <span
              className="snp-mono rounded-md px-2 py-1 text-[11px] font-bold"
              style={{ background: 'rgba(34,224,224,0.1)', color: 'var(--snp-cyan)' }}
            >
              挂单 {card.askUSDT >= 1000 ? `${Math.round(card.askUSDT).toLocaleString('en-US')}` : card.askUSDT.toFixed(1)} USDT
            </span>
          ) : (
            <span className="snp-mono text-[11px]" style={{ color: 'var(--snp-dim)' }}>已下架</span>
          )}
        </div>
      </div>

      {/* 命中规则 */}
      <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--snp-line)' }}>
        {tier === 'chain' && card.chain && (
          <div className="flex items-start gap-1.5 text-[12px]" style={{ color: accent.color }}>
            <span>🔗</span>
            <span className="snp-mono leading-tight">{card.chain.text}</span>
          </div>
        )}
        {card.rules?.map((r, i) => {
          const isObj = typeof r === 'object'
          return (
            <div key={i} className="flex items-start gap-1.5 text-[12px] leading-tight">
              <span>{isObj ? r.icon : ''}</span>
              <span style={{ color: 'var(--snp-text)' }}>
                {isObj ? (
                  <>
                    <span className="font-bold" style={{ color: accent.color }}>
                      【{r.label}】{' '}
                    </span>
                    {r.text}
                  </>
                ) : (
                  r
                )}
              </span>
            </div>
          )
        })}
      </div>
    </Root>
  )
}
