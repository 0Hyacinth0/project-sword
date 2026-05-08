#!/bin/bash

# ============================================
# 宝塔部署 - 同步本地构建产物到服务器
# 项目: project-sword (Vue3 + Vite)
# 域名: www.idcombat.icu/sword/
#
# 使用方式:
#   本地构建后执行: bash deploy.sh
#   或一键: bash deploy.sh --build
# ============================================

# ---------- 配置区（按实际情况修改） ----------

# 服务器 SSH 连接（宝塔面板 → 安全 → 查看SSH信息）
SERVER="root@59.110.36.83"

# 网站根目录（宝塔网站目录）
WEB_ROOT="/www/wwwroot/www.idcombat.icu"

# 部署子目录（访问路径: www.idcombat.icu/sword/）
DEPLOY_SUBDIR="sword"

# 最终部署目标
DEPLOY_DIR="${WEB_ROOT}/${DEPLOY_SUBDIR}"

# ---------- 本地构建 ----------

# 加 --build 参数时先在本地构建
if [ "$1" = "--build" ]; then
    echo "本地构建中..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "构建失败，终止部署"
        exit 1
    fi
    echo "构建完成"
fi

# 检查 dist 目录是否存在
if [ ! -d "dist" ]; then
    echo "错误: dist 目录不存在，请先本地执行 npm run build"
    exit 1
fi

# ---------- 同步到服务器 ----------

echo "部署到 ${DEPLOY_DIR}..."
ssh "${SERVER}" "mkdir -p ${DEPLOY_DIR}"
rsync -avz --delete dist/ "${SERVER}:${DEPLOY_DIR}/"

if [ $? -ne 0 ]; then
    echo "部署失败"
    exit 1
fi

echo "===== 部署成功 ====="
echo "访问地址: https://www.idcombat.icu/${DEPLOY_SUBDIR}/"
