const KEY = 'current_user'

function getCurrentUser(){ try { return wx.getStorageSync(KEY) || null } catch(e){ return null } }
function setCurrentUser(user){ try { wx.setStorageSync(KEY, user) } catch(e){} }
function ensureLoggedIn(){ const cached = getCurrentUser(); if(cached) return Promise.resolve(cached); return new Promise((resolve, reject)=>{ wx.getUserProfile({ desc:'用于房间加入与记分标识', success:(res)=>{ const p = res.userInfo || {}; const u = { uid: 'u-' + Math.random().toString(36).slice(2) + Date.now(), nickName: p.nickName || '未命名', avatarUrl: p.avatarUrl || '' }; setCurrentUser(u); resolve(u) }, fail:(err)=>reject(new Error(err.errMsg || '获取用户信息失败')) }) }) }

module.exports = { getCurrentUser, setCurrentUser, ensureLoggedIn }
