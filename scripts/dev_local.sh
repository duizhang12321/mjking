#!/usr/bin/env bash
set -euo pipefail

# 本地后端启动脚本：仅启动后端（不修改前端配置）
# 用法：
#   chmod +x scripts/dev_local.sh
#   ./scripts/dev_local.sh [PORT] [DATA_DIR]
# 环境变量（可选）：VOLC_ENDPOINT, VOLC_AUTH, LLM_ENDPOINT, LLM_AUTH

PORT=${1:-${PORT:-8080}}
DATA_DIR=${2:-${DATA_DIR:-./data}}
BACKEND_DIR="backend/go"

echo "[dev] 启动后端: PORT=$PORT DATA_DIR=$DATA_DIR"

mkdir -p "$DATA_DIR"

# 启动后端（后台运行，输出到 dev_backend.log）
LOG_DIR="logs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/backend-$TIMESTAMP.log"
PID_FILE="dev_backend.pid"
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
  echo "[dev] 后端已在运行 (pid $(cat "$PID_FILE")); 跳过启动"
else
  # 在子目录启动并在主目录记录 PID
  mkdir -p "$LOG_DIR"
  pushd "$BACKEND_DIR" >/dev/null
  nohup env PORT="$PORT" DATA_DIR="$(pwd)/../../$DATA_DIR" VOLC_ENDPOINT="${VOLC_ENDPOINT:-}" VOLC_AUTH="${VOLC_AUTH:-}" LLM_ENDPOINT="${LLM_ENDPOINT:-}" LLM_AUTH="${LLM_AUTH:-}" go run . > "../../$LOG_FILE" 2>&1 &
  PID=$!
  popd >/dev/null
  echo "$PID" > "$PID_FILE"
  echo "[dev] 后端进程已启动，pid $PID，日志 $LOG_FILE"
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

PID_OUT=""
if [ -f "$PID_FILE" ]; then PID_OUT=$(cat "$PID_FILE"); fi

echo "[dev] 完成：
- 后端：$BASE_URL（日志：$LOG_FILE，pid：$PID_OUT）
- 前端已由你手动配置 baseUrl 指向后端，无需脚本写入。

常用操作：
- 查看日志：tail -f $LOG_FILE
- 停止后端：[ -f $PID_FILE ] && kill \"$(cat $PID_FILE)\" || echo 'pid 文件不存在'
"
