# API 文档（后端对接）

## 规则 Rules
- GET /api/rules → 200: `[Rule]`
- POST /api/rules → 200: `Rule`（请求：`{ name, templateMarkdown, preset? }` 或 `{ name, prompt }`）
- PUT /api/rules/:id → 200: `Rule`
- DELETE /api/rules/:id → 200: `{ deleted: true }`（预置规则返回 400）

Rule: `{ id, name, desc, version, preset, templateMarkdown }`

## 房间 Rooms
- GET /api/rooms → 200: `[Room]`
- POST /api/rooms → 200: `Room`（请求：`{ name, ownerUid, ownerName, ownerAvatar }`）
- GET /api/rooms/:id → 200: `Room`
- PUT /api/rooms/:id → 200: `Room`
- POST /api/rooms/:id/join → 200: `Room`（请求：`{ uid, name, avatar }`）

Room: `{ id, name, createdAt, ownerUid, players:[{uid,name,avatar}], ruleId?, rounds:[{id,ts,score,desc,userUid}] }`

## AI
- POST /api/ai/score → 200: `{ score:number, detail?:object }`（代理火山引擎图片记分；入参：`multipart/form-data` 字段名 `file`）
- POST /api/ai/rule-markdown → 200: `{ markdown:string }`（代理 LLM 规则渲染；入参：`{ prompt, schema }`）
- POST /api/score/execute → 200: `{ score:number, detail?:object }`（规则执行引擎：入参 `ruleId` 或 `templateMarkdown` + `input.tiles` 等；当前为占位实现）
- 规则创建会话：
  - POST /api/rules/session/start → 200: `{ sessionId }`
  - POST /api/rules/session/:id/message → 200: `{ markdown }`（多轮对话占位，暂复用 LLM 渲染）

## 配置与部署
- 环境变量：
  - `PORT`（默认 8080）
  - `DATA_DIR`（默认 `./data`，用于文件持久化）
  - `VOLC_ENDPOINT`、`VOLC_AUTH`（图片记分代理地址与鉴权）
  - `LLM_ENDPOINT`、`LLM_AUTH`（规则渲染代理地址与鉴权）
- CORS：默认允许跨域访问；如需收紧可在 `main.go` 中调整 `withCORS`。
- 预置规则：由前端提供并可写入后端；服务端需保证 `preset=true` 的规则不可删除。
