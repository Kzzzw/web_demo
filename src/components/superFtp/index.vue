<script lang="ts" setup>
import { computed, onMounted, ref, unref, useAttrs, watch } from 'vue'
import { Space, Tooltip, Upload } from 'ant-design-vue'
import { infoPanelBus, formatBytes } from '@/components/superChunkUploader/panelBus'
import { omit } from 'lodash-es'
import UploadModal from '@/components/Upload/src/UploadModal.vue'
import UploadPreviewModal from '@/components/Upload/src/UploadPreviewModal.vue'
import { useModal } from '@/components/Modal'
import { useI18n } from '@/hooks/web/useI18n'
import { Icon } from '@/components/Icon'
import { defHttp } from '@/utils/http/axios'
import type { AxiosProgressEvent } from 'axios'

defineOptions({ name: 'SuperFtpUpload' })

// 无需多余连接参数，所有接口只使用必要字段（path、filename、file）

const props = defineProps({
  // 上传接口地址（表单，file + 业务参数）
  ftpUrl: { type: String, required: true },
  // 列表接口地址（GET）
  ftpListUrl: { type: String, default: '' },
  // 下载接口地址（POST 表单：filename + path）
  ftpDownloadUrl: { type: String, default: '' },
  // 删除接口地址（POST 表单：filename + path）
  ftpDeleteUrl: { type: String, default: '' },

  // 统一 path，默认 /root
  basePath: { type: String, default: '/root' },
  // 是否组件挂载后自动请求列表
  autoLoadList: { type: Boolean, default: true },
  // 是否在组件内展示列表
  showList: { type: Boolean, default: false },
  // 简单上传：选择文件立即上传，不弹出预览/批量窗口
  simpleUpload: { type: Boolean, default: true },

  // 上传相关参数
  value: { type: Array as PropType<string[]>, default: () => [] },
  accept: { type: Array as PropType<string[]>, default: () => [] },
  helpText: { type: String, default: '' },
  multiple: { type: Boolean, default: true },
  maxNumber: { type: Number, default: Number.POSITIVE_INFINITY },
  maxSize: { type: Number, default: 0 },
  // 固定字段名为 file，不再对外暴露可配置名
  // filename 由浏览器自动附带原文件名，无需额外传递
  showPreviewNumber: { type: Boolean, default: true },
  emptyHidePreview: { type: Boolean, default: false },
})

const emit = defineEmits([
  'change',
  'update:value',
  'preview-delete',
  'delete',
  'list-success',
  'list-error',
  'upload-success',
  'upload-error',
  'delete-success',
  'delete-error',
  'download',
])

const attrs = useAttrs()
const { t } = useI18n()
const [registerUploadModal, { openModal: openUploadModal }] = useModal()
const [registerPreviewModal, { openModal: openPreviewModal }] = useModal()

const fileList = ref<string[]>([])
const listLoading = ref(false)
const listData = ref<any[]>([])

let lastTime = 0
let lastBytes = 0
function updateAndEmitProgress(loaded: number, total?: number) {
  const now = Date.now()
  if (lastTime === 0) lastTime = now
  const dt = (now - lastTime) / 1000
  const dbytes = loaded - lastBytes
  const speed = dt > 0 ? dbytes / dt : 0
  const percent = total && total > 0 ? Number(((loaded / total) * 100).toFixed(1)) : 0
  infoPanelBus.emit('panel:progress', {
    percent,
    uploadedBytes: loaded,
    speedText: formatBytes(speed),
    etaText: total && speed > 0 ? `${Math.ceil((total - loaded) / speed)}s` : '--',
  })
  lastTime = now
  lastBytes = loaded
}

const showPreview = computed(() => {
  const { emptyHidePreview } = props
  if (!emptyHidePreview)
    return true
  return emptyHidePreview ? fileList.value.length > 0 : true
})

const bindValue = computed(() => {
  const value = { ...attrs, ...props }
  return omit(
    value,
    'onChange',
    'ftpUrl',
    'ftpListUrl',
    'ftpDownloadUrl',
    'ftpDeleteUrl',
    'basePath',
    'autoLoadList',
    'showList',
    // 不透传固定实现相关的内部参数
  )
})

watch(
  () => props.value,
  (value = []) => {
    fileList.value = Array.isArray(value) ? value : []
  },
  { immediate: true },
)

const uploadParams = computed(() => ({ path: props.basePath }))

function handleChange(urls: string[]) {
  fileList.value = [...unref(fileList), ...(urls || [])]
  emit('update:value', fileList.value)
  emit('change', fileList.value)
  emit('upload-success', urls)
}

function handlePreviewChange(urls: string[]) {
  fileList.value = [...(urls || [])]
  emit('update:value', fileList.value)
  emit('change', fileList.value)
}

function handleDelete(record: Recordable) {
  emit('delete', record)
}

function handlePreviewDelete(url: string) {
  emit('preview-delete', url)
}

// 上传（供 UploadModal 使用）
function ftpUploadApi(
  params: {
    data: Record<string, any>
    file: File
    name?: string
    filename?: string
  },
  onUploadProgress: (e: AxiosProgressEvent) => void,
) {
  const bodyData: Record<string, any> = { path: props.basePath }
  // 打开全局面板（上传）
  infoPanelBus.emit('panel:open', { mode: 'upload', title: '上传信息面板', file: params.file })
  lastTime = 0
  lastBytes = 0

  return defHttp.uploadFile(
    {
      url: props.ftpUrl,
      // 上传可能很耗时，禁用超时（0）避免大文件触发请求超时
      timeout: 0,
      onUploadProgress: (e: AxiosProgressEvent) => {
        updateAndEmitProgress(e.loaded || 0, e.total || 0)
        onUploadProgress && onUploadProgress(e)
      },
    },
    {
      data: bodyData,
      file: params.file,
      name: 'file',
      // 不显式设置 filename，默认使用文件原名
    },
  )
}

