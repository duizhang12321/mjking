const user = require('../../utils/user')

Page({
  data: { redirect: '' },
  onLoad(q){
    const me = user.getCurrentUser()
    const redirect = q && q.redirect ? decodeURIComponent(q.redirect) : ''
    this.setData({ redirect })
    if(me){
      if (redirect) {
        wx.redirectTo({ url: redirect })
      } else {
        wx.redirectTo({ url: '/pages/rooms/index' })
      }
    }
  },
  login(){
    user.ensureLoggedIn()
      .then(()=> {
        if (this.data.redirect) {
          wx.redirectTo({ url: this.data.redirect })
        } else {
          wx.redirectTo({ url: '/pages/rooms/index' })
        }
      })
      .catch(()=> wx.showToast({ title:'授权失败或取消', icon:'none' }))
  }
})
