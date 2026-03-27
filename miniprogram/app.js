// 微信小程序入口
let cfg = {}
try { cfg = require('./config') } catch (e) { try { cfg = require('./config.sample') } catch (_) {} }

App({
  onLaunch() {
    console.log('App launched')
    // 自动化自测：在开发阶段自动跑一遍核心流程，生成数据便于快速验证
    if (cfg && cfg.autoTest) {
      try {
        const selftest = require('./utils/selftest')
        selftest.runAutoTest()
      } catch (e) {
        console.warn('AutoTest failed to start:', e && e.message)
      }
    }
  }
})
