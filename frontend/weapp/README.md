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

## 登录认证（当前模式：本地）
- 默认仅使用微信统一授权弹窗获取“头像/昵称”，不依赖后端绑定。
- 触发方式：登录页点击“授权并进入”按钮调用 `wx.getUserProfile`；成功后将用户信息保存在本地（`utils/user.js:1`）。
- 如需接入后端登录绑定，可启用 `utils/auth.js:1` 并配置 `miniprogram/config.js`，再将流程切换为 `wx.login` + 绑定接口。

## 页面与流程

- 登录授权页：`miniprogram/pages/auth/index.*` 首次进入必须授权，成功后进入房间列表
- 房间列表页：`miniprogram/pages/rooms/index.*` 新建/进入房间、跳转规则管理
- 房间详情页：`miniprogram/pages/room/index.*` 手动记分或拍照 AI 记分
- 分享与加入：房主在房间详情页点击“分享房间”，其他用户通过分享卡片进入该房间页面；如未登录会先跳转授权页，授权后自动加入房间。
- 规则管理页：`miniprogram/pages/rules/index.*` 新建规则（骨架），支持关联到房间
- 用户登录：首次进入会请求微信头像/昵称授权（`utils/user.js:1`），用于标识房主与玩家
- 登录授权需“用户触发”：在登录页点击“授权并进入”按钮弹出授权框；授权后进入应用。
 - 开发者工具提示：微信开发者工具在模拟环境中可能返回默认昵称“微信用户”和空头像；真机授权可获取真实头像与昵称。页面已在头像为空时回退使用 `<open-data type="userAvatarUrl">` 显示。

## 规则模版（AI 使用依据）
规则以“结构化 Schema + 可读模版文本”表示，AI 将据此算分。关键字段：
- 桌面：`players`（人数）、`handSize`（手牌数）、`tiles`（牌组组成，如是否含风/箭/花，`totalTiles`）
- 庄家：`continuousDealer`（连庄）、`dealerBonus`（自摸/胡牌加底）
- 结算：`payMode`（一人付/三家付）、`basePoint`（底分）、`cap`（封顶番）
- 抓鸟：`enabled`、`count`、`hitBonus`
- 违例检查：`checkNoDeclare`（查大叫）、`checkWrongSuit`（查花猪）
- 番型：`scoring.baseHands/melds/extras`（示例：平胡、自摸、对对胡、清一色、明杠、暗杠、绝张等）

模版渲染：`miniprogram/rules/template.js:1` 的 `renderTemplateMarkdown(rule)` 将结构化规则渲染为 Markdown，可直接被 AI 消费。
预置“川麻·血战到底”已内置且标记为“预置”，不可删除：`miniprogram/rules/template.js:1`、`miniprogram/pages/rules/index.*`。
自定义规则：在“新建规则”页输入名称与自然语言描述，调用 LLM 渲染为 Markdown 模版；保存前进行规范校验（必含“桌面/庄家/结算/抓鸟/违例检查/番型”等段落）。目前编辑功能暂时移除，仅支持新建与删除。LLM 渲染包含反馈闭环：若首次渲染不合格（缺分节等），系统会携带校验反馈要求 LLM 修正，最多重试 2 次；仍不合格则回退为本地解析渲染。
支持多轮交互：根据 AI 提示追加描述并再次渲染，以完善规则。

## 开发测试：重置数据
- 应用内：房间列表页顶部用户区域点击“清空数据”按钮，确认后将清除本地的用户、房间、规则等全部缓存并回到登录页。
- 开发者工具：也可使用“清缓存”功能（会话/本地缓存），效果等同。

（已移除自动化自测，所有玩家均通过真实微信授权加入房间）

## 接口约定建议

- 请求：上传图片（`multipart/form-data` 字段名 `file`），可附带业务参数（如目标评分规则）。
- 响应：`{ score: number, detail?: string, version?: string }`，`score` 范围建议 `0-100`。

## 后续工作清单（示例）

- 梳理并落地麻将规则细则与分值表；完善规则绑定与验证
- 对接火山引擎真实接口（签名、鉴权、响应结构映射）
- 后端提供 `/api/auth/bind` 与鉴权体系（校验 `code` 换取 `openid/unionid`，返回 `userId/token`），完善数据合规与隐私策略
- 完善数据模型（玩家、局次、结算与账本）与导出能力
- 错误处理与重试、隐私合规与图片生命周期管理
- UI 细化（维度展示、战绩统计）与埋点监控

## 交互与协作方式

- 你在 `docs/requirements.md` 按模板逐项补充与修改需求；我据此分阶段实现并提交修改。
- 每阶段我会更新待办清单、补充实现细节，并在必要时提出澄清问题。
- 你可在微信开发者工具里真机/模拟器验证；如有变更，继续在需求澄清文档中记录。
