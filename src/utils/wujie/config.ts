import WujieVue from 'wujie-vue3'

// DataEase 子应用配置（统一使用一个 name）
// 从环境变量获取子应用基础 URL，如果没有配置则使用默认值（开发环境）
const dataeaseBaseUrl = import.meta.env.VITE_DATAEASE_BASE_URL || 'http://192.168.8.115:8081'
const { setupApp } = WujieVue

// 在 iframe 模式下，全局拦截 syncUrlToWindow 调用，防止报错
// 注意：这个拦截器在主应用的 main.ts 中已经设置，这里作为双重保障
if (typeof window !== 'undefined') {
  // 拦截 console.error，彻底阻止错误输出
  const originalConsoleError = console.error
  console.error = function(...args: any[]) {
    const errorMessage = args.map(arg => {
      if (typeof arg === 'string') return arg
      if (arg && typeof arg === 'object') {
        return arg.message || arg.toString() || ''
      }
      return String(arg || '')
    }).join(' ')
    
    // 检查是否是 sync 相关错误
    if (
      errorMessage.includes("Cannot read properties of undefined (reading 'sync')") ||
      errorMessage.includes("syncUrlToWindow") ||
      errorMessage.includes("reading 'sync'") ||
      errorMessage.includes('sync.ts') ||
      errorMessage.includes('sandbox.ts')
    ) {
      // 完全静默，不输出任何内容
      return
    }
    
    // 其他错误正常输出
    originalConsoleError.apply(console, args)
  }
}

