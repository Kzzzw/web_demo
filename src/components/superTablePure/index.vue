<template>
	<div class="table-container">
		<div
			class="table_top"
			:style="tableTopStyle"
			v-if="showTitleRow || tableTitle || defaultBtn.length || batchBtns.length"
		>
			<!-- <div class="title">{{ tableTitle }}</div> -->
			<div class="buttons">
				<slot name="preButton"></slot>
				<a-button
					type="primary"
					class="default_btn"
					@click="emit('add')"
					v-if="defaultBtn.includes('add')"
				>
					新增
				</a-button>
				<a-button
					:class="tableType === 'pure' ? 'default_btn' : 'btn-gap'"
					@click="emit('export')"
					v-if="defaultBtn.includes('export')"
				>
					<template #icon>
						<i class="iconfont icon-daochu tiny-gap"></i>
					</template>
					导出
				</a-button>
				<a-button
					:class="tableType === 'pure' ? 'default_btn' : 'btn-gap'"
					@click="emit('download')"
					v-if="defaultBtn.includes('download')"
				>
					<template #icon>
						<i class="iconfont icon-xiazaimoban1 tiny-gap"></i>
					</template>
					下载模板
				</a-button>
				<a-button
					:class="tableType === 'pure' ? 'default_btn' : 'btn-gap'"
					@click="emit('import')"
					v-if="defaultBtn.includes('import')"
				>
					<template #icon>
						<i class="iconfont icon-daoru tiny-gap"></i>
					</template>
					导入
				</a-button>
				<a-dropdown v-if="batchBtns.length">
					<template #overlay>
						<a-menu @click="handleMenuClick">
							<a-menu-item
								v-for="bat in batchBtns"
								:key="bat.value"
								:style="{
									textAlign: bat?.align ? bat.align : 'center',
								}"
								:disabled="!!bat?.disabled"
							>
								{{ bat.label }}
							</a-menu-item>
						</a-menu>
					</template>
					<a-button>
						批量操作
						<DownOutlined />
					</a-button>
				</a-dropdown>
				<a-button
					v-if="defaultBtn.includes('delete')"
					danger
					type="primary"
					:disabled="selectKey.length === 0"
					@click="emit('delete')"
				>
					删除
				</a-button>
				<slot name="afterButton"></slot>
			</div>
		</div>
		<div class="table-module">
			<div class="table-setting" v-if="props.showSetting">
				<a-dropdown>
					<SettingOutlined class="table-setting-icon" />
					<template #overlay>
						<a-menu>
							<a-menu-item
								v-for="(item, index) in props.tableSettingData"
								:key="index"
								@click="handleSettingClick(item.value)"
							>
								{{ item.label }}
							</a-menu-item>
						</a-menu>
					</template>
				</a-dropdown>
			</div>
			<a-table
				sticky
				:class="`super-table-pure${uniqueCode}`"
				:data-source="tableData"
				:columns="listColumns"
				:pagination="false"
				:row-selection="props.hasSelect ? toRefs(rowSelection) : null"
				:rowKey="rowKey"
				:loading="loading"
				:scroll="scroll"
				:bordered="false"
				@resizeColumn="handleResizeColumn"
				@change="handleTableChange"
				:row-class-name="rowClassName"
			>
				<template v-if="headerSlot" #headerCell="header">
					<slot name="headerCell" :header="header"></slot>
				</template>
				<template #bodyCell="scope">
					<slot name="bodyCell" :scope="scope"></slot>
				</template>
				<template #expandIcon="props">
					<slot name="expandIcon" :props="props"></slot>
				</template>
				<template #emptyText>
					<div />
				</template>
			</a-table>
		</div>
		<!-- </div> -->
		<div class="pagination-bottom" v-if="tableData.length > 0 && showPagination">
			<a-pagination
				v-model:current="pageSetting.current"
				show-size-changer
				:show-quick-jumper="showQuickJumper"
				:total="pageSetting.total"
				:pageSizeOptions="pageSetting.pageSizeOptions"
				v-model:page-size="pageSetting.pageSize"
				:show-total="(total, range) => `共 ${total} 条`"
				@change="ChangePagination"
			/>
		</div>
		<DeleteModel
			:visible="visibleDelete"
			:deleteText="deleteText"
			@closeModel="(val) => closeModel(val)"
		></DeleteModel>
		<div style="display: none" inert>
			<div class="table-empty" :class="`table-empty${uniqueCode}`">
				<img
					class="empty-box-img"
					src="@/assets/imgs/empty.svg"
					style="width: 150px; height: auto; margin-top: 30px"
				/>
				<div class="empty-box-text">{{ emptyText }}</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { message } from 'ant-design-vue';
