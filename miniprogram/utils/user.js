// 简易用户会话：使用微信昵称与头像（本地持久化）

const KEY = 'current_user'

function getCurrentUser() {
  try { return wx.getStorageSync(KEY) || null } catch (e) { return null }
}

function setCurrentUser(user) {
  try { wx.setStorageSync(KEY, user) } catch (e) {}
}

function ensureLoggedIn() {
  const u = getCurrentUser()
  if (u) return Promise.resolve(u)
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于房间加入与记分标识',
      success: (res) => {
        const profile = res.userInfo || {}
        const user = {
          uid: 'u-' + Math.random().toString(36).slice(2) + Date.now(),
          nickName: profile.nickName || '未命名',
          avatarUrl: profile.avatarUrl || ''
        }
        setCurrentUser(user)
        resolve(user)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '获取用户信息失败'))
      }
    })
  })
}

module.exports = { getCurrentUser, setCurrentUser, ensureLoggedIn }

