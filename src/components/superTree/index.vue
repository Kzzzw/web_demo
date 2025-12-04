<template>
    <div>
        <a-input-search v-if="showSearch" placeholder="请输入内容" @search="onSearch" allowClear />
        <div :class="['department-tree', largeTreeCls]">
            <a-tree
                :tree-data="branchData"
                :expanded-keys="expandedKeys"
                :auto-expand-parent="autoExpandParent"
                @expand="onExpand"
                @select="handleSelect"
                showIcon
            >
                <template #title="node">
                    <span class="title-parent">
                        <SuperTooltip :title="node.title">
                            <span class="title">
                                <span v-if="node.title?.indexOf(searchValue) > -1">
                                    {{ node.title.substr(0, node.title?.indexOf(searchValue)) }}
                                    <span style="color: #f50"> {{ searchValue }}</span>
                                    {{
                                        node.title.substr(
                                            node.title?.indexOf(searchValue) + searchValue.length,
                                        )
                                    }}
                                </span>
                                <span v-else>{{ node.title }}</span>
                            </span>
                        </SuperTooltip>
                        <span
                            v-if="node.key !== treeRootId && showActions"
                            style="float: right; margin-right: 10px"
                        >
                            <SuperTooltip :title="'删除'">
                                <a-popconfirm
                                    :title="`确定要删除'${node.title}'吗?`"
                                    @confirm="(e) => deleteNode(e, node.key)"
                                >
                                    <IconFont icon="icon-shanchu2" class="icon-style" />
                                </a-popconfirm>
                            </SuperTooltip>
                        </span>
                        <span
                            v-if="showActions"
                            @click="(e) => editNode(e, node)"
                            style="float: right; margin-right: 10px"
                        >
                            <SuperTooltip :title="'编辑'">
                                <IconFont icon="icon-bianji2" class="icon-style" />
                            </SuperTooltip>
                        </span>
                        <span
                            v-if="showActions"
                            @click="(e) => addNode(e, node)"
                            style="float: right; margin-right: 10px"
                        >
                            <SuperTooltip :title="'新增'">
                                <IconFont icon="icon-a-" class="icon-style" />
                            </SuperTooltip>
                        </span>
                    </span>
                </template>
            </a-tree>
        </div>
    </div>
</template>
<script setup>
import { watch, ref, reactive } from 'vue';
const props = defineProps({
    list: Array,
    width: {
        type: String,
        default: () => {
            return '240px';
        },
    },
    showSearch: {
        type: Boolean,
        default: true,
    },
    treeRootId: {
        type: [String, Number],
    },
    defaultExpand: {
        type: Array,
        default: [],
    },
    titleWidth: {
        type: String,
        default: () => {
            return '80px';
        },
    },
    showActions: {
        type: Boolean,
        default: true,
    },
    largeTreeCls: {
        type: String,
        default: '',
    },
});

/* 获取方法 */
const emit = defineEmits(['delete', 'edit', 'new', 'select']);
const branchData = ref(props.list);
// 展开的key
const expandedKeys = ref(props.defaultExpand);
// 搜索关键字
const searchValue = ref('');
// 是否展开树
const autoExpandParent = ref(true);

const branchParam = reactive({
    NodeTitle: '',
    id: null,
    visible: false,
});
/* 部门搜索 */
const onSearch = (value) => {
    searchValue.value = value;
};
// 展开收起触发
const onExpand = (keys) => {
    expandedKeys.value = keys;
    autoExpandParent.value = false;
};

const handleSelect = (selectedKeys, e) => {
    emit('select', { key: e.node.key, title: e.node.title, event: e });
};

// antd 组件方法 获取父级节点key
const getParentKey = (key, tree) => {
    let parentKey;
    for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
            if (node.children.some((item) => item.key === key)) {
                parentKey = node.key;
            } else if (getParentKey(key, node.children)) {
                parentKey = getParentKey(key, node.children);
            }
        }
    }
    return parentKey;
};

/**
 * 编辑节点
 * @param e
 * @param node
 */
const editNode = (e, node) => {
    e.stopPropagation();
    Object.assign(branchParam, {
        id: node.id,
        NodeTitle: '编辑',
        visible: true,
        ...node,
    });
    emit('edit', branchParam);
};

/**
 * 新增节点
 * @param e
 * @param node
 */
const addNode = (e, node) => {
    e.stopPropagation();
    Object.assign(branchParam, {
        id: node.id,
        NodeTitle: '新增',
        visible: true,
        ...node,
    });
    emit('new', branchParam);
};

/**
 * 删除节点
 * @param e
 * @param id
 */
const deleteNode = (e, id) => {
    e.stopPropagation();
    emit('delete', id);
};

/* 数据扁平化， */
const dataList = ref([]);
const generateList = (data) => {
    for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const key = node.key;
        const title = node.title;
        dataList.value.push({
            key,
            title,
        });
        if (node.children) {
            generateList(node.children);
        }
    }
};

// 搜索事件
watch(searchValue, (value) => {
    if (!value) {
        autoExpandParent.value = false;
        expandedKeys.value = [];
        return;
    }
    const expanded = dataList.value
        ?.map((item) => {
            if (item?.title) {
                if (item?.title.indexOf(value) > -1) {
                    return getParentKey(item.key, branchData.value);
                }
            }

            return null;
        })
        .filter((item, i, self) => item && self.indexOf(item) === i);
    expandedKeys.value = expanded;
    searchValue.value = value;
    autoExpandParent.value = true;
});

// 当更新节点的时候，重新渲染树结构
watch(
    () => props.list,
    (value) => {
        branchData.value = value;
        generateList(value);
    },
    { immediate: true },
);
</script>
<style lang="less" scoped>
.department-tree {
    margin-top: 20px;
    margin-bottom: 20px;

    .icon-style {
        font-size: 16px;
    }
    :deep(.ant-tree-treenode) {
        width: v-bind('props.width');
        position: relative;
        .ant-tree-node-content-wrapper {
            flex: 1;
            line-height: 25px;
            height: 25px;
        }
    }
    .title {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        width: v-bind('props.titleWidth');
        display: inline-block;
    }
}

.large-tree {
    height: calc(100vh - 240px);
    overflow: auto;
}

.left-title {
    font-size: 16px;
    padding-bottom: 20px;
    font-weight: bold;
}

.disable-bubble {
    pointer-events: none;
}
</style>