import { reactive, toRefs, ref, onMounted, computed, watch, onBeforeMount } from 'vue';
import { SettingOutlined, PlusOutlined, DownOutlined } from '@ant-design/icons-vue';

const props = defineProps({
	getOrderCount: {
		type: Function,
	},
	api: {
		type: Function,
		// required: true
	},
	deleteApi: {
		type: Function,
	},
	initParam: {
		type: Object,
		default: {},
	},
	columns: {
		type: Array,
		required: true,
		default: [],
	},
	scroll: {
		type: Object,
		default: {},
	},
	current: {
		type: String,
		default: () => {
			return 'currentPage';
		},
	},
	size: {
		type: String,
		default: () => {
			return 'pageSize';
		},
	},
	total: {
		type: Number,
		default: () => {
			return 0;
		},
	},
	pagination: {
		type: Boolean,
		default: () => {
			return true;
		},
	},
	showQuickJumper: {
		type: Boolean,
		default: () => {
			return true;
		},
	},
	pageSetting: { type: Object },
	hasSelect: {
		type: Boolean,
		default: () => {
			return true;
		},
	},
	rowKey: {
		type: String,
		default: 'id',
	},
	emptyText: {
		type: String,
		default: '暂无数据',
	},
	scrollHeight: { type: Number }, // 滚动高度
	scrollWidth: { type: Number }, // 滚动宽度
	searchShow: { type: Boolean }, // 显示搜索项
	showTools: { type: Boolean },
	isFilterBtn: { type: Boolean, default: true },
	isDisabled: { type: String, default: '' }, // 单行禁用，需要还需要设置 disableCellVal
	disableCellVal: { type: null }, // 具体判断是否禁用的值
	deleteText: { type: String },
	rowSelectionData: {
		type: Object,
	},
	// seaPlaceholder: {
	//     type: String,
	//     default: '请输入内容',
	// },
	isAddBtn: {
		type: Boolean,
		default: () => true,
	},
	batchBtns: {
		type: Array,
		default: () => [],
	},
	tableData: {
		type: Array,
		default: [],
	},
	tableSettingData: {
		type: Array,
		default: [],
	},
	showSetting: {
		type: Boolean,
		default: () => false,
	},
	loading: {
		type: Boolean,
		default: () => false,
	},
	// 删除效果类名为deleteRow
	rowClassName: {
		type: Function,
		default: null,
	},
	// 默认按钮 参数为['add','export','download','import']
	defaultBtn: {
		type: Array,
		default: () => [],
	},
	// 表格标题
	tableTitle: {
		type: String,
		default: '',
	},
	// 是否显示表格头部
	showTitleRow: {
		type: Boolean,
		default: false,
	},
	showPagination: {
		type: Boolean,
		default: true,
	},
	headerSlot: {
		type: Boolean,
		default: false,
	},
	// 以下是为了区分superTableModule与本组件的细微差别而新增的参数，后续不需要管
	tableType: {
		type: String,
		default: 'pure',
	},
	tableTopStyle: {
		type: Object,
		default: () => {
			return { 'margin-bottom': '24px' };
		},
	},
});
// const tableData = ref([]);
const emit = defineEmits([
	'beforeSearch',
	'searchDone',
	'handleAdd',
	'batchAction',
	'selectChange',
	'tableChangePage',
	'add',
	'export',
	'download',
	'import',
	'setting',
	'batch',
	'changeTable',
	'selectIdChange',
]);
const tableEmptyDomClone = ref(null);
const visibleDelete = ref(false);
const formState = ref({});
// const loading = ref(false);
const selectKey = ref([]);
const uniqueCode = ref();

const ChangePagination = (current, pageSize) => {
	emit('tableChangePage', { current, pageSize });
};
/* 搜索 */
const handleSearch = (val) => {
	formState.value = {};
	if (val) {
		if (Object.keys(val).length !== 0) {
			formState.value = val;
		} else {
			cleanSearch();
		}
	}
	return JSON.parse(JSON.stringify(formState.value));
};

const closeModel = (val) => {
	if (val) {
		let data = Array.from(selectKey.value);
		batchDelete(data);
	}
	visibleDelete.value = false;
};
/* 批量操作 */
const handleMenuClick = (data) => {
	emit('batch', data.key);
};
const batchDelete = async (data) => {
	try {
		let res = await props?.deleteApi(data);
		if (res.code === 200) {
			// searchFirst();
			message.success('批量删除成功');
			selectKey.value = [];
			if (props?.getOrderCount) {
				props.getOrderCount();
			}
		} else {
			message.error(res.message);
		}
	} catch (error) {
		console.log(error.message);
	}
};
/**
 * 选择时抛出事件
 * @param selectedRowKeys
 */
