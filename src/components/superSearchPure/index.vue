<template>
    <div class="search-box">
        <div class="search-left">
            <div class="search-btn">
                <a-button
                    type="primary"
                    @click="newAndEdit(null, '新增')"
                    class="add-items"
                    v-if="isAddBtn"
                >
                    新增
                </a-button>
                <span v-if="isBatchBtn">
                    <a-dropdown v-if="batchBtns.length">
                        <template #overlay>
                            <a-menu @click="handleMenuClick">
                                <a-menu-item v-for="bat in batchBtns" :key="bat.value">
                                    {{ bat.label }}
                                </a-menu-item>
                            </a-menu>
                        </template>
                        <a-button>
                            批量操作
                            <DownOutlined />
                        </a-button>
                    </a-dropdown>
                </span>
                <slot name="extra"></slot>
            </div>

            <div class="search-right">
                <a-form :model="alwaysShowData" ref="formRefAlways">
                    <span v-for="list in columns">
                        <a-form-item
                            v-if="list?.search?.alwaysShow == true && list?.isShow == false"
                        >
                            <a-input-search
                                v-model:value="alwaysShowData[list?.search?.key]"
                                :placeholder="seaPlaceholder"
                                style="width: 300px"
                                allowClear
                                @search="searchAlways"
                            />
                        </a-form-item>
                    </span>
                </a-form>
                <a-input-group compact>
                    <a-button @click="resetList">
                        <i class="iconfont icon-zhongzhi"></i>
                    </a-button>
                    <a-button @click="toggleList" v-if="isToggleBtn">
                        <i class="iconfont icon-liebiao"></i>
                        <i class="iconfont icon-zhankai" v-if="isToggle == true"></i>
                        <i class="iconfont icon-zhankai1" v-else></i>
                    </a-button>
                    <a-button @click="openSearch" v-if="isFilterBtn">
                        <i class="iconfont icon-shaixuanshouqi" v-if="isSearch == true"></i>
                        <i class="iconfont icon-shaixuan" v-if="isSearch == false"></i>
                    </a-button>
                </a-input-group>
            </div>
        </div>
        <a-row class="middle-block-narrow" v-if="baseDataAlways.length > 0">
            <a-col class="rule-list-container">
                <div class="search-field" v-for="(item, index) in baseDataAlways">
                    <span class="condition">
                        {{ item.title }}&nbsp;&nbsp;包含“{{ item.value }}”
                    </span>
                    <span class="delete-icon" @click="deleteSearchList(index)">
                        <i class="iconfont icon-guanbi"></i>
                    </span>
                </div>
            </a-col>
            <span class="clean-btn" @click="cleanList">清空</span>
        </a-row>
        <!-- </div> -->
        <div v-show="isSearch == true && isToggle === false" class="search-items">
            <a-form :model="searchData" ref="formRef" :colon="false">
                <a-row :gutter="[2]">
                    <a-col span="8" v-for="item of listArray" class="search-con">
                        <a-form-item class="input-item" :label="item.title" labelAlign="left">
                            <component
                                :is="item?.component"
                                v-model:value="searchData[item?.search?.key]"
                                :locale="locale"
                                :placeholder="item?.placeholder"
                                :fieldNames="item.search?.fieldNames"
                                :showSearch="item?.showSearch"
                                :ranges="
                                    item.search?.props?.defaultValue
                                        ? item.search?.props?.defaultValue
                                        : undefined
                                "
                                :min="item?.name === 'inputNumber' ? item?.min : undefined"
                                :max="item?.name === 'inputNumber' ? item?.max : undefined"
                                :options="item.search?.enum || item?.treeSelect"
                                :tree-data="item?.name === 'treeSelect' ? item?.treeSelect : []"
                                allowClear
                                :format="item?.lableFormat"
                                :value-format="item.search?.props?.format || 'YYYY-MM-DD HH:mm:ss'"
                                :picker="item?.picker"
                                :showTime="item.search?.props?.showTime"
                                :style="selectStyle"
                                :defaultValue="
                                    item.search?.enum ? item.search?.defaultValue : undefined
                                "
                                class="custom-select"
                                @change="(e) => handleSelectChange(e, item.search?.key)"
                            >
                            </component>
                        </a-form-item>
                    </a-col>
                </a-row>
                <div class="filter-btn">
                    <a-button type="primary" @click="searchFilter">过滤</a-button>
                </div>
            </a-form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, shallowRef, onMounted, reactive, toRaw, nextTick, watch } from 'vue';
