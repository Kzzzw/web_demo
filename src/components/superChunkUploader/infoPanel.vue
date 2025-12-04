<template>
<a-card class="upload-panel" :bordered="true">
  <template #title>
    <a-space :size="8">
      <span>{{ title }}</span>
      <a-tag v-if="isUploading" color="blue">上传中</a-tag>
      <a-tag v-else-if="isCompleted" color="green">已完成</a-tag>
      <a-tag v-else color="default">已就绪</a-tag>
    </a-space>
  </template>
  <template #extra>
    <a-button type="text" size="small" @click="$emit('close')">关闭</a-button>
  </template>
  <a-descriptions size="small" :column="1">
    <a-descriptions-item label="文件名">{{ file?.name }}</a-descriptions-item>
    <a-descriptions-item label="大小">{{ formatBytes(file?.size || 0) }}</a-descriptions-item>
    <a-descriptions-item label="进度">
      <a-progress :percent="Number(percent.toFixed(1))" :status="isCompleted ? 'success' : (isUploading ? 'active' : 'normal')" />
    </a-descriptions-item>
    <a-descriptions-item label="速度">{{ speedText }}/s</a-descriptions-item>
    <a-descriptions-item v-if="!isCompleted" label="剩余时间">{{ etaText }}</a-descriptions-item>
  </a-descriptions>
  <a-space class="panel-actions" :size="8">
    <a-button type="primary" :disabled="!file || isUploading" @click="$emit('start')">开始</a-button>
    <a-button :disabled="!isUploading" @click="$emit('pause')">暂停</a-button>
    <a-button :disabled="isUploading || !file || isCompleted" @click="$emit('resume')">继续</a-button>
    <a-button danger :disabled="!file && uploadedBytes === 0" @click="$emit('reset')">重置</a-button>
  </a-space>
</a-card>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

defineProps<{
  title?: string,
  file: File|null,
  percent: number,
  speedText: string,
  etaText: string,
  isUploading: boolean,
  isCompleted: boolean,
  uploadedBytes: number,
  formatBytes: (n: number) => string,
}>()
</script>

<style scoped>
.upload-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 360px;
  z-index: 2000;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.panel-actions {
  margin-top: 12px;
}
</style> 
