# Minecraft 资源包材质差异检查工具

这是一个基于 Vue3 + Vuetify3 前端与 Express 后端的 Web 应用。用户可以上传 Minecraft 资源包（.zip），选择核心版本，服务端自动下载对应版本的 Minecraft 客户端 JAR 并提取材质文件，比较资源包与核心材质的差异，返回缺失/修改/多余三类纹理列表。

## 项目结构
```
MinecraftTextureChecker/
├── client/            # 前端 (Vite + Vue3 + Vuetify3)
│   ├── src/           # 主应用源码
│   ├── index.html     # 入口 HTML
│   └── vite.config.js # 前端构建配置
├── server/            # 后端 (Express + Multer + AdmZip)
│   ├── index.js       # 服务端主文件
│   └── package.json   # 后端依赖与脚本
├── run-backend.bat    # 启动后端脚本
├── run-frontend.bat   # 启动前端脚本
└── README.md          # 项目说明
```

## 开发调试
1. 在项目根目录分别执行：
   - `run-backend.bat`：切换到 `server`，执行 `npm install` 并启动后端服务。
   - `run-frontend.bat`：切换到 `client`，执行 `npm install` 并启动前端开发服务器。
2. 浏览器打开 http://localhost:5173 ，上传资源包并点击"开始检查"。

## 许可证

本项目基于 MIT 许可证开源，详见 [LICENSE](./LICENSE)。 