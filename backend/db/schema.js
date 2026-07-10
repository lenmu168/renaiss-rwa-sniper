// RENAISS 狙击终端 —— 累积库
// 每张扫到的卡持久化存储：只增不删，重新上架/下架只更新 listed 状态。
const { pgTable, text, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core')

exports.market_cards = pgTable('market_cards', {
  token_id: text('token_id').primaryKey(),
  cert: text('cert'),
  serial: text('serial'),
  listed: boolean('listed').default(true),
  data: jsonb('data'),
  first_seen: timestamp('first_seen').defaultNow(),
  last_seen: timestamp('last_seen').defaultNow(),
})
