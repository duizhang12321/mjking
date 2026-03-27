const store = require('../../utils/storage')

Page({
  data: { rules: [], pick: false },
  onLoad(q){ this.setData({ pick: !!q && q.pick }) },
  onShow(){ this.setData({ rules: store.listRules() }) },
  createRule(){
    wx.showModal({ title:'规则名称', editable:true, placeholderText:'输入规则名', success:(res)=>{
      if(res.confirm && res.content){
        const rule = { id: 'rule-'+Date.now(), name: res.content, desc: '' }
        store.createRule(rule)
        this.setData({ rules: store.listRules() })
      }
    }})
  },
  selectRule(e){
    if(!this.data.pick) return
    const id = e.currentTarget.dataset.id
    store.setSelectedRule(id)
    wx.showToast({ title:'规则已选择', icon:'none' })
    wx.navigateBack()
  }
})
