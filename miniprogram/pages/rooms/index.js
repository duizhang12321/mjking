const store = require('../../utils/storage')

Page({
  data: { rooms: [] },
  onShow() { this.setData({ rooms: store.listRooms() }) },
  formatTime(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  },
  createRoom() {
    wx.showModal({
      title: '新建房间',
      editable: true,
      placeholderText: '输入房间名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const room = store.createRoom(res.content)
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
})
