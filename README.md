# RENAISS RWA Sniper Terminal · 狙击终端

> **A real-time sniping tool for the [Renaiss](https://www.renaiss.xyz) graded-card (PSA / CGC / BGS) RWA marketplace.**
> It scans every card's **certificate serial number** to surface three tiers of high-value targets — **Grail Cards · Fancy Numbers · Consecutive Chains** — and flags **premium / discount** vs. FMV so you can instantly spot cards listed below market value.

![tier](https://img.shields.io/badge/tiers-Grail%20·%20Fancy%20·%20Chain-ff2f8e) ![data](https://img.shields.io/badge/data-Renaiss%20Marketplace%20(real)-22e0e0) ![stack](https://img.shields.io/badge/stack-React%2019%20·%20Vite%20·%20Express-8b93ff)

**Language:** [English](#english) · [中文](#中文)

---

## English

### ✨ Features

| Tier | Description |
| --- | --- |
| 🐉 **Grail Cards** | Last 3/4 digits of the cert match a "destiny number" — Pokémon National Dex (Charizard #006, Mewtwo #150, Umbreon #197, Lugia #249…), One Piece birthdays/bounties, Yu-Gi-Oh ATK values, and waifu romance numbers (520 / 1314 / 888) |
| 🎯 **Fancy Numbers** | Repeated runs `(\d)\1{2,}`, 4–6 digit ascending/descending straights, full or last-5 palindromes (radar numbers) |
| 🔗 **Consecutive Chains** | Certs that run consecutively across current listings (chain length ≥ 2), tagged as double / triple / bundle series |
| 💰 **FMV Premium/Discount** | Each card compares ask price vs. FMV estimate — green discount / pink premium — to lock in below-market snipes |
| 📦 **Accumulation Library** | Every scanned asset is persisted, **append-only** (never deleted), so you can review delisted gems; a "Live" mode shows only current listings |
| 🖼️ **Real Card Art + Deep Links** | Renders each card's own official image; click a card to open its Renaiss page directly |

All data comes from the **official Renaiss Marketplace API** (`api.renaiss.xyz`) — **no fabricated cards**.

### 🖥️ Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4, dark neon theme (custom `.snp-*` holographic slab visuals)
- **Backend**: Express (`@surf-ai/sdk/server` auto-mounts `backend/routes/*.js` → `/api/{name}`)
- **Database**: Postgres (Drizzle schema, `dbQuery` from `@surf-ai/sdk/db`) as the accumulation library
- **Data source**: Renaiss HTTP API + `r.jina.ai` read-only proxy fallback (bypasses the WAF that blocks datacenter IPs)
- **Collision engine**: ported 1:1 from the original `psa_sniper.py` to JS (`backend/lib/engine.js`)

### 📁 Project Structure

```
.
├── backend/
│   ├── db/schema.js            # accumulation table market_cards (Drizzle)
│   ├── lib/
│   │   ├── grail-db.js         # grail databases (Pokémon / One Piece / Yu-Gi-Oh)
│   │   ├── engine.js           # collision engine: grail / fancy / chain
│   │   └── renaiss.js          # Renaiss API client (direct + proxy fallback)
│   └── routes/
│       └── scan.js             # GET /api/scan, GET /api/scan/database
├── frontend/
│   └── src/
│       ├── App.tsx             # main dashboard
│       ├── lib/scan.ts         # types + fetch helpers + display utils
│       └── components/sniper/
│           ├── CardTile.tsx    # single card (slab + hit rules + premium/discount)
│           └── SlabArt.tsx     # real card art + graceful fallback
└── README.md
```

### 🚀 Local Setup

> Prerequisites: [Bun](https://bun.sh) (or Node 18+) and a Postgres connection (auto-provisioned by the Surf SDK).

```bash
# 1. Install dependencies
cd backend  && bun install
cd ../frontend && bun install

# 2. Configure backend env
cp backend/.env.example backend/.env
# fill in SURF_API_KEY etc. (injected by the platform, see below)

# 3. Run
cd backend  && bun run dev      # Express on port 3001
cd frontend && bun run dev      # Vite on port 5173
```

Open `http://localhost:5173/` to see the terminal. The first visit auto-scans the marketplace and builds the accumulation library.

**Environment variables**

| Variable | Purpose |
| --- | --- |
| `BACKEND_PORT` | Backend Express port (default 3001) |
| `PORT` | Vite frontend port (default 5173) |
| `SURF_API_KEY` | Surf SDK auth (DB provisioning, etc.) |
| `RENAISS_API_URL` | Optional override of the Renaiss API base (default `https://api.renaiss.xyz`) |

### 🔌 API

**`GET /api/scan`** — scan the marketplace and run the collision engine.

| Param | Values | Description |
| --- | --- | --- |
| `mode` | `all` \| `live` | `all` = accumulation library (default); `live` = current listings only |
| `refresh` | `1` | Force refetch (otherwise 3-minute cache) |

Returns: `{ stats, grailHits, fancyHits, chainHits, chains }`; each hit includes `cert / name / image / url / fmvUsd / askUSDT / rules`.

**`GET /api/scan/database`** — returns the grail rule library (for the "Watchlist" drawer): `{ pokemon, onepiece, yugioh, counts }`.

### 🧬 Detection Rules (from psa_sniper.py)

- **Grail**: all `keywords` present in the card name (case-insensitive) **and** the last 3 or 4 cert digits ∈ `target_cert_suffixes`
- **Fancy**: 3+ repeated digits / 4–6 digit straights / palindromes (full string or last 5)
- **Chain**: after sorting certs, any `n → n+1` run of length ≥ 2

To add a new target, edit `backend/lib/grail-db.js` following the existing entry format.

### 🔗 Links

- Renaiss: https://www.renaiss.xyz
- Renaiss Marketplace API: `https://api.renaiss.xyz/v0/marketplace`
- Live demo: `<fill in after deploy>`
- Submission repo: `<GitHub repo URL>`

### 📄 License

MIT

---

## 中文

### ✨ 核心功能

| 档位 | 说明 |
| --- | --- |
| 🐉 **天命神卡** | 证书号末 3/4 位命中「命运数字」——宝可梦全国图鉴号（喷火龙 #006、超梦 #150、月亮伊布 #197、洛奇亚 #249…）、海贼王生日/悬赏金、游戏王攻击力、以及妹卡浪漫号（520 / 1314 / 888） |
| 🎯 **极品靓号** | 豹子号 `(\d)\1{2,}`、4~6 连顺子 / 倒顺号、全对称 / 尾 5 位雷达号 |
| 🔗 **连号序列** | 同场挂单中证书号连续（≥2 即成链），标记双连 / 三连 / 大组捆绑 |
| 💰 **FMV 溢价折价** | 每张卡对比挂单价与市价估值 FMV，绿色折价 / 粉色溢价，锁定低于市价的狙击目标 |
| 📦 **累积库** | 扫到的资产持久入库、**只增不减**，可回看已下架珍品；另有「在售」模式只看当前挂单 |
| 🖼️ **真实卡图 + 直达链接** | 展示每张卡自身的官方渲染图，点击卡片直达 Renaiss 官网对应卡牌页 |

数据全部来自 **Renaiss 官方 Marketplace API**（`api.renaiss.xyz`），无任何虚构卡牌。

### 🖥️ 技术栈

- **前端**：React 19 + Vite + Tailwind CSS 4，暗黑霓虹主题（自定义 `.snp-*` 全息卡砖视觉）
- **后端**：Express（`@surf-ai/sdk/server` 自动挂载 `backend/routes/*.js` → `/api/{name}`）
- **数据库**：Postgres（Drizzle schema，`@surf-ai/sdk/db` 的 `dbQuery`）用作累积库
- **数据源**：Renaiss HTTP API + `r.jina.ai` 只读代理兜底（绕过数据中心 IP 的 WAF 拦截）
- **碰撞引擎**：由原始 `psa_sniper.py` 1:1 移植为 JS（`backend/lib/engine.js`）

### 📁 目录结构

```
.
├── backend/
│   ├── db/schema.js            # 累积库表 market_cards (Drizzle)
│   ├── lib/
│   │   ├── grail-db.js         # 天命神卡数据库（宝可梦 / 海贼王 / 游戏王）
│   │   ├── engine.js           # 碰撞引擎：天命 / 靓号 / 连号
│   │   └── renaiss.js          # Renaiss API 客户端（直连 + 代理兜底）
│   └── routes/
│       └── scan.js             # GET /api/scan、GET /api/scan/database
├── frontend/
│   └── src/
│       ├── App.tsx             # 主仪表盘
│       ├── lib/scan.ts         # 类型 + fetch 封装 + 展示辅助
│       └── components/sniper/
│           ├── CardTile.tsx    # 单卡（全息卡砖 + 命中规则 + 溢价折价）
│           └── SlabArt.tsx     # 真实卡图 + 逐级回退
└── README.md
```

### 🚀 本地运行

> 前置：[Bun](https://bun.sh)（或 Node 18+）、一个 Postgres 连接（Surf SDK 会自动置备）。

```bash
# 1. 安装依赖
cd backend  && bun install
cd ../frontend && bun install

# 2. 配置环境变量（后端）
cp backend/.env.example backend/.env
# 按需填入 SURF_API_KEY 等（由平台注入，见下）

# 3. 启动
cd backend  && bun run dev      # Express，端口 3001
cd frontend && bun run dev      # Vite，端口 5173
```

打开 `http://localhost:5173/` 即可看到狙击终端。首次进入会自动扫描大盘并建立累积库。

**环境变量**

| 变量 | 用途 |
| --- | --- |
| `BACKEND_PORT` | 后端 Express 端口（默认 3001） |
| `PORT` | Vite 前端端口（默认 5173） |
| `SURF_API_KEY` | Surf SDK 鉴权（数据库置备等） |
| `RENAISS_API_URL` | 可选，覆盖 Renaiss API 基址（默认 `https://api.renaiss.xyz`） |

### 🔌 API

**`GET /api/scan`** —— 扫描大盘并跑碰撞引擎。

| 参数 | 值 | 说明 |
| --- | --- | --- |
| `mode` | `all` \| `live` | `all`=累积库（默认）；`live`=仅当前在售 |
| `refresh` | `1` | 强制重新拉取（否则 3 分钟缓存） |

返回：`{ stats, grailHits, fancyHits, chainHits, chains }`，每张命中卡含 `cert / name / image / url / fmvUsd / askUSDT / rules`。

**`GET /api/scan/database`** —— 返回天命规则库（用于前端「监控库」抽屉）：`{ pokemon, onepiece, yugioh, counts }`。

### 🧬 判定规则（源自 psa_sniper.py）

- **天命神卡**：`keywords` 全部命中卡名（不区分大小写）**且** 证书末 3 位或末 4 位 ∈ `target_cert_suffixes`
- **靓号**：豹子号 3+ 连同 / 顺子·倒顺 4~6 连 / 回文对称（全串或尾 5 位）
- **连号**：证书号排序后按 `n → n+1` 连续成链，长度 ≥2 即记

想新增监控目标，直接编辑 `backend/lib/grail-db.js`，按现有条目格式添加即可（含保姆级注释）。

### 🔗 相关链接

- Renaiss 官网：https://www.renaiss.xyz
- Renaiss Marketplace API：`https://api.renaiss.xyz/v0/marketplace`
- 在线 Demo：`<部署后填入>`
- 提交仓库：`<GitHub 仓库地址>`

### 📄 License

MIT
