import json
import re
import subprocess
import time
import os

CACHE_FILE = "market_cache.json"

# =====================================================================
# 🌟 RENAISS 核心神卡资产数据库 (GRAIL DB) - 【你可以在这里手动添加新卡！】
# =====================================================================
# 📚 如何添加新卡？ (保姆级教程)
# 1. 找好你要监控的卡，比如你想监控 "2024 Pokemon Pikachu Van Gogh Promo" (梵高皮卡丘)
# 2. 在下面对应的字典里 (比如 POKEMON_GRAIL_DATABASE) 加上一个新名字作为大括号。
# 3. "keywords" 填入它英文名字里的核心词，必须全是大写或小写，系统是不区分大小写的。
#    建议关键词少而精，比如 ["Pikachu", "Van Gogh", "Promo"]。
# 4. "target_cert_suffixes" 填入你想要监控的特殊 PSA 尾号。如果是梵高，可以填 ["1853"](梵高出生年) 
# 5. "lore_description" 写上这个尾号代表的意义，它会在你终端报警时显示出来。

POKEMON_GRAIL_DATABASE = {
    # ---------------- 原有核心神卡 ----------------
    "Base_Charizard": {
        "keywords": ["Charizard", "Base"], 
        "target_cert_suffixes": ["006", "0006"], 
        "lore_description": "全国图鉴 #006 完美匹配 (初代喷火龙圣杯)"
    },
    "Carddass_148": {
        "keywords": ["Carddass", "148"],
        "target_cert_suffixes": ["148"],
        "lore_description": "卡片自身卡号 #148 完美匹配 (复古硬通货)"
    },
    "Mewtwo_General": {
        "keywords": ["Mewtwo"],
        "target_cert_suffixes": ["150"],
        "lore_description": "全国图鉴 #150 完美匹配 (超梦高溢价)"
    },

    # ==================== 👇 全新加入：人气家族与神兽系列 ====================
    
    # 1. 皮卡丘大系 (涵盖所有皮卡丘、换装皮卡丘、特典卡)
    "Pikachu_Series": {
        "keywords": ["Pikachu"], 
        "target_cert_suffixes": ["025", "0025", "2525"], # 025是图鉴本命，2525是巨鲸最爱的叠词双杀号
        "lore_description": "全国图鉴 #025 (皮卡丘家族本命 / 极品叠号)"
    },
    
    # 2. 伊布本体 (Eevee)
    "Eevee_Series": {
        "keywords": ["Eevee"],
        "target_cert_suffixes": ["133", "0133"],
        "lore_description": "全国图鉴 #133 (伊布本传天命号)"
    },

    # 3. 月亮伊布 (Umbreon - 极度重要！)
    # 💡 注：月亮伊布是近年来宝可梦卡圈最贵的现代卡(如 Evolving Skies 苍响/月相大背头)，必须单独列出监控！
    "Umbreon_Series": {
        "keywords": ["Umbreon"],
        "target_cert_suffixes": ["197", "0197"],
        "lore_description": "全国图鉴 #197 (月亮伊布天命号 / 现代神卡预警!)"
    },

    # 4. 仙子伊布 (Sylveon - 猛男必收，极高人气)
    "Sylveon_Series": {
        "keywords": ["Sylveon"],
        "target_cert_suffixes": ["700", "0700"],
        "lore_description": "全国图鉴 #700 (仙子伊布本命 / 完美整百序列号)"
    },

    # 5. 烈空坐大系 (Rayquaza - 神兽界的保值王者)
    "Rayquaza_Series": {
        "keywords": ["Rayquaza"],
        "target_cert_suffixes": ["384", "0384"],
        "lore_description": "全国图鉴 #384 (天空之神烈空坐天命匹配)"
    },

# 6. 洛奇亚大系 (Lugia)
    "Lugia_Series": {
        "keywords": ["Lugia"],
        "target_cert_suffixes": ["249", "0249"],
        "lore_description": "全国图鉴 #249 (海神洛奇亚天命匹配)"
    }, # <--- 注意这里必须要有一个逗号！

    # ==================== 👇 全新加入：顶级妹卡/女性训练家 (Waifu Series) ====================
    # 💡 妹卡无图鉴编号，但碰到 "520", "1314", "0520" 等浪漫情话号，或 "888" 等发财号时，记录

    # 7. 莉莉艾大系 (Lillie - 整个宝可梦现代卡的绝对巅峰，黄昏莉莉艾/加油莉莉艾)
    "Waifu_Lillie": {
        "keywords": ["Lillie"],
        "target_cert_suffixes": ["520", "0520", "1314", "888", "8888"],
        "lore_description": "顶级妹卡 [莉莉艾] 命中浪漫天命号 (520/1314) 或 极品发财号 (888)"
    },

    # 8. 玛俐 (Marnie - 剑盾时代巅峰，高人气暗黑风)
    "Waifu_Marnie": {
        "keywords": ["Marnie"],
        "target_cert_suffixes": ["520", "0520", "1314", "888", "8888"],
        "lore_description": "顶级妹卡 [玛俐] 命中浪漫天命号 (520/1314) 或 极品发财号 (888)"
    },

    # 9. 艾莉嘉 (Erika - 初代关都巅峰，和服美人，老钱最爱)
    "Waifu_Erika": {
        "keywords": ["Erika"],
        "target_cert_suffixes": ["520", "0520", "1314", "888", "8888"],
        "lore_description": "顶级妹卡 [艾莉嘉] 命中浪漫天命号 (520/1314) 或 极品发财号 (888)"
    },

    # 10. 现代人气女团 (Iono 奇树 / Miriam 米莫莎 / Rosa 鸣依 / Serena 莎莉娜)
    "Waifu_Modern_Stars": {
        "keywords": ["Iono"], 
        "target_cert_suffixes": ["520", "0520", "1314", "888", "8888"],
        "lore_description": "高人气妹卡 [奇树 Iono] 命中浪漫天命号 (520/1314)"
    },
    "Waifu_Rosa": {
        "keywords": ["Rosa"], 
        "target_cert_suffixes": ["520", "0520", "1314", "888", "8888"],
        "lore_description": "高人气妹卡 [鸣依 Rosa] 命中浪漫天命号 (520/1314)"
    },
    "Waifu_Serena": {
        "keywords": ["Serena"], 
        "target_cert_suffixes": ["520", "0520", "1314", "888", "8888"],
        "lore_description": "高人气妹卡 [莎莉娜 Serena] 命中浪漫天命号 (520/1314)"
    }
} # <--- 这里是 POKEMON_GRAIL_DATABASE 的总结束括号

