后端（Go）说明

- 启动：在 `backend/go` 目录执行 `go run .`，监听 `:8080`
- 接口：
  - 规则：`GET/POST/PUT/DELETE /api/rules`
  - 房间：`GET/POST /api/rooms`、`GET/PUT /api/rooms/:id`、`POST /api/rooms/:id/join`
  - AI：`POST /api/ai/score`（占位）、`POST /api/ai/rule-markdown`（占位）
- 数据存储：当前为内存存储，占位实现；后续可替换为持久化（如 Postgres/SQLite）
