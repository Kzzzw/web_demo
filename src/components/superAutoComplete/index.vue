<template>
    <div :class="['super-auto-complete']">
        <a-auto-complete
            v-model:value="query"
            class="certain-category-search"
            style="width: 100%"
            :options="searchRecordList"
            :defaultActiveFirstOption="false"
        >
            <template #option="item">
                <div @click="handleSearch(item.value)">
                    {{ item.value }}
                </div>
            </template>
            <a-input placeholder="请输入" size="large">
                <template #suffix>
                    <img
                        v-show="query"
                        src="@/assets/imgs/components/clear.png"
                        class="clear-icon"
                        @click="handleClear"
                    />
                    <IconFont
                        icon="icon-gaoliangsousuo"
                        class="search-icon"
                        @click="handleSearch(query)"
                    />
                </template>
            </a-input>
        </a-auto-complete>
    </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import IconFont from '@/components/IconFont/index.vue'
const props = defineProps({
    dataSource: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['search', 'clear']);

const query = ref('');

const searchRecordList = ref([
    {
        value: '最近搜索',
        options: []
    }
]);
watchEffect(() => {
    searchRecordList.value[0].options = props.dataSource;
});
const handleClear = () => {
    query.value = '';
    emit('clear');
};

const handleSearch = (value) => {
    emit('search', value);
};
</script>

<style lang="less" scoped>
.super-auto-complete {
    width: 100%;
    .clear-icon {
        margin-right: 12px;
    }
    .search-icon {
        font-size: 14px;
    }
    :deep(.ant-select-selection-search-input) {
        /* height: 48px; */
        border-radius: 6px;
        /*  background: #eef3ff; */
    }
}
</style>
