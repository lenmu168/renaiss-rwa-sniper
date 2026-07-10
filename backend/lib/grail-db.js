// =====================================================================
// 🌟 RENAISS 核心神卡资产数据库 (GRAIL DB)
// 直接从用户脚本 psa_sniper.py 1:1 移植，勿改判定含义。
// 每条：{ keywords, target_cert_suffixes, lore_description }
//   · keywords 需全部命中卡名（不区分大小写）
//   · 证书末 3 位或末 4 位命中 target_cert_suffixes 即算天命
// =====================================================================

const POKEMON_GRAIL_DATABASE = {
  // ---------------- 原有核心神卡 ----------------
  Base_Charizard: {
    keywords: ['Charizard', 'Base'],
    target_cert_suffixes: ['006', '0006'],
    lore_description: '全国图鉴 #006 完美匹配 (初代喷火龙圣杯)',
  },
  Carddass_148: {
    keywords: ['Carddass', '148'],
    target_cert_suffixes: ['148'],
    lore_description: '卡片自身卡号 #148 完美匹配 (复古硬通货)',
  },
  Mewtwo_General: {
    keywords: ['Mewtwo'],
    target_cert_suffixes: ['150'],
    lore_description: '全国图鉴 #150 完美匹配 (超梦高溢价)',
  },

  // ---------------- 人气家族与神兽系列 ----------------
  Pikachu_Series: {
    keywords: ['Pikachu'],
    target_cert_suffixes: ['025', '0025', '2525'],
    lore_description: '全国图鉴 #025 (皮卡丘家族本命 / 极品叠号)',
  },
  Eevee_Series: {
    keywords: ['Eevee'],
    target_cert_suffixes: ['133', '0133'],
    lore_description: '全国图鉴 #133 (伊布本传天命号)',
  },
  Umbreon_Series: {
    keywords: ['Umbreon'],
    target_cert_suffixes: ['197', '0197'],
    lore_description: '全国图鉴 #197 (月亮伊布天命号 / 现代神卡预警!)',
  },
  Sylveon_Series: {
    keywords: ['Sylveon'],
    target_cert_suffixes: ['700', '0700'],
    lore_description: '全国图鉴 #700 (仙子伊布本命 / 完美整百序列号)',
  },
  Rayquaza_Series: {
    keywords: ['Rayquaza'],
    target_cert_suffixes: ['384', '0384'],
    lore_description: '全国图鉴 #384 (天空之神烈空坐天命匹配)',
  },
  Lugia_Series: {
    keywords: ['Lugia'],
    target_cert_suffixes: ['249', '0249'],
    lore_description: '全国图鉴 #249 (海神洛奇亚天命匹配)',
  },

  // ---------------- 顶级妹卡 / 女性训练家 (Waifu Series) ----------------
  Waifu_Lillie: {
    keywords: ['Lillie'],
    target_cert_suffixes: ['520', '0520', '1314', '888', '8888'],
    lore_description: '顶级妹卡 [莉莉艾] 命中浪漫天命号 (520/1314) 或 极品发财号 (888)',
  },
  Waifu_Marnie: {
    keywords: ['Marnie'],
    target_cert_suffixes: ['520', '0520', '1314', '888', '8888'],
    lore_description: '顶级妹卡 [玛俐] 命中浪漫天命号 (520/1314) 或 极品发财号 (888)',
  },
  Waifu_Erika: {
    keywords: ['Erika'],
    target_cert_suffixes: ['520', '0520', '1314', '888', '8888'],
    lore_description: '顶级妹卡 [艾莉嘉] 命中浪漫天命号 (520/1314) 或 极品发财号 (888)',
  },
  Waifu_Modern_Stars: {
    keywords: ['Iono'],
    target_cert_suffixes: ['520', '0520', '1314', '888', '8888'],
    lore_description: '高人气妹卡 [奇树 Iono] 命中浪漫天命号 (520/1314)',
  },
  Waifu_Rosa: {
    keywords: ['Rosa'],
    target_cert_suffixes: ['520', '0520', '1314', '888', '8888'],
    lore_description: '高人气妹卡 [鸣依 Rosa] 命中浪漫天命号 (520/1314)',
  },
  Waifu_Serena: {
    keywords: ['Serena'],
    target_cert_suffixes: ['520', '0520', '1314', '888', '8888'],
    lore_description: '高人气妹卡 [莎莉娜 Serena] 命中浪漫天命号 (520/1314)',
  },
}

const ONE_PIECE_GRAIL_DATABASE = {
  Manga_Luffy: {
    keywords: ['Luffy', 'Manga', 'OP05'],
    target_cert_suffixes: ['0505', '3000'],
    lore_description: '5月5日生日匹配 或 30亿最终悬赏金顶点匹配',
  },
  Manga_Shanks: {
    keywords: ['Shanks', 'Manga', 'OP01'],
    target_cert_suffixes: ['0309', '4048'],
    lore_description: '3月9日生日匹配 或 40亿4890万四皇悬赏金匹配',
  },
  Manga_Zoro: {
    keywords: ['Zoro', 'Manga', 'OP06'],
    target_cert_suffixes: ['1111'],
    lore_description: '11月11日生日匹配 (纯四豹子号降临)',
  },
  Manga_Ace: {
    keywords: ['Ace', 'Manga', 'OP02'],
    target_cert_suffixes: ['0101', '0550'],
    lore_description: '1月1日生日匹配 或 5亿5000万悬赏金匹配',
  },
}

const YUGIOH_GRAIL_DATABASE = {
  Blue_Eyes_White_Dragon: {
    keywords: ['Blue-Eyes', 'White Dragon'],
    target_cert_suffixes: ['3000', '1025'],
    lore_description: '攻击力 3000 完美匹配，或 海马濑人 10月25日 生日匹配',
  },
}

module.exports = {
  POKEMON_GRAIL_DATABASE,
  ONE_PIECE_GRAIL_DATABASE,
  YUGIOH_GRAIL_DATABASE,
}
