import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Radar, Zap, Crosshair, Database, Activity, Link2, RefreshCw, X, Sparkles,
} from 'lucide-react'
import {
  fetchScan, fetchDatabase, GAME_META,
  type ScanResult, type Card, type Database as Db, type Mode,
} from '@/lib/scan'
import { CardTile } from '@/components/sniper/CardTile'

type Tier = 'grail' | 'fancy' | 'chain'

const TIERS: { key: Tier; label: string; icon: typeof Zap; color: string }[] = [
  { key: 'grail', label: '天命神卡', icon: Sparkles, color: '#ffb62e' },
  { key: 'fancy', label: '特种靓号', icon: Zap, color: '#ff2f8e' },
  { key: 'chain', label: '连号序列', icon: Link2, color: '#22e0e0' },
]

const LOG_LINES = [
  '> 建立 Renaiss 大盘链路 …',
  '> 拉取已挂单资产清单 …',
  '> 解析证书序列号 …',
  '> 碰撞天命数字数据库 …',
  '> 扫描极品靓号规则 …',
  '> 追踪连号序列链 …',
  '> 计算 FMV 溢价 / 折价 …',
  '> 生成狙击目标 ✓',
]

function useCountUp(target: number, dur = 800) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return val
}

function Stat({
  label, value, sub, color, icon: Icon, live,
}: {
  label: string; value: number; sub?: string; color: string; icon: typeof Zap; live?: boolean
}) {
  const v = useCountUp(value)
  return (
    <div className="snp-panel relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--snp-dim)' }}>{label}</span>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="mt-1.5 flex items-end gap-2">
        <span className="snp-mono text-[30px] font-bold leading-none" style={{ color: '#fff' }}>{v.toLocaleString('en-US')}</span>
        {live && <span className="snp-pulse mb-1.5 inline-block h-2 w-2 rounded-full" style={{ color }} />}
      </div>
      {sub && <div className="mt-1 text-[11px]" style={{ color: 'var(--snp-dim)' }}>{sub}</div>}
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('all')
  const [tier, setTier] = useState<Tier>('grail')
  const [gameFilter, setGameFilter] = useState<'all' | Card['game']>('all')
  const [logIdx, setLogIdx] = useState(0)
  const [dbOpen, setDbOpen] = useState(false)
  const [db, setDb] = useState<Db | null>(null)

  const runScan = useCallback(async (refresh = false, m: Mode = mode) => {
    setLoading(true)
    setError(null)
    setLogIdx(0)
    const logTimer = setInterval(() => setLogIdx((i) => Math.min(i + 1, LOG_LINES.length - 1)), 260)
    try {
      const res = await fetchScan(refresh, m)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : '扫描失败')
    } finally {
      clearInterval(logTimer)
      setLogIdx(LOG_LINES.length - 1)
      setLoading(false)
    }
  }, [mode])

  useEffect(() => { runScan(false, 'all') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    runScan(false, m)
  }

  const openDb = async () => {
    setDbOpen(true)
    if (!db) {
      try { setDb(await fetchDatabase()) } catch { /* ignore */ }
    }
  }

  const hits: Card[] = useMemo(() => {
    if (!data) return []
    const src = tier === 'grail' ? data.grailHits : tier === 'fancy' ? data.fancyHits : data.chainHits
    if (gameFilter === 'all') return src
    return src.filter((c) => c.game === gameFilter)
  }, [data, tier, gameFilter])

  const s = data?.stats

  return (
    <div className="snp-root">
      <div className="snp-bg" />
      <div className="snp-grid" />
      <div className="snp-scanline" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 pb-24 pt-6">
        {/* ============ 顶栏 ============ */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: 'linear-gradient(135deg, #ff2f8e, #ff6a3d)', boxShadow: '0 0 22px -4px #ff2f8e' }}>
              <Crosshair size={22} color="#fff" />
            </div>
            <div>
              <h1 className="text-[20px] font-black leading-none tracking-tight" style={{ color: '#fff' }}>
                RENAISS <span style={{ color: 'var(--snp-pink)' }}>狙击终端</span>
              </h1>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--snp-dim)' }}>评级卡证书号 · 天命 / 靓号 / 连号 深度透视</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 模式切换 */}
            <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {(['all', 'live'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-bold transition"
                  style={mode === m ? { background: 'var(--snp-pink)', color: '#fff' } : { color: 'var(--snp-dim)' }}
                >
                  {m === 'all' ? '累积库' : '在售'}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 sm:flex" style={{ background: 'rgba(34,224,224,0.08)' }}>
              <span className="snp-pulse inline-block h-2 w-2 rounded-full" style={{ color: 'var(--snp-cyan)' }} />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--snp-cyan)' }}>节点在线</span>
            </div>
            <button onClick={openDb} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition hover:brightness-125" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--snp-text)' }}>
              <Database size={14} /> 监控库
            </button>
          </div>
        </header>

        {/* ============ 控制台 ============ */}
        <div className="snp-panel mb-6 grid gap-4 p-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--snp-text)' }}>
                <Radar size={16} style={{ color: 'var(--snp-cyan)' }} /> 大盘扫描引擎
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'var(--snp-dim)' }}>
                {mode === 'all'
                  ? '累积库汇总历史扫描到的全部资产，只增不减，可回看已下架珍品。'
                  : '在售模式仅显示当前挂单中的资产，第一时间狙击新上架好卡。'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => runScan(true)} disabled={loading} className="snp-btn-scan flex items-center gap-2 px-5 py-3 text-[14px] font-black">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? '扫描中…' : '重新扫描大盘'}
              </button>
              {data && !loading && (
                <span className="text-[11px]" style={{ color: 'var(--snp-dim)' }}>
                  {data.cached ? '缓存结果' : '实时抓取'} · {new Date(data.scannedAt).toLocaleTimeString('zh-CN')}
                </span>
              )}
            </div>
          </div>

          {/* 终端日志 */}
          <div className="snp-log max-h-[150px] overflow-hidden rounded-xl p-3.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--snp-line)' }}>
            {LOG_LINES.slice(0, logIdx + 1).map((l, i) => (
              <div key={i} className="snp-mono text-[12px] leading-6" style={{ color: i === logIdx && loading ? 'var(--snp-cyan)' : 'var(--snp-dim)' }}>
                {l}{i === logIdx && loading ? ' ▊' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* ============ 统计卡 ============ */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Stat
            label={mode === 'all' ? '资产总库' : '在售挂单'}
            value={mode === 'all' ? (s?.library ?? 0) : (s?.listed ?? 0)}
            sub={mode === 'all' ? `当前在售 ${s?.listed ?? 0}` : '实时挂单中'}
            color="#8b93ff" icon={Activity} live={mode === 'live'}
          />
          <Stat label="天命神卡" value={s?.grail ?? 0} sub="证书号命中命运数字" color="#ffb62e" icon={Sparkles} />
          <Stat label="特种靓号" value={s?.fancy ?? 0} sub="豹子 / 顺子 / 回文" color="#ff2f8e" icon={Zap} />
          <Stat label="连号命中" value={s?.chain ?? 0} sub={`${s?.chainSeries ?? 0} 条连号序列`} color="#22e0e0" icon={Link2} />
          <Stat label="新挂单" value={s?.newHits ?? 0} sub="近 10 分钟出现" color="#34d399" icon={Radar} />
        </div>

        {/* ============ 错误提示 ============ */}
        {error && (
          <div className="snp-panel mb-6 flex items-center justify-between gap-3 p-4" style={{ borderColor: 'rgba(255,80,80,0.4)' }}>
            <div className="flex items-center gap-2 text-[13px]" style={{ color: '#ff8fa3' }}>
              <X size={16} /> {error}
            </div>
            <button onClick={() => runScan(true)} className="rounded-lg px-3 py-1.5 text-[12px] font-bold" style={{ background: 'rgba(255,47,142,0.15)', color: 'var(--snp-pink)' }}>
              重试
            </button>
          </div>
        )}

        {/* ============ Tab + 过滤 ============ */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TIERS.map((t) => {
              const active = tier === t.key
              const count = t.key === 'grail' ? s?.grail : t.key === 'fancy' ? s?.fancy : s?.chain
              return (
                <button
                  key={t.key}
                  onClick={() => setTier(t.key)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition"
                  style={active
                    ? { background: `${t.color}1f`, color: t.color, boxShadow: `0 0 0 1px ${t.color}66` }
                    : { background: 'rgba(255,255,255,0.04)', color: 'var(--snp-dim)' }}
                >
                  <t.icon size={15} /> {t.label}
                  <span className="snp-mono rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: 'rgba(0,0,0,0.35)' }}>{count ?? 0}</span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-1.5">
            {(['all', 'pokemon', 'onepiece', 'yugioh'] as const).map((g) => {
              const active = gameFilter === g
              const label = g === 'all' ? '全部' : GAME_META[g].label
              const color = g === 'all' ? '#fff' : GAME_META[g].color
              return (
                <button
                  key={g}
                  onClick={() => setGameFilter(g)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition"
                  style={active ? { background: `${color}22`, color } : { background: 'rgba(255,255,255,0.04)', color: 'var(--snp-dim)' }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ============ 结果网格 ============ */}
        {loading && !data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="snp-panel aspect-[3/4] animate-pulse" style={{ opacity: 0.4 }} />
            ))}
          </div>
        ) : hits.length === 0 ? (
          <div className="snp-panel flex flex-col items-center justify-center gap-2 py-20 text-center">
            <Crosshair size={30} style={{ color: 'var(--snp-dim)' }} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--snp-text)' }}>该分类暂无命中目标</p>
            <p className="text-[12px]" style={{ color: 'var(--snp-dim)' }}>切换分类或重新扫描大盘试试</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {hits.map((c, i) => (
              <CardTile key={c.tokenId || c.cert || i} card={c} tier={tier} index={i} />
            ))}
          </div>
        )}

        {/* ============ 连号全景 ============ */}
        {tier === 'chain' && data && data.chains.length > 0 && (
          <div className="snp-panel mt-8 p-5">
            <div className="mb-3 flex items-center gap-2 text-[14px] font-bold" style={{ color: 'var(--snp-cyan)' }}>
              <Link2 size={16} /> 连号序列全景 · {data.chains.length} 条
            </div>
            <div className="space-y-2">
              {data.chains.map((ch, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2.5" style={{ background: 'rgba(34,224,224,0.06)' }}>
                  <span className="snp-mono rounded-md px-2 py-1 text-[12px] font-bold" style={{ background: 'rgba(34,224,224,0.15)', color: 'var(--snp-cyan)' }}>{ch.length} 连</span>
                  <span className="snp-mono text-[12px]" style={{ color: 'var(--snp-text)' }}>{ch.head} → {ch.tail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ 监控库抽屉 ============ */}
      {dbOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setDbOpen(false)}>
          <div className="h-full w-full max-w-[440px] overflow-y-auto p-5" style={{ background: '#0b0d16', borderLeft: '1px solid var(--snp-line)' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[15px] font-bold" style={{ color: '#fff' }}>
                <Database size={17} style={{ color: 'var(--snp-gold)' }} /> 天命规则库
              </div>
              <button onClick={() => setDbOpen(false)} className="rounded-lg p-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X size={16} color="#fff" />
              </button>
            </div>
            {!db ? (
              <p className="text-[13px]" style={{ color: 'var(--snp-dim)' }}>加载中…</p>
            ) : (
              <div className="space-y-5">
                {(['pokemon', 'onepiece', 'yugioh'] as const).map((g) => (
                  <div key={g}>
                    <div className="mb-2 flex items-center gap-2 text-[13px] font-bold" style={{ color: GAME_META[g].color }}>
                      {GAME_META[g].label}
                      <span className="snp-mono text-[11px]" style={{ color: 'var(--snp-dim)' }}>{db.counts[g]} 条规则</span>
                    </div>
                    <div className="space-y-1.5">
                      {db[g].slice(0, 40).map((r, i) => (
                        <div key={i} className="rounded-lg p-2.5 text-[12px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold" style={{ color: 'var(--snp-text)' }}>{r.keywords[0]}</span>
                            <span className="snp-mono" style={{ color: GAME_META[g].color }}>···{r.suffixes.join(' / ')}</span>
                          </div>
                          <div className="mt-1 leading-snug" style={{ color: 'var(--snp-dim)' }}>{r.lore}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
