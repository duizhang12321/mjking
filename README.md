# 项目总览（前后端）

本仓库统一管理微信小程序前端与 Go 后端：

- 前端（微信小程序）：frontend/weapp/
  - 导入路径：在微信开发者工具选择 frontend/weapp 作为项目根（包含 project.config.json）
  - 数据层：miniprogram/utils/storage.js 优先走后端 API，未配置时本地回退
- 后端（Go）：backend/go/
  - 启动：在该目录运行 go run .，默认监听 :8080
  - API 文档：backend/docs/api.md

对接步骤：
- 在 frontend/weapp/miniprogram/config.js 配置 baseUrl、headers、volc.endpoint、llm.endpoint
- 在微信开发者工具中将域名加入“request 合法域名”

文档索引：
- 总体需求与状态：docs/requirements.md、docs/status.md
- 前端说明：frontend/weapp/README.md
- 后端说明与 API：backend/go/README.md、backend/docs/api.md

目录结构（简要）：
- frontend/weapp/miniprogram/pages/*、utils/*、rules/*
- backend/go/main.go、go.mod
- docs/requirements.md、docs/status.md

本地联调（脚本）：
- 脚本：scripts/dev_local.sh（启动后端并写入前端 config.js）
- 用法：
  - chmod +x scripts/dev_local.sh && ./scripts/dev_local.sh（可选参数：PORT DATA_DIR）
  - 环境变量（可选）：VOLC_ENDPOINT、VOLC_AUTH、LLM_ENDPOINT、LLM_AUTH
- 行为：
  - 在后台启动后端（日志：dev_backend.log，PID：dev_backend.pid）
  - 等待 http://127.0.0.1:<PORT> 就绪，写入前端 frontend/weapp/miniprogram/config.js，将 baseUrl 指向后端
  - 打开微信开发者工具并导入 frontend/weapp 进行联调