ONE_PIECE_GRAIL_DATABASE = {
    # 示例1：尼卡路飞
    "Manga_Luffy": {
        "keywords": ["Luffy", "Manga", "OP05"], # 针对 OP05 的漫画大头路飞
        "target_cert_suffixes": ["0505", "3000"],
        "lore_description": "5月5日生日匹配 或 30亿最终悬赏金顶点匹配"
    },
    # 示例2：漫画红发
    "Manga_Shanks": {
        "keywords": ["Shanks", "Manga", "OP01"],
        "target_cert_suffixes": ["0309", "4048"],
        "lore_description": "3月9日生日匹配 或 40亿4890万四皇悬赏金匹配"
    },
    # 示例3：漫画索隆
    "Manga_Zoro": {
        "keywords": ["Zoro", "Manga", "OP06"],
        "target_cert_suffixes": ["1111"],
        "lore_description": "11月11日生日匹配 (纯四豹子号降临)"
    },
    # 示例4：漫画艾斯
    "Manga_Ace": {
        "keywords": ["Ace", "Manga", "OP02"],
        "target_cert_suffixes": ["0101", "0550"],
        "lore_description": "1月1日生日匹配 或 5亿5000万悬赏金匹配"
    }
    # ---> 想要添加新的海贼王神卡，就在这里接着写！
}

