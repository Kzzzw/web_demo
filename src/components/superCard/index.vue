<template>
    <div class="btm-card">
        <div :class="[size, 'card-main']" v-for="item in cardList">
            <a-card :hoverable="false" :style="{ width: cardWidth + 'px' }">
                <template #cover>
                    <span
                        class="card-head"
                        :style="{
                            backgroundImage: `url(${cardBg})`,
                            backgroundSize: `${cardWidth}px 102px`
                        }"
                    >
                        <div class="card-name">
                            {{ item.name }}
                            <span v-if="item.sex">
                                <img :src="man" alt="" v-if="item.sex === '1'" />
                                <img :src="lady" alt="" v-if="item.sex === '2'" />
                            </span>
                            <span v-if="item.status">
                                <img :src="onJob" alt="" v-if="item.status === '1'" />
                                <img :src="dimission" alt="" v-if="item.status === '2'"
                            /></span>
                        </div>
                        <div>
                            <span v-if="item.label || item.tag" class="card-label">{{
                                item.label || item.tag
                            }}</span>
                            <span v-if="item.level || item.tag" class="card-label-level">{{
                                item.level || '无'
                            }}</span>
                        </div>
                    </span>
                </template>
                <template #actions>
                    <!-- <SuperTooltip :title="'画像'" key="setting">
                        <icon-font
                            type="icon-chakanxiangqing"
                            @click="newAndEdit(item, '画像')"
                            class="icon-style"
                        />
                    </SuperTooltip> -->
                    <SuperTooltip :title="'编辑'" key="edit">
                        <IconFont
                            icon="icon-xiugai--bianji"
                            @click="newAndEdit(item.id, '编辑', item)"
                            class="icon-style"
                        />
                    </SuperTooltip>
                    <SuperTooltip :title="'删除'" :placement="'right'" key="del">
                        <a-popconfirm
                            :title="`确定要删除'${item.name}'吗?`"
                            @confirm="onDelete(item.id, item)"
                        >
                            <span>
                                <i class="iconfont icon-shanchu delete-btn-icon"></i>
                            </span> </a-popconfirm
                    ></SuperTooltip>
                </template>
                <a-card-meta>
                    <template #avatar>
                        <div class="card-con" :style="{ width: cardWidth + 'px' }">
                            <div :style="{ width: cardDiv + 'px' }">
                                <span class="card-avatar">
                                    <a-avatar :src="icon1" class="card-img" />
                                </span>
                                <span>
                                    <ul>
                                        <li>{{ item.orgLabel }}</li>
                                        <li>
                                            <SuperTooltip
                                                :title="`${item.org || item.userName}`"
                                                :placement="'top'"
                                            >
                                                <span class="card-label-con">
                                                    {{ item.org || item.userName }}</span
                                                >
                                            </SuperTooltip>
                                        </li>
                                    </ul>
                                </span>
                            </div>
                            <div :style="{ width: cardDiv + 'px' }">
                                <span class="card-avatar">
                                    <a-avatar class="card-img" :src="icon2" />
                                </span>
                                <span>
                                    <ul>
                                        <li>{{ item.responseLabel }}</li>
                                        <li>
                                            <!-- {{ item.response }} -->
                                            <SuperTooltip
                                                :title="`${item.response || item.assetsName}`"
                                                :placement="'top'"
                                            >
                                                <span class="card-label-con">
                                                    {{ item.response || item.assetsName }}
                                                </span>
                                            </SuperTooltip>
                                        </li>
                                    </ul>
                                </span>
                            </div>
                            <div :style="{ width: cardDiv + 'px' }">
                                <span class="card-avatar">
                                    <a-avatar class="card-img" :src="icon3" />
                                </span>
                                <span
                                    ><ul>
                                        <li>{{ item.EqualLevelLabel }}</li>
                                        <li>
                                            <SuperTooltip
                                                :title="`${item.EqualLevel || item.orgName}`"
                                                :placement="'top'"
                                            >
                                                <span class="card-label-con">
                                                    {{ item.EqualLevel || item.orgName }}
                                                </span>
                                            </SuperTooltip>
                                        </li>
                                    </ul>
                                </span>
                            </div>
                            <div :style="{ width: cardDiv + 'px' }">
                                <span class="card-avatar">
                                    <a-avatar class="card-img" :src="icon4" />
                                </span>
                                <span>
                                    <ul>
                                        <li>{{ item.SecretLevelLabel }}</li>
                                        <li>
                                            <SuperTooltip
                                                :title="`${item.SecretLevel || item.type}`"
                                                :placement="'top'"
                                            >
                                                <span class="card-label-con">
                                                    {{ item.SecretLevel || item.type }}
                                                </span>
                                            </SuperTooltip>
                                        </li>
                                    </ul>
                                </span>
                            </div>
                        </div>
                    </template>
                </a-card-meta>
            </a-card>
        </div>
        <div class="empty-con" v-if="cardList.length == 0">
            <a-empty />
        </div>
    </div>

    <div class="btm-page" v-if="pagination && cardList && cardList.length > 0">
        <a-pagination
            v-model:current="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            show-quick-jumper
            show-size-changer
            :show-total="(total) => `共 ${total} 条`"
            @change="onChangePage"
        />
    </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import IconFont from '@/components/IconFont/index.vue';
