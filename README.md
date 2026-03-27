# AI 图片评分微信小程序

一个支持“上传图片并由 AI 自动计算分数”的微信小程序基础工程。当前版本包含本地模拟评分逻辑，便于先跑通端到端流程；后续可按需接入后端或云函数实现真实 AI 评分。

## 目录结构

```
project.config.json           // 小程序项目配置（miniprogramRoot 指向 miniprogram）
miniprogram/
  app.json                    // 全局配置
  app.js                      // 入口
  app.wxss                    // 全局样式
  utils/
    api.js                    // 评分 API 封装（模拟/直连后端二选一）
  pages/
    index/
      index.json
      index.wxml
      index.js
      index.wxss
docs/
  requirements.md             // 需求澄清文档模板（待你补充）
```

## 开发环境

- 微信开发者工具（建议最新稳定版）
- 可选：Node.js（若后续引入 npm 生态或工具脚本）

## 快速开始

1. 打开微信开发者工具，选择“导入项目”，将本目录作为项目根。
2. AppID 可先用 `touristappid` 体验；实际发布时请替换为你的 AppID。
3. 进入 `pages/index`，点击“选择图片”，再点击“计算分数”，即可看到模拟评分结果。

## 当前评分实现（模拟）

- 初始阶段为演示使用，本地读取图片大小并生成稳定的“伪评分”。
- 真实接入后可切换为直连后端：`utils/api.js` 的 `uploadAndScore`，页面调用改为 `api.uploadAndScore(imagePath)`。

## 接入 AI 的两种常见方案

- 直连服务端：
  - 页面用 `wx.uploadFile` 上传图片到你的服务端，服务端调用 AI 工具返回 `{ score: number, detail?: string }`。
  - 在 `utils/api.js` 配置 `BASE_URL` 并使用 `uploadAndScore`。
- 云开发云函数：
  - 在云函数中完成图片处理与 AI 调用，页面用 `wx.cloud.callFunction` 传递临时文件。
  - 需初始化云开发、创建函数与部署（后续按需求补充）。

## 接口约定建议

- 请求：上传图片（`multipart/form-data` 字段名 `file`），可附带业务参数（如目标评分规则）。
- 响应：`{ score: number, detail?: string, version?: string }`，`score` 范围建议 `0-100`。

## 后续工作清单（示例）

- 明确评分规则与量表定义（需求澄清文档）。
- 选择 AI 工具与供应商，确定接入方式与成本。
- 整理接口协议、错误码与重试策略。
- 隐私合规与数据处理（本地压缩、敏感信息处理等）。
- UI 细化与体验优化（加载态、异常提示、结果维度展示）。

## 交互与协作方式

- 你在 `docs/requirements.md` 按模板逐项补充与修改需求；我据此分阶段实现并提交修改。
- 每阶段我会更新待办清单、补充实现细节，并在必要时提出澄清问题。
- 你可在微信开发者工具里真机/模拟器验证；如有变更，继续在需求澄清文档中记录。

