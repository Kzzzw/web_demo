<script setup>
const $props = defineProps({
  okText: { default: '确定' },
  cancelText: { default: '取消' },
});

</script>

<template>
  <a-modal
      wrap-class-name="___ant-modal-custom"

  >
    <template #okText>
      <span>{{ okText }}</span>
    </template>
    <template #cancelText>
      <span>{{ cancelText }}</span>
    </template>
    <template v-if="$slots.title" #title>
      <slot name="title"></slot>
    </template>
    <slot/>
    <template v-if="$slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </a-modal>
</template>

<style lang="less">
.___ant-modal-custom.___ant-modal-custom.___ant-modal-custom.___ant-modal-custom.___ant-modal-custom.___ant-modal-custom.___ant-modal-custom.___ant-modal-custom {

  .ant-modal-content {
    box-shadow: 0 8px 20px 0 rgba(15, 17, 20, 0.1);
  }

  .ant-modal-close-x {
    width: 64px;
    height: 72px;
    line-height: 72px;
    color: #868d9c;

    .anticon {
      font-size: 14px;
    }
  }

  .ant-modal-header {
    margin-right: 64px;
    padding: 24px 0;
    border: none;

    .ant-modal-title {
      line-height: 24px;
      font-family: Source Han Sans, Source Han Sans;
      font-weight: 700;
      font-size: 16px;
      color: #101219;
    }
  }

  .ant-modal-body {
    padding: 0 24px;
  }

  .ant-modal-footer {
    padding: 24px;

    .ant-btn {
      padding: 4px 15px;

      & + .ant-btn:not(.ant-dropdown-trigger) {
        margin-left: 12px;
      }

      &.ant-btn.ant-btn.ant-btn {
        &.ant-btn-two-chinese-chars::first-letter {
          letter-spacing: 0;
        }

        &.ant-btn-two-chinese-chars > *:not(.anticon) {
          margin-right: 0;
          letter-spacing: 0;
        }
      }
    }
  }

}
</style>
