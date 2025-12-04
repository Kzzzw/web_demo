<template>
    <div class="cardContainer">
        <div class="card-content">
            <slot></slot>
        </div>
    </div>
</template>
<script setup>
const props = defineProps({
    // 页面名称
    name: String,
});
</script>
<style lang="less" scoped>
.cardContainer {
    height: 100%;
    overflow: auto;
    .card-content {
        /* padding: 24px 16px; */
        min-height: calc(100% - 80px);
        // padding: 24px;
        margin: 24px 16px 24px 16px;
    }
}
</style>
