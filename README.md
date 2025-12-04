# 安装 pnpm，提升依赖的安装速度
npm config set registry https://registry.npmmirror.com
npm install -g pnpm
# 安装依赖
pnpm install

# 启动服务
npm run dev

## 项目概述

**项目名称**: rapid-dev-platform-front/  
**技术栈**: Vue 3 + TypeScript + Vite + Ant Design Vue + Pinia  

这是一个基于 Vue 3 和 Ant Design Vue 的现代化管理系统前端项目，采用了最新的前端技术栈，提供了丰富的业务功能模块和高度可复用的组件库。

## 技术架构

### 核心技术栈

| 技术           | 版本   | 说明                   |
| -------------- | ------ | ---------------------- |
| Vue            | 3.3.8  | 渐进式 JavaScript 框架 |
| TypeScript     | 5.2.2  | JavaScript 的超集      |
| Vite           | 4.5.0  | 下一代前端构建工具     |
| Ant Design Vue | 4.0.7  | 企业级 UI 组件库       |
| Pinia          | 2.1.7  | Vue 状态管理库         |
| Vue Router     | 4.2.5  | Vue 官方路由管理器     |
| VueUse         | 10.6.1 | Vue 组合式 API 工具集  |
| UnoCSS         | 0.57.3 | 原子化 CSS 引擎        |

# 📁项目目录结构

├── build/                     # 构建相关配置
├── public/                    # 静态资源
├── src/                       # 源代码目录

​	├── api/                    # API 接口定义
​	├── assets/                 # 静态资源
​	├── components/             # 全局组件库
​	├── design/                 # 样式文件
​	├── directives/             # 自定义指令
​	├── enums/                  # 枚举定义
​	├── hooks/                  # 自定义 Hooks
​	├── layouts/                # 布局组件
​	├── locales/                # 国际化配置
​	├── logics/                 # 业务逻辑
​	├── router/                 # 路由配置
​	├── settings/               # 项目配置
​	├── store/                  # 状态管理
​	├── types/                  # TypeScript 类型定义
​	├── utils/                  # 工具函数
​	└── views/                  # 页面组件

├── package.json              # 项目依赖配置
├── vite.config.ts            # Vite 构建配置
├── tsconfig.json             # TypeScript 配置
├── uno.config.ts             # UnoCSS 配置
├── index.html                # 入口 HTML
├── README.md                 # 项目说明
├── commitlint.config.js      # 提交信息规范
├── eslint.config.js          # ESLint 配置
└── stylelint.config.js       # 样式检查配置

## 1. api

- 作用：所有接口封装的入口，按域拆分。
-  `api/base/**`（登录、用户、上传等）作为基座；
- 后续新业务在 `api/<your-domain>/index.ts` 新建。

## 2. assets/

- 作用：静态资源（图片、字体、样式变量等）。

## 3. components/

- 作用：全局/通用组件库（表单、表格、弹窗、图标注册等）。

## 4. design/

- 作用：全局样式与主题变量（less/css）关系到整体 UI 风格与主题色。

## 5. directives/

- 作用：自定义指令（权限指令、拖拽、复制等）。

## 6. enums/

- 作用：全局枚举（页面枚举、角色、缓存 key 等）贯穿路由、权限、缓存、用户等功能。

## 7. hooks/

- 作用：组合式函数（主题、设置、表格、请求等）。

## 8. layouts/

- 作用：应用主布局（头部/侧边栏/标签页/设置抽屉）。

## 9. locales/

- 作用：国际化（多语言词条与初始化）。

## 10. logics/

- 作用：应用初始化、错误处理、埋点、路由切换事件等。

## 11. plugins/

- 作用：第三方插件初始化（按项目而定）。

## 12. router/

- 作用：路由核心（实例、基础路由、模块收集、守卫、菜单生成）。

- `src/router/index.ts`：路由实例与 `setupRouter(app)`

- `src/router/guard/**`：登录、权限、进度条、滚动、消息清理等守卫

- `src/router/constant.ts`：`LAYOUT`、`EXCEPTION_COMPONENT` 等

- `src/router/routes/index.ts` 中这两块：

  - 自动收集模块：

    ```ts
    const modules = import.meta.glob('./modules/**/*.ts', { eager: true })
    // ...将 modules 里的路由收集到 routeModuleList
    ```

  - 基础路由最小集：`LoginRoute`、`RootRoute`、`REDIRECT_ROUTE`、`PAGE_NOT_FOUND_ROUTE`（可选保留 `ProfileRoute`）

## 13. settings/

- 作用：项目运行参数（权限模式、主题、动画、菜单等）。
- `projectSetting.ts` 中 `permissionMode` 当前为 BACK（后端菜单）。按需改。

## 14. store/

- 作用：Pinia 全局状态。
- 结论总览：
  - 必留：`index.ts`、`plugin/persist.ts`、`modules/app.ts`、`modules/locale.ts`、`modules/lock.ts`、`modules/multipleTab.ts`、`modules/permission.ts`、`modules/user.ts`
  - 按需：`modules/errorLog.ts`（是否启用全局错误采集由 `settings/projectSetting.ts` 决定）

- `modules/app.ts`：主题、菜单、标签页、加载状态、项目配置持久化等全局 UI 状态。
- `modules/permission.ts`：三种权限模式（BACK/ROUTE_MAPPING/ROLE）下的菜单/路由构建中心，登录后注入动态路由。
- `modules/user.ts`：登录、登出、拉取用户信息、写入 Token 与角色。
- `modules/locale.ts`：多语言设置。
- `modules/lock.ts`：锁屏相关。
- `modules/multipleTab.ts`：多标签页状态（可在设置里关闭多标签）。
- `plugin/persist.ts`：Pinia 持久化插件注册。

## 15. types/

- 作用：全局类型定义。

## 16. utils/

- 作用：工具库（http 封装、缓存、颜色、文件、事件、校验等）。
- `utils/http/axios` 是所有 API 的基座。

## 17. views/

- 作用：页面视图。
- 基础页（登录/个人中心/异常/仪表盘壳等）或建立你的起步页 `views/example/index.vue`。