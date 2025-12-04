<template>
    <div ref="globalModal">
        <a-modal
            :open="visible"
            :width="customizeWidth"
            :closable="closable"
            :maskClosable="maskClosable"
            :destroyOnClose="destroyOnClose"
            :okText="okText"
            :cancelText="cancelText"
            :mask="mask"
            @ok="handleOk"
            @cancel="handleCancel"
            :getContainer="() => $refs.globalModal"
            :centered="centered"
            :style="bodyStyle"
        >
            <template #title>
                <div>
                    <span class="title-icon">
                        <IconFont v-if="titleType=='prompt'"  type="icon-a-tishidanchuang" />
                        <IconFont v-if="titleType=='success'" type="icon-chenggong-xiao" />
                        <IconFont v-if="titleType=='fail'" type="icon-shibai-xiao" />
                    </span>
                    <span>{{title}}</span>
                </div>
            </template>
            <template #footer>
                <slot name="footer">
                    <a-button class="foot-but" key="submit" type="primary" @click="handleOk">{{okText}}</a-button>
                    <a-button class="foot-but" key="back" @click="handleCancel">{{cancelText}}</a-button>
                </slot>
            </template>
            <slot></slot>
        </a-modal>
    </div>
    </template>
    <script setup>
    import { computed } from 'vue'
    const props = defineProps({
        // 弹窗title样式(提示，成功，失败)
        titleType: {
            type: String,
            default: ''
        },
        // 弹框是否可见
        visible: Boolean,
        // 弹窗是否垂直居中
        centered: {
            type: Boolean,
            default: false
        },
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
            default: '确定'
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
    <style lang="less" scoped>
        .title-icon {
            font-size: 26px;
            vertical-align: sub;
            margin-right: 10px;
        }
        :deep(.ant-modal) {
            max-height: 820px;
            overflow-y: scroll;
            &::-webkit-scrollbar {
               display: none;
            }
        }
        :deep(.ant-modal-title) {
            font-weight: 600;
        }
        .foot-but {
            padding: 5px 21px;
            border-radius: 4px 4px 4px 4px;
        }
        .small-modal {
            :deep(.ant-modal-footer) {
                padding: 32px 33px;
            }
            :deep(.ant-modal-body) {
                padding: 24px 33px 0;
            }
        }
        .big-modal {
            :deep(.ant-modal-footer) {
                padding: 32px 75px;
            }
            :deep(.ant-modal-body) {
                padding: 24px 75px 0;
            }
        }
    </style>
    