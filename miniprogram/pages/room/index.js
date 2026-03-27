const store = require('../../utils/storage')
const ai = require('../../utils/ai')
const user = require('../../utils/user')

Page({
  data: { id: '', room: { name: '', players: [], rounds: [], ownerUid: '' }, ruleName: '', isOwner: false, me: null },
  onLoad(q) {
    if (q && q.id) {
      const room = store.getRoom(q.id) || { name: '', players: [], rounds: [] }
      const ruleName = room.ruleId ? (store.listRules().find(r=>r.id===room.ruleId)?.name || '') : ''
      const me = user.getCurrentUser()
      const isOwner = !!(me && room.ownerUid && me.uid === room.ownerUid)
      this.setData({ id: q.id, room, ruleName, me, isOwner })
    }
  },
  onShow(){
    // 若从规则页返回且房主选择了规则，关联到房间
    const sel = store.getSelectedRule()
    if(sel && this.data.isOwner){
      const room = this.data.room
      room.ruleId = sel
      store.saveRoom(room)
      const ruleName = store.listRules().find(r=>r.id===sel)?.name || ''
      this.setData({ room, ruleName })
    }
  },
  formatTime(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  },
  chooseRule() { if(!this.data.isOwner){ wx.showToast({ title:'仅房主可设置规则', icon:'none' }); return } wx.navigateTo({ url: '/pages/rules/index?pick=1' }) },
  addPlayer() {
    if(!this.data.isOwner){ wx.showToast({ title:'仅房主可添加玩家', icon:'none' }); return }
    wx.showModal({ title:'添加玩家', editable:true, placeholderText:'输入玩家名', success:(res)=>{
      if(res.confirm && res.content){
        const room = this.data.room
        room.players.push({ uid:'p-'+Date.now(), name: res.content })
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
          const me = this.data.me
          room.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score, desc:'手动', userUid: me?.uid || '' })
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
          const me = this.data.me
          room.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score, desc:'AI', userUid: me?.uid || '' })
          this.setData({ room }); store.saveRoom(room)
          wx.hideLoading(); wx.showToast({ title:'记分完成' })
        })
        .catch(err=>{ wx.hideLoading(); wx.showToast({ title: err.message || '记分失败', icon:'none' }) })
    } })
  }
})
