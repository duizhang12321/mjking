// 评分 API 封装（当前为本地模拟，后续可切换为后端/云函数）

const BASE_URL = '' // 如需直连服务端：例如 https://your.domain

function mockScore(tempFilePath) {
  return new Promise((resolve) => {
    // 通过文件大小生成一个稳定的“伪评分”，便于本地演示
    const fsm = wx.getFileSystemManager()
    fsm.readFile({
      filePath: tempFilePath,
      success: (res) => {
        const size = res.data ? (res.data.byteLength || (res.data.length || 0)) : 0
        const score = Math.max(10, Math.min(100, Math.round((size % 100000) / 1000)))
        setTimeout(() => resolve(score), 600)
      },
      fail: () => {
        setTimeout(() => resolve(Math.floor(Math.random() * 90) + 10), 500)
      }
    })
  })
}

function uploadAndScore(tempFilePath) {
  return new Promise((resolve, reject) => {
    if (!BASE_URL) {
      reject(new Error('未配置 BASE_URL'))
      return
    }
    wx.uploadFile({
      url: BASE_URL + '/api/score',
      filePath: tempFilePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (typeof data.score === 'number') {
            resolve(data.score)
          } else {
            reject(new Error('无有效评分字段'))
          }
        } catch (e) {
          reject(new Error('返回解析失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'))
      }
    })
  })
}

module.exports = {
  // 默认使用本地模拟，便于初始化阶段演示
  scoreImage: mockScore,
  // 如需接入后端，页面中可改为：api.uploadAndScore(imagePath)
  uploadAndScore
}
