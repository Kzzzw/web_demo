import type { AppRouteModule } from '@/router/types'
import { LAYOUT } from '@/router/constant'

const dataease: AppRouteModule = {
  path: '/core',
  name: 'DataEase',
  component: LAYOUT,
  meta: {
    orderNo: 20,
    icon: 'ant-design:fund-outlined',
    title: 'DataEase',
  },
  children: [
    {
      path: 'workbranch',
      name: 'DataEaseWorkbranch',
      component: () => import('@/views/micro/dataease/index.vue'),
      meta: {
        title: '工作台',
        icon: 'ant-design:desktop-outlined',
      },
      
    },
    {
      path: 'panel',
      name: 'DataEaseDashboard',
      component: () => import('@/views/micro/dataease/index.vue'),
      meta: {
        title: '仪表板',
        icon: 'ant-design:dashboard-outlined',
        
      },
      
    },
    {
      path: 'screen',
      name: 'DataEaseScreen',
      component: () => import('@/views/micro/dataease/index.vue'),
      meta: {
        title: '数据大屏',
        icon: 'ant-design:desktop-outlined',
        
      },
      
    },
    {
      path: 'data-preparation',
      name: 'DataPreparation',
      component: LAYOUT,
      meta: {
        title: '数据准备',
        icon: 'ant-design:folder-outlined',
      },
      children: [
        {
          path: 'data/datasource',
          name: 'DataEaseDatasource',
          component: () => import('@/views/micro/dataease/index.vue'),
          meta: {
            title: '数据源',
            icon: 'ant-design:database-outlined',
           
          },
          
        },
        {
          path: 'data/dataset',
          name: 'DataEaseDataset',
          component: () => import('@/views/micro/dataease/index.vue'),
          meta: {
            title: '数据集',
            icon: 'ant-design:table-outlined',
            
          },
          
        },
      ],
    },
  ],
}

export default dataease

