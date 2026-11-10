@echo off
rem 在本机用 localhost 打开（这样才能安装成应用、离线使用）。需要已安装 Python。
cd /d "%~dp0"
start "" http://localhost:8765/
python -m http.server 8765
