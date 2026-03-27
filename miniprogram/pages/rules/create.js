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
      // 优先使用 LLM 渲染 Markdown；若失败则本地回退
      let markdown = await llm.renderRuleMarkdown(nl, tmpl.schema)
      if (!tmpl.validateMarkdown(markdown)) {
        // 回退：本地 parse + 渲染
        const obj = tmpl.buildRuleObject(name, nl)
        markdown = obj.templateMarkdown
      }
      const html = md.mdToHtml(markdown)
      this.setData({ preview: markdown, html })
      // 保存（规则对象以 Markdown 为准）
      const ruleObj = { id: 'rule-'+Date.now(), name, desc: '', version: 'v1', schema: tmpl.schema, rule: {}, templateMarkdown: markdown }
      store.createRule(ruleObj)
      wx.showToast({ title:'已创建', icon:'success' })
      wx.navigateBack()
    } catch (e) {
      wx.showToast({ title: e.message || '渲染失败', icon:'none' })
    }
  }
})
