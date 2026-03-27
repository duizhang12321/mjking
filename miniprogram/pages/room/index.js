const store = require('../../utils/storage')
const ai = require('../../utils/ai')

Page({
  data: { id: '', room: { name: '', players: [], rounds: [] }, ruleName: '' },
  onLoad(q) {
    if (q && q.id) {
      const room = store.getRoom(q.id) || { name: '', players: [], rounds: [] }
      const ruleName = room.ruleId ? (store.listRules().find(r=>r.id===room.ruleId)?.name || '') : ''
      this.setData({ id: q.id, room, ruleName })
    }
  },
  formatTime(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  },
  chooseRule() { wx.navigateTo({ url: '/pages/rules/index?pick=1' }) },
  addPlayer() {
    wx.showModal({ title:'添加玩家', editable:true, placeholderText:'输入玩家名', success:(res)=>{
      if(res.confirm && res.content){
        const room = this.data.room
        room.players.push(res.content)
        this.setData({ room }); store.saveRoom(room)
      }
    } })
  },
  addManualRound() {
    wx.showModal({ title:'手动记分', editable:true, placeholderText:'输入本局分数', success:(res)=>{
      if(res.confirm && res.content){
        const score = Number(res.content)
        if (Number.isFinite(score)) {
          const room = this.data.room
          room.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score, desc:'手动' })
          this.setData({ room }); store.saveRoom(room)
        } else {
          wx.showToast({ title:'分数格式错误', icon:'none' })
        }
      }
    } })
  },
  aiRound() {
    wx.chooseImage({ count:1, sizeType:['compressed'], sourceType:['album','camera'], success:(res)=>{
      const path = res.tempFilePaths[0]
      wx.showLoading({ title:'AI 记分中' })
      ai.scoreMahjongImage(path, this.data.room.ruleId)
        .then(score=>{
          const room = this.data.room
          room.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score, desc:'AI' })
          this.setData({ room }); store.saveRoom(room)
          wx.hideLoading(); wx.showToast({ title:'记分完成' })
        })
        .catch(err=>{ wx.hideLoading(); wx.showToast({ title: err.message || '记分失败', icon:'none' }) })
    } })
  }
})
