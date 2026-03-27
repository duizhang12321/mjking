// AI 接入封装：支持火山引擎或后端直连；无配置则回退到本地模拟

let cfg = {}
try {
  cfg = require('../config')
} catch (e) {
  try { cfg = require('../config.sample') } catch (_) {}
}

const api = require('./api')

function scoreMahjongImage(tempFilePath, ruleId) {
  // 优先火山引擎
  if (cfg && cfg.volc && cfg.volc.endpoint) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: cfg.volc.endpoint,
        filePath: tempFilePath,
        name: 'file',
        header: cfg.volc.headers || {},
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            // 预期返回：{ score: number, detail?: object }
            if (typeof data.score === 'number') {
              resolve(data.score)
            } else {
              reject(new Error('AI 返回中无 score 字段'))
            }
          } catch (e) {
            reject(new Error('AI 返回解析失败'))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || 'AI 请求失败'))
      })
    })
  }
  // 次选自建后端
  if (cfg && cfg.baseUrl) {
    return api.uploadAndScore(tempFilePath)
  }
  // 回退本地模拟
  return api.scoreImage(tempFilePath)
}

module.exports = { scoreMahjongImage }