const onSelectChange = (selectedRowKeys) => {
	selectKey.value = selectedRowKeys;
	emit('selectChange', selectedRowKeys);
};
// 单行选择时抛出
const onSelectChangeOne = (record, selected) => {
	emit('selectIdChange', record.id, selected);
};
const rowSelection = ref({
	selectedRowKeys: selectKey,
	checkStrictly: false,
	columnWidth: 50,
	onChange: onSelectChange,
	onSelect: onSelectChangeOne,
	getCheckboxProps: (record = {}) => {
		if (props.tableType === 'pure') {
			return {
				disabled: props.isDisabled ? record[props.isDisabled] === props.disableCellVal : false,
				name: props.isDisabled ? String(record[props.isDisabled] ?? '') : '',
			};
		}
		if (props.tableType === 'module') {
			let data = Object.keys(record);
			if (data.includes(props?.isDisabled)) {
				return {
					disabled: record[props?.isDisabled] === 1,
					name: record[props?.isDisabled].toString(),
				};
			}
		}
	},
});

const listColumns = computed(() => {
	return props.columns.filter((item) => item.isShow !== false && !item.isSearch);
});

const handleResizeColumn = (w, col) => {
	col.width = w;
};
const cleanSearch = () => {
	props.columns.forEach((field) => {
		if (formState.value.hasOwnProperty(field?.search?.key)) {
			formState.value[field?.search?.key] = '';
		}
	});
};

const minHeight = computed(() => {
	return props.scroll?.y;
});

const resetSelect = () => {
	selectKey.value = [];
};

const handleSettingClick = (val) => {
	emit('setting', val);
};
const handleTableChange = (...param) => {
	emit('changeTable', ...param);
};
const handlEmptyDom = () => {
	const tableDom = document.querySelector(`.super-table-pure${uniqueCode.value}`);
	const tableEmptyBlock = document.querySelector(`.table-empty${uniqueCode.value}`);

	if (tableEmptyDomClone.value && tableDom.contains(tableEmptyDomClone.value)) {
		tableDom.removeChild(tableEmptyDomClone.value);
	}

	// 克隆Dom
	tableEmptyDomClone.value = tableEmptyBlock.cloneNode(true);

	// 设置暂无数据Dom样式
	tableEmptyDomClone.value.style.position = 'absolute';
	tableEmptyDomClone.value.style.top = 0;
	tableEmptyDomClone.value.style.left = '50%';
	tableEmptyDomClone.value.style.transform = 'translateX(-50%)';
	tableEmptyDomClone.value.style.width = '100%';
	tableEmptyDomClone.value.style.height = 'calc(100% - 30px)';
	tableEmptyDomClone.value.style.textAlign = 'center';

	// 插入到 tableDom 中
	tableDom.appendChild(tableEmptyDomClone.value);
};

watch(
	() => props.tableData,
	(val) => {
		if (val.length === 0) {
			handlEmptyDom();
		} else {
			if (tableEmptyDomClone.value) {
				if (tableEmptyDomClone.value.parentNode.contains(tableEmptyDomClone.value)) {
					tableEmptyDomClone.value.parentNode.removeChild(tableEmptyDomClone.value);
				}
				tableEmptyDomClone.value = null;
			}
		}
	},
);
watch(
	() => props.loading,
	(val) => {
		if (val) {
			if (tableEmptyDomClone.value) {
				if (tableEmptyDomClone.value.parentNode.contains(tableEmptyDomClone.value)) {
					tableEmptyDomClone.value.parentNode.removeChild(tableEmptyDomClone.value);
				}
				tableEmptyDomClone.value = null;
			}
		}
	},
);

onBeforeMount(() => {
	uniqueCode.value = Math.ceil(Math.random() * 10000);
});

onMounted(() => {
	handleSearch();
});

defineExpose({
	handleSearch,
	resetSelect,
	ChangePagination,
	selectKey: selectKey,
});
</script>

