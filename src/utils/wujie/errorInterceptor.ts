// wujie sync 错误拦截器
// 必须在所有其他文件之前加载，确保能拦截到所有 sync 相关错误

if (typeof window !== 'undefined') {
  // 保存原始的 console 方法
  const originalConsoleError = window.console.error.bind(window.console)
  const originalConsoleWarn = window.console.warn.bind(window.console)
  
  // 创建一个错误检测函数
  const isSyncError = (text: string): boolean => {
    return (
      text.includes("Cannot read properties of undefined (reading 'sync')") ||
      text.includes("syncUrlToWindow") ||
      text.includes("reading 'sync'") ||
      text.includes('sync.ts') ||
      text.includes('sandbox.ts') ||
      text.includes('sync.ts:10') ||
      text.includes('sandbox.ts:181') ||
      (text.includes('sync') && text.includes('undefined') && text.includes('reading'))
    )
  }
  
  // 拦截 console.error
  window.console.error = function(...args: any[]) {
    for (const arg of args) {
      let errorText = ''
      try {
        if (typeof arg === 'string') {
          errorText = arg
        } else if (arg instanceof Error) {
          errorText = arg.message + ' ' + (arg.stack || '')
        } else if (arg && typeof arg === 'object') {
          errorText = JSON.stringify(arg) + ' ' + (arg.message || '') + ' ' + (arg.stack || '')
        } else {
          errorText = String(arg || '')
        }
      } catch {
        errorText = String(arg)
      }
      
      if (isSyncError(errorText)) {
        // 完全静默，不输出
        return
      }
    }
    
    originalConsoleError.apply(window.console, args)
  }
  
  // 拦截 console.warn（以防万一）
  window.console.warn = function(...args: any[]) {
    const errorText = args.map(arg => String(arg)).join(' ')
    if (isSyncError(errorText)) {
      return
    }
    originalConsoleWarn.apply(window.console, args)
  }
  
  // 拦截 window.onerror
  const originalOnError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = typeof message === 'string' ? message : (error?.message || String(message) || '')
    const errorSource = String(source || '')
    
    if (
      isSyncError(errorMessage) ||
      isSyncError(errorSource) ||
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
  
  // 拦截 unhandledrejection
  window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = event.reason?.message || String(event.reason || '')
    if (isSyncError(errorMessage)) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
  }, true)
  
  console.log('[Wujie] ✅ sync 错误拦截器已设置（errorInterceptor.ts）')
}

