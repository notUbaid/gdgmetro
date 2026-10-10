@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo   Ek Safar: Reset to Single Initial Commit
echo   Repository: https://github.com/notUbaid/gdgmetro
echo   Commit Timestamp: Oct 11, 2026 00:17:00 +0530 (12:17 AM)
echo ========================================================

cd /d "%~dp0"

:: Set Git author and committer dates to 12:17 AM today (IST)
set "GIT_AUTHOR_DATE=2026-10-11 00:17:00 +0530"
set "GIT_COMMITTER_DATE=2026-10-11 00:17:00 +0530"

echo [1/5] Ensuring remote origin is set to gdgmetro...
git remote set-url origin https://github.com/notUbaid/gdgmetro.git

echo [2/5] Creating clean orphan branch...
git checkout --orphan temp_clean_branch

echo [3/5] Staging all files...
git add -A

echo [4/5] Creating initial commit dated 12:17 AM...
git commit -m "Initial commit" --date="2026-10-11 00:17:00 +0530"

echo [5/5] Resetting main branch and force pushing to remote...
git branch -D main 2>nul
git branch -m main
git push -f origin main

echo.
echo ========================================================
echo   Success! Entire commit history reset to Initial Commit.
echo   Pushed to https://github.com/notUbaid/gdgmetro
echo ========================================================
pause
