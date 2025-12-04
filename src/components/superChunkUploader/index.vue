<template>
    <a-card class="super-chunk-uploader" :bordered="true" :hoverable="true">
        <template #title>
            <div class="card-title">大文件分片上传</div>
        </template>

        <input ref="fileInputRef" type="file" :multiple="false" @change="handleFileChange" style="display:none" />

        <a-space class="toolbar" :size="12" wrap>
            <a-button type="primary" @click="triggerSelect">选择文件</a-button>
            <a-button :disabled="!file || isUploading" @click="handleStart">开始</a-button>
            <a-button :disabled="!isUploading" @click="handlePause">暂停</a-button>
            <a-button :disabled="isUploading || !file || isCompleted" @click="handleResume">继续</a-button>
            <a-button danger :disabled="!file && uploadedBytes === 0" @click="handleReset">重置</a-button>
        </a-space>

    <div v-if="file" class="file-info">
            <a-descriptions size="small" :column="2" bordered>
                <a-descriptions-item label="文件">{{ file.name }}</a-descriptions-item>
                <a-descriptions-item label="大小">{{ formatBytes(file.size) }}</a-descriptions-item>
            </a-descriptions>
    </div>

        <div v-if="file" class="progress-wrap">
            <a-progress :percent="Number(percent.toFixed(1))"
                :status="isCompleted ? 'success' : (isUploading ? 'active' : 'normal')" />
      <div class="meta">
                <a-space :size="8">
        <span>{{ percent.toFixed(1) }}%</span>
                    <span>·</span>
                    <span>速度 {{ speedText }}/s</span>
                    <template v-if="!isCompleted">
                        <span>·</span>
                        <span>预计剩余 {{ etaText }}</span>
                    </template>
                    <template v-else>
                        <span>·</span>
                        <span>上传完成</span>
                    </template>
                </a-space>
      </div>
    </div>
    </a-card>

    <!-- 浮动信息面板 -->
    <InfoPanel v-if="panelVisible && file" :file="file" :percent="percent" :speedText="speedText" :etaText="etaText"
        :isUploading="isUploading" :isCompleted="isCompleted" :uploadedBytes="uploadedBytes" :formatBytes="formatBytes"
        @close="panelVisible = false" @start="handleStart" @pause="handlePause" @resume="handleResume"
        @reset="handleReset" />

    <!-- 打开面板按钮（隐藏时显示） -->
    <a-button v-if="!panelVisible && file" class="upload-open-btn" type="primary" shape="round"
        @click="panelVisible = true">上传信息</a-button>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, defineExpose } from 'vue'
import { useChunkUploader, type ChunkUploaderProps } from '@/utils/chunkUploader'
import InfoPanel from '@/components/superChunkUploader/infoPanel.vue'

const props = defineProps<ChunkUploaderProps>()
const emits = defineEmits<{ (e: 'progress', p: { loaded: number; total: number; percent: number; speedBps: number }): void; (e: 'serverProgress', p: { loaded: number; total: number; percent: number }): void; (e: 'success', payload: any): void; (e: 'error', error: any): void; (e: 'stateChange', s: 'idle' | 'uploading' | 'paused' | 'completed'): void; (e: 'change', f: File | null): void }>()

const {
    fileInputRef, file, state, percent, isUploading, isCompleted, uploadedBytes,
    speedText, etaText, formatBytes,
    triggerSelect, onFileChange, start, pause, resume, reset,
} = useChunkUploader(props, emits)

// 浮动面板可见性
const panelVisible = ref(false)

// 包一层本地处理，统一控制面板显隐
const handleFileChange = (e: Event) => { onFileChange(e); panelVisible.value = true }
const handleStart = () => { panelVisible.value = true; start() }
const handlePause = () => { pause() }
const handleResume = () => { resume() }
const handleReset = () => { reset(); panelVisible.value = false }

defineExpose({ start: handleStart, pause: handlePause, resume: handleResume, reset: handleReset, triggerSelect })
</script>

<style scoped>
.super-chunk-uploader {
    background: #fff;
}

.card-title {
    font-weight: 600;
}

.toolbar {
    margin-bottom: 12px;
}

.file-info {
    margin-bottom: 12px;
}

.progress-wrap {
    margin-top: 8px;
}

.meta {
    margin-top: 6px;
    font-size: 12px;
    color: #555;
}

/* 浮动信息面板 */
.upload-panel {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 360px;
    z-index: 2000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.panel-actions {
    margin-top: 12px;
}

.upload-open-btn {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1999;
}
</style>
