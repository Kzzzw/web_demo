<template>
    <div class="pageContainer">
        <div class="page-name" v-if="name">
            {{ name }}
        </div>
        <div class="page-content">
            <slot></slot>
        </div>
    </div>
</template>
<script setup>
const props = defineProps({
    // 页面名称
    name: String
});
</script>
<style lang="less" scoped>
.pageContainer {
    height: 100%;
    background-color: #fff;
    border-radius: 4px;
    overflow: auto;
    margin: 24px;
    .page-name {
        font-size: 18px;
        font-weight: 500;
        color: #25282e;
        padding: 24px 0px 24px 16px;
        border-bottom: 1px solid #e6e9f1;
    }
    .page-content {
        /* padding: 24px 16px; */
        height: calc(100% - 80px);
    }
}
</style>
