<template>
    <div>
        <a-pagination
            :total="total"
            :current="current"
            :page-size="pageSize"
            show-size-changer
            show-quick-jumper
            :show-total="(total) => `共 ${total} 条`"
            @change="onChange"
            @showSizeChange="onShowSizeChange"
        />
    </div>
</template>

<script setup>
const props = defineProps({
    total: {
        type: Number,
        default: 0,
    },
    current: {
        type: Number,
        default: 1,
    },
    pageSize: {
        type: Number,
        default: 10,
    },
});

const emit = defineEmits([
    'change',
    'showSizeChange',
    'update:current',
    'update:pageSize',
]);

const onChange = (page, size) => {
    emit('change', page, size);
    emit('update:current', page);
    emit('update:pageSize', size);
};

const onShowSizeChange = (page, size) => {
    emit('showSizeChange', page, size);
    emit('update:current', page);
    emit('update:pageSize', size);
};
</script>

<style lang="less"></style>
