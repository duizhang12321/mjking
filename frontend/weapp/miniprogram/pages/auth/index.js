const user = require('../../utils/user')

Page({
  data: { redirect: '' },
  onLoad(q){
    const me = user.getCurrentUser()
    const redirect = q && q.redirect ? decodeURIComponent(q.redirect) : ''
    this.setData({ redirect })
    if(me){
      wx.redirectTo({ url: redirect || '/pages/rooms/index' })
    }
  },
  login(){
    user.ensureLoggedIn()
      .then(()=> { wx.redirectTo({ url: this.data.redirect || '/pages/rooms/index' }) })
      .catch(()=> wx.showToast({ title:'授权失败或取消', icon:'none' }))
  }
})
