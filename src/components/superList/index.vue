<template>
    <div class="list-component" :style="{ '--list-height': height }">
        <div v-show="loading" class="loading-box">
            <a-spin :tip="loadingText" />
        </div>
        <div v-show="!dataSource.length && !loading" class="empty-box">
            <img class="empty-box-img" src="@/assets/imgs/components/empty.png" />
            <div class="empty-box-text">{{ emptyText }}</div>
        </div>
        <div v-show="dataSource.length && !loading" class="list-box">
            <slot :data="dataSource"></slot>
        </div>
    </div>
</template>

<script setup>
defineProps({
    // 列表数据
    dataSource: {
        type: Array,
        default: () => []
    },
    // loading状态
    loading: {
        type: Boolean,
        default: false
    },
    // loading文字
    loadingText: {
        type: String,
        default: 'loading...'
    },
    // 空列表文字
    emptyText: {
        type: String,
        default: '暂无数据'
    },
    // 列表高度
    height: {
        type: String,
        default: '400px'
    }
});
</script>

<style lang="less" scoped>
.list-component {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.loading-box {
    min-height: var(--list-height);
    display: flex;
    justify-content: center;
    align-items: center;
}

.empty-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: var(--list-height);
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
</style>