import SuperTooltip from '@/components/superTooltip/index.vue';
import lady from '@/assets/imgs/personnelManage/lady.png';
import man from '@/assets/imgs/personnelManage/man.png';
import dimission from '@/assets/imgs/personnelManage/icon5.png';
import onJob from '@/assets/imgs/personnelManage/icon6.png';
const props = defineProps({
    cardList: {
        type: Array,
        default: () => {
            return [];
        }
    },
    cardBg: { type: String },
    icon1: { type: String },
    icon2: { type: String },
    icon3: { type: String },
    icon4: { type: String },
    sex: { type: String },
    status: { type: String },
    cardWidth: {
        type: Number,
        default: () => {
            return 390;
        }
    },
    type: {
        type: String,
        default: () => {
            return 'default';
        }
    },
    pagination: {
        type: Object
    }
});

const size = computed(() => {
    if (props.type === 'default') {
        return 'card-default';
    } else if (props.type === 'large') {
        return 'card-large';
    } else if (props.type === 'small') {
        return 'card-small';
    } else {
        return 'card-default';
    }
});

const emit = defineEmits(['newAndEdit', 'onDelete', 'cardChangePage']);
/* 编辑/查看 */
const newAndEdit = (id, title, obj) => {
    emit('newAndEdit', { id, title, obj });
};
/* 删除 */
const onDelete = (id, obj) => {
    emit('onDelete', id, obj);
};
const cardDiv = ref(props.cardWidth / 2);
/* 分页 */
const onChangePage = (current, pageSize) => {
    emit('cardChangePage', { current, pageSize });
};
</script>
<style lang="less" scoped>
.btm-card {
    display: flex;
    //justify-content: flex-start;
    //gap: 24px;
    flex-wrap: wrap;
    // width: calc(100% - 200px);
    .card-head {
        height: 102px;
        padding: 20px 0 20px 24px;
        span {
            display: inline-block;
        }
        .card-name {
            height: 24px;
            font-size: 20px;
            font-family: SourceHanSansCN-Bold, SourceHanSansCN;
            font-weight: bold;
            color: #333333;
            line-height: 36px;
        }
        .card-label {
            height: 26px;
            width: 62px;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 4px;
            line-height: 26px;
            margin-top: 14px;
            text-align: center;
            font-size: 14px;
            font-family: SourceHanSansCN-Regular, SourceHanSansCN;
            font-weight: 400;
            color: #ffffff;
            display: inline-block;
        }
        .card-label-level {
            display: inline-block;
            width: 62px;
            height: 26px;
            background: #8b91af;
            text-align: center;
            border-radius: 4px;
            line-height: 26px;
            font-size: 14px;
            font-family: SourceHanSansCN-Regular, SourceHanSansCN;
            font-weight: 400;
            color: #ffffff;
            margin-left: 5px;
        }
    }
    .card-main {
        margin-bottom: 24px;
        margin-right: 24px;
        border-radius: 4px;
        :deep(.ant-card-body) {
            padding: 0;
        }
    }
    .card-default:nth-child(4n) {
        margin-right: 0;
    }
    .card-small:nth-child(3n) {
        margin-right: 0;
    }
    .card-con {
        height: 150px;
        display: flex;
        flex-wrap: wrap;
        margin-left: 24px;
        margin-top: 24px;
        div {
            height: 50px;
            margin-top: 10px;
            display: flex;
        }
        .card-avatar {
            display: inline-block;
            margin: 5px 5px 0px 0px;
        }
        .card-img {
            width: 32px;
            height: 32px;
        }
    }
    ul {
        li:first-of-type {
            font-size: 14px;
            font-family: SourceHanSansCN-Regular, SourceHanSansCN;
            font-weight: 400;
            color: #999999;
            line-height: 21px;
        }
        li:last-of-type {
            font-size: 16px;
            font-family: SourceHanSansCN-Medium, SourceHanSansCN;
            font-weight: 500;
            color: #333333;
            line-height: 24px;
        }
    }
    .icon-style {
        font-size: 16px;
    }
    .card-label-con {
        width: 120px;
        display: inline-block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}
.btm-page {
    height: 80px;
    line-height: 80px;
    float: right;
}
.empty-con {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

@media (max-width: 1900px) {
    .btm-card {
        .card-small:nth-child(3n) {
            margin-right: 24px;
        }
    }
}

@media (max-width: 1660px) {
    .btm-card {
        .card-small {
            margin-right: 100px !important;
        }

        .card-small:nth-child(3n) {
            margin-right: 100px;
        }
        .card-small:nth-child(2n) {
            margin-right: 0px !important;
        }
        .card-default {
            margin-right: 36px !important;
        }
        .card-default:nth-child(4n) {
            margin-right: 36px;
        }
        .card-default:nth-child(3n) {
            margin-right: 0px !important;
        }
    }
}
</style>
