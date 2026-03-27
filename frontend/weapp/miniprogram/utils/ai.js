let cfg = {}
try { cfg = require('../config') } catch (e) { try { cfg = require('../config.sample') } catch (_) {} }
const api = require('./api')

function scoreMahjongImage(tempFilePath, ruleId){
  if (cfg && cfg.volc && cfg.volc.endpoint) {
    return new Promise((resolve, reject)=>{
      wx.uploadFile({ url: cfg.volc.endpoint, filePath: tempFilePath, name: 'file', header: cfg.volc.headers || {}, success:(res)=>{ try { const data = JSON.parse(res.data); if (typeof data.score === 'number') resolve(data.score); else reject(new Error('AI 返回中无 score 字段')) } catch(e){ reject(new Error('AI 返回解析失败')) } }, fail:(err)=>reject(new Error(err.errMsg || 'AI 请求失败')) })
    })
  }
  if (cfg && cfg.baseUrl) return api.uploadAndScore(tempFilePath)
  return api.scoreImage(tempFilePath)
}

module.exports = { scoreMahjongImage }