import {
    InputNumber,
    Input,
    Select,
    TimePicker,
    TimeRangePicker,
    DatePicker,
    RangePicker,
    Cascader,
    TreeSelect,
} from 'ant-design-vue';
import { UserOutlined, DownOutlined } from '@ant-design/icons-vue';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import { findListLabel1 } from '@/utils/tool';
// import { axiosPost, axiosGet } from '@/utils/axios.js';
const props = defineProps({
    // 数据类型参考 demoColumn
    columns: {
        type: Array,
        default: () => [],
    },
    alwaysShowList: {
        type: Array,
        default: () => [],
    },
    isAddBtn: {
        type: Boolean,
        default: () => true,
    },
    isBatchBtn: {
        type: Boolean,
        default: () => true,
    },
    isFilterBtn: {
        type: Boolean,
        default: () => true,
    },
    isToggleBtn: {
        type: Boolean,
        default: () => false,
    },
    seaPlaceholder: {
        type: String,
        default: '请输入内容',
    },
    batchBtns: {
        type: Array,
        default: [
            {
                label: '批量删除',
                value: '1',
            },
        ],
    },
});
const emit = defineEmits(['update', 'add', 'reset', 'batch', 'selectChange', 'toggle']);
dayjs.locale('zh-cn');
const formRef = ref();
const formRefAlways = ref();
const searchData = ref({});
const alwaysShowData = reactive({});
const columnList = ref([]);
const listArray = ref([]);
const isSearch = ref(false); /* 是否搜索 */
const isToggle = ref(false);
const baseDataAlways = ref([]);
const enumList = ref([]);

// 不要删有枚举值时的使用示例
const demoColumn = [
    {
        title: '安全防护能力',
        dataIndex: 'safeSecurityType',
        align: 'left',
        // 选择框枚举值
        enum: [
            { label: '数据库账号', value: '1' },
            { label: '主机账号', value: '2' },
            { label: '应用账号', value: '3' },
        ],
        search: {
            el: 'select',
            key: 'safeSecurityType',
            props: { allowClear: true },
            alwaysShow: true,
        },
        width: 200,
    },
    {
        title: '所属组织',
        dataIndex: 'orgId',
        // 枚举类型，当枚举类型为 interface 时调用 enumFn 获取枚举值
        // 前端存储的数据不需要设置
        enumType: 'interface',
        // 枚举函数, promise 类型, 需要将干净的 list 数据返回
        enumFn: '',
        search: {
            // 控件类型
            el: 'treeSelect',
            key: 'orgId',
            props: { allowClear: true },
            alwaysShow: true,
            fieldNames: {
                label: 'name',
                value: 'id',
                children: 'children',
            },
        },
        align: 'left',
        width: 200,
    },
];

const createSearchWidth = () => {
    let sty = {
        width: `284px`,
    };
    return sty;
};
const openSearch = async () => {
    isSearch.value = !isSearch.value;
};

const selectStyle = reactive({
    width: '100%',
    height: '40px',
    lineHeight: '40px',
});
/* 头部搜索 */
const searchAlways = () => {
    isSearch.value = false;
    getSearchCon(alwaysShowData);
    searchList(alwaysShowData);
};
/* 底部过滤 */
const searchFilter = () => {
    isSearch.value = false;
    getSearchCon(searchData.value);
    searchList(searchData.value);
};
// 数据扁平化
let dataList = [];
const generateList = (data, key) => {
    for (let i = 0; i < data.length; i++) {
        let node = data[i];
        let clean = {
            [key.label]: node[key.label],
            [key.value]: node[key.value],
        };
        if (node.hasOwnProperty('children')) {
            generateList(node.children, key);
        }
        dataList.push(clean);
    }
};
const getSearchCon = (search) => {
    let data = listArray.value;
    let arr = [];
    data?.map((item) => {
        let newObj = {};
        for (let key in search) {
            if (key === item.search?.key) {
                if (search[key] || search[key] === 0) {
                    newObj.valueKey = search[key];
                    newObj.title = item.title;
                    let lab = {
                        label: item.search.fieldNames?.label
                            ? item.search.fieldNames.label
                            : 'label',
                        value: item.search.fieldNames?.value
                            ? item.search.fieldNames.value
                            : 'value',
                    };
                    if (item.treeSelect) {
                        if (item.treeSelect[0].children) {
                            generateList(item.treeSelect, lab);
                        } else {
                            dataList = [];
                        }
                        newObj.value = findListLabel1(
                            dataList.length > 0 ? dataList : item.treeSelect,
                            search[key],
                            lab,
                        );
                    } else {
                        newObj.value = search[key];
                    }
                    arr.push(newObj);
                }
            }
        }
    });
    baseDataAlways.value = arr;
};

