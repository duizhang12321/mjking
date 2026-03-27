// LLM 渲染规则 Markdown：可配置后端，否则本地回退
let cfg = {}
try { cfg = require('../config') } catch (e) { try { cfg = require('../config.sample') } catch (_) {} }

function renderRuleMarkdown(nlText, schema) {
  return new Promise((resolve, reject) => {
    if (cfg && cfg.llm && cfg.llm.endpoint) {
      wx.request({
        url: cfg.llm.endpoint,
        method: 'POST',
        header: { 'content-type': 'application/json', ...(cfg.llm.headers || {}) },
        data: { prompt: nlText, schema },
        success: (res) => {
          const data = res.data || {}
          if (typeof data.markdown === 'string' && data.markdown.length > 0) {
            resolve(data.markdown)
          } else {
            reject(new Error('LLM 返回缺少 markdown'))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || 'LLM 网络错误'))
      })
      return
    }
    reject(new Error('未配置 LLM endpoint'))
  })
}

module.exports = { renderRuleMarkdown }

