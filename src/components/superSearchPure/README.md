# SuperSearchPure 组件文档

## 功能特点

- 支持快速搜索和高级筛选
- 支持列表视图切换
- 支持多种输入组件（输入框、选择器、日期选择器等）
- 支持批量操作功能
- 支持自定义搜索条件
- 支持搜索条件展示和清除
- 支持新增按钮（可配置）
- 支持自定义占位符文本

### Props

| 属性名         | 类型    | 默认值                            | 说明                 |
| -------------- | ------- | --------------------------------- | -------------------- |
| columns        | Array   | []                                | 搜索列配置           |
| alwaysShowList | Array   | []                                | 始终显示的搜索项     |
| isAddBtn       | Boolean | true                              | 是否显示新增按钮     |
| isBatchBtn     | Boolean | true                              | 是否显示批量操作按钮 |
| isFilterBtn    | Boolean | true                              | 是否显示筛选按钮     |
| isToggleBtn    | Boolean | false                             | 是否显示列表切换按钮 |
| seaPlaceholder | String  | '请输入内容'                      | 搜索框占位符文本     |
| batchBtns      | Array   | [{label: '批量删除', value: '1'}] | 批量操作按钮配置     |

## 事件

| 事件名       | 参数                       | 说明               |
| ------------ | -------------------------- | ------------------ |
| update       | (data: Object)             | 搜索条件更新时触发 |
| add          | -                          | 点击新增按钮时触发 |
| reset        | -                          | 重置搜索条件时触发 |
| batch        | (key: string)              | 批量操作时触发     |
| selectChange | (value: any, type: string) | 选择器值变化时触发 |
| toggle       | -                          | 列表视图切换时触发 |

## 搜索列配置说明

```javascript
{
  title: string,           // 搜索项标题
  dataIndex: string,       // 数据字段名
  search: {
    el: string,           // 组件类型
    key: string,          // 搜索字段名
    alwaysShow: boolean,  // 是否始终显示
    fieldNames: {         // 字段映射（用于选择器）
      label: string,
      value: string,
      children: string    // 树形选择器专用
    },
    props: {              // 组件属性
      showTime: boolean,  // 是否显示时间选择
      format: string,     // 日期格式
      defaultValue: any   // 默认值
    }
  },
  enum: Array | Promise,  // 选项数据
  enumType: string,       // 枚举类型（'interface' 表示接口获取）
  enumFn: Function,       // 获取枚举数据的函数
  isShow: boolean,        // 是否显示
  placeholder: string,    // 占位符
  showSearch: boolean,    // 是否可搜索
  min: number,           // 最小值（数字输入框）
  max: number,           // 最大值（数字输入框）
  lableFormat: string    // 标签格式
}
```

## 使用示例

```vue
<template>
	<SuperSearchPure
		:columns="searchColumns"
		:batchBtns="batchButtons"
		@update="handleSearch"
		@add="handleAdd"
		@batch="handleBatch"
		@toggle="handleToggle"
	/>
</template>

<script setup>
import { ref } from 'vue';
import SuperSearchPure from '@/components/superSearchPure';

const searchColumns = ref([
	{
		title: '安全防护能力',
		dataIndex: 'safeSecurityType',
		search: {
			el: 'select',
			key: 'safeSecurityType',
			alwaysShow: true,
		},
		enum: [
			{ label: '数据库账号', value: '1' },
			{ label: '主机账号', value: '2' },
			{ label: '应用账号', value: '3' },
		],
	},
	{
		title: '所属组织',
		dataIndex: 'orgId',
		enumType: 'interface',
		enumFn: async () => {
			// 返回组织数据
			return [];
		},
		search: {
			el: 'treeSelect',
			key: 'orgId',
			alwaysShow: true,
			fieldNames: {
				label: 'name',
				value: 'id',
				children: 'children',
			},
		},
	},
]);

const batchButtons = ref([
	{ label: '批量删除', value: 'delete' },
	{ label: '批量启用', value: 'enable' },
]);
</script>
```

## 支持的组件类型

- input: 输入框
- inputNumber: 数字输入框
- select: 选择器
- treeSelect: 树形选择器
- timePicker: 时间选择器
- timeRangePicker: 时间范围选择器
- datePicker: 日期选择器
- dateRangePicker: 日期范围选择器
- cascader: 级联选择器
