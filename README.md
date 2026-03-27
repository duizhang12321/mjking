# AI 图片评分微信小程序

一个面向线下麻将辅助的微信小程序基础工程。支持：
- 开房间并记录对局积分（手动或 AI 记分）
- 关联自定义/预置规则（骨架，后续补充细则）
- 通过上传图片调用 AI 服务自动记分（占位：火山引擎 API）
 - 多用户：支持房主与玩家加入；房主可设置是否关联规则，其余玩家仅能手动或拍照上传记分

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
    rooms/                    // 房间列表页
    room/                     // 房间详情页（手动/AI 记分）
    rules/                    // 规则管理页（骨架）
    index/                    // 原演示页（保留）
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

## AI 记分接入

- 封装在 `miniprogram/utils/ai.js:1`：按优先级调用
  - 火山引擎：读取 `miniprogram/config.js` 的 `volc.endpoint` 与 `headers`，使用 `wx.uploadFile`
  - 自建后端：读取 `baseUrl`，走 `utils/api.js:1` 的 `uploadAndScore`
  - 无配置：回退到本地模拟 `scoreImage`
- 配置：复制 `miniprogram/config.sample.js:1` 为 `miniprogram/config.js` 并填写真实参数（切勿提交密钥）。

## 页面与流程

- 房间列表页：`miniprogram/pages/rooms/index.*` 新建/进入房间、跳转规则管理
- 房间详情页：`miniprogram/pages/room/index.*` 手动记分或拍照 AI 记分
- 规则管理页：`miniprogram/pages/rules/index.*` 新建规则（骨架），支持关联到房间
- 用户登录：首次进入会请求微信头像/昵称授权（`utils/user.js:1`），用于标识房主与玩家
 - 登录授权需“用户触发”才能弹窗：请点击房间列表页顶部的“登录授权”按钮（而非页面加载时自动弹窗）。

## 接口约定建议

- 请求：上传图片（`multipart/form-data` 字段名 `file`），可附带业务参数（如目标评分规则）。
- 响应：`{ score: number, detail?: string, version?: string }`，`score` 范围建议 `0-100`。

## 后续工作清单（示例）

- 梳理并落地麻将规则细则与分值表；完善规则绑定与验证
- 对接火山引擎真实接口（签名、鉴权、响应结构映射）
- 完善数据模型（玩家、局次、结算与账本）与导出能力
- 错误处理与重试、隐私合规与图片生命周期管理
- UI 细化（维度展示、战绩统计）与埋点监控

## 交互与协作方式

- 你在 `docs/requirements.md` 按模板逐项补充与修改需求；我据此分阶段实现并提交修改。
- 每阶段我会更新待办清单、补充实现细节，并在必要时提出澄清问题。
- 你可在微信开发者工具里真机/模拟器验证；如有变更，继续在需求澄清文档中记录。
