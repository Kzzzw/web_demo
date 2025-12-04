<template>
    <div style="border: 1px solid #ccc">
        <Toolbar
            style="border-bottom: 1px solid #ccc"
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            :mode="mode"
        />
        <Editor
            style="height: 350px; overflow-y: hidden"
            v-model="valueHtml"
            :defaultConfig="editorConfig"
            :mode="mode"
            @onCreated="handleCreated"
        />
    </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'; // 引入 css

import axios from 'axios';
import { message } from 'ant-design-vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
// import { getUploadFileApi } from '@/api/safeControl/knowledgeBase.js';
// const { VITE_APP_QINIU_TOKEN, VITE_APP_QINIUDOAMIN } = import.meta.env;

import { watch, onBeforeUnmount, ref, shallowRef, onMounted } from 'vue';

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();
const props = defineProps({ content: '' });
const emit = defineEmits(['update:content']);
// 内容 HTML
const valueHtml = ref(props.content);
const mode = 'default';
// 模拟 ajax 异步获取内容
onMounted(() => {
    valueHtml.value = '';
});

// 上传数据
watch(
    () => valueHtml.value,
    (val) => {
        emit('update:content', val);
    },
    {
        deep: true
    }
);
const fileToken = localStorage.token;
// 工具栏配置
const toolbarConfig = {
    toolbarKeys: [
        // 菜单 key
        'headerSelect',
        'bold', // 加粗
        'italic', // 斜体
        'through', // 删除线
        'underline', // 下划线
        'bulletedList', // 无序列表
        'numberedList', // 有序列表
        'color', // 文字色彩
        'insertLink', // 插入链接
        'fontSize', // 字体大小
        'lineHeight', // 行高
        'uploadImage', // 上传图片
        'delIndent', // 缩进
        'indent', // 增进
        'deleteImage', //删除图片
        'divider', // 分割线
        'insertTable', // 插入表格
        'justifyCenter', // 居中对齐
        'justifyJustify', // 两端对齐
        'justifyLeft', // 左对齐
        'justifyRight', // 右对齐
        'undo', // 撤销
        'redo', // 重做
        'clearStyle' // 革除格局
        // 'fullScreen' // 全屏
    ]
};

const editorConfig = {
    placeholder: '请输出内容...', // 配置默认提醒
    // readOnly: true,
    MENU_CONF: {
        // 配置上传服务器地址
        uploadImage: {
            // 小于该值就插入 base64 格局（而不上传），默认为 0
            /*  base64LimitSize: 5 * 1024, // 5kb
            // 单个文件的最大体积限度，默认为 2M
            maxFileSize: 2 * 1024 * 1024, // 1M
            // // 最多可上传几个文件，默认为 100
            maxNumberOfFiles: 5,
            // 抉择文件时的类型限度，默认为 ['image/*'] 。如不想限度，则设置为 []
            allowedFileTypes: ['image/*'],
            // 后端接收的文件名称
            fieldName: 'file', */
            // 自定义上传
            // 自定义上传
            async customUpload(file, insertFn) {
                // file 即选中的文件
                console.log('自定义上传', file);

                // 自己实现上传，并得到图片 url alt href
                const formData = new FormData();
                formData.append('file', file, file?.name);
                formData.append('scene', 'avatar');
                // 上传接口
                // const res = await getUploadFileApi(formData);
                // 最后插入图片
                // insertFn(res.data, 'image', res.data);
            }
            /* 
            meta: {
                token: fileToken
            },
            // 将 meta 拼接到 url 参数中，默认 false
            metaWithUrl: true */
        }
    }
};
// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value;
    if (editor == null) return;
    editor.destroy();
});

const handleCreated = (editor) => {
    editorRef.value = editor; // 记录 editor 实例，重要！
};
</script>

<style lang="scss" scoped></style>
