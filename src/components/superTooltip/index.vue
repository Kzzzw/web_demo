<template>
    <a-tooltip :title="title" :placement="placement" overlayClassName="bgcolor">
        <slot></slot>
    </a-tooltip>
</template>
<script setup>
const props = defineProps({
    title: {
        type: [String, Number],
    },
    placement: {
        type: String,
    },
});
</script>
<style lang="less">
/* //控制内容主题颜色 */
.bgcolor .ant-tooltip-inner {
    color: #333 !important;
    background-color: #fff !important;
    box-shadow: 0px 2px 8px 0px rgba(131, 131, 131, 0.5) !important;
    border-radius: 4px 4px 4px 4px !important;
    opacity: 1;
    font-size: 14px !important;
}
/* 控制最下面三角形颜色 */
.bgcolor .ant-tooltip-arrow-content {
    background-color: #fff !important;
}
</style>
