import { api } from './api'

export type Rule = { icon: string; label: string; text: string }

export type Chain = {
  index: number
  length: number
  head: string
  tail: string
  text: string
}

export type Card = {
  tokenId: string
  serial: string
  cert: string
  url?: string | null
  name: string
  setName: string
  cardNumber: string
  character: string
  company: string
  grade: string | number
  year: number | null
  language: string
  askUSDT: number
  fmvUsd: number
  priceValue: number
  game: 'pokemon' | 'onepiece' | 'yugioh'
  image: string | null
  imageFallback: string | null
  imageStandalone: string | null
  isNew?: boolean
  rules?: Array<Rule | string>
  chain?: Chain
  listed?: boolean
}

export type ChainSeries = {
  length: number
  head: string
  tail: string
  members: string[]
}

export type ScanStats = {
  total: number
  library: number
  listed: number
  grail: number
  fancy: number
  chain: number
  chainSeries: number
  newHits: number
}

export type ScanResult = {
  source: string
  mode: 'all' | 'live'
  scannedAt: string
  cached: boolean
  stats: ScanStats
  grailHits: Card[]
  fancyHits: Card[]
  chainHits: Card[]
  chains: ChainSeries[]
}

export type Mode = 'all' | 'live'

export async function fetchScan(refresh = false, mode: Mode = 'all'): Promise<ScanResult> {
  const qs = new URLSearchParams()
  qs.set('mode', mode)
  if (refresh) qs.set('refresh', '1')
  const res = await fetch(api(`scan?${qs.toString()}`))
  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j.error || j.detail || ''
    } catch {
      /* ignore */
    }
    throw new Error(detail || `扫描失败 (${res.status})`)
  }
  return res.json()
}

export type GrailRule = {
  game: string
  keywords: string[]
  suffixes: string[]
  lore: string
}

export type Database = {
  pokemon: GrailRule[]
  onepiece: GrailRule[]
  yugioh: GrailRule[]
  counts: { pokemon: number; onepiece: number; yugioh: number }
}

export async function fetchDatabase(): Promise<Database> {
  const res = await fetch(api('scan/database'))
  if (!res.ok) throw new Error('规则库加载失败')
  return res.json()
}

// ---------- 展示辅助 ----------
export function fmtUsd(n: number): string {
  if (!n) return '—'
  if (n >= 1000) return `$${Math.round(n).toLocaleString('en-US')}`
  return `$${n.toFixed(2)}`
}

// 挂单价 vs FMV 的溢价/折价
export function discount(card: Card): { pct: number; kind: 'discount' | 'premium' } | null {
  if (!card.askUSDT || !card.fmvUsd) return null
  const pct = ((card.askUSDT - card.fmvUsd) / card.fmvUsd) * 100
  if (Math.abs(pct) < 1) return null
  return { pct, kind: pct < 0 ? 'discount' : 'premium' }
}

export const GAME_META: Record<
  Card['game'],
  { label: string; short: string; color: string }
> = {
  pokemon: { label: '宝可梦', short: 'PKM', color: '#ffcb05' },
  onepiece: { label: '海贼王', short: 'OP', color: '#ff2f8e' },
  yugioh: { label: '游戏王', short: 'YGO', color: '#a855f7' },
}
