let cfg = {}
try { cfg = require('../config') } catch (e) { try { cfg = require('../config.sample') } catch (_) {} }

function mockScore(tempFilePath){
  return new Promise((resolve)=>{
    const fsm = wx.getFileSystemManager()
    fsm.readFile({ filePath: tempFilePath, success:(res)=>{ const size = res.data ? (res.data.byteLength || (res.data.length || 0)) : 0; const score = Math.max(10, Math.min(100, Math.round((size % 100000) / 1000))); setTimeout(()=>resolve(score), 600) }, fail:()=>{ setTimeout(()=>resolve(Math.floor(Math.random()*90)+10), 500) } })
  })
}

function uploadAndScore(tempFilePath){
  return new Promise((resolve, reject)=>{
    const base = cfg && cfg.baseUrl ? cfg.baseUrl : ''
    if (!base) { reject(new Error('未配置 baseUrl')); return }
    wx.uploadFile({ url: base + '/api/ai/score', filePath: tempFilePath, name: 'file', success:(res)=>{ try { const data = JSON.parse(res.data); if (typeof data.score === 'number') resolve(data.score); else reject(new Error('无有效评分字段')) } catch(e){ reject(new Error('返回解析失败')) } }, fail:(err)=>{ reject(new Error(err.errMsg || '网络错误')) } })
  })
}

module.exports = { scoreImage: mockScore, uploadAndScore }