<style scoped lang="less">
.table-container {
	overflow: hidden;
	// height: 100%;
	width: 100%;
	z-index: 1;
	display: flex;
	flex-direction: column; // 设置成上下排列方式

	.table_top {
		display: flex;
		// margin-bottom: 24px;
		justify-content: space-between;
		height: 32px;

		.title {
			font-size: 16px;
			font-weight: bold;
			line-height: 32px;
		}

		.default_btn {
			margin-right: 12px;
			border-radius: 4px;
		}
	}

	:deep(.ant-spin-container) {
		display: flex;
		flex-direction: column;
	}

	:deep(.ant-table) {
		flex: 1;
	}

	:deep(.ant-table-wrapper) {
		// 表格
		.ant-table {
			height: 100%;
		}

		// 选择列
		tr th.ant-table-selection-column,
		tr td.ant-table-selection-column {
			width: 60px;
		}

		.ant-checkbox-inner {
			width: 16px;
			height: 16px;
			border: 1px solid #a4a9c0;
			border-radius: 4px;
		}

		.ant-checkbox-checked .ant-checkbox-inner {
			background-color: #2665e2;
			border-color: #2665e2;

			&::after {
				border-width: 2px;
				transform: rotate(45deg) scale(0.92) translate(-70%, -55%);
			}
		}

		.ant-checkbox-indeterminate .ant-checkbox-inner::after {
			background-color: #2665e2;
		}

		.ant-table-tbody > tr.ant-table-row {
			border: none;
		}

		// 选择 单元格
		.ant-table-tbody > tr.ant-table-row-selected > td {
			background: #f4f7fc !important;
		}

		.ant-table-tbody > tr.ant-table-row > td.ant-table-cell:hover {
			background: #f4f7fc !important;
			border: none;
		}

		.ant-table-tbody > tr.ant-table-row:hover > td,
		.ant-table-tbody > tr > td.ant-table-cell-row-hover {
			background: #f4f7fc !important;
		}

		// 表头
		.ant-table-thead {
			tr th {
				font-size: 14px;
				font-family: PingFang SC-Bold, PingFangSC-Regular, PingFang SC;
				font-weight: bold;
				color: #32374a;
				line-height: 32px;
				padding: 0 16px;
				white-space: nowrap;
				background: #f7f8fa;

				&::before {
					display: none;
				}
			}

			.ant-table-resize-handle-line {
				width: 4px;
				background-color: #dae0e4;
			}

			.ant-table-cell {
				&:first-child {
					padding-left: 25px !important;
				}
			}
		}

		.ant-table-thead > tr > th.ant-table-cell:hover {
			background: #e9edf0 !important;
		}

		// 普通单元格
		.ant-table-tbody > tr > td {
			padding: 0px 16px;
			font-size: 14px;
			font-family: PingFangSC-Regular, PingFang SC;
			font-weight: 400;
			color: #32374a;
			height: 40px;
			line-height: 16px;
			box-sizing: border-box;
			border: none;
		}

		.ant-table-tbody .ant-table-cell {
			&:first-child {
				padding-left: 25px !important;
			}
		}

		.ant-table-tbody .deleteRow {
			> td {
				color: rgba(50, 55, 74, 0.5);
			}

			.ant-table-cell:first-child {
				position: relative;

				&:after {
					content: '';
					display: block;
					position: absolute;
					left: 0;
					top: 0;
					width: 35px;
					height: 35px;
					pointer-events: none;
					background: url('../../assets/imgs/deleteIcon.png') no-repeat;
					background-size: 100% 100%;
					z-index: 2;
				}
			}
		}

		.ant-table-tbody > tr:last-child > td {
			border-bottom: none;
		}

		/* 表内容 */
		.ant-table-body {
			min-height: v-bind(minHeight);
		}
	}

	/* 分页 */
	:deep(.ant-pagination) {
		flex-shrink: 0;
		margin: 0 !important;
		padding: 16px 0 !important;
		height: 50px;
		display: flex;
		justify-content: end;
		align-items: center;
	}

	:deep(.ant-table-sticky-scroll) {
		display: none;
	}

	.pagination-bottom {
		// margin-top: auto;
		height: 50px;
		line-height: 50px;
		border-top: 1px solid #d8d8d8;
	}
}

/* 表格容器样式已在上方定义 */

.search-container {
	padding-bottom: 24px;
}

.table-module {
	position: relative;
	overflow: auto scroll;
	/* 保留水平滚动条 */
}

.table-module::-webkit-scrollbar {
	width: 0;
	height: 0;
	background: transparent;
}

.table-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	flex: 1;

	.empty-box-img {
		width: 215px;
		height: 188px;
	}

	.empty-box-text {
		margin-top: 10px;
		font-size: 16px;
		color: #aaa;
	}
}

.table-setting {
	position: absolute;
	top: 6px;
	right: 10px;
	z-index: 999;

	.table-setting-icon {
		color: #666666;
		cursor: pointer;
	}
}
</style>
