<template>
    <div id="app">
        <RouterView />
        <Disclaimer v-if="!isLyricsRoute" />
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Disclaimer from '@/components/Disclaimer.vue';
import { MoeAuthStore } from '@/stores/store';

const route = useRoute();
const isLyricsRoute = computed(() => route.path === '/lyrics');

onMounted(async () => {
    const MoeAuth = MoeAuthStore();
    await MoeAuth.initDevice();
});
</script>

<style scoped>
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}
</style>
