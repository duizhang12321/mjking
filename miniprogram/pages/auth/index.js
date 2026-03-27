const user = require('../../utils/user')

Page({
  onLoad(){
    const me = user.getCurrentUser()
    if(me){
      wx.redirectTo({ url: '/pages/rooms/index' })
    }
  },
  login(){
    user.ensureLoggedIn()
      .then(()=> wx.redirectTo({ url: '/pages/rooms/index' }))
      .catch(()=> wx.showToast({ title:'授权失败或取消', icon:'none' }))
  }
})
