// 真实登录态接入：将 code 与头像/昵称上报后端进行账号绑定与合规存储

let cfg = {}
try { cfg = require('../config') } catch (e) { try { cfg = require('../config.sample') } catch (_) {} }

function bindLogin(code, profile) {
  return new Promise((resolve, reject) => {
    if (!cfg || !cfg.baseUrl) {
      reject(new Error('未配置 baseUrl'))
      return
    }
    wx.request({
      url: cfg.baseUrl + '/api/auth/bind',
      method: 'POST',
      header: { 'content-type': 'application/json', ...(cfg.headers || {}) },
      data: { code, nickName: profile.nickName, avatarUrl: profile.avatarUrl },
      success: (res) => {
        const data = res.data || {}
        if (data && (data.userId || data.token)) {
          resolve({ userId: data.userId, token: data.token })
        } else {
          reject(new Error('后端未返回 userId/token'))
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '网络错误'))
    })
  })
}

module.exports = { bindLogin }

