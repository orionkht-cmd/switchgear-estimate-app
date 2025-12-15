#!/bin/bash

# 1. NVM 설정을 로드합니다 (사용자 환경변수 불러오기)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. 작업 폴더로 이동
cd /home/dlckdgn/switchgear-estimate-app/backend

# 3. NVM을 통해 'default' 버전의 노드로 스크립트 실행
# (특정 버전을 고정하고 싶다면 'nvm run v22.21.1' 처럼 써도 됩니다)
nvm run default send-db-email.js >> send-db-email.log 2>&1