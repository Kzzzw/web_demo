<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import InfoPanel from './infoPanel.vue'
import { infoPanelBus } from './panelBus'

const visible = ref(false)
const state = reactive({
  title: '上传信息面板',
  file: null as File | null,
  percent: 0,
  uploadedBytes: 0,
  speedText: '0 B',
  etaText: '--',
  isUploading: false,
  isCompleted: false,
})

onMounted(() => {
  infoPanelBus.on('panel:open', ({ title, file }) => {
    state.title = title
    state.file = file || null
    state.percent = 0
    state.uploadedBytes = 0
    state.speedText = '0 B'
    state.etaText = '--'
    state.isUploading = true
    state.isCompleted = false
    visible.value = true
  })
  infoPanelBus.on('panel:progress', (p) => {
    state.percent = p.percent
    state.uploadedBytes = p.uploadedBytes
    state.speedText = p.speedText
    state.etaText = p.etaText
  })
  infoPanelBus.on('panel:complete', () => {
    state.isUploading = false
    state.isCompleted = true
  })
  infoPanelBus.on('panel:close', () => {
    visible.value = false
  })
})

onUnmounted(() => {
  infoPanelBus.all.clear()
})
</script>

<template>
  <InfoPanel
    v-if="visible"
    :title="state.title"
    :file="state.file"
    :percent="state.percent"
    :speed-text="state.speedText"
    :eta-text="state.etaText"
    :is-uploading="state.isUploading"
    :is-completed="state.isCompleted"
    :uploaded-bytes="state.uploadedBytes"
    :format-bytes="(n:number)=>`${(n/1024).toFixed(1)} KB`"  
    @close="visible=false"
  />
</template>


