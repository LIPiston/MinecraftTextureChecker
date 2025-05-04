# Minecraft Texture checker

这是一个基于 Vue3 和 Vuetify3 的前端与 Express 后端的 web 应用。用户可以上传 Minecraft 资源包(.zip)，选择核心版本，服务端会下载对应的 Minecraft 客户端，并比较资源包与核心中的材质差异。

## 运行步骤

```bash
# 安装后端依赖并启动后端
cd server
npm install
npm start

# 在另一个终端安装前端依赖并启动前端
cd client
npm install
npm run dev

# 打开浏览器，访问 http://localhost:5173
``` 