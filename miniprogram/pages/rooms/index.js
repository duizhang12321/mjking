const store = require('../../utils/storage')
const user = require('../../utils/user')

Page({
  data: { rooms: [] },
  onShow() { this.setData({ rooms: store.listRooms() }) },
  onLoad(){
    // 提示登录以获取昵称头像
    user.ensureLoggedIn().catch(()=>{
      wx.showToast({ title:'请授权头像昵称以加入房间', icon:'none' })
    })
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
  joinRoom(){
    const u = user.getCurrentUser()
    if(!u){ wx.showToast({ title:'请先登录授权', icon:'none' }); return }
    wx.showModal({ title:'加入房间', editable:true, placeholderText:'输入房间ID', success:(res)=>{
      if(res.confirm && res.content){
        const r = store.addPlayerToRoom(res.content, u)
        if(r){ wx.navigateTo({ url: `/pages/room/index?id=${r.id}` }) }
        else{ wx.showToast({ title:'房间不存在', icon:'none' }) }
      }
    }})
  },
  openRoom(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/room/index?id=${id}` })
  },
  toRules() { wx.navigateTo({ url: '/pages/rules/index' }) }
})
