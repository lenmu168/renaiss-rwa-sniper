// =====================================================================
// Renaiss 数据源 —— 直接调用 HTTP API（GET https://api.renaiss.xyz/v0/marketplace）
//   · api.renaiss.xyz 的 WAF 会拦截数据中心/服务器 IP（返回 403），
//     因此直连失败时自动改走 r.jina.ai 只读代理兜底（住宅出口，可绕过 WAF）。
//   · 图片 URL 由 Serial 直接推导；部分卡为银标变体，前端加载失败时回退。
// =====================================================================
const API_BASE = process.env.RENAISS_API_URL || 'https://api.renaiss.xyz'
const IMG_BASE =
  'https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders'

const BROWSER_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  origin: 'https://www.renaiss.xyz',
  referer: 'https://www.renaiss.xyz/',
}

async function fetchDirect(url, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: ctrl.signal })
    if (!res.ok) {
      const err = new Error(`Renaiss API ${res.status}`)
      err.status = res.status
      throw err
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchViaProxy(url, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    // Jina Reader：返回 { code, data: { content: "<原始响应体字符串>" } }
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { accept: 'application/json', 'x-respond-with': 'no-content' },
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`代理 ${res.status}`)
    const env = await res.json()
    const content = env && env.data && env.data.content
    if (!content) throw new Error('代理返回为空')
    return JSON.parse(content)
  } finally {
    clearTimeout(timer)
  }
}

async function apiGet(pathname, query = {}, timeoutMs = 20000) {
  const url = new URL(pathname, API_BASE)
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }
  const href = url.toString()
  try {
    return await fetchDirect(href, timeoutMs)
  } catch (err) {
    // WAF 拦截（403）或直连异常 → 走代理兜底
    return await fetchViaProxy(href, Math.max(timeoutMs, 30000))
  }
}

function inferGame(name = '', setName = '') {
  const t = `${name} ${setName}`.toUpperCase()
  if (t.includes('ONE PIECE') || t.includes('ONE_PIECE')) return 'onepiece'
  if (t.includes('YU-GI-OH') || t.includes('YUGIOH') || t.includes('YU GI OH')) return 'yugioh'
  return 'pokemon'
}

function normalize(item) {
  const attrs = item.attributes || []
  const serialAttr = attrs.find((a) => a.trait === 'Serial')
  const langAttr = attrs.find((a) => a.trait === 'Language')
  const serial = serialAttr ? serialAttr.value : ''
  const cert = serial.replace(/\D/g, '') // 纯数字证书号，供引擎碰撞
  const askUSDT = item.askPriceInUSDT ? Number(item.askPriceInUSDT) / 1e18 : 0
  // fmvPriceInUSD 单位是「美分」，需 /100 才是美元（11800 => $118.00）
  const fmvUsd = item.fmvPriceInUSD ? Number(item.fmvPriceInUSD) / 100 : 0
  const game = inferGame(item.name, item.setName)

  return {
    tokenId: item.tokenId,
    serial,
    cert,
    // Renaiss 官网单卡页面，可直接点进去查看/购买
    url: item.tokenId ? `https://www.renaiss.xyz/card/${item.tokenId}` : null,
    name: item.name || '',
    setName: item.setName || '',
    cardNumber: item.cardNumber || '',
    character: item.pokemonName || '',
    company: item.gradingCompany || 'PSA',
    grade: item.grade || '',
    year: item.year || null,
    language: langAttr ? langAttr.value : '',
    askUSDT,
    fmvUsd,
    priceValue: fmvUsd || askUSDT,
    game,
    // 默认渲染图；部分卡为银标变体，前端加载失败时回退到 imageFallback
    image: serial ? `${IMG_BASE}/${serial}/nft_image.jpg` : null,
    imageFallback: serial ? `${IMG_BASE}/${serial}/nft_image_silver.jpg` : null,
    imageStandalone: serial ? `${IMG_BASE}/${serial}/nft_image_standalone.png` : null,
  }
}

// 拉取整个已挂单大盘（自动翻页），返回 { cards, listedTotal }
async function fetchListedMarket({ maxPages = 12, limit = 100 } = {}) {
  const out = []
  let listedTotal = 0
  for (let page = 0; page < maxPages; page++) {
    const offset = page * limit
    const data = await apiGet('/v0/marketplace', {
      listedOnly: true,
      sortBy: 'listDate',
      sortOrder: 'desc',
      limit,
      offset,
    })
    if (data.pagination && typeof data.pagination.total === 'number') {
      listedTotal = data.pagination.total
    }
    const collection = data.collection || []
    for (const it of collection) {
      const n = normalize(it)
      // 与脚本一致：只保留 7~10 位合法证书号
      if (n.cert && n.cert.length >= 7 && n.cert.length <= 10) out.push(n)
    }
    const hasMore = data.pagination && data.pagination.hasMore
    if (!hasMore || collection.length === 0) break
  }
  return { cards: out, listedTotal }
}

module.exports = { fetchListedMarket, apiGet, IMG_BASE }
