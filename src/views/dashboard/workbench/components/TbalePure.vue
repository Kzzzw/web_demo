<template>
    <div v-bind="$attrs">
      <SuperTablePure
        ref="tableRef"
        :columns="columns"
        :tableData="tableData"
        :api="fetchData"
        :deleteApi="deleteData"
        :defaultBtn="['add', 'export', 'download', 'import', 'delete']"
        :batchBtns="batchBtns"
        :hasSelect="true"
        :pagination="true"
        :pageSetting="pageSetting"
        :showSetting="true"
        :tableSettingData="tableSettingData"
        :loading="loading"
        :rowKey="'id'"
        :emptyText="'暂无数据'"
        :scroll="{ x: 1200, y: 400 }"
        :column0peration="columnOperation"
        :operationShowCount="2"
        @add="onAdd"
        @export="onExport"
        @download="onDownload"
        @import="onImport"
        @delete="onDelete"
        @batch="onBatch"
        @tableChangePage="onPageChange"
        @selectChange="onSelectChange"
        @selectIdChange="onSelectIdChange"
        @setting="onSetting"
        @changeTable="onTableChange"
      >
      
      <template #afterButton>
        <a-button type="default" @click="refreshData">
          刷新
        </a-button>
      </template>
  
      <!-- 自定义单元格内容 -->
      <template #bodyCell="{ scope }">
        <!-- 状态列自定义 -->
        <template v-if="scope.column.dataIndex === 'status'">
          <a-tag :color="scope.record.status === '启用' ? 'green' : 'red'">
            {{ scope.record.status }}
          </a-tag>
        </template>
        
        <!-- 操作列自定义 -->
        <template v-if="scope.column.dataIndex === 'operation'">
          <a-space>
            <a-button type="link" @click="editRecord(scope.record)">
              编辑
            </a-button>
            <a-button type="link" danger @click="deleteRecord(scope.record)">
              删除
            </a-button>
          </a-space>
        </template>
      </template>
  
      <!-- 自定义表头 -->
      <template #headerCell="{ header }">
        <template v-if="header.column.dataIndex === 'name'">
          <span style="color: #1890ff;">{{ header.column.title }}</span>
        </template>
      </template>
    </SuperTablePure>
    </div>
    
    <!-- 新增/编辑弹窗示例 -->
    <SuperModalOne
      :open="modalVisible"
      :maskClosable="false"
      :closable="true"
      :width="540"
      :bodyStyle="{ top: '200px' }"
      class="small-modal"
      :title="modalTitle"
      :titleType="modalMode === 'add' ? 'prompt' : 'success'"
      @onOk="onModalOk"
      @onCancel="onModalCancel"
    >
      <div>
        <div v-if="modalMode === 'add'">这里是新增示例内容。</div>
        <div v-else>这里是编辑示例内容：{{ currentRecord?.name }}</div>
      </div>
    </SuperModalOne>
  </template>
  
  <script setup>
  import SuperTablePure from '@/components/superTablePure/index.vue'
  import SuperModalOne from '@/components/superModalOne/index.vue'
  import { ref, onMounted } from 'vue'
  import { message } from 'ant-design-vue'
  
  // 表格引用
  const tableRef = ref()
  
  // 加载状态
  const loading = ref(false)
  
  // 表格列配置
  const columns = ref([
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80,
      isShow: true,
    },
    { 
      title: '名称', 
      dataIndex: 'name', 
      key: 'name',
      width: 200,
      isShow: true,
      resizable: true
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      isShow: true,
      resizable: true,
      resizable: true
    },
    { 
      title: '创建时间', 
      dataIndex: 'createTime', 
      key: 'createTime',
      width: 180,
      isShow: true,
      resizable: true
    },
    { 
      title: '操作', 
      dataIndex: 'operation', 
      key: 'operation',
      width: 150,
      isShow: true
    }
  ])
  
  // 表格数据
  const tableData = ref([
    {
      id: 1,
      name: '张三',
      status: '启用',
      createTime: '2021-01-01 12:00:00'
    },
    {
      id: 2,
      name: '李四',
      status: '禁用',
      createTime: '2021-01-01 12:00:00'
    },
    {
      id: 3,
      name: '王五',
      status: '启用',
      createTime: '2021-01-01 12:00:00'
    },
    {
      id: 4,
      name: '赵六',
      status: '禁用',
      createTime: '2021-01-01 12:00:00'
    },
    {
      id: 5,
      name: '孙七',
      status: '启用',
      createTime: '2021-01-01 12:00:00'
    },
    {
      id: 6,
      name: '周八',
      status: '禁用',
      createTime: '2021-01-01 12:00:00'
    },
    {
      id: 7,
      name: '吴九',
      status: '启用',
      createTime: '2021-01-01 12:00:00'
    },
    {
      id: 8,
      name: '郑十',
      status: '禁用',
      createTime: '2021-01-01 12:00:00'
    }
  ])

  // 操作列（由 SuperTablePure 内置渲染）
  const editRecord = (record) => {
    modalMode.value = 'edit'
    currentRecord.value = record
    modalTitle.value = '编辑'
    modalVisible.value = true
  }
  const deleteRecord = (record) => {
    console.log('删除记录:', record)
  }
  const columnOperation = ref([
    { name: '编辑', function: editRecord },
    { name: '删除', type: 'danger', popconfirm: true, popconfirmTitle: '确认删除{slot}？', popconfirmKey: 'name', function: deleteRecord },
  ])
  
  // 批量操作按钮配置
  const batchBtns = ref([
    { label: '批量启用', value: 'enable', align: 'center' },
    { label: '批量禁用', value: 'disable', align: 'center' },
    { label: '批量导出', value: 'export', align: 'center' }
  ])
  
  // 列设置配置
  const tableSettingData = ref([
    { label: '显示所有列', value: 'showAll' },
    { label: '隐藏所有列', value: 'hideAll' },
    { label: '重置列宽', value: 'resetWidth' }
  ])
  
  // 分页配置
  const pageSetting = ref({
    current: 1,
    total: 0,
    pageSize: 20,
    pageSizeOptions: ['10', '20', '50', '100']
  })
  
  // 获取数据API
  const fetchData = async (params = {}) => {
    loading.value = true
    try {
      const response = await api.getDataList({
        current: pageSetting.value.current,
        pageSize: pageSetting.value.pageSize,
        ...params
      })
      
      if (response.code === 200) {
        tableData.value = response.data.records
        pageSetting.value.total = response.data.total
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      loading.value = false
    }
  }
  
  // 删除数据API
  const deleteData = async (ids) => {
    try {
      const response = await api.deleteData({ ids })
      if (response.code === 200) {
        message.success('删除成功')
        fetchData() // 重新获取数据
      }
    } catch (error) {
      message.error('删除失败')
    }
  }
  
  // 事件处理函数
  const onAdd = () => {
    modalMode.value = 'add'
    currentRecord.value = null
    modalTitle.value = '新增'
    modalVisible.value = true
  }
  
  const onExport = () => {
    // 导出逻辑
    console.log('点击导出')
  }
  
  const onDownload = () => {
    // 下载模板逻辑
    console.log('点击下载模板')
  }
  
  const onImport = () => {
    // 导入逻辑
    console.log('点击导入')
  }
  
  const onDelete = () => {
    // 批量删除逻辑
    const selectedKeys = tableRef.value.selectKey
    if (selectedKeys.length === 0) {
      message.warning('请选择要删除的数据')
      return
    }
    // 删除确认已在组件内部处理
  }
  
  const onBatch = (key) => {
    // 批量操作逻辑
    const selectedKeys = tableRef.value.selectKey
    if (selectedKeys.length === 0) {
      message.warning('请选择要操作的数据')
      return
    }
    
    switch (key) {
      case 'enable':
        batchEnable(selectedKeys)
        break
      case 'disable':
        batchDisable(selectedKeys)
        break
      case 'export':
        batchExport(selectedKeys)
        break
    }
  }
  
  const onPageChange = ({ current, pageSize }) => {
    pageSetting.value.current = current
    pageSetting.value.pageSize = pageSize
    fetchData()
  }
  
  const onSelectChange = (selectedKeys) => {
    console.log('选中的行:', selectedKeys)
  }
  
  const onSelectIdChange = (id, selected) => {
    console.log('单行选择变化:', id, selected)
  }
  
  const onSetting = (value) => {
    switch (value) {
      case 'showAll':
        columns.value.forEach(col => col.isShow = true)
        break
      case 'hideAll':
        columns.value.forEach(col => col.isShow = false)
        break
      case 'resetWidth':
        // 重置列宽逻辑
        break
    }
  }
  
  const onTableChange = (...params) => {
    console.log('表格变化:', params)
  }
  
  // 自定义操作
  const customAction = () => {
    console.log('自定义操作')
  }
  
  const refreshData = () => {
    fetchData()
  }
  
  
  
  // 批量操作具体实现
  const batchEnable = async (ids) => {
    try {
      await api.batchEnable({ ids })
      message.success('批量启用成功')
      fetchData()
    } catch (error) {
      message.error('批量启用失败')
    }
  }
  
  const batchDisable = async (ids) => {
    try {
      await api.batchDisable({ ids })
      message.success('批量禁用成功')
      fetchData()
    } catch (error) {
      message.error('批量禁用失败')
    }
  }
  
  const batchExport = (ids) => {
    console.log('批量导出:', ids)
  }
  
  // 弹窗状态
  const modalVisible = ref(false)
  const modalMode = ref('add') // add | edit
  const modalTitle = ref('新增')
  const currentRecord = ref(null)

  const onModalOk = () => {
    modalVisible.value = false
    message.success(`${modalMode.value === 'add' ? '新增' : '编辑'}成功（示例）`)
  }
  const onModalCancel = () => {
    modalVisible.value = false
  }

  // 组件挂载时获取数据
  onMounted(() => {
    fetchData()
  })
  </script>