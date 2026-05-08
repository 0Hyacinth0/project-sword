#!/bin/bash

# ============================================
# 宝塔部署 - 自动拉取代码并构建脚本
# 项目: project-sword (Vue3 + Vite)
# 域名: www.idcombat.icu/sword/
# ============================================

# ---------- 配置区（按实际情况修改） ----------

# Git 仓库地址
GIT_REPO="https://github.com/0Hyacinth0/project-sword.git"

# 项目代码存放目录（git 仓库，与网站目录分开）
PROJECT_DIR="/www/wwwroot/repos/project-sword"

# 网站根目录（宝塔网站目录）
WEB_ROOT="/www/wwwroot/www.idcombat.icu"

# 部署子目录（访问路径: www.idcombat.icu/sword/）
DEPLOY_SUBDIR="sword"

# 最终部署目标: /www/wwwroot/www.idcombat.icu/sword/
DEPLOY_DIR="${WEB_ROOT}/${DEPLOY_SUBDIR}"

# Node.js 路径（SSH 登录执行 which node 获取）
NODE_BIN="/www/server/nodejs/v22.2.0/bin"

# Git 分支
GIT_BRANCH="main"

# 日志文件
LOG_FILE="${PROJECT_DIR}/deploy.log"

# ---------- 函数区 ----------

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log() {
    echo "[$(timestamp)] $1" | tee -a "$LOG_FILE"
}

# ---------- 主流程 ----------

# 首次部署：如果项目目录不存在则自动 clone
if [ ! -d "$PROJECT_DIR" ]; then
    log "项目目录不存在，正在克隆仓库..."
    mkdir -p "$(dirname "$PROJECT_DIR")"
    git clone -b "$GIT_BRANCH" "$GIT_REPO" "$PROJECT_DIR" >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
        log "错误: 克隆仓库失败，请检查 Git 地址和网络"
        exit 1
    fi
    log "仓库克隆成功"
fi

cd "$PROJECT_DIR" || { log "错误: 无法进入项目目录 $PROJECT_DIR"; exit 1; }

log "===== 开始部署 ====="

# 1. 拉取最新代码
log "拉取最新代码 (分支: $GIT_BRANCH)..."
git fetch origin "$GIT_BRANCH" >> "$LOG_FILE" 2>&1
git reset --hard "origin/$GIT_BRANCH" >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "错误: 拉取代码失败，请检查 Git 配置"
    exit 1
fi
log "代码拉取成功"

# 2. 安装依赖
log "安装依赖..."
export PATH="$NODE_BIN:$PATH"
npm install >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "错误: 依赖安装失败"
    exit 1
fi
log "依赖安装完成"

# 3. 构建
log "开始构建..."
npm run build >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "错误: 构建失败，请查看 $LOG_FILE"
    exit 1
fi
log "构建完成"

# 4. 同步构建产物到网站子目录
mkdir -p "$DEPLOY_DIR"
log "同步构建产物到 ${DEPLOY_DIR}..."
rsync -av --delete "${PROJECT_DIR}/dist/" "${DEPLOY_DIR}/" >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "错误: 文件同步失败"
    exit 1
fi
log "文件同步完成"

log "===== 部署成功 ====="
log "访问地址: https://www.idcombat.icu/${DEPLOY_SUBDIR}/"
