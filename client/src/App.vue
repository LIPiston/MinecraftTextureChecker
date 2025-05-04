<template>
  <v-app>
    <!-- 顶部导航栏 -->
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>Minecraft 资源包差异检查工具</v-toolbar-title>
      <v-spacer />
      <v-btn variant="text" href="https://github.com/lipiston/MinecraftTextureChecker" target="_blank" color="white">
        GitHub 仓库
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container class="mx-auto" style="max-width:600px;">
        <!-- 进度条及状态显示 -->
        <v-row v-if="loading" class="mb-4">
          <v-col cols="12">
            <v-progress-linear :value="progress" height="6" striped color="primary"></v-progress-linear>
            <div class="caption text-center mt-1">{{ loadingStage }}</div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-file-input
              v-model="file"
              label="上传资源包 (.zip)"
              accept=".zip"
              outlined
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="version"
              :items="filteredVersions"
              label="选择Minecraft核心版本"
              outlined
            />
          </v-col>
        </v-row>
        <!-- 只显示正式版核心选项，放在版本下方 -->
        <v-row dense class="py-1">
          <v-col cols="12" class="py-1">
            <v-checkbox
              v-model="onlyRelease"
              label="只显示正式版核心"
              dense
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex align-center">
            <v-btn
              :disabled="!file || !version || loading"
              color="primary"
              @click="submit"
            >
              开始检查
            </v-btn>
            <v-btn
              class="ml-4"
              color="primary"
              @click="exportMarkdown"
              :disabled="!result || loading"
            >
              导出 Markdown 报告
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-if="loading">
          <v-col cols="12" class="text-center">
            <v-progress-circular indeterminate color="primary" />
          </v-col>
        </v-row>
        <v-row v-if="result">
          <v-col cols="12" md="4">
            <v-list>
              <v-list-subheader>缺失纹理 ({{ result.missing.length }})</v-list-subheader>
              <v-list-item
                v-for="item in result.missing"
                :key="item"
              >
                <v-list-item-icon>
                  <v-icon color="warning">mdi-alert-circle-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ item }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="4">
            <v-list>
              <v-list-subheader>修改纹理 ({{ result.modified.length }})</v-list-subheader>
              <v-list-item
                v-for="item in result.modified"
                :key="item"
              >
                <v-list-item-icon>
                  <v-icon color="info">mdi-image-filter-none</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ item }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="4">
            <v-list>
              <v-list-subheader>多余纹理 ({{ result.extra.length }})</v-list-subheader>
              <v-list-item
                v-for="item in result.extra"
                :key="item"
              >
                <v-list-item-icon>
                  <v-icon color="success">mdi-plus-box-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ item }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
        <v-row v-if="error">
          <v-col cols="12">
            <v-alert type="error" dense>{{ error }}</v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const file = ref(null);
const version = ref('');
const versions = ref([]);
const onlyRelease = ref(true);
const loading = ref(false);
const loadingStage = ref('');
const progress = ref(0);
const result = ref(null);
const error = ref('');

// 基于 onlyRelease 开关过滤正式版版本（仅匹配 x.y 或 x.y.z 形式）
const filteredVersions = computed(() => {
  const all = versions.value;
  if (!onlyRelease.value) return all;
  return all.filter(v => /^\d+\.\d+(?:\.\d+)?$/.test(v));
});

onMounted(async () => {
  try {
    const res = await axios.get('/api/versions');
    versions.value = res.data;
  } catch (e) {
    error.value = '获取版本列表失败';
  }
});

const submit = async () => {
  if (!file.value || !version.value) {
    error.value = '请先选择文件和版本';
    return;
  }
  loading.value = true;
  error.value = '';
  result.value = null;
  progress.value = 0;
  loadingStage.value = '准备上传资源包';

  const formData = new FormData();
  formData.append('file', file.value);
  formData.append('version', version.value);
  try {
    const res = await axios.post('/api/diff', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => {
        loadingStage.value = '上传资源包';
        progress.value = Math.min(20, Math.round(e.loaded / e.total * 20));
      },
      onDownloadProgress: e => {
        loadingStage.value = '下载并处理核心';
        progress.value = 20 + Math.min(60, Math.round(e.loaded / e.total * 60));
      }
    });
    // 请求处理完成
    loadingStage.value = '完成';
    progress.value = 100;
    result.value = res.data;
  } catch (e) {
    error.value = e.response?.data?.error || '检查失败';
  } finally {
    loading.value = false;
  }
};

const exportMarkdown = () => {
  let md = `# Minecraft 资源包差异报告\n\n`;
  md += `## 缺失纹理 (${result.value.missing.length})\n`;
  result.value.missing.forEach(item => { md += `- [ ] ${item}\n`; });
  md += `\n## 修改纹理 (${result.value.modified.length})\n`;
  result.value.modified.forEach(item => { md += `- ${item}\n`; });
  md += `\n## 多余纹理 (${result.value.extra.length})\n`;
  result.value.extra.forEach(item => { md += `- ${item}\n`; });
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `texture-diff-report-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.v-application {
  font-family: "Noto Sans SC", sans-serif;
}
</style> 