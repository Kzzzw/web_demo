<template>
    <a-modal
        :open="visible"
        :title="title"
        :width="customizeWidth"
        :closable="closable"
        :maskClosable="maskClosable"
        :destroyOnClose="destroyOnClose"
        :okText="okText"
        :cancelText="cancelText"
        :footer="footer"
        :mask="mask"
        :bodyStyle="bodyStyle"
        @ok="handleOk"
        @cancel="handleCancel"
    >
        <template #footer>
            <slot name="footer">
                <a-button type="primary" @click="handleOk">确定</a-button>
                <a-button @click="handleCancel">取消</a-button>
            </slot>
        </template>
        <slot></slot>
    </a-modal>
</template>
<script setup>
import { computed } from 'vue';

const props = defineProps({
    // 弹框是否可见
    visible: Boolean,
    // 弹框标题
    title: String,
    // 弹框宽度 520 / 620 / 720
    width: {
        type: Number,
        default: 520
    },
    // 弹框尺寸 mini / default / large
    size: {
        type: String,
        default: ''
    },
    // 关闭时销毁 Modal 里的子元素
    destroyOnClose: {
        type: Boolean,
        default: false
    },
    // 确认按钮文字
    okText: {
        type: String,
        default: '确认'
    },
    // 取消按钮文字
    cancelText: {
        type: String,
        default: '取消'
    },
    // 是否显示右上角的关闭按钮
    closable: {
        type: Boolean,
        default: true
    },
    // 点击蒙层是否允许关闭
    maskClosable: {
        type: Boolean,
        default: false
    },
    mask: {
        type: Boolean,
        default: true
    },
    // 底部内容，当不需要默认底部按钮时，可以设为 :footer="null"
    footer: {
        type: String
    },
    bodyStyle: {
        type: Object,
        default: {}
    }
});

const emit = defineEmits(['onOk', 'onCancel']);

const sizeObj = { small: 520, middle: 620, large: 720 };

const customizeWidth = computed(() => {
    return sizeObj[props.size] || props.width;
});

const handleOk = () => {
    emit('onOk');
};

const handleCancel = () => {
    emit('onCancel');
};
</script>
