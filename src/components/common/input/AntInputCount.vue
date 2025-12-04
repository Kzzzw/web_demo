<script setup>
import { computed } from 'vue';

const $props = defineProps({
  value: { default: null },
  max: { type: Number, default: Infinity },
});
const length = computed(() => $props.value?.length || 0);
</script>
<template>
<span class="ant-input-suffix ant-input-suffix-custom">
  <span
      class="ant-input-show-count-suffix"
      style="font-size: 12px;"
      :style="{ color: length > max ? 'var(--ant-error-color)' : ''}"
  >
    {{ length }}{{ max === Infinity ? '' : `/${ max }` }}
  </span>
</span>
</template>
<style scoped lang="less">
textarea.ant-input, .ant-input-affix-wrapper.ant-input-affix-wrapper-textarea-with-clear-btn {
  & + .ant-input-suffix.ant-input-suffix-custom {
    margin: 1px 0 0 0;
    display: flex;
    position: absolute;
    z-index: 1;
    bottom: 2px;
    right: 11px;
    width: fit-content;

    .ant-input-show-count-suffix {
      background-color: rgba(255, 255, 255, .9);
    }
  }
}
</style>


<style lang="less">
textarea.ant-input.ant-input {
  padding-bottom: 16px;
}

.ant-input-affix-wrapper.ant-input-affix-wrapper-textarea-with-clear-btn {
  & > textarea {
    padding-bottom: 16px;
  }
}
</style>
