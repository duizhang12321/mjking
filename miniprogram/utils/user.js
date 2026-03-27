// 简易用户会话：使用微信昵称与头像（本地持久化）

const KEY = 'current_user'
let cfg = {}
try { cfg = require('../config') } catch (e) { try { cfg = require('../config.sample') } catch (_) {} }
const auth = require('./auth')

function getCurrentUser() {
  try { return wx.getStorageSync(KEY) || null } catch (e) { return null }
}

function setCurrentUser(user) {
  try { wx.setStorageSync(KEY, user) } catch (e) {}
}

function ensureLoggedIn() {
  const cached = getCurrentUser()
  if (cached) return Promise.resolve(cached)
  // 必须在用户手势中调用；流程：wx.login -> wx.getUserProfile -> 后端绑定
  return new Promise((resolve, reject) => {
    wx.login({
      success: (loginRes) => {
        const code = loginRes.code
        wx.getUserProfile({
          desc: '用于房间加入与记分标识',
          success: async (res) => {
            const profile = res.userInfo || {}
            const localUser = {
              uid: 'u-' + Math.random().toString(36).slice(2) + Date.now(),
              nickName: profile.nickName || '未命名',
              avatarUrl: profile.avatarUrl || ''
            }
            // 后端绑定（如配置了 baseUrl）
            try {
              if (cfg && cfg.baseUrl) {
                const server = await auth.bindLogin(code, { nickName: localUser.nickName, avatarUrl: localUser.avatarUrl })
                const merged = { ...localUser, serverUserId: server.userId || '', token: server.token || '' }
                setCurrentUser(merged)
                resolve(merged)
              } else {
                setCurrentUser(localUser)
                resolve(localUser)
              }
            } catch (e) {
              // 后端失败时回退本地，但提示错误
              setCurrentUser(localUser)
              wx.showToast({ title: '后端绑定失败，已本地登录', icon: 'none' })
              resolve(localUser)
            }
          },
          fail: (err) => { reject(new Error(err.errMsg || '获取用户信息失败')) }
        })
      },
      fail: (e) => reject(new Error(e.errMsg || 'wx.login 失败'))
    })
  })
}

module.exports = { getCurrentUser, setCurrentUser, ensureLoggedIn }
