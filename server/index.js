import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// ESM 环境下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 静态资源目录（前端打包输出到 public）
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // 所有非 API 请求返回 index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use(cors());
app.use(express.json());

// 创建上传目录
const uploadDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const port = process.env.PORT || 3000;

// 获取所有版本列表
app.get('/api/versions', async (req, res) => {
  try {
    const manifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
    const manifestRes = await fetch(manifestUrl);
    const manifest = await manifestRes.json();
    const versions = manifest.versions.map(v => v.id);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据版本获取客户端 Jar 下载链接
async function getVersionJarUrl(version) {
  const manifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
  const manifestRes = await fetch(manifestUrl);
  const manifest = await manifestRes.json();
  const versionInfo = manifest.versions.find(v => v.id === version);
  if (!versionInfo) throw new Error('版本不存在');
  const versionMetaRes = await fetch(versionInfo.url);
  const versionMeta = await versionMetaRes.json();
  return versionMeta.downloads.client.url;
}

// 提取材质文件并计算哈希
async function extractTextures(bufferOrPath) {
  const zip = Buffer.isBuffer(bufferOrPath)
    ? new AdmZip(bufferOrPath)
    : new AdmZip(bufferOrPath);
  const entries = zip.getEntries();
  const textures = {};

  for (const entry of entries) {
    const p = entry.entryName;
    if (p.startsWith('assets/minecraft/textures/') && p.endsWith('.png')) {
      const relativePath = p.replace('assets/minecraft/textures/', '');
      const buffer = entry.getData();
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      textures[relativePath] = hash;
    }
  }
  return textures;
}

// 差异比较接口
app.post('/api/diff', upload.single('file'), async (req, res) => {
  try {
    const version = req.body.version;
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }
    const userZipPath = req.file.path;

    // 提取用户资源包材质
    const userTextures = await extractTextures(userZipPath);

    // 下载并提取核心材质
    const jarUrl = await getVersionJarUrl(version);
    const jarRes = await fetch(jarUrl);
    const jarBuffer = await jarRes.buffer();
    const coreTextures = await extractTextures(jarBuffer);

    // 比较差异
    const missing = [];
    const extra = [];
    const modified = [];

    for (const key of Object.keys(coreTextures)) {
      if (!userTextures[key]) missing.push(key);
      else if (userTextures[key] !== coreTextures[key]) modified.push(key);
    }
    for (const key of Object.keys(userTextures)) {
      if (!coreTextures[key]) extra.push(key);
    }

    res.json({ missing, modified, extra });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
}); 