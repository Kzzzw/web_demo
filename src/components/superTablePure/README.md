# superTablePure 组件使用文档

## 组件简介

基于 ant-design-vue 的高度可配置表格组件，支持分页、批量操作、选择、导入导出、动态列设置、空数据自定义、批量删除等常用表格功能。

---

## 基本用法

```vue
<template>
  <superTablePure
    :columns="columns"
    :tableData="tableData"
    :api="fetchData"
    :deleteApi="deleteData"
    :defaultBtn="['add', 'export', 'download', 'import', 'delete']"
    :batchBtns="batchBtns"
    :hasSelect="true"
    :pagination="true"
    :pageSetting="pageSetting"
    @add="onAdd"
    @export="onExport"
    @download="onDownload"
    @import="onImport"
    @delete="onDelete"
    @batch="onBatch"
    @tableChangePage="onPageChange"
    @selectChange="onSelectChange"
  >
    <template #bodyCell="{ scope }">
      <!-- 自定义单元格内容 -->
    </template>
  </superTablePure>
</template>

<script setup>
import superTablePure from '@/components/superTablePure/index.vue'

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' }
  // ...
]
const tableData = []
const batchBtns = [
  { label: '批量启用', value: 'enable' },
  { label: '批量禁用', value: 'disable' }
]
const pageSetting = {
  current: 1,
  total: 0,
  pageSize: 20,
  pageSizeOptions: ['10', '20', '50', '100']
}
const fetchData = async (params) => { /* ... */ }
const deleteData = async (ids) => { /* ... */ }

const onAdd = () => {}
const onExport = () => {}
const onDownload = () => {}
const onImport = () => {}
onDelete = () => {}
const onBatch = (key) => {}
const onPageChange = ({ current, pageSize }) => {}
const onSelectChange = (selectedKeys) => {}
</script>
```

---

## Props

| 属性名           | 类型      | 说明                                                                 |
|------------------|-----------|----------------------------------------------------------------------|
| columns          | Array     | 表格列配置，必填                                                     |
| tableData        | Array     | 表格数据源                                                           |
| api              | Function  | 获取数据的 API 方法（可选）                                           |
| deleteApi        | Function  | 批量删除的 API 方法（可选）                                           |
| defaultBtn       | Array     | 默认按钮，支持 'add'、'export'、'download'、'import'、'delete'        |
| batchBtns        | Array     | 批量操作按钮配置，格式：`[{ label, value }]`                         |
| hasSelect        | Boolean   | 是否显示多选框，默认 true                                            |
| pagination       | Boolean   | 是否显示分页，默认 true                                              |
| pageSetting      | Object    | 分页配置，包含 current、total、pageSize、pageSizeOptions 等           |
| rowKey           | String    | 行唯一标识，默认 'id'                                                |
| loading          | Boolean   | 是否显示加载中，默认 false                                           |
| showSetting      | Boolean   | 是否显示列设置，默认 false                                           |
| tableSettingData | Array     | 列设置下拉菜单配置                                                   |
| emptyText        | String    | 空数据提示，默认"暂无数据"                                           |
| showTitleRow     | Boolean   | 是否显示表格头部，默认 false                                         |
| tableTitle       | String    | 表格标题                                                             |
| showPagination   | Boolean   | 是否显示分页，默认 true                                              |
| showQuickJumper  | Boolean   | 是否显示快速跳转，默认 true                                          |
| scroll           | Object    | 表格滚动配置                                                         |
| ...              | ...       | 其他 ant-design-vue a-table 支持的属性                                |

---

## 事件

| 事件名           | 说明                                 | 回调参数                |
|------------------|--------------------------------------|-------------------------|
| add              | 点击"新增"按钮时触发                 | 无                      |
| export           | 点击"导出"按钮时触发                 | 无                      |
| download         | 点击"下载模板"按钮时触发             | 无                      |
| import           | 点击"导入"按钮时触发                 | 无                      |
| delete           | 点击"删除"按钮时触发                 | 无                      |
| batch            | 批量操作菜单项点击时触发             | 选中项的 value          |
| tableChangePage  | 分页变化时触发                       | { current, pageSize }   |
| selectChange     | 多选框选中项变化时触发               | 选中行 key 数组         |
| selectIdChange   | 单行选择变化时触发                   | (id, selected)          |
| setting          | 列设置菜单项点击时触发               | value                   |
| changeTable      | 表格排序、筛选等变化时触发           | ...                     |

---

## 插槽

| 插槽名         | 说明                         |
|----------------|------------------------------|
| preButton      | 表格头部左侧自定义按钮区     |
| afterButton    | 表格头部右侧自定义按钮区     |
| bodyCell       | 自定义单元格内容             |
| headerCell     | 自定义表头内容               |
| expandIcon     | 自定义展开图标               |

---

## 功能说明

- **批量操作**：支持批量选择、批量删除、批量自定义操作。
- **导入导出**：支持导入、导出、下载模板等常用操作。
- **动态列设置**：可通过下拉菜单动态显示/隐藏列。
- **分页与选择**：支持分页、快速跳转、多选、单选等。
- **空数据自定义**：无数据时自定义展示内容和图片。
- **删除确认**：批量删除时弹窗确认，防止误操作。
- **自定义按钮**：支持插槽扩展表格头部按钮区。

---
