import { mitt } from '@/utils/mitt'

export type PanelMode = 'upload' | 'download'

export interface PanelOpenPayload {
  mode: PanelMode
  title: string
  file?: File | null
}

export interface PanelProgressPayload {
  percent: number
  uploadedBytes: number
  speedText: string
  etaText: string
}

export type PanelEvents = {
  'panel:open': PanelOpenPayload
  'panel:progress': PanelProgressPayload
  'panel:complete': void
  'panel:close': void
}

export const infoPanelBus = mitt<PanelEvents>()

export function formatBytes(n: number) {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}


