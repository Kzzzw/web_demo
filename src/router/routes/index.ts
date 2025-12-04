import type { AppRouteModule, AppRouteRecordRaw } from '@/router/types'
import { PAGE_NOT_FOUND_ROUTE, REDIRECT_ROUTE } from '@/router/routes/basic'

import { LAYOUT } from '@/router/constant'
import { PageEnum } from '@/enums/pageEnum'
import { t } from '@/hooks/web/useI18n'

// import.meta.glob() 直接引入所有的模块 Vite 独有的功能
const modules = import.meta.glob('./modules/**/*.ts', { eager: true })
const routeModuleList: AppRouteModule[] = []

// 加入到路由集合中
Object.keys(modules).forEach((key) => {
  const mod = (modules as Recordable)[key].default || {}
  const modList = Array.isArray(mod) ? [...mod] : [mod]
  routeModuleList.push(...modList)
})

// 404 路由必须放在最后，否则会优先匹配所有路径，导致其他路由无法匹配
export const asyncRoutes = [...routeModuleList, PAGE_NOT_FOUND_ROUTE]

// 根路由
export const RootRoute: AppRouteRecordRaw = {
  path: '/',
  name: 'Root',
  redirect: PageEnum.BASE_HOME,
  meta: {
    title: 'Root',
  },
}

// 登录
export const LoginRoute: AppRouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/base/login/Login.vue'),
  meta: {
    title: t('routes.basic.login'),
  },
}

// 第三方授权登录
export const SSORoute: AppRouteRecordRaw = {
  path: '/sso',
  name: 'SSO',
  component: () => import('@/views/base/login/sso.vue'),
  meta: {
    title: t('routes.basic.sso'),
  },
}

// 个人中心
export const ProfileRoute: AppRouteRecordRaw = {
  path: '/profile',
  component: LAYOUT,
  name: 'Profile',
  meta: {
    title: t('routes.basic.profile'),
    hidden: true,
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/base/profile/index.vue'),
      name: 'UserProfile',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:user-outlined',
        title: t('routes.basic.profile'),
      },
    },
    {
      path: 'notify-message',
      component: () => import('@/views/system/notify/my/index.vue'),
      name: 'MyNotifyMessage',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:bell-outlined',
        title: t('routes.basic.notifyMessage'),
      },
    },
  ],
}



// Basic routing without permission
// 未经许可的基本路由
export const basicRoutes = [
  LoginRoute,  // 登录
  SSORoute,  // 第三方授权登录
  RootRoute,  // 根路由
  ProfileRoute,  // 个人中心
  REDIRECT_ROUTE,  // 重定向路由
  PAGE_NOT_FOUND_ROUTE,  // 404 路由
]
