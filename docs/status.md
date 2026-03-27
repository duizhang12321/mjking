# 项目状态与变更记录

更新时间：2026-03-27 00:00:00Z（UTC）

## 项目状态快照
- 里程碑：M1（演示版 + 房间/规则骨架 + AI 接入占位）进行中；M2（接入火山引擎真实 API）待开始；M3（体验与合规）规划中。
- 当前实现：
  - 房间列表/详情页、规则管理页骨架；支持手动记分与拍照 AI 记分（占位）。
  - AI 接入封装 `miniprogram/utils/ai.js:1`（火山引擎优先，其次后端，最后回退本地模拟）。
  - 配置模板 `miniprogram/config.sample.js:1`，避免提交敏感信息。
- 入口页面：`miniprogram/pages/rooms/index.wxml:1`
- API 封装：`miniprogram/utils/api.js:1`（默认 `scoreImage` 使用本地模拟；直连后端用 `uploadAndScore` 并配置 `BASE_URL`）。
- 文档：`README.md:1`（项目指南）、`docs/requirements.md:1`（需求澄清模板）。

## 最近重要变更
- 2026-03-27
  - 初始化小程序目录与首页功能：
    - `project.config.json:1`、`miniprogram/app.*`、`miniprogram/pages/index/index.*`、`miniprogram/utils/api.js:1`
  - 新增文档：`README.md:1`、`docs/requirements.md:1`
  - 新增房间/规则页面与导航；AI 接入封装与配置模板；存储工具：
    - `miniprogram/pages/rooms/index.*`、`miniprogram/pages/room/index.*`、`miniprogram/pages/rules/index.*`
    - `miniprogram/utils/ai.js:1`、`miniprogram/config.sample.js:1`、`miniprogram/utils/storage.js:1`
  - 更新 `miniprogram/app.json:1` 页面顺序，将房间列表设为入口；更新 `README.md:1` 页面说明与接入方式。
  - 启用 Git post-commit 自动推送钩子：`/.git/hooks/post-commit:1`（每次提交后自动 `git push origin <branch>`）
  - 多用户房间与房主权限：
    - 用户会话：`miniprogram/utils/user.js:1`（微信头像昵称）
    - 房间支持加入/显示房间ID：`miniprogram/pages/rooms/index.*`
    - 房主可关联规则、添加玩家；玩家仅手动或拍照记分：`miniprogram/pages/room/index.*`
    - 轮次记录携带操作者：`userUid`

## 待决事项（需要你在需求澄清文档补充）
- 选择 AI 接入方式：直连服务端 或 云函数。
- 评分规则与量表（维度、权重、范围、阈值）。
- 接口协议（上传字段、返回结构、错误码与重试）。
- 隐私合规（图片存储与生命周期、脱敏策略、鉴权与限流）。

## 下一步计划
- 根据 `docs/requirements.md` 的更新，接通真实评分链路（后端/云函数）。
- 补充加载态、错误提示与结果维度展示。
- 增加埋点与最小监控（错误率、延时、QPS）。

## 交接须知（给后续接手的 Agent）
- 开发者工具：导入当前目录，`AppID` 可先用 `touristappid`。
- 关键文件：
  - 页面入口：`miniprogram/pages/rooms/index.wxml:1`、房间详情 `miniprogram/pages/room/index.js:1`
  - AI 封装：`miniprogram/utils/ai.js:1` 与配置 `miniprogram/config.sample.js:1`
  - API 封装：`miniprogram/utils/api.js:1`（后端直连时使用）。
- 验证流程：新建房间 -> 添加玩家 -> 手动或拍照 AI 记分 -> 查看记录。
- 需求来源：`docs/requirements.md:1` 为唯一事实来源；以该文档为准推进实现与验收。

## 更新机制
- 我将于每次实现/决策变更后更新本文件的“项目状态快照”和“最近重要变更”。
- 当需求澄清文档更新时，同步在此处记录待决事项的变更与下一步计划调整。
