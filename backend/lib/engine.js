// =====================================================================
// 碰撞引擎 —— 从 psa_sniper.py 1:1 移植
//   · analyzeLoreGrails  天命神卡（末3/末4位命中）
//   · analyzeFancyRules  豹子 / 顺子 / 倒顺 / 对称雷达
//   · detectChains       连号序列（≥2 即成链）
//   · runCollision       三档独立命中（一张卡可同时上榜）
// =====================================================================
const {
  POKEMON_GRAIL_DATABASE,
  ONE_PIECE_GRAIL_DATABASE,
  YUGIOH_GRAIL_DATABASE,
} = require('./grail-db')

const isDigits = (s) => typeof s === 'string' && s.length > 0 && /^\d+$/.test(s)

// ---------- 👑 天命神卡 ----------
function analyzeLoreGrails(cert, name) {
  if (!isDigits(cert)) return []
  const rules = []
  const nameUpper = (name || '').toUpperCase()
  const suffix3 = cert.length >= 3 ? cert.slice(-3) : cert
  const suffix4 = cert.length >= 4 ? cert.slice(-4) : cert

  const scan = (db, icon, label) => {
    for (const cfg of Object.values(db)) {
      const allKw = cfg.keywords.every((kw) => nameUpper.includes(kw.toUpperCase()))
      if (!allKw) continue
      if (cfg.target_cert_suffixes.includes(suffix3) || cfg.target_cert_suffixes.includes(suffix4)) {
        rules.push({ icon, label, text: cfg.lore_description })
      }
    }
  }
  scan(POKEMON_GRAIL_DATABASE, '🐉', '宝可梦天命')
  scan(ONE_PIECE_GRAIL_DATABASE, '🏴‍☠️', '海贼王天命')
  scan(YUGIOH_GRAIL_DATABASE, '👁️‍🗨️', '游戏王天命')
  return rules
}

// ---------- 🌟 极品靓号 ----------
function analyzeFancyRules(cert) {
  if (!isDigits(cert)) return []
  const rules = []

  // 1. 豹子号（3+ 连同）
  const rep = cert.match(/(\d)\1{2,}/)
  if (rep) {
    const l = rep[0].length
    if (cert.endsWith(rep[0])) rules.push(`🐆 尾部 ${l} 连豹子号 (${rep[0]})`)
    else rules.push(`🐆 包含 ${l} 连豹子号 (${rep[0]})`)
  }

  // 2. 顺子号 / 倒顺号
  const inc = '0123456789'
  const dec = '9876543210'
  for (const length of [6, 5, 4]) {
    let found = false
    for (let i = 0; i <= inc.length - length; i++) {
      const seq = inc.slice(i, i + length)
      if (cert.includes(seq)) { rules.push(`🐉 ${length} 连顺子号 (${seq})`); found = true; break }
    }
    if (found) break
  }
  for (const length of [6, 5, 4]) {
    let found = false
    for (let i = 0; i <= dec.length - length; i++) {
      const seq = dec.slice(i, i + length)
      if (cert.includes(seq)) { rules.push(`🐉 ${length} 连倒顺号 (${seq})`); found = true; break }
    }
    if (found) break
  }

  // 3. 对称雷达号
  const rev = cert.split('').reverse().join('')
  if (cert === rev && cert.length >= 5) {
    rules.push(`🎯 极品全对称雷达号 (${cert})`)
  } else if (cert.length >= 6) {
    const t5 = cert.slice(-5)
    if (t5 === t5.split('').reverse().join('')) rules.push(`🎯 尾部 5 位雷达号 (${t5})`)
  }

  return [...new Set(rules)]
}

// ---------- 🔗 连号序列（≥2 即成链）----------
function zfill(str, len) {
  return str.length >= len ? str : '0'.repeat(len - str.length) + str
}

function detectChains(certKeys) {
  const keys = [...new Set(certKeys.filter(isDigits))].sort((a, b) => {
    const A = BigInt(a)
    const B = BigInt(b)
    return A < B ? -1 : A > B ? 1 : 0
  })
  const certSet = new Set(keys)
  const visited = new Set()
  const rawChains = []

  for (const c of keys) {
    if (visited.has(c)) continue
    const chain = [c]
    let next = zfill(String(BigInt(c) + 1n), c.length)
    while (certSet.has(next)) {
      chain.push(next)
      visited.add(next)
      next = zfill(String(BigInt(next) + 1n), c.length)
    }
    if (chain.length >= 2) rawChains.push(chain)
  }

  const chainMap = {}
  for (const chain of rawChains) {
    const desc = chain.join(' → ')
    for (let idx = 0; idx < chain.length; idx++) {
      const c = chain[idx]
      let text
      if (chain.length === 2) text = `🔗 所属双连号序列: ${desc}`
      else if (chain.length === 3) text = `🔥 所属三连号序列: ${desc}`
      else text = `💥 所属大组捆绑序列: ${desc}`
      chainMap[c] = {
        index: idx + 1,
        length: chain.length,
        head: chain[0],
        tail: chain[chain.length - 1],
        members: chain,
        text,
      }
    }
  }

  const chains = rawChains.map((ch) => ({
    length: ch.length,
    head: ch[0],
    tail: ch[ch.length - 1],
    members: ch,
  }))
  // 长链优先展示
  chains.sort((a, b) => b.length - a.length)
  return { chains, chainMap }
}

// ---------- 汇总（三档独立）----------
function runCollision(marketData) {
  const certKeys = marketData.map((c) => c.cert).filter(Boolean)
  const { chains, chainMap } = detectChains(certKeys)

  const grailHits = []
  const fancyHits = []
  const chainHits = []

  for (const card of marketData) {
    const g = analyzeLoreGrails(card.cert, card.name)
    if (g.length) grailHits.push({ ...card, rules: g })

    const f = analyzeFancyRules(card.cert)
    if (f.length) fancyHits.push({ ...card, rules: f })

    const chain = chainMap[card.cert]
    if (chain) chainHits.push({ ...card, chain })
  }

  const byPrice = (a, b) => (b.priceValue || 0) - (a.priceValue || 0)
  grailHits.sort(byPrice)
  fancyHits.sort(byPrice)
  chainHits.sort(byPrice)

  return { total: marketData.length, grailHits, fancyHits, chainHits, chains }
}

module.exports = { analyzeLoreGrails, analyzeFancyRules, detectChains, runCollision }
