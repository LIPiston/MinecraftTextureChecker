@echo off
REM 切换到项目根目录下的 server 文件夹
cd /d "%~dp0server"
REM 启动后端服务
npm i
npm start
pause 