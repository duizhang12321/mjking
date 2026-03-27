const store = require('../../utils/storage')
const user = require('../../utils/user')

Page({
  data: { rooms: [], me: null },
  onShow() { this.setData({ rooms: store.listRooms(), me: user.getCurrentUser() }) },
  onLoad(){ this.setData({ me: user.getCurrentUser() }) },
  login(){
    user.ensureLoggedIn()
      .then(u => { this.setData({ me: u }); wx.showToast({ title:'已登录', icon:'success' }) })
      .catch(()=>{ wx.showToast({ title:'授权失败或取消', icon:'none' }) })
  },
  formatTime(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  },
  createRoom() {
    const u = user.getCurrentUser()
    wx.showModal({
      title: '新建房间',
      editable: true,
      placeholderText: '输入房间名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const room = store.createRoom(res.content, u)
          this.setData({ rooms: store.listRooms() })
          wx.navigateTo({ url: `/pages/room/index?id=${room.id}` })
        }
      }
    })
  },
  openRoom(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/room/index?id=${id}` })
  },
  toRules() { wx.navigateTo({ url: '/pages/rules/index' }) }
  ,
  resetAll(){
    wx.showModal({ title:'清空数据', content:'将清除本地的用户、房间、规则等所有数据。是否继续？', success:(res)=>{
      if(res.confirm){
        store.clearAll()
        this.setData({ rooms: [], me: null })
        wx.showToast({ title:'已清空', icon:'success' })
        wx.redirectTo({ url: '/pages/auth/index' })
      }
    }})
  }
})
