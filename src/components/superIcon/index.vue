<script setup>
import { computed } from 'vue'
import * as IconMap from '@ant-design/icons-vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const IconComponent = computed(() => {
  return IconMap[props.name]
})
</script>

<template>
  <component :is="IconComponent" v-bind="$attrs" />
</template>
