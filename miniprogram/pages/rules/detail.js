const store = require('../../utils/storage')

Page({
  data: { rule: {} },
  onLoad(q){
    const id = q && q.id
    const rule = (store.listRules().find(r=>r.id===id)) || {}
    this.setData({ rule })
  }
})
