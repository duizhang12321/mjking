#!/usr/bin/env bash
set -euo pipefail

# 重启后端：若存在旧进程则先停止，再启动并等待就绪
# 用法：
#   chmod +x scripts/dev_restart.sh
#   ./scripts/dev_restart.sh [PORT] [DATA_DIR]
# 环境变量（可选）：VOLC_ENDPOINT, VOLC_AUTH, LLM_ENDPOINT, LLM_AUTH

PORT=${1:-${PORT:-8080}}
DATA_DIR=${2:-${DATA_DIR:-./data}}
BACKEND_DIR="backend/go"
LOG_DIR="logs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/backend-$TIMESTAMP.log"
PID_FILE="dev_backend.pid"

stop_backend() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" || true)
    if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
      echo "[restart] 停止后端进程 pid $PID"
      kill "$PID" || true
      # 等待退出
      for i in $(seq 1 20); do
        if kill -0 "$PID" 2>/dev/null; then sleep 0.5; else break; fi
      done
    fi
    rm -f "$PID_FILE"
  fi
}

start_backend() {
  mkdir -p "$DATA_DIR" "$LOG_DIR"
  pushd "$BACKEND_DIR" >/dev/null
  echo "[restart] 启动后端: PORT=$PORT DATA_DIR=$(pwd)/../../$DATA_DIR 日志=$LOG_FILE"
  nohup env PORT="$PORT" DATA_DIR="$(pwd)/../../$DATA_DIR" VOLC_ENDPOINT="${VOLC_ENDPOINT:-}" VOLC_AUTH="${VOLC_AUTH:-}" LLM_ENDPOINT="${LLM_ENDPOINT:-}" LLM_AUTH="${LLM_AUTH:-}" go run . > "../../$LOG_FILE" 2>&1 &
  PID=$!
  popd >/dev/null
  echo "$PID" > "$PID_FILE"
  echo "[restart] 后端进程已启动，pid $PID，日志 $LOG_FILE"
}

wait_ready() {
  BASE_URL="http://127.0.0.1:$PORT"
  echo "[restart] 等待后端可用：$BASE_URL"
  for i in $(seq 1 30); do
    if curl -fsS "$BASE_URL/api/rooms" >/dev/null 2>&1; then echo "[restart] 后端就绪"; return 0; fi
    sleep 1
  done
  echo "[restart] 后端未就绪，请查看日志 $LOG_FILE"; return 1
}

stop_backend
start_backend
wait_ready

echo "[restart] 完成：后端地址 http://127.0.0.1:$PORT（日志：$LOG_FILE，pid：$(cat "$PID_FILE")）"
