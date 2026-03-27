const store = require('../../utils/storage')
const tmpl = require('../../rules/template')

Page({
  data: { id:'', name:'', nl:'', preview:'' },
  onLoad(q){
    if(q && q.id){
      const r = store.listRules().find(x=>x.id===q.id)
      if(r){ this.setData({ id:r.id, name:r.name, nl: r.rule && r.rule.meta && r.rule.meta.description || '' , preview: r.templateText || '' }) }
    }
  },
  onName(e){ this.setData({ name: e.detail.value }) },
  onNL(e){ this.setData({ nl: e.detail.value }) },
  render(){
    const obj = tmpl.buildRuleObject(this.data.name, this.data.nl)
    this.setData({ preview: obj.templateText })
  },
  save(){
    const obj = tmpl.buildRuleObject(this.data.name, this.data.nl)
    if(this.data.id){ obj.id = this.data.id; store.updateRule(obj) } else { store.createRule(obj) }
    wx.showToast({ title:'已保存', icon:'success' })
    wx.navigateBack()
  }
})
