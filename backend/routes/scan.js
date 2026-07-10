// =====================================================================
// GET /api/scan          扫描大盘 → 天命神卡 / 靓号 / 连号
//   ?mode=all|live       all=累积库（历史全量）, live=仅当前在售
//   ?refresh=1           强制重新拉取（否则 3 分钟缓存）
// GET /api/scan/database  返回天命规则库（用于「监控库」抽屉）
// =====================================================================
const { Router } = require('express')
const { dbQuery } = require('@surf-ai/sdk/db')
const { fetchListedMarket } = require('../lib/renaiss')
const { runCollision } = require('../lib/engine')
const {
  POKEMON_GRAIL_DATABASE,
  ONE_PIECE_GRAIL_DATABASE,
  YUGIOH_GRAIL_DATABASE,
} = require('../lib/grail-db')

const router = Router()

// ---- 内存缓存：避免频繁打大盘 ----
let cache = { at: 0, live: [], listedTotal: 0 }
const TTL = 3 * 60 * 1000

// ---- 内存累积库兜底：托管数据库额度不足 / 不可用时仍能提供「累积库」视图 ----
const memStore = new Map() // tokenId -> { data, listed, firstSeen }
let dbHealthy = true

// dbQuery 包一层：任何失败（含 402 额度不足）都不影响实时扫描
async function safeDbQuery(sql, params) {
  try {
    const r = await dbQuery(sql, params)
    if (!dbHealthy) console.warn('[scan] 数据库恢复可用')
    dbHealthy = true
    return r
  } catch (err) {
    if (dbHealthy) console.warn('[scan] 数据库不可用，降级为内存模式:', String(err && err.message || err))
    dbHealthy = false
    return null
  }
}

async function refreshMarket(force) {
  const fresh = Date.now() - cache.at < TTL
  if (!force && fresh && cache.live.length) return cache

  const { cards, listedTotal } = await fetchListedMarket({ maxPages: 12, limit: 100 })
  cache = { at: Date.now(), live: cards, listedTotal }

  if (!cards.length) return cache
  const valid = cards.filter((c) => c.tokenId)

  // 先更新内存累积库（始终可用）：本次在售 listed=true，其余标记 false
  const now = Date.now()
  for (const rec of memStore.values()) rec.listed = false
  const liveIds = new Set(valid.map((c) => c.tokenId))
  for (const c of valid) {
    const prev = memStore.get(c.tokenId)
    memStore.set(c.tokenId, {
      data: c,
      listed: true,
      firstSeen: prev ? prev.firstSeen : now,
    })
  }
  void liveIds

  // 尝试写入托管数据库；失败则静默降级，实时扫描不受影响
  const cleared = await safeDbQuery('UPDATE market_cards SET listed = false')
  if (cleared) {
    const CHUNK = 200
    for (let i = 0; i < valid.length; i += CHUNK) {
      const chunk = valid.slice(i, i + CHUNK)
      const rows = []
      const params = []
      chunk.forEach((c, j) => {
        const b = j * 4
        rows.push(`($${b + 1}, $${b + 2}, $${b + 3}, true, $${b + 4}, now(), now())`)
        params.push(c.tokenId, c.cert, c.serial, JSON.stringify(c))
      })
      await safeDbQuery(
        `INSERT INTO market_cards (token_id, cert, serial, listed, data, first_seen, last_seen)
         VALUES ${rows.join(',')}
         ON CONFLICT (token_id) DO UPDATE
           SET listed = true, cert = EXCLUDED.cert, serial = EXCLUDED.serial,
               data = EXCLUDED.data, last_seen = now()`,
        params
      )
    }
  }
  return cache
}

async function loadStore() {
  const r = await safeDbQuery(
    'SELECT data, listed, first_seen FROM market_cards ORDER BY last_seen DESC'
  )
  if (r && r.rows.length) {
    return r.rows.map((row) => {
      const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      return { ...d, listed: row.listed, firstSeen: row.first_seen }
    })
  }
  // 降级：用内存累积库
  return [...memStore.values()].map((rec) => ({
    ...rec.data,
    listed: rec.listed,
    firstSeen: rec.firstSeen ? new Date(rec.firstSeen).toISOString() : null,
  }))
}

router.get('/', async (req, res) => {
  try {
    const mode = req.query.mode === 'live' ? 'live' : 'all'
    const force = req.query.refresh === '1' || req.query.refresh === 'true'
    const snap = await refreshMarket(force)

    // 标记「本次新出现」的 tokenId（用于 NEW 徽标）
    const store = await loadStore()
    const dataset = mode === 'live' ? snap.live : store

    const result = runCollision(dataset)

    // 新挂单：first_seen 在最近 10 分钟内
    const newCutoff = Date.now() - 10 * 60 * 1000
    const isNewToken = new Set(
      store
        .filter((c) => c.firstSeen && new Date(c.firstSeen).getTime() > newCutoff)
        .map((c) => c.tokenId)
    )
    const tag = (arr) =>
      arr.map((c) => ({ ...c, isNew: isNewToken.has(c.tokenId) }))

    const grailHits = tag(result.grailHits)
    const fancyHits = tag(result.fancyHits)
    const chainHits = tag(result.chainHits)

    res.json({
      source: 'renaiss',
      mode,
      scannedAt: new Date().toISOString(),
      cached: !force && Date.now() - snap.at > 500,
      stats: {
        total: dataset.length,
        library: store.length,
        listed: snap.listedTotal || snap.live.length,
        grail: grailHits.length,
        fancy: fancyHits.length,
        chain: chainHits.length,
        chainSeries: result.chains.length,
        newHits: grailHits.filter((c) => c.isNew).length
          + fancyHits.filter((c) => c.isNew).length,
      },
      grailHits,
      fancyHits,
      chainHits,
      chains: result.chains,
    })
  } catch (err) {
    console.error('[scan] failed:', err)
    res.status(502).json({ error: 'Renaiss 大盘拉取失败', detail: String(err && err.message || err) })
  }
})

// 天命规则库（扁平化）
router.get('/database', (req, res) => {
  const flat = (db, game) =>
    Object.values(db).map((r) => ({
      game,
      keywords: r.keywords,
      suffixes: r.target_cert_suffixes,
      lore: r.lore_description,
    }))
  res.json({
    pokemon: flat(POKEMON_GRAIL_DATABASE, 'pokemon'),
    onepiece: flat(ONE_PIECE_GRAIL_DATABASE, 'onepiece'),
    yugioh: flat(YUGIOH_GRAIL_DATABASE, 'yugioh'),
    counts: {
      pokemon: Object.keys(POKEMON_GRAIL_DATABASE).length,
      onepiece: Object.keys(ONE_PIECE_GRAIL_DATABASE).length,
      yugioh: Object.keys(YUGIOH_GRAIL_DATABASE).length,
    },
  })
})

module.exports = router
