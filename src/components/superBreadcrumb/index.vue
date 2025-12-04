<template>
    <a-breadcrumb :routes="routes" :separator="separator" class="super-breadcrumb">
        <template #itemRender="{ route, params, routes, paths }">
            <span v-if="routes.indexOf(route) === routes.length - 1">
                {{ route.breadcrumbName }}
            </span>
            <router-link v-else :to="paths.join('/')">{{ route.breadcrumbName }}</router-link>
        </template>
    </a-breadcrumb>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
defineProps({
    separator: {
        type: String,
        default: '/'
    }
});

const route = useRoute();

const routes = computed(() => {
    const routes = [];
    const matched = route.matched;
    let path = '';
    matched.forEach((route) => {
        if (route.meta.isBreadcrumb !== false) {
            path = `${path}/${route.path}`;
            routes.push({
                path,
                breadcrumbName: route.meta.title || route.path
            });
        }
    });
    return routes;
});
</script>

<style>
.super-breadcrumb {
    margin-bottom: 24px;
}
</style>
