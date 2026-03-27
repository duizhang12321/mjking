// 简易用户会话：使用微信昵称与头像（本地持久化）

const KEY = 'current_user'

function getCurrentUser() {
  try { return wx.getStorageSync(KEY) || null } catch (e) { return null }
}

function setCurrentUser(user) {
  try { wx.setStorageSync(KEY, user) } catch (e) {}
}

function ensureLoggedIn() {
  const cached = getCurrentUser()
  if (cached) return Promise.resolve(cached)
  // 必须在用户手势中调用；仅获取头像/昵称并本地存储，不进行后端绑定
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于房间加入与记分标识',
      success: (res) => {
        const profile = res.userInfo || {}
        const localUser = {
          uid: 'u-' + Math.random().toString(36).slice(2) + Date.now(),
          nickName: profile.nickName || '未命名',
          avatarUrl: profile.avatarUrl || ''
        }
        setCurrentUser(localUser)
        resolve(localUser)
      },
      fail: (err) => { reject(new Error(err.errMsg || '获取用户信息失败')) }
    })
  })
}

module.exports = { getCurrentUser, setCurrentUser, ensureLoggedIn }
