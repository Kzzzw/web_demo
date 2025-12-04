<template>
    <div id="CommonPageHeader">
        <div
            class="common-page-header-heading-left"
            @click="back"
            :class="!titleClickabled ? '' : 'cursor-pointer'"
        >
            <slot name="backIcon">
                <div class="common-page-header-back cursor-pointer">
                    <img src="@/assets/imgs/components/back.png" />
                </div>
            </slot>
            <template v-if="!titleClickabled">
                <div @click.stop>
                    <slot name="title">
                        <span class="common-page-header-heading-title" :title="title">{{
                            title
                        }}</span>
                    </slot>
                </div>
            </template>
            <template v-else>
                <slot name="title">
                    <span class="common-page-header-heading-title" :title="title">{{ title }}</span>
                </slot>
            </template>
        </div>
    </div>
    <div class="bottom-line" v-if="showBottomLine"></div>
</template>
<script setup>
import { ArrowLeftOutlined } from '@ant-design/icons-vue';
import { ref, onMounted, onBeforeUnmount } from 'vue';
const props = defineProps({
    title: {
        type: String,
        default: '返回',
    },
    titleClickabled: {
        type: Boolean,
        default: false,
    },
    showBottomLine: {
        type: Boolean,
        default: true,
    },
});
const emit = defineEmits(['back']);
const back = () => {
    emit('back');
};
onMounted(() => {});
onBeforeUnmount(() => {});
defineExpose({});
</script>
<style lang="less" scoped>
#CommonPageHeader {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: rgba(0, 0, 0, 0.85);
    font-size: 14px;
    font-variant: tabular-nums;
    line-height: 1.5715;
    list-style: none;
    font-feature-settings: 'tnum';
    position: relative;
    padding-bottom: 12px;
    background-color: #fff;
    .common-page-header-heading-left {
        display: flex;
        align-items: center;

        &:hover {
            .common-page-header-back {
                color: var(--ant-primary-color);
            }
        }
    }
    .cursor-pointer {
        cursor: pointer;
    }
    .common-page-header-back {
        margin-right: 8px;
        line-height: 1;
        > img {
            height: 15px;
        }
    }
    .common-page-header-heading-title {
        margin-right: 12px;
        margin-bottom: 0;
        color: rgba(0, 0, 0, 0.85);
        font-weight: 600;
        font-size: 18px;
        line-height: 32px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}
.bottom-line {
    border-bottom: 1px solid #e9e9e9;
}
</style>
