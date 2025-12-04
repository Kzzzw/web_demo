<template>
    <div>
        <SuperModalOne
            :visible="visible"
            :maskClosable="false"
            :closable="true"
            @onOk="onOK"
            @onCancel="onCancel"
            :width="540"
            :bodyStyle="{ top: '280px' }"
            class="small-modal"
            title="提示"
            titleType="prompt"
        >
            <div>
                <span
                    >批量删除多个{{ deleteText }}，将会同时删除所选
                    {{ deleteText }}相关的数据，确认是否删除？</span
                >
            </div>
        </SuperModalOne>
    </div>
</template>

<script setup>
const props = defineProps({
    visible: {
        type: Boolean
    },
    deleteText: {
        type: String
    }
});
const emit = defineEmits(['closeModel']);
const onOK = async () => {
    try {
        submitForm();
    } catch (errorInfo) {
        console.log('Failed:', errorInfo);
    }
};
const submitForm = async () => {
    onCancel(1);
};
const onCancel = (val) => {
    emit('closeModel', val);
};
</script>

<style lang="less"></style>
