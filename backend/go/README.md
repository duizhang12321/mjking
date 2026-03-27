- 后端（Go）说明

- 启动：在 `backend/go` 目录执行 `PORT=8080 DATA_DIR=./data go run .`，监听 `:8080`
- 接口：
  - 规则：`GET/POST/PUT/DELETE /api/rules`
  - 房间：`GET/POST /api/rooms`、`GET/PUT /api/rooms/:id`、`POST /api/rooms/:id/join`
  - AI：`POST /api/ai/score`（占位）、`POST /api/ai/rule-markdown`（占位）
- 数据存储：当前为文件持久化（`DATA_DIR` 下 `rules.json`/`rooms.json`），线程安全；后续可替换为数据库（如 Postgres/SQLite）
- CORS：已开启（允许跨域 GET/POST/PUT/DELETE/OPTIONS）

本地联调脚本：
- 使用仓库根目录的 `scripts/dev_local.sh` 自动启动后端并更新前端配置。
- 运行后在微信开发者工具导入 `frontend/weapp`，即可联调。
