#!/bin/bash
# 部署 Docusaurus 文档到群晖 Web Station
# 用法: ./deploy-nas.sh

set -e

# ===== 配置 =====
NAS_USER="luuman"
NAS_HOST="luuman.synology.me"
NAS_PORT="22"
NAS_PATH="/volume1/web/matrx-docs"
# =================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"

echo "=============================="
echo "  部署 Matrx 文档到群晖 NAS"
echo "=============================="

# 1. 构建
echo ""
echo "[1/3] 构建文档站点..."
cd "$SCRIPT_DIR"
BASE_URL="/" npm run build

if [ ! -d "$BUILD_DIR" ]; then
  echo "错误: 构建目录 $BUILD_DIR 不存在"
  exit 1
fi

# 2. 同步到群晖
echo ""
echo "[2/3] 同步到 ${NAS_USER}@${NAS_HOST}:${NAS_PATH} ..."
rsync -avz --delete \
  -e "ssh -p ${NAS_PORT}" \
  "$BUILD_DIR/" \
  "${NAS_USER}@${NAS_HOST}:${NAS_PATH}/"

# 3. 完成
echo ""
echo "[3/3] 部署完成!"
echo "访问地址: 请在 Web Station 中查看配置的域名/端口"
echo "=============================="
