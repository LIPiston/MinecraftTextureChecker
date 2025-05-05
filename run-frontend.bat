@echo off
REM 切换到项目根目录下的 client 文件夹
cd /d "%~dp0client"
REM 启动前端开发服务器
npm i
npm run dev
pause 