# 游戏王专属库 (可选扩展)
YUGIOH_GRAIL_DATABASE = {
    "Blue_Eyes_White_Dragon": {
        "keywords": ["Blue-Eyes", "White Dragon"],
        "target_cert_suffixes": ["3000", "1025"],
        "lore_description": "攻击力 3000 完美匹配，或 海马濑人 10月25日 生日匹配"
    }
}
# =====================================================================
# ⬆️ 数据库区域结束，以下是核心引擎逻辑，一般不需要修改 ⬆️
# =====================================================================


class RenaissSniper:
    def __init__(self):
        self.limit = 100
        self.market_data = {}  
        self.load_cache()      

    def load_cache(self):
        """开发者级快照管理：无损保留，自动排错"""
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    self.market_data = json.load(f)
                
                clean_cache = {}
                for cert, info in self.market_data.items():
                    # 过滤非法长度的编号，排除那些连名字或价格都没抓取到的死数据
                    if 7 <= len(cert) <= 10 and "缺失" not in info.get('price', '') and "未知" not in info.get('name', ''):
                        info['is_new'] = False
                        clean_cache[cert] = info
                
                self.market_data = clean_cache
                print(f"💾 [记忆库] 数据已清洗净化，当前保留 {len(self.market_data)} 张完美级大盘资产。")
            except Exception:
                self.market_data = {}
        else:
            print("💾 [记忆库] 未发现历史快照，准备全量大盘抓取。")

    def save_cache(self):
        try:
            with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.market_data, f, ensure_ascii=False, indent=4)
        except Exception: pass

    def analyze_lore_grails(self, cert, name):
        """👑 终极机制：顶级 IP 天命与图鉴匹配检测"""
        if not cert.isdigit(): return []
        rules = []
        name_upper = name.upper()
        # 提取尾号，容错处理，防止编号太短报错
        suffix_3 = cert[-3:] if len(cert) >= 3 else cert
        suffix_4 = cert[-4:] if len(cert) >= 4 else cert

        # 1. 扫描宝可梦库
        for key, config in POKEMON_GRAIL_DATABASE.items():
            if all(kw.upper() in name_upper for kw in config["keywords"]):
                if suffix_3 in config["target_cert_suffixes"] or suffix_4 in config["target_cert_suffixes"]:
                    rules.append(f"🐉 【宝可梦天命】 {config['lore_description']}")

        # 2. 扫描海贼王库
        for key, config in ONE_PIECE_GRAIL_DATABASE.items():
            if all(kw.upper() in name_upper for kw in config["keywords"]):
                if suffix_3 in config["target_cert_suffixes"] or suffix_4 in config["target_cert_suffixes"]:
                    rules.append(f"🏴‍☠️ 【海贼王天命】 {config['lore_description']}")
                    
        # 3. 扫描游戏王库
        for key, config in YUGIOH_GRAIL_DATABASE.items():
            if all(kw.upper() in name_upper for kw in config["keywords"]):
                if suffix_3 in config["target_cert_suffixes"] or suffix_4 in config["target_cert_suffixes"]:
                    rules.append(f"👁️‍🗨️ 【游戏王天命】 {config['lore_description']}")

        return rules

    def analyze_fancy_rules(self, cert):
        """🌟 核心矩阵：常规数字靓号检测算法"""
        if not cert.isdigit(): return []
        rules = []
        
        # 1. 检测豹子号 (例如 8888, 77777)
        repeat_match = re.search(r'(\d)\1{2,}', cert)
        if repeat_match:
            l = len(repeat_match.group(0))
            if cert.endswith(repeat_match.group(0)):
                rules.append(f"🐆 尾部 {l} 连豹子号 ({repeat_match.group(0)})")
            else:
                rules.append(f"🐆 包含 {l} 连豹子号 ({repeat_match.group(0)})")

        # 2. 检测顺子号和倒顺号 (例如 12345, 9876)
        inc_str, dec_str = "0123456789", "9876543210"
        for length in [6, 5, 4]:
            found = False
            for i in range(len(inc_str) - length + 1):
                seq = inc_str[i:i+length]
                if seq in cert:
                    rules.append(f"🐉 {length} 连顺子号 ({seq})")
                    found = True; break
            if found: break 
            
        for length in [6, 5, 4]:
            found = False
            for i in range(len(dec_str) - length + 1):
                seq = dec_str[i:i+length]
                if seq in cert:
                    rules.append(f"🐉 {length} 连倒顺号 ({seq})")
                    found = True; break
            if found: break

        # 3. 检测对称雷达号 (例如 12321)
        if cert == cert[::-1] and len(cert) >= 5:
            rules.append(f"🎯 极品全对称雷达号 ({cert})")
        elif len(cert) >= 6 and cert[-5:] == cert[-5:][::-1]:
            rules.append(f"🎯 尾部 5 位雷达号 ({cert[-5:]})")

        return list(set(rules))

    def extract_with_radar(self, text):
        """🌟 物理雷达结界：穿透 CLI 强制抓取"""
        results = []
        matches = re.finditer(r'(?<!\d)(\d{7,10})(?!\d)', text)
        seen = set()
        
        for m in matches:
            cert = m.group(1)
            preceding = text[max(0, m.start() - 40):m.start()].lower()
            if any(x in preceding for x in ['asset', 'cents', 'usd', 'time', 'date', 'id', 'width', 'height']):
                continue
                
            if cert in seen: continue
            seen.add(cert)
            
            start = max(0, m.start() - 800)
            end = min(len(text), m.end() + 800)
            context = text[start:end]
            
            price = "价格缺失"
            usd_m = re.search(r'\$\s*([\d\.,]+)', context)
            if usd_m:
                price = f"${float(usd_m.group(1).replace(',', '')):.2f}"
            else:
                p_m = re.search(r'["\']?(priceUsdCents|price_cents|cents|price|listingPrice|amount|usd)["\']?\s*:\s*["\']?([\d\.,]+)["\']?', context, re.IGNORECASE)
                if p_m:
                    key_f = p_m.group(1).lower()
                    try:
                        val = float(p_m.group(2).replace(',', ''))
                        if 'cent' in key_f or val >= 1000: price = f"${val/100:.2f}"
                        else: price = f"${val:.2f}"
                    except: pass
                    
            name = "未知卡牌"
            names = re.findall(r'["\'](?:name|cardName|title)["\']\s*:\s*["\']([^"\']+)["\']', context, re.IGNORECASE)
            if names: name = names[0]
            else:
                long_strs = re.findall(r'["\']([^"\']{15,120})["\']', context)
                for ls in long_strs:
                    if any(k in ls for k in ['Pokemon', 'PSA', 'CGC', 'Mint', 'Card', '#', 'Gem']):
                        name = ls; break
                if name == "未知卡牌" and long_strs: name = long_strs[0]
                    
            company = "PSA"
            if 'CGC' in name.upper() or '"CGC"' in context.upper(): company = "CGC"
            elif 'BGS' in name.upper() or '"BGS"' in context.upper(): company = "BGS"
            
            results.append({"cert": cert, "name": name, "price": price, "company": company})
            
        return results

    def fetch_market_data(self):
        page = 0
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        total_scanned = 0
        empty_page_count = 0
        has_history = len(self.market_data) > 0
        
        print("\n" + "🚀"*3 + " 闪电增量模式启动！探测到旧卡将自动熔断停止！" + "🚀"*3)
        
        while True:
            offset = page * self.limit
            print(f"📡 [API 网关] 请求分页 Offset: {offset} ...")
            
            # 💡 防假死补丁：加入 --yes 和 timeout 限制！
            cmd = f"npx --yes renaiss marketplace --listed --limit {self.limit} --offset {offset} --json"
            
            try:
                # 设定 20 秒超时限制，防止 npx 在后台假死挂起
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore', timeout=20)
                
                raw_text = result.stdout.strip()
                clean_text = ansi_escape.sub('', raw_text)
                hunted = self.extract_with_radar(clean_text)
                
                page_items = {}
                for item in hunted: page_items[item['cert']] = item

                if not page_items:
                    empty_page_count += 1
                    if empty_page_count >= 2:
                        print("  🏁 连续遭遇空数据区，判定大盘遍历结束。")
                        break
                else:
                    empty_page_count = 0
                
                new_added = 0
                hit_cached = False
                
                for c, info in page_items.items():
                    if c not in self.market_data:
                        info['is_new'] = True if has_history else False
                        self.market_data[c] = info
                        new_added += 1
                    else:
                        hit_cached = True
                        # 热更新缺失的数据
                        if self.market_data[c]['price'] == "价格缺失" and info['price'] != "价格缺失":
                            self.market_data[c]['price'] = info['price']
                        if self.market_data[c]['name'] == "未知卡牌" and info['name'] != "未知卡牌":
                            self.market_data[c]['name'] = info['name']
                            self.market_data[c]['company'] = info['company']
                            
                total_scanned += len(page_items)
                print(f"  ⚡ 成功萃取资产: {len(page_items)} 张 | 发现新挂单: {new_added} 张。")
                
                # 如果碰到了旧数据且没有抓到新数据，触发熔断器，直接停止抓取
                if hit_cached and new_added == 0 and has_history:
                    print("  🛑 [智能熔断] 探测到历史旧卡区，增量同步完成，停止网络请求！")
                    break
            
            # 捕获网络超时错误
            except subprocess.TimeoutExpired:
                print(f"  ⚠️ [网络超时] 拉取数据超过 20 秒，节点拥堵，跳过此页或重试...")
                break # 这里选了直接中断，你可以改成 continue 让它继续试下一页
            except Exception as e:
                print(f"  ❌ 网络层调用异常: {e}")
                break
                
            page += 1
            time.sleep(0.1)
            
        print(f"\n✅ 同步结束，本次通讯共解析 {total_scanned} 条合格记录。")
        self.save_cache()

    def run_collision(self):
        """核心碰撞引擎：将抓取到的所有卡牌跟规则库进行碰撞匹配"""
        total_assets = len(self.market_data)
        if total_assets == 0: return

        print("\n" + "="*18 + " 📊 RENAISS 资产分析矩阵计算中... " + "="*18)
        print(f"📊 当前完美数据库总量：{total_assets} 张。\n")
        
        cert_keys = sorted(list(self.market_data.keys()), key=lambda x: int(x))
        cert_set = set(cert_keys)

        # ---------------- 扫描连号 (同场挂单) ----------------
        visited = set()
        chains = []
        for c in cert_keys:
            if c in visited: continue
            current_chain = [c]
            next_c = str(int(c) + 1).zfill(len(c))
            while next_c in cert_set:
                current_chain.append(next_c)
                visited.add(next_c)
                next_c = str(int(next_c) + 1).zfill(len(c))
            if len(current_chain) >= 2: chains.append(current_chain)

        chain_map = {}
        for chain in chains:
            chain_desc = " -> ".join(chain)
            for c in chain:
                if len(chain) == 2: chain_map[c] = f"🔗 所属双连号序列: {chain_desc}"
                elif len(chain) == 3: chain_map[c] = f"🔥 所属三连号序列: {chain_desc}"
                else: chain_map[c] = f"💥 所属大组捆绑序列: {chain_desc}"

        grail_hits = []
        fancy_hits = []
        chain_hits = []
        
        # ---------------- 主引擎扫描 ----------------
        for cert in cert_keys:
            info = self.market_data[cert]
            name = info.get('name', '')
            
            # 1. 匹配顶级天命神卡 (走上面设置的 GRAIL 字典)
            g_rules = self.analyze_lore_grails(cert, name)
            if g_rules: grail_hits.append((cert, info, g_rules))
            
            # 2. 匹配普通数字靓号 (豹子号/顺子等)
            f_rules = self.analyze_fancy_rules(cert)
            if f_rules: fancy_hits.append((cert, info, f_rules))
            
            # 3. 匹配连号
            if cert in chain_map: chain_hits.append((cert, info, [chain_map[cert]]))

        # ==================== 结果输出控制台 ====================
        print("\n" + "👑"*6 + " [ 第零梯队：天命神卡 / 顶级图鉴匹配 ] " + "👑"*6)
        if not grail_hits: print("  暂无天命神卡资产。")
        else:
            for cert, info, rules in grail_hits:
                new_flag = "🚨 [NEW!] " if info.get('is_new') else ""
                print(f"{new_flag}💎【图鉴神迹】{info['company']}: {cert} | {info['price']} | {info['name']}")
                for r in rules: print(f"   ↳ 🚨 {r}")
                print("-" * 75)

        print("\n" + "💎"*6 + " [ 第一梯队：特种靓号 / 顺子 / 豹子 / 雷达 ] " + "💎"*6)
        if not fancy_hits: print("  暂无靓号资产。")
        else:
            for cert, info, rules in fancy_hits:
                new_flag = "🔥 [NEW!] " if info.get('is_new') else ""
                print(f"{new_flag}🎯【靓号命中】{info['company']}: {cert} | {info['price']} | {info['name']}")
                for r in rules: print(f"   ↳ {r}")
                print("-" * 75)

        print("\n" + "🔗"*6 + " [ 第二梯队：同场双连号 / 三连序列 ] " + "🔗"*6)
        if not chain_hits: print("  暂无连号资产。")
        else:
            for cert, info, rules in chain_hits:
                new_flag = "🔥 [NEW!] " if info.get('is_new') else ""
                print(f"{new_flag}🎯【连号命中】{info['company']}: {cert} | {info['price']} | {info['name']}")
                print(f"   ↳ {rules[0]}")
                print("-" * 75)

        if chains:
            print("\n" + "🏆"*4 + " [特种连号资产·宏观全景汇总] " + "🏆"*4)
            chain_3_plus = [c for c in chains if len(c) >= 3]
            chain_2 = [c for c in chains if len(c) == 2]
            if chain_3_plus:
                print("\n🔥 【三连号及以上顶级组合】:")
                for c in chain_3_plus: print(f"   ► {' -> '.join(c)}")
            if chain_2:
                print("\n🔗 【双连号组合】:")
                for c in chain_2: print(f"   ► {' -> '.join(c)}")
            print("=" * 75)

        print(f"\n✅ 投研结束！全场 {total_assets} 资产已深度透视！挖掘出 {len(grail_hits)} 张天命神卡、{len(fancy_hits)} 张极品靓号 与 {len(chain_hits)} 张连号卡牌！")


if __name__ == "__main__":
    print("==================================================")
    print("🚀 [官方级透视引擎] RENAISS RWA 狙击终端启动...")
    print("==================================================")
    
    # 实例化并运行狙击手类
    sniper = RenaissSniper()
    
    # 1. 向 Renaiss Marketplace 发送网络请求，抓取或更新数据
    sniper.fetch_market_data()
    
    # 2. 跑碰撞引擎，算出所有靓号、神卡和连号并打印
    sniper.run_collision()
    
    # 3. 运行完毕，等待用户敲击回车退出窗口 (防止运行完立刻闪退)
    input("\n🎉 大盘透视完毕！按回车键安全退出...")