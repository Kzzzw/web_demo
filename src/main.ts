import 'uno.css'
import 'ant-design-vue/dist/reset.css'
import './design/index.less'
import '@/assets/fonts/iconfont.css'
// Register icon sprite
import 'virtual:svg-icons-register'
import 'ant-design-vue/dist/reset.css'
import '@/utils/tongji'

// ========== 必须在 wujie 加载之前设置全局错误拦截器 ==========
// 首先加载专门的错误拦截器
import '@/utils/wujie/errorInterceptor'

// 在 iframe 模式下，拦截 wujie 的 sync 相关错误（双重保障）
if (typeof window !== 'undefined') {
  // 保存原始的 error 处理器
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn
  
  // 拦截 console.error，过滤 sync 相关错误
  // 这是最关键的拦截，因为错误通常通过 console.error 输出
  const createSuppressSyncErrorHandler = (originalFunc: typeof console.error) => {
    return function(...args: any[]) {
      // 检查所有参数，包括字符串、错误对象、堆栈信息等
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
        
        // 检查是否是 sync 相关错误（更宽松的匹配，包括所有可能的格式）
        if (
          errorText.includes("Cannot read properties of undefined (reading 'sync')") ||
          errorText.includes("syncUrlToWindow") ||
          errorText.includes("reading 'sync'") ||
          errorText.includes('sync.ts') ||
          errorText.includes('sandbox.ts') ||
          errorText.includes('sync.ts:10') ||
          errorText.includes('sandbox.ts:181') ||
          (errorText.includes('sync') && errorText.includes('undefined') && errorText.includes('reading'))
        ) {
          shouldSuppress = true
          break
        }
      }
      
      if (shouldSuppress) {
        // 完全静默，不输出任何内容
        return
      }
      
      // 其他错误正常输出
      originalFunc.apply(console, args)
    }
  }
  
  console.error = createSuppressSyncErrorHandler(originalConsoleError)
  
  // 拦截 window.onerror
  const originalOnError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = typeof message === 'string' ? message : 
                        (error?.message || String(message) || '')
    const errorSource = source || ''
    
    if (
      errorMessage.includes("Cannot read properties of undefined (reading 'sync')") ||
      errorMessage.includes("syncUrlToWindow") ||
      errorMessage.includes("reading 'sync'") ||
      errorSource.includes('sync.ts') ||
      errorSource.includes('sandbox.ts')
    ) {
      // 阻止错误传播
      return true
    }
    
    // 其他错误继续使用原始处理器
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error)
    }
    return false
  }
  
  // 拦截 unhandledrejection
  window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = event.reason?.message || 
                        (typeof event.reason === 'string' ? event.reason : '') ||
                        String(event.reason || '')
    
    if (
      errorMessage.includes("Cannot read properties of undefined (reading 'sync')") ||
      errorMessage.includes("syncUrlToWindow") ||
      errorMessage.includes("reading 'sync'")
    ) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
  }, true)
}
// ========== 错误拦截器设置完成 ==========

// 引入 wujie 配置（必须在错误拦截器之后）
import '@/utils/wujie/config'

import { router, setupRouter } from '@/router'

import Antd from 'ant-design-vue'
import App from './App.vue'
import WujieVue from 'wujie-vue3'
import { createApp } from 'vue'
import { initAppConfigStore } from '@/logics/initAppConfig'
import { registerGlobComp } from '@/components/registerGlobComp'
import { setupErrorHandle } from '@/logics/error-handle'
import { setupGlobDirectives } from '@/directives'
import { setupI18n } from '@/locales/setupI18n'
import { setupRouterGuard } from '@/router/guard'
import { setupStore } from '@/store'

async function bootstrap() {
  const app = createApp(App)

  // Configure store
  // 配置 store
  setupStore(app)

  // Initialize internal system configuration
  // 初始化内部系统配置
  initAppConfigStore()

  // Register global components
  // 注册全局组件
  registerGlobComp(app)

  // Multilingual configuration
  // 多语言配置
  // Asynchronous case: language files may be obtained from the server side
  // 异步案例：语言文件可能从服务器端获取
  await setupI18n(app)

  // Configure routing
  // 配置路由
  setupRouter(app)

  // router-guard
  // 路由守卫
  setupRouterGuard(router)

  // Register global directive
  // 注册全局指令
  setupGlobDirectives(app)

  // Configure global error handling
  // 配置全局错误处理
  setupErrorHandle(app)
  
  // 在 setupErrorHandle 之后，确保 sync 错误拦截器仍然有效（防止被覆盖）
  // 必须在所有错误处理设置之后，重新确保拦截器生效
  if (typeof window !== 'undefined') {
    const currentConsoleError = console.error
    // 如果 console.error 已经被修改，需要检查它是否还包含我们的拦截逻辑
    // 如果已经被替换，我们需要重新包装它
    if (!currentConsoleError.toString().includes('shouldSuppress')) {
      const originalConsoleError = currentConsoleError
      console.error = function(...args: any[]) {
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
          return
        }
        
        originalConsoleError.apply(console, args)
      }
    }
  }

  // https://next.router.vuejs.org/api/#isready
  // await router.isReady();
  app.use(Antd)
  app.use(WujieVue)
  app.mount('#app')

}

bootstrap()
