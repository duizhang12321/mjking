# 项目状态与变更记录

更新时间：2026-03-27 00:00:00Z（UTC）

## 项目状态快照
- 里程碑：M1（演示版：本地模拟评分与基础 UI）已完成；M2（接入真实 AI）待开始；M3（体验与合规）规划中。
- 当前实现：
  - 小程序基础结构已建立（选择图片、重置、计算分数）。
  - 评分逻辑为本地模拟，真实接入的 `uploadAndScore` 已预留。
- 入口页面：`miniprogram/pages/index/index.wxml:1`
- API 封装：`miniprogram/utils/api.js:1`（默认 `scoreImage` 使用本地模拟；直连后端用 `uploadAndScore` 并配置 `BASE_URL`）。
- 文档：`README.md:1`（项目指南）、`docs/requirements.md:1`（需求澄清模板）。

## 最近重要变更
- 2026-03-27
  - 初始化小程序目录与首页功能：
    - `project.config.json:1`、`miniprogram/app.*`、`miniprogram/pages/index/index.*`、`miniprogram/utils/api.js:1`
  - 新增文档：`README.md:1`、`docs/requirements.md:1`

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
  - 页面入口：`miniprogram/pages/index/index.js:1`、`miniprogram/pages/index/index.wxml:1`
  - API 封装：`miniprogram/utils/api.js:1`（切换到真实后端时，改用 `uploadAndScore` 并设置 `BASE_URL`）。
- 验证流程：选择图片 -> 计算分数（模拟） -> 查看结果与错误信息。
- 需求来源：`docs/requirements.md:1` 为唯一事实来源；以该文档为准推进实现与验收。

## 更新机制
- 我将于每次实现/决策变更后更新本文件的“项目状态快照”和“最近重要变更”。
- 当需求澄清文档更新时，同步在此处记录待决事项的变更与下一步计划调整。

