<script lang="ts" setup>
import { computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getAuthorize, authorize } from '@/api/base/login'
import WujieVue from 'wujie-vue3'

const route = useRoute()

// 从环境变量获取子应用基础 URL，如果没有配置则使用默认值（开发环境）
const baseUrl = import.meta.env.VITE_DATAEASE_BASE_URL

// 子应用的 clientId（可以从环境变量或配置中获取）
const clientId = ref<string>('rapid-dev-platform-sso-demo-by-code') // 默认值，可根据实际情况修改

// 子应用的登录接口地址，从环境变量获取，如果没有配置则使用默认值（开发环境）
const loginApiUrl = import.meta.env.VITE_DATAEASE_LOGIN_API_URL || 'http://192.168.8.105:8100/de2api/auth/login-by-code'

// 存储授权信息，用于传递给子应用
const authorizeData = ref<any>(null)
// 防止重复调用的标志
const isFetching = ref(false)
// 记录上次处理的路由名称，避免同一路由重复调用
let lastProcessedRouteName: string | symbol | null = null

// 根据路由名称映射到子应用的路由路径（不包含 baseUrl）
const routePathMap: Record<string, string> = {
  DataEaseWorkbranch: '/workbranch/index',
  DataEaseDashboard: '/panel/index',
  DataEaseScreen: '/screen/index',
  DataEaseDatasource: '/data/datasource',
  DataEaseDataset: '/data/dataset',
}

// 根据路由名称映射到子应用的完整 URL（用于首次加载）
const urlMap: Record<string, string> = {
  DataEaseWorkbranch: `${baseUrl}/#/workbranch/index`,
  DataEaseDashboard: `${baseUrl}/#/panel/index`,
  DataEaseScreen: `${baseUrl}/#/screen/index`,
  DataEaseDatasource: `${baseUrl}/#/data/datasource`,
  DataEaseDataset: `${baseUrl}/#/data/dataset`,
}

const subAppUrl = computed(() => {
  return `${baseUrl}/`
})

// 每次从主应用跳转到子应用时，获取授权码并准备调用登录接口
const fetchAuthorizeWithCode = async () => {
  // 如果正在获取中，跳过重复调用
  if (isFetching.value) {
    return
  }
  
  try {
    isFetching.value = true
    
    const authorizeInfo = await getAuthorize(clientId.value)
    const allScopes = authorizeInfo.scopes.map((scope: any) => scope.key)
    
    const authResult = await authorize(
      'code',
      clientId.value,
      loginApiUrl,
      1,
      true,
      allScopes,
      []
    )
    
    let authorizationCode: string | null = null
    let urlString: string | null = null
    
    if (typeof authResult === 'string') {
      urlString = authResult
    } else if (typeof authResult?.data === 'string') {
      urlString = authResult.data
    } else if (typeof authResult?.data?.data === 'string') {
      urlString = authResult.data.data
    }
    
    if (urlString) {
      try {
        const url = new URL(urlString)
        authorizationCode = url.searchParams.get('code')
      } catch (error) {
        const codeMatch = urlString.match(/[?&]code=([^&]+)/)
        if (codeMatch && codeMatch[1]) {
          authorizationCode = codeMatch[1]
        }
      }
    }
    
    // 无论是否获取到授权码，都设置 authorizeData，确保子应用能接收到 loginApiUrl
    authorizeData.value = {
      authorizationCode: authorizationCode || null,
      loginApiUrl,
    }
    
    // 通知子应用调用登录接口
    if (authorizationCode) {
      console.log('[Wujie] 获取到授权码，通知子应用调用登录接口')
    } else {
      console.warn('[Wujie] 未能获取授权码，但仍会通知子应用调用登录接口')
    }
    
    // 等待一段时间，确保：
    // 1. props 已经更新到子应用
    // 2. 子应用的事件监听器已经设置好
    // 3. 子应用已经完全挂载
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 先通过 props 传递，再通过 bus 事件通知（双重保障）
    WujieVue.bus.$emit('dataease-login-by-code', {
      loginApiUrl,
      authorizationCode: authorizationCode || null,
    })
    
    console.log('[Wujie] ✅ 已发送登录事件通知，授权码:', authorizationCode ? '有' : '无')
  } catch (error) {
    console.error('[Wujie] 获取授权码失败:', error)
    // 即使获取授权码失败，也传递登录接口地址给子应用
    authorizeData.value = {
      authorizationCode: null,
      loginApiUrl,
    }
    // 通知子应用调用登录接口（可能不需要授权码）
    WujieVue.bus.$emit('dataease-login-by-code', {
      loginApiUrl,
      authorizationCode: null,
    })
  } finally {
    isFetching.value = false
  }
}

// 每次路由变化时，只要跳转到子应用就调用获取授权码并通知子应用调用登录接口
watch(
  () => route.name,
  async (newRouteName) => {
    if (newRouteName && urlMap[newRouteName as string]) {
      // 如果路由名称相同，跳过重复调用
      if (lastProcessedRouteName === newRouteName) {
        return
      }
      lastProcessedRouteName = newRouteName
      // 立即调用，不等待授权码获取完成
      await fetchAuthorizeWithCode()
    }
  },
  { immediate: true }
)

// 通过 bus 通知子应用路由变化
watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName && routePathMap[newRouteName as string]) {
      WujieVue.bus.$emit('dataease-router-change', routePathMap[newRouteName as string])
    }
  },
  { immediate: true }
)

// 将响应式对象转换为普通对象，始终传递 loginApiUrl
const authorizeDataPlain = computed(() => {
  // 确保始终返回有效的对象，即使 authorizeData 还未初始化
  if (!authorizeData.value) {
    return {
      authorizationCode: null,
      loginApiUrl,
    }
  }
  return {
    authorizationCode: authorizeData.value.authorizationCode || null,
    loginApiUrl,
  }
})

// beforeLoad 处理器，确保在 iframe 模式下禁用 sync
const beforeLoadHandler = (appWindow: any) => {
  console.log('[Wujie] beforeLoad handler - 禁用 sync')
  try {
    // 尝试访问并禁用 sync 相关功能
    if (appWindow) {
      // 方法1: 禁用 __WUJIE__ 对象中的 sync
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
      
      // 方法2: 如果存在 syncUrlToWindow 方法，替换为空函数
      if (typeof appWindow.syncUrlToWindow !== 'undefined') {
        appWindow.syncUrlToWindow = () => {
          // 空函数，什么都不做
          return
        }
      }
      
      // 方法3: 在 appWindow 上设置 sync 属性
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
    console.warn('[Wujie] 无法在 beforeLoad handler 中禁用 sync:', e)
  }
}
</script>

<template>
  <div style="width: 100%; height: 100%;">
    <!-- 只要跳转到子应用就加载，不需要等待授权码 -->
    <!-- 在 iframe 模式下必须禁用 sync，避免 syncUrlToWindow 错误 -->
    <!-- 注意：sync 必须设为 false，degrade 必须设为 true -->
    <WujieVue 
      width="100%" 
      height="100%" 
      name="dataease" 
      :url="subAppUrl"
      :props="authorizeDataPlain"
      :sync="false"
      :degrade="true"
      :before-load="beforeLoadHandler"
      v-on="{
        // 拦截可能的错误事件
        error: (e) => {
          if (e?.message?.includes('sync')) {
            console.warn('[Wujie] 已拦截 sync 相关错误')
            e.preventDefault?.()
          }
        }
      }"
    ></WujieVue>
  </div>
</template>


