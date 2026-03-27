// 规则模板定义与渲染（川麻为基线，可扩展）

// 结构化 Schema（供表单编辑与一致性检查）
const schema = {
  meta: {
    name: '',
    variant: '川麻·血战到底', // 或 川麻·血流成河
    version: 'v1',
    description: ''
  },
  table: {
    players: 4,
    handSize: 13,
    tiles: {
      suits: ['万','筒','条'],
      includeWinds: false,
      includeDragons: false,
      includeFlowers: false,
      totalTiles: 108
    }
  },
  dealer: {
    continuousDealer: true, // 连庄
    dealerBonus: { selfDrawAddBase: 1, winAddBase: 1 }
  },
  settlement: {
    payMode: '三家付', // 一人付 / 三家付
    basePoint: 1,
    cap: 0 // 0 表示不限封顶
  },
  birds: {
    enabled: true,
    count: 2,
    hitBonus: 1
  },
  penalties: {
    checkNoDeclare: true, // 查大叫
    checkWrongSuit: true // 查花猪（缺一门未完成）
  },
  scoring: {
    // 示例基础番型与加成，后续可扩展
    baseHands: [
      { key: '平胡', fan: 1 },
      { key: '自摸', fan: 1 },
      { key: '对对胡', fan: 2 },
      { key: '清一色', fan: 4 }
    ],
    melds: [
      { key: '明杠', fan: 1 },
      { key: '暗杠', fan: 2 }
    ],
    extras: [
      { key: '绝张', fan: 1 }
    ]
  }
}

function renderTemplateText(rule) {
  const r = { ...schema, ...rule }
  const m = r.meta || {}
  const t = r.table || {}
  const tiles = t.tiles || {}
  const d = r.dealer || {}
  const s = r.settlement || {}
  const b = r.birds || {}
  const p = r.penalties || {}
  const sc = r.scoring || {}
  const list = arr => (arr || []).map(i => `${i.key}：${i.fan}番`).join('；') || '无'
  return [
    `规则名称：${m.name}（${m.variant}；版本：${m.version}）`,
    `说明：${m.description || '无'}`,
    `桌面：${t.players}人；手牌数：${t.handSize}；牌组：${tiles.totalTiles || ''}张（${tiles.suits.join('、')}${tiles.includeWinds?'含风':''}${tiles.includeDragons?'含箭':''}${tiles.includeFlowers?'含花':''}）`,
    `庄家：${d.continuousDealer?'连庄':''}；庄家自摸加底：${d.dealerBonus?.selfDrawAddBase || 0}；庄家胡牌加底：${d.dealerBonus?.winAddBase || 0}`,
    `结算：付费模式=${s.payMode}；底分=${s.basePoint}；封顶=${s.cap? s.cap+'番':'不限'}`,
    `抓鸟：${b.enabled? '开启' : '关闭'}；数量=${b.count || 0}；每中一鸟加底=${b.hitBonus || 0}`,
    `查错：查大叫=${p.checkNoDeclare? '是':'否'}；查花猪=${p.checkWrongSuit? '是':'否'}`,
    `基础番型：${list(sc.baseHands)}`,
    `杠类加番：${list(sc.melds)}`,
    `额外加成：${list(sc.extras)}`
  ].join('\n')
}

// 简单自然语言解析（基础关键词提取），用于快速从描述生成结构
function parseNaturalLanguage(nl) {
  const r = JSON.parse(JSON.stringify(schema))
  const text = (nl || '').replace(/\s+/g,'')
  const m = text.match(/抓(\d+)鸟/) ; if (m) r.birds.enabled = true, r.birds.count = Number(m[1])
  const h = text.match(/手牌(\d+)张?/) ; if (h) r.table.handSize = Number(h[1])
  if (/三家付/.test(text)) r.settlement.payMode = '三家付'
  if (/一人付/.test(text)) r.settlement.payMode = '一人付'
  if (/血战到底/.test(text)) r.meta.variant = '川麻·血战到底'
  if (/血流成河/.test(text)) r.meta.variant = '川麻·血流成河'
  const b = text.match(/每中一鸟加(\d+)/); if (b) r.birds.hitBonus = Number(b[1])
  const dp = text.match(/底分(\d+)/); if (dp) r.settlement.basePoint = Number(dp[1])
  return r
}

// 预置：川麻·血战到底
const presetChuanMaXueZhan = {
  id: 'preset-chuanma-xuezhan',
  name: '川麻·血战到底（模版）',
  desc: '常见川麻血战到底基线规则，可编辑微调',
  version: 'v1',
  schema: schema,
  rule: {
    meta: { name: '川麻·血战到底', variant: '川麻·血战到底', version: 'v1', description: '四人，无风无箭无花；连庄；抓鸟2，每中一鸟加1；查花猪/查大叫；示例番型含清一色、对对胡等' },
    table: { players: 4, handSize: 13, tiles: { suits: ['万','筒','条'], includeWinds: false, includeDragons: false, includeFlowers: false, totalTiles: 108 } },
    dealer: { continuousDealer: true, dealerBonus: { selfDrawAddBase: 1, winAddBase: 1 } },
    settlement: { payMode: '三家付', basePoint: 1, cap: 0 },
    birds: { enabled: true, count: 2, hitBonus: 1 },
    penalties: { checkNoDeclare: true, checkWrongSuit: true },
    scoring: {
      baseHands: [ { key:'平胡', fan:1 }, { key:'自摸', fan:1 }, { key:'对对胡', fan:2 }, { key:'清一色', fan:4 } ],
      melds: [ { key:'明杠', fan:1 }, { key:'暗杠', fan:2 } ],
      extras: [ { key:'绝张', fan:1 } ]
    }
  }
}

function buildRuleObject(metaName, nlText) {
  const r = parseNaturalLanguage(nlText)
  r.meta.name = metaName || r.meta.name
  return { id: 'rule-'+Date.now(), name: metaName || r.meta.name, desc: '', version: r.meta.version, schema, rule: r, templateText: renderTemplateText(r) }
}

module.exports = { schema, renderTemplateText, parseNaturalLanguage, presetChuanMaXueZhan, buildRuleObject }