// 简单上传模式：选择文件立即上传
async function handleSimpleBeforeUpload(file: File) {
  try {
    await ftpUploadApi({ data: {}, file }, () => {})
    emit('upload-success', [file.name])
    if (props.autoLoadList)
      refreshList()
  }
  catch (e) {
    emit('upload-error', e)
  }
  // 阻止 antd 自带上传
  return false
}

// 列表（使用 FormData POST，仅传 path）
async function refreshList() {
  if (!props.ftpListUrl)
    return
  try {
    listLoading.value = true
    const fd = new FormData()
    fd.append('path', props.basePath)
    const res = await fetch(props.ftpListUrl, { method: 'POST', body: fd })
    const json: any = await res.json().catch(() => ({} as any))
    const data = json?.data ?? json?.list ?? json
    listData.value = Array.isArray(data) ? data : []
    emit('list-success', listData.value)
  }
  catch (e) {
    listData.value = []
    emit('list-error', e)
  }
  finally {
    listLoading.value = false
  }
}

// 下载
async function downloadFile(filename: string) {
  if (!props.ftpDownloadUrl || !filename)
    return
  // 使用 fetch 以 FormData 方式请求，再在当前页触发浏览器下载
  const fd = new FormData()
  fd.append('filename', filename)
  fd.append('path', props.basePath)
  const res = await fetch(props.ftpDownloadUrl, { method: 'POST', body: fd })

  // 打开全局面板（下载）
  infoPanelBus.emit('panel:open', { mode: 'download', title: '下载信息面板' })
  lastTime = 0
  lastBytes = 0

  const total = Number(res.headers.get('content-length') || 0)
  const reader = res.body?.getReader()
  const chunks: BlobPart[] = []
  let received = 0
  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        received += value.byteLength
        updateAndEmitProgress(received, total)
      }
    }
  }
  const blob = new Blob(chunks.length ? chunks : [await res.blob()])
  // 如果返回的是 json（通常为错误），则尝试读取文本
  if (blob.type?.includes('application/json')) {
    try {
      const text = await blob.text()
      console.error('download failed:', text)
    } catch {}
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  infoPanelBus.emit('panel:complete', undefined)
  emit('download', { filename })
}

// 删除
async function deleteFile(filename: string) {
  if (!props.ftpDeleteUrl || !filename)
    return
  try {
    const fd = new FormData()
    fd.append('filename', filename)
    fd.append('path', props.basePath)
    await fetch(props.ftpDeleteUrl, { method: 'DELETE', body: fd })
    emit('delete-success', filename)
    await refreshList()
  }
  catch (e) {
    emit('delete-error', e)
  }
}

onMounted(() => {
  if (props.autoLoadList)
    refreshList()
})

defineExpose({ refreshList, downloadFile, deleteFile })
</script>

<template>
  <div>
    <Space>
      <template v-if="simpleUpload">
        <Upload :multiple="multiple" :before-upload="handleSimpleBeforeUpload as any" :show-upload-list="false">
          <a-button type="primary" pre-icon="carbon:cloud-upload">{{ t('component.upload.upload') }}</a-button>
        </Upload>
      </template>
      <template v-else>
        <a-button type="primary" pre-icon="carbon:cloud-upload" @click="openUploadModal">
          {{ t('component.upload.upload') }}
        </a-button>
      </template>
      <Tooltip v-if="!simpleUpload && showPreview" placement="bottom">
        <template #title>
          {{ t('component.upload.uploaded') }}
          <template v-if="fileList.length">
            {{ fileList.length }}
          </template>
        </template>
        <a-button @click="openPreviewModal">
          <Icon icon="bi:eye" />
          <template v-if="fileList.length && showPreviewNumber">
            {{ fileList.length }}
          </template>
        </a-button>
      </Tooltip>
    </Space>

    <UploadModal v-if="!simpleUpload"
      v-bind="bindValue"
      :api="ftpUploadApi"
      :upload-params="uploadParams"
      :preview-file-list="fileList"
      @register="registerUploadModal"
      @change="handleChange"
      @delete="handleDelete"
    />

    <UploadPreviewModal v-if="!simpleUpload"
      :value="fileList"
      @register="registerPreviewModal"
      @list-change="handlePreviewChange"
      @delete="handlePreviewDelete"
    />

    <div v-if="showList && ftpListUrl" style="margin-top: 12px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom: 8px;">
        <a-button :loading="listLoading" @click="refreshList">刷新列表</a-button>
        <span style="color:#999;">path: {{ basePath }}</span>
      </div>
      <a-list v-if="listData && listData.length" :data-source="listData" :bordered="true" size="small">
        <template #renderItem="{ item }">
          <a-list-item>
            <div style="display:flex; gap:12px; align-items:center; width: 100%; justify-content: space-between;">
              <span
                style="cursor: pointer; color: #1677ff;"
                @click="downloadFile(typeof item==='string'? item : (item?.name||''))"
              >
                {{ typeof item === 'string' ? item : (item?.name || JSON.stringify(item)) }}
              </span>
              <div style="display:flex; gap:8px;">
                <a-button size="small" default @click.stop="downloadFile(typeof item==='string'? item : (item?.name||''))">下载</a-button>
                <a-button size="small" danger @click.stop="deleteFile(typeof item==='string'? item : (item?.name||''))">删除</a-button>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
      <div v-else style="color:#999;">暂无数据</div>
  </div>
  </div>
</template>


