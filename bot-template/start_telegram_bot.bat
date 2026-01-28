@echo off
REM Run Telegram controller from this folder (uses venv if present).
cd /d "%~dp0"
if exist "venv\Scripts\activate.bat" (
  call "venv\Scripts\activate.bat"
)
python telegram_runner.py
pause

