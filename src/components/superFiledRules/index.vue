<template>
    <div class="rules-container">
        <span @click="isent = !isent">
            <span v-if="isent == true">
                <CaretDownOutlined />
            </span>
            <span v-else><CaretRightOutlined /></span>
        </span>

        <span v-if="formState.filterList.rulesName">
            <a-space align="center">
                <a-form-item
                    :name="['filterList', 'rulesName']"
                    :rules="{
                        required: true,
                        message: '请选择'
                    }"
                >
                    <a-select
                        :options="JudgmentSymbol"
                        class="input-field"
                        v-model:value="formState.filterList.rulesName"
                    >
                    </a-select>
                </a-form-item>
                <!-- <a-button
                    class="rules-btn"
                    type="link"
                    @click="addFilter(formState.filterList.filterRules?.length)"
                >
                    字段过滤
                </a-button> -->
                <a-tag
                    class="rules-btn"
                    color="blue"
                    @click="addFilter(formState.filterList.filterRules?.length)"
                    >字段过滤
                </a-tag>
            </a-space>
        </span>
        <div
            v-for="(rule, index) in formState.filterList.filterRules"
            :key="index"
            class="filterFiled"
            v-if="isent == true"
        >
            <a-space align="center">
                <a-form-item
                    :name="['filterList', 'filterRules', index, 'filedName']"
                    :rules="{
                        required: true,
                        message: 'Missing sight'
                    }"
                >
                    <a-select
                        :options="filedNameList"
                        class="input-field"
                        v-model:value="rule.filedName"
                        @change="(val, filed) => changeFiledName(val, filed, index)"
                    >
                    </a-select
                ></a-form-item>
                <a-form-item
                    :name="['filterList', 'filterRules', index, 'judgmentField']"
                    :rules="{
                        required: true,
                        message: '请选择'
                    }"
                >
                    <a-select
                        :options="JudgmentSymbol"
                        class="input-field"
                        v-model:value="rule.judgmentField"
                    >
                    </a-select
                ></a-form-item>
                <a-form-item
                    :name="['filterList', 'filterRules', index, 'filedValue']"
                    :rules="{
                        required: true,
                        message: '请输入'
                    }"
                >
                    <a-select
                        :options="JudgmentSymbol"
                        class="input-field"
                        v-model:value="rule.filedValue"
                        placeholder="请选择"
                        v-if="rule.filedType == 'select'"
                    >
                    </a-select>
                    <a-input
                        :options="JudgmentSymbol"
                        class="input-field"
                        v-model:value="rule.filedValue"
                        placeholder="请输入"
                        v-if="rule.filedType == 'string'" />
                    <a-date-picker
                        show-time
                        placeholder="时间"
                        @change="(val, dateString) => onChange(val, dateString, index)"
                        v-model:value="rule.filedValue"
                        class="input-field"
                        @ok="onOk"
                        v-if="rule.filedType == 'time'"
                /></a-form-item>
                <span class="add-icon" @click="delTopic(index, 'brokerList', 'broker')">
                    <DeleteOutlined />
                </span>
            </a-space>
        </div>
    </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import {
    DeleteOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    CaretRightOutlined
} from '@ant-design/icons-vue';
const props = defineProps({
    formState: {
        type: Object
    },
    filedNameList: {
        type: Array
    }
});

const JudgmentSymbol = ref([
    { label: 'AND', value: 'AND' },
    { label: 'OR', value: 'OR' },
    { label: 'NOT', value: 'NOT' }
]);
const isent = ref(false);
const filedType = ref('');
const fieldTime = ref('');
const open = ref(false);
// const open = computed(() => {
//     return props.formState.filterList.filterRules?.length > 0;
// });
watch(props.formState.filterList.filterRules, () => {
    if (props.formState.filterList.filterRules.length == 0) {
        isent.value = false;
    }
});

const emits = defineEmits(['addFilter', 'delFilter', 'changeFiledName']);
const delTopic = (index) => {
    emits('delFilter', { index: index });
};
const addFilter = (index) => {
    isent.value = true;
    emits('addFilter', { index: index });
};
const changeFiledName = (value, filedValue, index) => {
    emits('changeFiledName', { filedValue, index, type: 'field' });
};
const onChange = (val, filedValue, index) => {
    fieldTime.value = filedValue;
    // emits('changeFiledName', { filedValue, index, type: 'date' });
};
const onOk = (val, filedValue, index) => {
    emits('changeFiledName', { filedValue: fieldTime.value, index, type: 'date' });
};
</script>
<style lang="less" scoped>
.rules-container {
    padding: 10px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    min-height: 50px;
    // line-height: 50px;
    :deep(.ant-form-item) {
        margin-bottom: 0;
    }
    :deep(.ant-space-align-center) {
        height: 40px;
        line-height: 40px;
    }
    :deep(.ant-select-selector) {
        border-radius: 5px !important;
    }
    // ant-select-selection-search-input
    :deep(.ant-input) {
        border-radius: 5px;
    }
}
.rules-btn {
    // display: inline-block;
    /* color: aqua; */
    padding: 3px;
    cursor: pointer;
    /* margin-left: 10px; */
    /* height: 30px; */
    /* margin-bottom: 20px; */
    /* border: 1px solid #ccc; */
    // background-color: rgba(12, 123, 12, 0.3);
}
/* .rules-btn:hover {
    // background-color: rgba(12, 123, 12, 0.3);
    // color: #d7ddf1;
} */
.filterFiled {
    padding-left: 15px;
}
.add-icon {
    /* height: 45px;
    margin-bottom: 20px; */
    display: inline-block;
}
.input-field {
    width: 130px !important;
    display: inline-block;
}
</style>
