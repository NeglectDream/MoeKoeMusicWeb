<template>
    <div v-if="showUpdateDialog" class="modal-overlay" @click="closeUpdateDialog">
        <div class="modal-content update-dialog" @click.stop>
            <h2>发现新版本 V{{ latestVersion }}</h2>
            <MarkdownContent class="update-log-box" :content="updateLog" :repo-url="projectRepoUrl" />
            <div class="update-dialog-actions">
                <button @click="openManualUpdatePage">前往更新</button>
                <button class="secondary-button" @click="closeUpdateDialog">取消</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import MarkdownContent from './MarkdownContent.vue';
import { openRegisterUrl } from '../utils/utils';

const props = defineProps({
    appVersion: {
        type: String,
        default: ''
    },
    platform: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['badge-change']);

const projectRepoUrl = 'https://github.com/NeglectDream/MoeKoeMusicWeb';
const repoUrl = `${projectRepoUrl}/releases`;
const showUpdateDialog = ref(false);
const showNewBadge = ref(false);
const downloadUrl = ref('');
const updateLog = ref('暂无更新日志');
const latestVersion = ref('');

const setShowNewBadge = (value) => {
    showNewBadge.value = value;
    emit('badge-change', value);
};

const isVersionLower = (current, latest) => {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        if ((latestParts[i] || 0) > (currentParts[i] || 0)) {
            return true;
        } else if ((latestParts[i] || 0) < (currentParts[i] || 0)) {
            return false;
        }
    }
    return false;
};

const getPlatformDownloadUrl = (release) => {
    const assets = Array.isArray(release?.assets) ? release.assets : [];
    if (!assets.length) {
        return release?.html_url || repoUrl;
    }
    return release?.html_url || repoUrl;
};

const fetchLatestVersion = async () => {
    if (!props.appVersion) {
        return;
    }

    try {
        const response = await fetch('https://api.github.com/repos/NeglectDream/MoeKoeMusicWeb/releases/latest');
        const data = await response.json();
        downloadUrl.value = getPlatformDownloadUrl(data);
        latestVersion.value = data.tag_name.replace(/^v/, '');
        updateLog.value = data.body?.trim() || '暂无更新日志';
        setShowNewBadge(isVersionLower(props.appVersion, latestVersion.value));
    } catch (error) {
        console.error('获取最新版本号失败:', error);
    }
};

const closeUpdateDialog = () => {
    showUpdateDialog.value = false;
};

const openManualUpdatePage = () => {
    openRegisterUrl(downloadUrl.value || repoUrl);
};

const handleEntryClick = () => {
    if (!showNewBadge.value) {
        openRegisterUrl(repoUrl);
        return;
    }
    showUpdateDialog.value = true;
};

watch(() => [props.appVersion, props.platform], ([appVersion]) => {
    if (appVersion) {
        fetchLatestVersion();
    }
}, { immediate: true });

defineExpose({
    handleEntryClick
});
</script>

<style lang="scss" scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    position: relative;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    max-width: 700px;
    width: 90%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    text-align: left;
    animation: fadeIn 0.3s ease;

    h2 {
        margin-top: 20px;
        color: var(--primary-color);
    }

    button {
        margin-top: 15px;
        padding: 8px 12px;
        background-color: var(--primary-color);
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
}

.update-dialog {
    max-width: 600px;

    .update-log-box {
        max-height: 250px;
        overflow-y: auto;
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 10px;
        background: #faf7fb;
        border: 1px solid rgba(var(--primary-color-rgb), 0.18);
    }

    .update-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 18px;
        flex-wrap: wrap;
    }

    button {
        min-width: 124px;
        border-radius: 999px;
        padding: 10px 18px;
        margin-top: 0;
    }

    .secondary-button {
        background: #eef1f6;
        color: #333;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
