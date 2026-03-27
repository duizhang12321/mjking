const store = require('../../utils/storage')
const md = require('../../utils/markdown')

Page({
  data: { rule: {}, html: '' },
  onLoad(q){ const id = q && q.id; store.listRules().then(list=>{ const rule = (list.find(r=>r.id===id)) || {}; const html = md.mdToHtml(rule.templateMarkdown || rule.templateText || ''); this.setData({ rule, html }) }) }
})
