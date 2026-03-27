const store = require('../../utils/storage')
const ai = require('../../utils/ai')
const user = require('../../utils/user')

Page({
  data: { id: '', room: { name: '', players: [], rounds: [], ownerUid: '' }, ruleName: '', isOwner: false, me: null },
  onLoad(q) {
    if (q && q.id) {
      const room = store.getRoom(q.id) || { name: '', players: [], rounds: [], ownerUid: '' }
      const ruleName = room.ruleId ? (store.listRules().find(r=>r.id===room.ruleId)?.name || '') : ''
      const me = user.getCurrentUser()
      if (!me) {
        // 未登录则跳转授权页，并在登录后重定向回房间
        const redirect = encodeURIComponent(`/pages/room/index?id=${q.id}`)
        wx.redirectTo({ url: `/pages/auth/index?redirect=${redirect}` })
        return
      }
      const isOwner = !!(me && room.ownerUid && me.uid === room.ownerUid)
      // 自动加入房间（若不在玩家列表）
      const exists = (room.players || []).some(p => p.uid === me.uid)
      if (!exists) {
        store.addPlayerToRoom(q.id, me)
      }
      const updated = store.getRoom(q.id)
      this.setData({ id: q.id, room: updated, ruleName, me, isOwner })
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
  ,
  onShareAppMessage() {
    const { id, room } = this.data
    return {
      title: `加入房间：${room.name}`,
      path: `/pages/room/index?id=${id}`
    }
  }
})
