<template>
    <a-modal
        :open="value"
        :title="title"
        :footer="null"
        wrap-class-name="full-modal"
        @cancel="handleCancel"
    >
        <iframe v-if="isPdf" id="pdfPreview" width="100%" height="100%" frameborder="0"></iframe>
        <div id="excelId" v-if="isExcel"></div>
        <div id="preview" v-show="isDocx">
            <pre id="output"></pre>
        </div>
    </a-modal>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted, nextTick } from 'vue';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

const props = defineProps({
    value: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: '预览',
    },
});

const isPdf = ref(false);
const isExcel = ref(false);
const isDocx = ref(false);
const emit = defineEmits(['update:value', 'submit']);
const blobUrl = ref('');
const handleCancel = () => {
    isPdf.value = false;
    isExcel.value = false;
    isDocx.value = false;
    emit('update:value', false);
};
const open = (blob) => {
    emit('update:value', true);
    nextTick(async () => {
        console.log(blob, 'blob');
        switch (blob.type) {
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                isDocx.value = true;
                const container = document.getElementById('preview');
                await renderAsync(blob, container, null, {
                    breakPages: false, // 关闭强制分页 ← 关键参数
                    ignoreHeight: false, // 不忽略原始高度
                    ignoreWidth: false, // 不忽略原始宽度
                });
                break;
            case 'text/plain':
                isDocx.value = true;
                const text = await blob.text();
                document.getElementById('output').textContent = text;
                break;
            case 'application/pdf':
                isPdf.value = true;
                nextTick(() => {
                    const iframe = document.getElementById('pdfPreview');
                    blobUrl.value = URL.createObjectURL(blob);
                    iframe.src = blobUrl.value;
                });
                break;
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.ms-excel':
                isExcel.value = true;
                nextTick(() => {
                    const excelContainer = document.getElementById('excelId');
                    // 处理 Excel 文件
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        // 将表格转换为 HTML
                        excelContainer.innerHTML = XLSX.utils.sheet_to_html(worksheet);
                    };
                    reader.readAsArrayBuffer(blob);
                });
                break;
            default:
                break;
        }
    });
};
onMounted(() => {});
onBeforeUnmount(() => {});
defineExpose({ open });
onUnmounted(() => {
    if (blobUrl.value) {
        URL.revokeObjectURL(blobUrl.value);
    }
});
</script>
<style lang="less" scoped>
#preview {
    height: calc(100vh - 110px);
    overflow: hidden;
    overflow-y: auto;
}
#excelId {
    height: calc(100vh - 110px);
    overflow: hidden;
    overflow-y: auto;
}

/* 使用深度选择器确保样式能应用到动态生成的表格 */
#excelId /deep/ table {
    border-collapse: collapse;
    width: 100%;
}

#excelId /deep/ th,
#excelId /deep/ td {
    border: 1px solid #ddd !important;
    padding: 8px;
}

#excelId /deep/ th {
    background-color: #f2f2f2;
    font-weight: bold;
}

#excelId /deep/ tr:nth-child(even) {
    background-color: #f9f9f9;
}
</style>
