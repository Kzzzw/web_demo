import { computed, onBeforeUnmount, reactive, ref } from 'vue'

import SparkMD5 from 'spark-md5'

/**
 * useChunkUploader
 * 
 * - 纯逻辑、无 UI 依赖；由组件负责展示
 * - 支持直传 uploadUrl（可选 queryUrl/mergeUrl/progressUrl）
 * - 支持暂停/继续、失败重试、并发上传、断点续传
 * - 暴露进度、速度（Bps）、ETA、公开控制方法
 */

// 自定义协议类型已移除

export interface ChunkUploaderProps {
  /** 直传地址（若未提供，则必须提供 request 回调） */
  uploadUrl?: string
  /** 查询已上传分片地址：期望返回 { uploaded:number[] } */
  queryUrl?: string
  /** 合并分片地址：期望返回后端合并结果 */
  mergeUrl?: string
  /** 服务器进度查询地址：可选，返回 { loaded:number; total:number } */
  progressUrl?: string
  /** 查询/进度接口中 fileId 的参数名，默认 'fileId'（有的后端可能是 'fileld'） */
  idParamKey?: string
  /** 自定义生成 fileId 的方法；不提供则使用稳定策略 name-size-mtime */
  resolveFileId?: (file: File) => Promise<string> | string
  /** 附带的请求头（仅直传模式） */
  headers?: Record<string, string>
  /** 是否携带凭证（仅直传模式） */
  withCredentials?: boolean
  /** 分片大小，默认 5MB */
  chunkSize?: number
  /** 并发数，默认 3 */
  concurrency?: number
  /** 单片最大重试次数，默认 2 */
  retry?: number
  // 自定义协议已移除，仅保留 URL 方式
}

export interface ChunkUploaderEmits {
  /** 进度回调：loaded/total/percent/speedBps */
  (e: 'progress', p: { loaded: number; total: number; percent: number; speedBps: number }): void
  /** 成功回调：complete 的返回值 */
  (e: 'success', payload: any): void
  /** 错误回调：任何异常 */
  (e: 'error', error: any): void
  /** 状态变更：idle/uploading/paused/completed */
  (e: 'stateChange', s: 'idle' | 'uploading' | 'paused' | 'completed'): void
  /** 文件选择变更 */
  (e: 'change', f: File | null): void
  /** 服务器端进度（如提供 progressUrl），可选 */
  (e: 'serverProgress', p: { loaded: number; total: number; percent: number }): void
}