/* 新增数据 */
const newAndEdit = () => {
    emit('add');
};
/* 搜索数据 */
const searchList = (data) => {
    let list = {};
    Object.assign(list, data);
    props.columns?.map((item, crr) => {
        if (
            list[item?.search?.key] &&
            list[item.search?.key]?.length > 0 &&
            ['timeRangePicker', 'dateRangePicker'].includes(item?.search?.el)
        ) {
            list[item?.search?.props?.startTime] = list[item.search?.key][0];
            list[item?.search?.props?.endTime] = list[item.search?.key][1];
            delete list[item?.search?.key];
        }
    });
    emit('update', list);
};
/* 重置数据 */
const resetList = () => {
    isSearch.value = false;
    props.columns.map((item) => {
        if (item?.search?.alwaysShow == true && item.isShow === false) {
            alwaysShowData[item?.search?.key] = '';
        }
    });
    listArray.value.map((item) => {
        if (['TimeRangePicker', 'dateRangePicker'].includes(item?.search?.el)) {
            searchData.value[item?.search?.key] = null;
        } else {
            searchData.value[item?.search?.key] = '';
        }
    });
    baseDataAlways.value = [];
    emit('reset');
};
/* 批量操作 */
const handleMenuClick = (key) => {
    emit('batch', key);
};
const handleSelectChange = (val, type) => {
    emit('selectChange', val, type);
};
/* 切换列表 */
const toggleList = () => {
    isToggle.value = !isToggle.value;
    emit('toggle');
};

// 设置不同组件
const setComponent = (name) => {
    let component = null;
    switch (name) {
        case 'inputNumber':
            component = InputNumber;
            break;
        case 'input':
            component = Input;
            break;
        case 'select':
            component = Select;
            break;
        case 'treeSelect':
            component = TreeSelect;
            break;
        case 'timePicker':
            component = TimePicker;
            break;
        case 'timeRangePicker':
            component = TimeRangePicker;
            break;
        case 'datePicker':
            component = DatePicker;
            break;
        case 'dateRangePicker':
            component = RangePicker;
            break;
        case 'cascader':
            component = Cascader;
            break;
    }
    return component;
};

const getSearchList = async (list) => {
    let arr = [];
    for (const [index, item] of list.entries()) {
        if (item?.search && item?.isShow !== false && item.search?.alwaysShow) {
            let data = {
                ...item,
                name: item?.search?.el, // 组件名称
                component: shallowRef(setComponent(item?.search?.el)), // 绑定不同组件
                index: index, // 组件序号
                isShow: item.isShow ?? true,
            };
            let tr = [];
            if (data.enumType === 'interface') {
                tr = await data.enumFn();
                data.treeSelect = tr;
            } else {
                data.treeSelect = item.search?.enum;
            }
            arr.push(data); // 按顺序推入数组
        }
    }

    setTimeout(() => {
        listArray.value = arr;
    }, 1000);
};

/* 删除搜索项 */
const deleteSearchList = (index) => {
    let list = baseDataAlways.value;
    list.splice(index, 1);
    baseDataAlways.value = list;
    let obj = cleanSearchData(baseDataAlways.value);
    if (Object.keys(obj).length === 0) cleanAll();
    else searchData.value = obj;
    searchList(obj);
};
/* 清空选择项 */
const cleanList = () => {
    isSearch.value = false;
    baseDataAlways.value = [];
    let obj = cleanSearchData(baseDataAlways.value);
    cleanAll();
    searchList(obj);
};
/* 清洗搜索项 */
const cleanSearchData = (data = []) => {
    let search = props.columns;
    let obj = data.reduce((acc, curr) => {
        const matchingItem = search.find((item) => item.title === curr.title);
        if (matchingItem) {
            acc[matchingItem.search.key] = curr.valueKey;
        }
        return acc;
    }, {});
    return obj;
};
/* 清空选择数据 */
const cleanAll = () => {
    let obj = {};
    let data = {};
    props.columns.map((item) => {
        if (item?.search?.alwaysShow == true && item.isShow !== false) {
            if (['timeRangePicker', 'dateRangePicker'].includes(item?.search?.el)) {
                obj[item?.search?.key] = null;
            } else {
                obj[item?.search?.key] = '';
            }
        } else if (item?.search?.alwaysShow == true && item.isShow == false) {
            data[item.search?.key] = '';
        }
        Object.assign(searchData.value, obj);
        Object.assign(alwaysShowData, data);
    });
};
watch(
    () => props.columns,
    () => {
        if (props.columns && props.columns.length > 0) {
            columnList.value = props.columns;
            getSearchList(columnList.value);
        }
    },
    { immediate: true },
);
watch(
    () => props.isToggleBtn,
    (newValue) => {
        if (newValue == false) {
            isToggle.value = true;
        }
    },
    { immediate: true },
);
defineExpose({ isToggle: isToggle.value, resetList });
</script>

<style lang="less" scoped>
@import './search';
:deep(.ant-form-item-label) {
    /* 设置 label 的样式 */
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 154px;
    /* 设置边框和背景色 */
    text-align: right;
    border-radius: 4px 0px 0px 4px !important;
    border-right: none;
    label {
        font-size: 14px;
        font-family: SourceHanSansCN-Regular, SourceHanSansCN;
        font-weight: 400;
        color: #666666;
    }
}
</style>
