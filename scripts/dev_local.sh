#!/usr/bin/env bash
set -euo pipefail

# 本地联调启动脚本：启动后端并更新前端配置
# 用法：
#   chmod +x scripts/dev_local.sh
#   ./scripts/dev_local.sh [PORT] [DATA_DIR]
# 环境变量（可选）：VOLC_ENDPOINT, VOLC_AUTH, LLM_ENDPOINT, LLM_AUTH

PORT=${1:-${PORT:-8080}}
DATA_DIR=${2:-${DATA_DIR:-./data}}
BACKEND_DIR="backend/go"
FRONT_CFG="frontend/weapp/miniprogram/config.js"

echo "[dev] 启动后端: PORT=$PORT DATA_DIR=$DATA_DIR"

mkdir -p "$DATA_DIR"

# 启动后端（后台运行，输出到 dev_backend.log）
LOG_FILE="dev_backend.log"
PID_FILE="dev_backend.pid"
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
  echo "[dev] 后端已在运行 (pid $(cat "$PID_FILE")); 跳过启动"
else
  (cd "$BACKEND_DIR" && nohup env PORT="$PORT" DATA_DIR="$(pwd)/../../$DATA_DIR" VOLC_ENDPOINT="${VOLC_ENDPOINT:-}" VOLC_AUTH="${VOLC_AUTH:-}" LLM_ENDPOINT="${LLM_ENDPOINT:-}" LLM_AUTH="${LLM_AUTH:-}" go run . > "../../$LOG_FILE" 2>&1 & echo $! > "../../$PID_FILE")
  echo "[dev] 后端进程已启动，pid $(cat "$PID_FILE")，日志 $LOG_FILE"
fi

# 等待后端可用
BASE_URL="http://127.0.0.1:$PORT"
echo "[dev] 等待后端可用：$BASE_URL"
for i in $(seq 1 30); do
  if curl -fsS "$BASE_URL/api/rooms" >/dev/null 2>&1; then
    echo "[dev] 后端就绪"
    break
  fi
  sleep 1
done

# 更新前端配置（生成或覆盖 config.js）
echo "[dev] 写入前端配置：$FRONT_CFG"
cat > "$FRONT_CFG" <<EOF
module.exports = {
  baseUrl: "$BASE_URL",
  headers: {},
  volc: { endpoint: "", headers: {} },
  llm: { endpoint: "", headers: {} }
}
EOF

echo "[dev] 配置完成：
- 后端：$BASE_URL（日志：$LOG_FILE，pid：$(cat "$PID_FILE")）
- 前端配置：$FRONT_CFG（baseUrl 指向后端）

后续步骤：
1) 打开微信开发者工具并导入 frontend/weapp
2) 若需代理火山引擎或 LLM，请在运行脚本前设置 VOLC_ENDPOINT/LLM_ENDPOINT 环境变量
3) 如需停止后端：kill \"$(cat "$PID_FILE")\"，或删除 $PID_FILE 后重启"
