<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineOptions({
    name:'SuperOptionsPure'
})

const props = defineProps({
    alignType:{
        type: String,
        default: 'center'
    },
    btnStyle: {
      type: Object,
      default: {}
    }
})

const visible=ref(false)
const clickFn=(event)=>{
    // 阻止事件冒泡，避免触发父级的点击事件
    event.stopPropagation();
    visible.value=false
}
const open=(event)=>{
    // 阻止事件冒泡，避免触发父级的点击事件
    event.stopPropagation();
    visible.value=!visible.value
}

onMounted(() => {
    document.addEventListener('click', clickFn)
})

onUnmounted(() => {
    document.removeEventListener('click', clickFn)
})
</script>

<template>
<div class="superOptionsPure" :class="`superOptionsPure_${alignType}`">
    <a-popconfirm v-model:open="visible" placement="leftTop"  overlayClassName="confirm_option" :showCancel="false" :okButton="false" >
        <template #icon></template>
        <template #okButton></template>
        <template #title>
            <div class="button_container" :style="btnStyle" @click="(event) => clickFn(event)">
                <slot></slot>
            </div>
        </template>
        <span class="content" @click="(event) => open(event)">...</span>
    </a-popconfirm>

</div>
</template>

<style scoped lang="less">
.superOptionsPure{
    //width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    .content{
        height: 20px;
        //min-width: 50px;
        font-size: 16px;
        font-weight: bold;
        margin-top: -5px;
        color: rgba(50, 55, 74, 0.50);
        cursor: pointer;
        &:hover{
            color: rgba(89, 131, 255, 1);
        }

    }
}
.superOptionsPure_center{
    justify-content: center;
}
.superOptionsPure_left{
    justify-content: left;
}
.superOptionsPure_right{
    justify-content: right;
}
</style>
<style lang="less">
.confirm_option{
    .ant-popover-message-title{
        padding-left: 0;
    }
    .ant-popover-message{
        padding-bottom: 0;
    }
    .ant-popover-inner-content{
        padding: 5px;
    }
    .button_container{
        width: 80px;
        display: flex;
        flex-wrap: wrap;
        div{
            width: 100%;
            height: 30px;
            line-height: 30px;
            text-align: center;
            &:hover{
                cursor: pointer;
                background: rgba(245, 246, 247, 1);
            }
        }
    }
}
.default_confirm{
    .ant-popover-message-title{
        padding-left: 22px!important;
    }
    .ant-popover-message{
        padding-bottom: 12px!important;
    }
    .ant-popover-inner-content{
        padding: 12px  16px!important;
    }
}
</style>
