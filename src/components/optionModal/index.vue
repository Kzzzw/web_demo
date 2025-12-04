<template>
    <a-modal 
        :open="optionVisible" 
        :title="title" 
        :width="customizeWidth" 
        :footer="null" 
        :maskClosable="false"
        :keyboard="false"
        @cancel="cancel"
    >
        <SuperTablePure
                ref="tableRef"
                key="table"
                :loading="loading"
                :columns="optionColumns"
                :tableData="dataSource"
                :pageSetting="pagination"
                :scroll="{ y: 300 }"
                :hasSelect="false"
                @tableChangePage="getChangeList"
        >
            <template #bodyCell="{ scope }">
                <template v-if="scope.column.dataIndex === 'statusName'">
                    <a-tag
                            :color="scope.record.status === 999 ? 'red' : 'green'"
                            :bordered="false"
                            class="item-tag"
                    >{{ scope.text }}
                    </a-tag
                    >
                </template>

                <template v-if="scope.column.dataIndex === 'action'">
                    <a-button
                            type="link"
                            style="padding-left: 0"
                            :disabled="((scope.record.status === 10 ||scope.record.status === 2) && scope.record.type === 2) ||
                            scope.record.status === 26"
                            @click="handleDownload(scope.record)"
                    >下载
                    </a-button
                    >
                </template>
            </template>
        </SuperTablePure>
    </a-modal>
</template>


<script lang="ts" setup>
import {reactive, ref, computed, watch} from 'vue';
import {downloadFromStream} from "@/utils/tool";
// import { getRecord } from '@/api/appInterface/infoAssestData.js';
import {message} from 'ant-design-vue';
import {useRoute} from 'vue-router'
const props = defineProps({
    width: {
        type: Number,
        default: 800
    },
    // 弹框尺寸 mini / default / large
    size: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: '操作记录'
    }
});
const route = useRoute();
const  optionColumns = [
    {
        title: '类型',
        dataIndex: 'typeName',
        width: 180,
    },
    {
        title: '操作人',
        dataIndex: 'userName',
        width: 120,
        ellipsis: true,
    },
    {
        title: '状态',
        dataIndex: 'statusName',
        width: 180,
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        width: 180,
    },
    {
        width: 80,
        title: '操作',
        dataIndex: 'action',
        align: 'left',
    },
];
async function handleDownload(record) {
    message.info('下载中...');
    try {
        const dataName = route.meta.title
        const fileName = `${dataName}-${record.createTime}.xlsx`;
        let url = '/service_acl/asset/batch-task-record/export';
        let data = {fileName: record.path};
        await downloadFromStream(url, data, 'GET', fileName);
    } catch (error) {
        message.error('下载失败');
    }
}
const optionVisible = ref(false)
const dataSource = ref<any[]>([])
const loading = ref(false);
const dataList = ref()
const pagination = reactive({
    showTotal: (total) => `共 ${total} 条`,
    current: 1,
    total: 0,
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
});
const sizeObj = {small: 520, middle: 620, large: 720};
const customizeWidth = computed(() => {
    return sizeObj[props.size] || props.width;
});

async function getChangeList(item) {
    loading.value = true;
    let { current, pageSize } = item;
    const params = {
        currentPage: current,
        pageSize: pageSize,
        dataType: dataList.value
    };
    try {
        console.log(params);
        // 模拟数据，避免空数据导致的渲染问题
        dataSource.value = [
            {
                typeName: '测试类型',
                userName: '测试用户',
                statusName: '成功',
                createTime: new Date().toLocaleString(),
                status: 1,
                type: 1,
                path: 'test.xlsx'
            }
        ];
        pagination.total = 1;
        pagination.current = current;
        pagination.pageSize = pageSize;
        loading.value = false;
        // const res = await getRecord(params);
        // loading.value = false;
        // dataSource.value = res.data.list;
        // pagination.total = res.data.total;
        // pagination.current = res.data.currentPage;
        // pagination.pageSize = res.data.pageSize;
    } catch (error) {
        console.error('获取数据失败:', error);
        loading.value = false;
    }
}
const showModal = (item) => {
    optionVisible.value = true;
    dataList.value = item
}
const cancel = () => {
    dataSource.value = [];
    optionVisible.value = false;
}
let timer: NodeJS.Timeout | null = null;

watch(
        () => optionVisible.value,
        async (val) => {
            if (val) {
                const params = {
                    current: 1,
                    pageSize: 20,
                };
                getChangeList(params);

                timer = setInterval(() => {
                    const params = {
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                    };
                    getChangeList(params);
                }, 10 * 1000);
            } else {
                if (timer) {
                    clearInterval(timer);
                    timer = null;
                }
            }
        },
        { deep: true },
);
defineExpose({
    showModal
})
</script>


<style lang="less" scoped>
.item-tag {
    border: none;
}
:deep(.ant-table-body) {
    min-height: calc(100vh - 320px) !important;
}
</style>
