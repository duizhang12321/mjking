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
- POST /api/ai/score → 200: `{ score:number, detail?:object }`
- POST /api/ai/rule-markdown → 200: `{ markdown:string }`

## 配置与部署
- 环境变量：
  - `PORT`（默认 8080）
  - `DATA_DIR`（默认 `./data`，用于文件持久化）
- CORS：默认允许跨域访问；如需收紧可在 `main.go` 中调整 `withCORS`。
- 预置规则：由前端提供并可写入后端；服务端需保证 `preset=true` 的规则不可删除。