export function useChunkUploader(props: ChunkUploaderProps, emits: ChunkUploaderEmits) {
  // 选择文件 input 引用
  const fileInputRef = ref<HTMLInputElement | null>(null)
  // 当前选择文件
  const file = ref<File | null>(null)
  // 状态机
  const state = ref<'idle' | 'uploading' | 'paused' | 'completed'>('idle')
  const fileId = ref('')
  // 管理各分片的 AbortController，用于暂停/中断
  const controllerBag = new Map<number, AbortController>()
  let progressTimer: any = null

  const cfg = reactive({
    chunkSize: props.chunkSize ?? 5 * 1024 * 1024,
    concurrency: Math.max(1, props.concurrency ?? 3),
    retry: Math.max(0, props.retry ?? 2)
  })
  const idKey = props.idParamKey ?? 'fileId'

  const totalChunks = computed(() => (file.value ? Math.ceil(file.value.size / cfg.chunkSize) : 0))
  const uploadedSet = reactive(new Set<number>())
  const uploadedBytes = ref(0)
  const lastTick = ref(0)
  const lastLoaded = ref(0)
  const speedBps = ref(0)

  const percent = computed(() => {
    const total = file.value?.size ?? 0
    return total ? Math.min(100, (uploadedBytes.value / total) * 100) : 0
  })
  const isUploading = computed(() => state.value === 'uploading')
  const isCompleted = computed(() => state.value === 'completed')

  /**
   * 打开文件选择框：
   * 先清空 input.value，保证选择同一物理文件也能触发 change
   */
  const triggerSelect = () => {
    if (fileInputRef.value) fileInputRef.value.value = ''
    fileInputRef.value?.click()
  }
  /** 文件选择回调：写入 file 并重置进度 */
  const onFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const f = input.files?.[0] || null
    file.value = f
    resetProgress()
    emits('change', f)
  }

  /** 生成稳定 fileId（优先 resolveFileId，否则 name-size-lastModified） */
  async function ensureFileId(f: File) {
    if (props.resolveFileId) {
      const v = await props.resolveFileId(f)
      fileId.value = String(v || '')
    } else {
      // 默认稳定策略：文件名+大小+最后修改时间，刷新后仍一致
      fileId.value = `${f.name}-${f.size}-${f.lastModified}`
    }
  }

  /** 开始上传：生成稳定 fileId、查询已传分片、可选开启服务器进度轮询并并发上传 */
  const start = async () => {
    if (!file.value || state.value === 'uploading') return
    try {
      state.value = 'uploading'; emits('stateChange', state.value)
      if (!fileId.value && file.value) await ensureFileId(file.value)
      if (props.queryUrl) {
        try {
          const res = await fetch(`${props.queryUrl}?${encodeURIComponent(idKey)}=${encodeURIComponent(fileId.value)}`, { credentials: props.withCredentials ? 'include' : 'same-origin', headers: props.headers })
          if (res.ok) {
            const data = await res.json()
            // 兼容 { uploaded: number[] } 或 { data: number[] }
            const list: number[] = Array.isArray(data?.uploaded) ? data.uploaded : (Array.isArray(data?.data) ? data.data : [])
            // 若希望从“最后一个连续分片 + 1”开始，则取最大分片号作为已完成连续区间
            const maxIndex = list.length ? Math.max(...list) : -1
            uploadedSet.clear()
            for (let i = 0; i <= maxIndex; i++) uploadedSet.add(i)
            uploadedBytes.value = Math.min((maxIndex + 1) * cfg.chunkSize, file.value.size)
          }
        } catch {}
      }
      // 服务器端进度轮询（可选）
      if (props.progressUrl) startProgressPolling()
      await pumpQueue()
    } catch (err) {
      state.value = 'idle'; emits('stateChange', state.value); emits('error', err)
    }
  }

  /** 暂停上传：中断在途请求并停止服务器进度轮询 */
  const pause = () => {
    if (state.value !== 'uploading') return
    state.value = 'paused'; emits('stateChange', state.value)
    controllerBag.forEach(c => c.abort()); controllerBag.clear()
    stopProgressPolling()
  }

  /** 继续上传：从未完成分片处接续 */
  const resume = async () => {
    if (!file.value || state.value === 'uploading' || state.value === 'completed') return
    state.value = 'uploading'; emits('stateChange', state.value)
    await pumpQueue()
  }

  /** 重置：清空文件与进度，清空 input，恢复 idle */
  const reset = () => {
    pause(); file.value = null; fileId.value = ''
    if (fileInputRef.value) fileInputRef.value.value = ''
    resetProgress(); emits('change', null)
  }

  function resetProgress() {
    uploadedSet.clear(); uploadedBytes.value = 0; speedBps.value = 0
    state.value = 'idle'; emits('stateChange', state.value)
  }

  /** 根据文件与分片大小生成分片计划 */
  function chunkPlan(f: File, size: number) {
    const total = Math.ceil(f.size / size)
    return Array.from({ length: total }).map((_, idx) => ({ index: idx, start: idx * size, end: Math.min(f.size, (idx + 1) * size) }))
  }

  /** 并发上传 pending 分片，直至全部完成或被暂停 */
  async function pumpQueue() {
    if (!file.value) return
    const tasks = chunkPlan(file.value, cfg.chunkSize)
    const pending = tasks.filter(i => !uploadedSet.has(i.index))
    let cursor = 0
    const workers: Promise<void>[] = []
    for (let i = 0; i < cfg.concurrency; i++) {
      workers.push((async function worker() {
        while (state.value === 'uploading' && cursor < pending.length) {
          const task = pending[cursor++]
          await uploadChunkWithRetry(task)
        }
      })())
    }
    await Promise.all(workers)
    if (state.value !== 'uploading') return
    if (uploadedSet.size === totalChunks.value) {
      try {
        let result: any
        if (props.mergeUrl && file.value) {
          const form = new FormData()
          form.append('fileId', fileId.value)
          form.append('fileName', file.value.name)
          form.append('totalChunks', String(totalChunks.value))
          const res = await fetch(props.mergeUrl, { method: 'POST', body: form, headers: props.headers, credentials: props.withCredentials ? 'include' : 'same-origin' })
          if (!res.ok) {
            let serverMsg: string | undefined
            try { const data = await res.clone().json(); serverMsg = data?.msg || data?.message } catch {}
            if (!serverMsg) { try { serverMsg = await res.clone().text() } catch {} }
            const err = new Error(serverMsg || ('合并失败: ' + res.status)) as any
            err.status = res.status
            err.serverMsg = serverMsg
            throw err
          }
          result = await res.json()
        } else {
          result = { fileId: fileId.value }
        }
        state.value = 'completed'; emits('stateChange', state.value); emits('success', result)
        stopProgressPolling()
      } catch (e) { emits('error', e); state.value = 'idle'; emits('stateChange', state.value) }
    }
  }

  /** 单片上传（带重试与指数退避） */
  async function uploadChunkWithRetry(task: { index: number; start: number; end: number }) {
    if (!file.value || state.value !== 'uploading') return
    const blob = file.value.slice(task.start, task.end)
    let attempt = 0
    while (attempt <= cfg.retry) {
      try {
        await uploadChunk(task.index, blob)
        uploadedSet.add(task.index)
        uploadedBytes.value = Math.min(uploadedBytes.value + blob.size, file.value.size)
        tick()
        return
      } catch (e) {
        if (state.value !== 'uploading') return
        attempt++
        if (attempt > cfg.retry) throw e
        await wait(400 * attempt)
      }
    }
  }

  /** 执行单片上传（仅直传模式） */
  async function uploadChunk(index: number, chunkBlob: Blob) {
    if (!file.value) return
    const ctrl = new AbortController()
    controllerBag.set(index, ctrl)
    try {
      const buf = await chunkBlob.arrayBuffer()
      const chunkMd5 = SparkMD5.ArrayBuffer.hash(buf)
      const totalSize = file.value.size
      const fid = fileId.value || `${file.value.name}-${file.value.size}-${file.value.lastModified}`
      if (!props.uploadUrl) throw new Error('uploadUrl 未提供')
      const form = new FormData()
      // 按照后端要求的字段名严格传递，file 带上文件名
      form.append('file', chunkBlob, file.value.name)
      form.append('fileId', fid)
      form.append('chunkIndex', String(index))
      form.append('totalChunks', String(totalChunks.value))
      form.append('totalSize', String(totalSize))
      form.append('fileName', file.value.name)
      form.append('chunkMd5', chunkMd5)
      const res = await fetch(props.uploadUrl, { method: 'POST', body: form, headers: props.headers, credentials: props.withCredentials ? 'include' : 'same-origin', signal: ctrl.signal })
      if (!res.ok) {
        let serverMsg: string | undefined
        try { const data = await res.clone().json(); serverMsg = data?.msg || data?.message } catch {}
        if (!serverMsg) { try { serverMsg = await res.clone().text() } catch {} }
        const err = new Error(serverMsg || ('上传失败: ' + res.status)) as any
        err.status = res.status
        err.serverMsg = serverMsg
        throw err
      }
    } finally { controllerBag.delete(index) }
  }

  /** 节流更新速率/进度，并抛出 progress 事件 */
  function tick() {
    const now = Date.now()
    if (!lastTick.value) { lastTick.value = now; lastLoaded.value = uploadedBytes.value; return }
    const dt = now - lastTick.value
    if (dt >= 400) {
      const loaded = uploadedBytes.value
      speedBps.value = Math.max(0, ((loaded - lastLoaded.value) * 1000) / dt)
      lastLoaded.value = loaded; lastTick.value = now
      const total = file.value?.size ?? 0
      emits('progress', { loaded, total, percent: total ? (loaded / total) * 100 : 0, speedBps: speedBps.value })
    }
  }

  /** 开启服务器进度轮询（可选） */
  function startProgressPolling() {
    stopProgressPolling()
    if (!props.progressUrl) return
    progressTimer = setInterval(async () => {
      try {
        if (!file.value || state.value !== 'uploading') return
        const res = await fetch(`${props.progressUrl}?${encodeURIComponent(idKey)}=${encodeURIComponent(fileId.value)}`, { credentials: props.withCredentials ? 'include' : 'same-origin', headers: props.headers })
        if (!res.ok) return
        const data = await res.json()
        const loaded = Number(data?.loaded ?? 0)
        const total = Number(data?.total ?? file.value.size)
        const percent = total ? Math.min(100, (loaded / total) * 100) : 0
        emits('serverProgress', { loaded, total, percent })
      } catch {}
    }, 1000)
  }

  /** 停止服务器进度轮询 */
  function stopProgressPolling() { if (progressTimer) { clearInterval(progressTimer); progressTimer = null } }

  /** 格式化字节数为人类可读字符串 */
  function formatBytes(n: number) {
    if (!n) return '0 B'
    const u = ['B','KB','MB','GB','TB']
    const i = Math.floor(Math.log(n) / Math.log(1024))
    return (n / Math.pow(1024, i)).toFixed(2) + ' ' + u[i]
  }

  const speedText = computed(() => formatBytes(Math.round(speedBps.value)))
  const etaText = computed(() => {
    // 未开始上传或速度为 0，则显示 "--"
    if (state.value !== 'uploading' || speedBps.value <= 0) return '--秒'
    const total = file.value?.size ?? 0
    const remain = Math.max(0, total - uploadedBytes.value)
    const s = speedBps.value || 1
    const sec = Math.ceil(remain / s)
    const m = Math.floor(sec / 60), r = sec % 60
    return m ? `${m}分${r}秒` : `${r}秒`
  })

  function wait(ms: number) { return new Promise(res => setTimeout(res, ms)) }

  onBeforeUnmount(() => pause())

  return {
    fileInputRef, file, state, percent, isUploading, isCompleted, uploadedBytes,
    speedText, etaText, formatBytes,
    triggerSelect, onFileChange, start, pause, resume, reset,
  }
}


