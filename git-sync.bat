@echo off
chcp 65001 > nul
echo ==============================================
echo        SWITCHGEAR APP - GIT SYNC TOOL
echo ==============================================
echo.
echo [Current Status]
git status -s
echo.
echo ----------------------------------------------
set /p msg="커밋 메시지를 입력하세요 (엔터치면 자동생성): "
if "%msg%"=="" set msg=Auto-save: %date% %time%
echo.
echo [1/3] 파일 담는 중 (git add)...
git add .
echo.
echo [2/3] 기록 남기는 중 (git commit)...
git commit -m "%msg%"
echo.
echo [3/3] 서버로 보내는 중 (git push)...
git push
echo.
echo ==============================================
echo              완료되었습니다! (SUCCESS)
echo ==============================================
pause
