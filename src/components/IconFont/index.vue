<template>
  <i :class="['iconfont', icon]" :style="iconStyle"></i>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  size: {
    type: [String, Number],
    default: 16,
  },
  color: {
    type: String,
    default: '',
  },
})

const iconStyle = computed(() => {
  const style = {}
  if (props.size) {
    style.fontSize = typeof props.size === 'number' ? `${props.size}px` : props.size
  }
  if (props.color) {
    style.color = props.color
  }
  return style
})
</script>
