const store = require('../../utils/storage')
const ai = require('../../utils/ai')
const user = require('../../utils/user')

Page({
  data: { id: '', room: { name: '', players: [], rounds: [], ownerUid: '' }, ruleName: '', isOwner: false, me: null },
  onLoad(q) {
    const id = q && q.id
    if (!id) {
      wx.showToast({ title: '房间ID缺失', icon: 'none' })
      wx.navigateBack({})
      return
    }
    store.getRoom(id).then(room => {
      if (!room) {
        wx.showToast({ title: '房间不存在', icon: 'none' })
        wx.navigateBack({})
        return
      }
      const me = user.getCurrentUser()
      if (!me) {
        const redirect = encodeURIComponent(`/pages/room/index?id=${id}`)
        wx.redirectTo({ url: `/pages/auth/index?redirect=${redirect}` })
        return
      }
      const isOwner = !!(me && room.ownerUid && me.uid === room.ownerUid)
      const exists = (room.players || []).some(p => p.uid === me.uid)
      if (!exists) {
        store.addPlayerToRoom(id, me).then(r => {
          if (r) room = r
          this.setData({ id, room, me, isOwner })
        })
      } else {
        this.setData({ id, room, me, isOwner })
      }
      if (room.ruleId) {
        store.listRules().then(rs => {
          const name = (rs.find(r => r.id === room.ruleId)?.name || '')
          this.setData({ ruleName: name })
        })
      }
    })
  },
  formatTime(ts) { const d = new Date(ts); return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` },
  chooseRule() { if(!this.data.isOwner){ wx.showToast({ title:'仅房主可设置规则', icon:'none' }); return } wx.navigateTo({ url: '/pages/rules/index?pick=1' }) },
  addManualRound() {
    wx.showModal({ title:'手动记分', editable:true, placeholderText:'输入本局分数', success:(res)=>{
      if(res.confirm && res.content){ const score = Number(res.content); if(Number.isFinite(score)){ const room = this.data.room; room.rounds = room.rounds||[]; room.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score, desc:'手动', userUid: this.data.me?.uid || '' }); this.setData({ room }); store.saveRoom(room) } else { wx.showToast({ title:'分数格式错误', icon:'none' }) } }
    } })
  },
  aiRound() {
    wx.chooseImage({ count:1, sizeType:['compressed'], sourceType:['album','camera'], success:(res)=>{
      const path = res.tempFilePaths[0]
      wx.showLoading({ title:'AI 记分中' })
      ai.scoreMahjongImage(path, this.data.room.ruleId)
        .then(score=>{ const room = this.data.room; room.rounds = room.rounds||[]; room.rounds.unshift({ id: Date.now()+Math.random(), ts: Date.now(), score, desc:'AI', userUid: this.data.me?.uid || '' }); this.setData({ room }); store.saveRoom(room); wx.hideLoading(); wx.showToast({ title:'记分完成' }) })
        .catch(err=>{ wx.hideLoading(); wx.showToast({ title: err.message || '记分失败', icon:'none' }) })
    } })
  },
  onShareAppMessage() { const { id, room } = this.data; return { title: `加入房间：${room.name}`, path: `/pages/room/index?id=${id}` } }
})
