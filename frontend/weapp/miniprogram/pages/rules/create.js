const store = require('../../utils/storage')
const tmpl = require('../../rules/template')
const md = require('../../utils/markdown')
const llm = require('../../utils/llm')

Page({
  data: { name:'', nl:'', preview:'', html:'' },
  onName(e){ this.setData({ name: e.detail.value }) },
  onNL(e){ this.setData({ nl: e.detail.value }) },
  async create(){
    const { name, nl } = this.data
    if(!name || !nl){ wx.showToast({ title:'请填写名称与描述', icon:'none' }); return }
    try {
      let markdown = ''
      let ok = false
      try { const res = await llm.renderRuleMarkdownWithFeedback(nl, tmpl.schema, 2); markdown = res.markdown; ok = res.valid } catch (e) {}
      if (!ok) { const obj = tmpl.buildRuleObject(name, nl); markdown = obj.templateMarkdown; ok = true }
      const html = md.mdToHtml(markdown); this.setData({ preview: markdown, html })
      const ruleObj = { id: 'rule-'+Date.now(), name, desc: '', version: 'v1', schema: tmpl.schema, rule: {}, templateMarkdown: markdown }
      store.createRule(ruleObj).then(()=>{ wx.showToast({ title:'已创建', icon:'success' }); wx.navigateBack() })
    } catch (e) { wx.showToast({ title: e.message || '渲染失败', icon:'none' }) }
  }
})
