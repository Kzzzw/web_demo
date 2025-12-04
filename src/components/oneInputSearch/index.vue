<template>
    <div class="search-left">
        <div class="search-btn">
            <a-button
                type="primary"
                @click="newAndEdit(null, '新增')"
                class="add-items"
                v-if="isAddBtn"
            >
                新增
            </a-button>
            <span v-if="isBatchBtn">
                    <a-dropdown v-if="batchBtns.length">
                        <template #overlay>
                            <a-menu @click="handleMenuClick">
                                <a-menu-item v-for="bat in batchBtns" :key="bat.value">
                                    {{ bat.label }}
                                </a-menu-item>
                            </a-menu>
                        </template>
                        <a-button>
                            批量操作
                            <DownOutlined />
                        </a-button>
                    </a-dropdown>
                </span>
            <slot name="extra"></slot>
        </div>

        <div class="search-right">
            <a-input-search
                v-if="showSearch"
                v-model:value="keyword"
                :placeholder="seaPlaceholder"
                style="width: 300px"
                allowClear
                @search="searchKeyword">
                <template #enterButton>
                    <a-button type="primary" class="input-search-btn">搜索</a-button>
                </template>
            </a-input-search>
            <slot name="extraRight"></slot>
            <a-button-group compact>
                <a-button v-if="showReset" @click="resetList">
                    <i class="iconfont icon-zhongzhi"></i>
                </a-button>
                <a-button @click="toggleList" v-if="isToggleBtn">
                    <i class="iconfont icon-liebiao"></i>
                    <i class="iconfont icon-zhankai1" v-if="isToggle" ></i>
                    <i class="iconfont icon-zhankai" v-else></i>

                </a-button>
            </a-button-group>
        </div>
    </div>
</template>

<script setup>
import { defineProps, ref, onMounted } from 'vue';
import { DownOutlined } from '@ant-design/icons-vue'
const props = defineProps({
    isAddBtn: {
        type: Boolean,
        default: () => true,
    },
    isBatchBtn: {
        type: Boolean,
        default: () => true,
    },
    batchBtns: {
        type: Array,
        default: [
            {
                label: '批量删除',
                value: '1',
            },
        ],
    },
    isToggleBtn: {
        type: Boolean,
        default: () => false,
    },
    seaPlaceholder: {
        type: String,
        default: '请输入内容',
    },
    showSearch: {
        type: Boolean,
        default: true,
    },
    showReset: {
        type: Boolean,
        default: true,
    },
});
const emit = defineEmits(['add', 'search', 'batch', 'reset', 'toggle'])

const keyword = ref('')
const isToggle = ref(false);

/* 新增数据 */
const newAndEdit = () => {
    emit('add');
};
/* 批量操作 */
const handleMenuClick = (key) => {
    emit('batch', key);
};

const searchKeyword = () => {
    emit('search', keyword.value);
}
const resetList = () => {
    emit('reset');
}
const toggleList = () => {
    isToggle.value = !isToggle.value;
    emit('toggle');
};
</script>

<style scoped lang="less">
.search-left {
    display: flex;
    max-height: 32px;
    justify-content: space-between;
    .search-btn {
        :deep(.ant-btn) {
            border-radius: 4px;
        }
    }
}
.search-right {
    display: flex;
}
.add-items {
    margin-right: 12px;
}
.search-items {
    width: 100%;
    min-height: 100px;
    padding: 24px 24px 24px 24px;
    background: #f6f7f9;
    margin-top: 24px;
    .input-item .custom-select {
        font-size: 14px;
        font-family: SourceHanSansCN-Regular, SourceHanSansCN;
        font-weight: 400;
        color: #333333;
        border-radius: 0px 4px 4px 0px !important;
    }
}
</style>