const store = require('../../utils/storage')
const tmpl = require('../../rules/template')

Page({
  data: { rules: [], pick: false },
  onLoad(q){ this.setData({ pick: !!q && q.pick }) },
  onShow(){
    const preset = [{ id: tmpl.presetChuanMaXueZhan.id, name: tmpl.presetChuanMaXueZhan.name, desc: tmpl.presetChuanMaXueZhan.desc, version: tmpl.presetChuanMaXueZhan.version, preset: true, schema: tmpl.schema, rule: tmpl.presetChuanMaXueZhan.rule, templateMarkdown: tmpl.renderTemplateMarkdown(tmpl.presetChuanMaXueZhan.rule) }]
    const rules = store.ensurePresetRules(preset)
    this.setData({ rules })
  },
  createRule(){ wx.navigateTo({ url: '/pages/rules/create' }) },
  selectRule(e){
    if(!this.data.pick) return
    const id = e.currentTarget.dataset.id
    store.setSelectedRule(id)
    wx.showToast({ title:'规则已选择', icon:'none' })
    wx.navigateBack()
  },
  openDetail(e){ const id = e.currentTarget.dataset.id; wx.navigateTo({ url: `/pages/rules/detail?id=${id}` }) },
  deleteRule(e){
    const id = e.currentTarget.dataset.id
    const item = store.listRules().find(r=>r.id===id)
    if (item && item.preset) { wx.showToast({ title:'预置规则不可删除', icon:'none' }); return }
    wx.showModal({ title:'删除规则', content:'删除后不可恢复，确认删除？', success:(res)=>{ if(res.confirm){ store.deleteRule(id); this.setData({ rules: store.listRules() }) } } })
  }
})
