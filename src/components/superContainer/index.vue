<template>
    <div id="super-container" :ref="refName">
        <template v-if="ready">
            <slot></slot>
        </template>
    </div>
</template>

<script>
import { debounce } from 'lodash';
import { defineComponent, ref, onMounted, onUnmounted, nextTick } from 'vue';

export default defineComponent({
    props: {
        options: Object
    },
    setup(ctx) {
        const refName = 'SuperContainer';
        // 屏幕宽度
        const width = ref(0);
        // 屏幕高度
        const height = ref(0);
        // 原始屏幕宽度
        const originalWidth = ref(0);
        // 原始屏幕高度
        const originalHeight = ref(0);
        // 控制显示
        const ready = ref(false);
        /*
         * dom:well-container的dom
         * observer: window.MutationObserver(Bom实例)监听dom改变
         */
        let dom;
        let observer;

        // 设置初始值
        const initSize = () => {
            return new Promise((resolve) => {
                nextTick(() => {
                    dom = document.getElementById('super-container');
                    // 获取大屏的传入尺寸
                    if (ctx.options && ctx.options.width && ctx.options.height) {
                        // 传入宽高
                        width.value = ctx.options.width;
                        height.value = ctx.options.height;
                    } else {
                        // 可见宽高
                        width.value = dom.clientWidth;
                        height.value = dom.clientHeight;
                    }
                    // 获取画布尺寸
                    if (!originalWidth.value || !originalHeight.value) {
                        // 屏幕分辨率宽高
                        originalWidth.value = window.screen.width;
                        originalHeight.value = window.screen.height;
                    }
                    resolve();
                });
            });
        };

        const updateSize = () => {
            if (width.value && height.value) {
                dom.style.width = `${width.value}px`;
                dom.style.height = `${height.value}px`;
            } else {
                dom.style.width = `${originalWidth.value}px`;
                dom.style.height = `${originalHeight.value}px`;
            }
        };

        const updateScale = () => {
            // 获取真实的视口尺寸
            const currentWidth = document.body.clientWidth;
            const currentHeight = document.body.clientHeight;
            // 获取大屏最终的宽高
            const realWidth = width.value || originalWidth.value;
            const realHeight = height.value || originalHeight.value;
            // 缩放比例  = 分辨率宽高 / 传入宽高(可视宽高)
            const widthScale = currentWidth / realWidth;
            const heightScale = currentHeight / realHeight;
            // 如果dom存在,就按照比例缩放
            dom && (dom.style.transform = `scale(${widthScale}, ${heightScale})`);
        };

        // 重置缩放比例
        const onResize = async () => {
            await initSize();
            updateScale();
        };

        const initMutationObserver = () => {
            // 监听元素属性变化
            const MutationObserver = window.MutationObserver;
            // 如果变化,就用onResize重置屏幕所缩放比例
            observer = new MutationObserver(onResize);
            observer.observe(dom, {
                attributes: true,
                attributeFilter: ['style'],
                attributeOldValue: true
            });
        };
        // 移除监听属性
        const removeMutationObserver = () => {
            if (observer) {
                observer.disconnect();
                observer.takeRecords();
                observer = null;
            }
        };
        //
        onMounted(async () => {
            ready.value = false;

            await initSize();
            updateSize();
            updateScale();
            window.addEventListener('resize', debounce(onResize, 500));
            initMutationObserver();
            ready.value = true;
        });

        onUnmounted(() => {
            window.removeEventListener('resize', onResize);
            removeMutationObserver();
        });

        return {
            refName,
            ready
        };
    }
});
</script>

<style lang="less" scoped>
#super-container {
    position: fixed;
    top: 0;
    left: 0;
    overflow: hidden;
    transform-origin: left top;
    z-index: 999;
}
</style>