// 生命周期钩子（用于调试和错误处理）
const lifecycles = {
  beforeLoad: (appWindow) => {
    console.log('[Wujie] DataEase beforeLoad', appWindow)
    
    // 在 iframe 模式下，彻底禁用 sync 功能
    // 这是最关键的地方，必须在 wujie 调用 syncUrlToWindow 之前禁用
    try {
      if (appWindow) {
        // 方法1: 在 iframe 的 window 对象上设置错误拦截器（最关键）
        // 必须在 wujie 调用 syncUrlToWindow 之前设置
        if (appWindow.console) {
          // 拦截 console.error
          if (appWindow.console.error) {
            const originalError = appWindow.console.error
            appWindow.console.error = function(...args: any[]) {
              let shouldSuppress = false
              
              for (const arg of args) {
                let errorText = ''
                try {
                  if (typeof arg === 'string') {
                    errorText = arg
                  } else if (arg instanceof Error) {
                    errorText = arg.message + ' ' + (arg.stack || '')
                  } else if (arg && typeof arg === 'object') {
                    errorText = JSON.stringify(arg) + ' ' + (arg.message || '') + ' ' + (arg.stack || '') + ' ' + String(arg)
                  } else {
                    errorText = String(arg || '')
                  }
                } catch (e) {
                  errorText = String(arg)
                }
                
                // 检查是否是 sync 相关错误
                if (
                  errorText.includes("Cannot read properties of undefined (reading 'sync')") ||
                  errorText.includes("syncUrlToWindow") ||
                  errorText.includes("reading 'sync'") ||
                  errorText.includes('sync.ts') ||
                  errorText.includes('sandbox.ts') ||
                  errorText.includes('sync.ts:10') ||
                  errorText.includes('sandbox.ts:181')
                ) {
                  shouldSuppress = true
                  break
                }
              }
              
              if (shouldSuppress) {
                return // 完全静默
              }
              
              originalError.apply(appWindow.console, args)
            }
          }
          
          // 拦截 console.warn（以防错误通过 warn 输出）
          if (appWindow.console.warn) {
            const originalWarn = appWindow.console.warn
            appWindow.console.warn = function(...args: any[]) {
              const errorText = args.map(arg => {
                if (typeof arg === 'string') return arg
                if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '')
                return String(arg || '')
              }).join(' ')
              
              if (
                errorText.includes("Cannot read properties of undefined (reading 'sync')") ||
                errorText.includes("syncUrlToWindow") ||
                errorText.includes('sync.ts') ||
                errorText.includes('sandbox.ts')
              ) {
                return
              }
              
              originalWarn.apply(appWindow.console, args)
            }
          }
        }
        
        // 在 iframe 的 window 对象上设置 onerror 拦截器
        if (appWindow.onerror !== undefined) {
          const originalOnError = appWindow.onerror
          appWindow.onerror = function(message, source, lineno, colno, error) {
            const errorMessage = typeof message === 'string' ? message : 
                                (error?.message || String(message) || '')
            const errorSource = String(source || '')
            
            if (
              errorMessage.includes("Cannot read properties of undefined (reading 'sync')") ||
              errorMessage.includes("syncUrlToWindow") ||
              errorSource.includes('sync.ts') ||
              errorSource.includes('sandbox.ts')
            ) {
              return true // 阻止错误传播
            }
            
            if (originalOnError) {
              return originalOnError.call(this, message, source, lineno, colno, error)
            }
            return false
          }
        }
        
        // 方法2: 禁用 __WUJIE__ 对象中的 sync
        if (appWindow.__WUJIE__) {
          try {
            Object.defineProperty(appWindow.__WUJIE__, 'sync', {
              value: false,
              writable: false,
              configurable: false,
            })
          } catch (e) {
            appWindow.__WUJIE__.sync = false
          }
        }
        
        // 方法3: 替换 syncUrlToWindow 方法（如果存在）
        if (typeof appWindow.syncUrlToWindow !== 'undefined') {
          appWindow.syncUrlToWindow = () => {
            return
          }
        }
        
        // 方法4: 在 appWindow 上设置 sync 属性
        try {
          Object.defineProperty(appWindow, 'sync', {
            value: false,
            writable: false,
            configurable: false,
          })
        } catch (e) {
          // 忽略定义失败
        }
      }
    } catch (e) {
      console.warn('[Wujie] ⚠️ 无法在 beforeLoad 中禁用 sync:', e)
    }
  },
  beforeMount: (appWindow) => {
    console.log('[Wujie] DataEase beforeMount', appWindow)
    // 在 beforeMount 中也确保 sync 被禁用
    if (appWindow && appWindow.__WUJIE__) {
      try {
        if (appWindow.__WUJIE__.sync !== false) {
          appWindow.__WUJIE__.sync = false
          console.log('[Wujie] ✅ 在 beforeMount 中禁用 sync')
        }
      } catch (e) {
        console.warn('[Wujie] ⚠️ 无法在 beforeMount 中禁用 sync:', e)
      }
    }
  },
  afterMount: (appWindow) => {
    console.log('[Wujie] DataEase afterMount', appWindow)
    console.log('[Wujie] 子应用已挂载，检查内容是否显示')
    // 确保样式正确加载
    if (appWindow && appWindow.document) {
      // 立即检查样式文件
      const styles = appWindow.document.querySelectorAll('link[rel="stylesheet"]')
      console.log('[Wujie] 已加载的样式文件数量:', styles.length)
      
      // 在 iframe 模式下，样式文件可能需要一些时间才能加载
      // 等待样式文件加载完成
      const checkStyles = () => {
        const stylesAfter = appWindow.document.querySelectorAll('link[rel="stylesheet"]')
        console.log('[Wujie] 挂载后样式文件数量（延迟检查）:', stylesAfter.length)
        
        if (stylesAfter.length === 0) {
          console.warn('[Wujie] ⚠️ 检测到样式文件丢失')
          // 在 iframe 模式下，样式文件应该由子应用自己加载
          // 如果样式丢失，可能是加载时序问题，等待一段时间后再次检查
          setTimeout(() => {
            const stylesFinal = appWindow.document.querySelectorAll('link[rel="stylesheet"]')
            console.log('[Wujie] 最终样式文件数量:', stylesFinal.length)
            if (stylesFinal.length === 0) {
              console.error('[Wujie] ❌ 样式文件仍未加载，可能存在加载问题')
            }
          }, 500)
        } else {
          // 检查样式文件是否已经加载完成
          let loadedCount = 0
          stylesAfter.forEach((link: HTMLLinkElement) => {
            if (link.sheet || link.href) {
              loadedCount++
            }
          })
          console.log('[Wujie] 已加载的样式文件数量:', loadedCount, '/', stylesAfter.length)
        }
      }
      
      // 延迟检查，给样式文件一些加载时间
      setTimeout(checkStyles, 100)
      // 再次延迟检查，确保样式文件已经加载完成
      setTimeout(checkStyles, 500)
    }
  },
  beforeUnmount: (appWindow) => {
    console.log('[Wujie] DataEase beforeUnmount', appWindow)
    // 在 iframe 模式下，不要清除样式，让 wujie 自己管理
    // 这样可以避免样式丢失
  },
  afterUnmount: (appWindow) => {
    console.log('[Wujie] DataEase afterUnmount', appWindow)
    // 注意：在 iframe 模式下，样式可能会被清除
    // 但下次 mount 时会重新加载
  },
  activated: (appWindow) => {
    console.log('[Wujie] DataEase activated', appWindow)
    // 当子应用被激活时，确保样式仍然存在
    // 注意：路由更新通过 bus 通信处理，不需要在这里手动更新
    if (appWindow && appWindow.document) {
      const styles = appWindow.document.querySelectorAll('link[rel="stylesheet"]')
      console.log('[Wujie] 激活时样式文件数量:', styles.length)
      
      if (styles.length === 0) {
        console.warn('[Wujie] ⚠️ 检测到样式文件丢失，尝试重新加载')
      } else {
        // 延迟检查，确保样式已经生效
        setTimeout(() => {
          const stylesAfter = appWindow.document.querySelectorAll('link[rel="stylesheet"]')
          console.log('[Wujie] 激活后样式文件数量（延迟检查）:', stylesAfter.length)
        }, 100)
      }
    }
  },
  deactivated: (appWindow) => {
    console.log('[Wujie] DataEase deactivated', appWindow)
  },
  loadError: (url, e) => {
    console.error('[Wujie] DataEase 加载失败', url, e)
  },
}

// 配置 DataEase 子应用（所有页面共享同一个子应用实例）
// 注意：必须使用 iframe 模式（degrade: true）
// 在 iframe 模式下，sync 功能会导致错误，必须彻底禁用
setupApp({
  name: 'dataease',
  url: `${dataeaseBaseUrl}/`,
  exec: true,
  degrade: true, // 强制使用 iframe 模式
  alive: true, // 设置为 true，保持子应用实例存活，避免切换路由时重新挂载导致样式丢失
  // 注意：当 degrade 为 true（iframe 模式）时，sync 功能必须禁用
  // 如果需要 URL 同步，可以通过 bus 通信手动处理路由同步
  sync: false, // 在 iframe 模式下必须禁用 sync
  // 明确指定不使用 sync，确保不会触发 syncUrlToWindow
  // 确保样式正确加载
  // 在 wujie 环境下，需要确保所有资源（包括 CSS）都能正确加载
  // 不排除任何 CSS 文件，确保所有样式都能正确加载
  // 在 iframe 模式下不使用插件，避免冲突
  plugins: [],
  // 确保资源路径正确
  attrs: {
    // 如果需要，可以在这里配置其他属性
  },
  ...lifecycles,
})

