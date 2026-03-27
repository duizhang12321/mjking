// 将本文件复制为 config.js 并填写真实参数（避免提交敏感信息）

module.exports = {
  baseUrl: '', // 若使用自建后端，填入基础 URL，如 https://your.domain
  headers: {
    // 可选：公共请求头（例如鉴权）
  },
  volc: {
    endpoint: '', // 火山引擎图片记分接口地址
    headers: {
      // 示例：Authorization: 'Bearer xxx', 'X-Custom-Token': '...' 等
    }
  },
  // 开发辅助：自动自测，生成示例用户、房间与对局（生产请关闭）
  autoTest: true
}
