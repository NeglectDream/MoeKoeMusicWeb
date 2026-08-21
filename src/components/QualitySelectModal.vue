<template>
    <div v-if="visible" class="quality-modal-mask" @click.self="close">
        <div class="quality-modal">
            <h3 class="quality-modal-title">
                {{ mode === 'batch'
                    ? `${t('xia-zai')} ${songs.length} ${t('shou-ge-qu')}`
                    : t('xuan-ze-xia-zai-yin-zhi') }}
            </h3>
            <p v-if="mode === 'batch'" class="quality-modal-sub">{{ t('yin-zhi-jiang-ying-yong-yu-suo-you') }}</p>

            <div v-if="loading" class="quality-modal-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>{{ t('zheng-zai-huo-qu-yin-zhi') }}</span>
            </div>

            <ul v-else-if="availableQualities.length" class="quality-list">
                <li v-for="opt in availableQualities" :key="opt.value"
                    :class="['quality-item', { active: selectedQuality === opt.value }]"
                    @click="selectedQuality = opt.value">
                    <span class="quality-label">{{ opt.label }}</span>
                    <i v-if="selectedQuality === opt.value" class="fas fa-check quality-check"></i>
                </li>
            </ul>
            <div v-else class="quality-modal-empty">
                {{ t('mei-you-ke-yong-yin-zhi') }}
            </div>

            <div class="quality-modal-actions">
                <button class="quality-btn cancel" @click="close">{{ t('qu-xiao') }}</button>
                <button class="quality-btn confirm" :disabled="!selectedQuality || loading" @click="confirm">
                    {{ t('que-ding-xia-zai') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import i18n from '@/utils/i18n';
import { getAvailableQualities, normalizeTrack } from '@/utils/download';
import { QUALITY_LEVELS, getQualityLabel } from '@/utils/quality';

const t = (key, params) => i18n.global.t(key, params);

const visible = ref(false);
const songs = ref([]);
const mode = ref('single'); // 'single' | 'batch'
const availableQualities = ref([]);
const selectedQuality = ref('');
const loading = ref(false);
let onConfirmCallback = null;

const getDefaultQuality = () => {
    try {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        return settings.quality || '128';
    } catch {
        return '128';
    }
};

const open = async ({ songs: list, onConfirm }) => {
    songs.value = list || [];
    onConfirmCallback = onConfirm;
    visible.value = true;
    selectedQuality.value = '';
    availableQualities.value = [];

    if (songs.value.length === 1) {
        mode.value = 'single';
        loading.value = true;
        const opts = await getAvailableQualities(normalizeTrack(songs.value[0]).hash);
        availableQualities.value = opts;
        const def = getDefaultQuality();
        selectedQuality.value = opts.find(o => o.value === def)?.value || opts[0]?.value || '';
        loading.value = false;
    } else {
        mode.value = 'batch';
        const def = getDefaultQuality();
        availableQualities.value = QUALITY_LEVELS
            .slice()
            .reverse()
            .map(v => ({ value: v, label: getQualityLabel(v) }));
        selectedQuality.value = availableQualities.value.find(o => o.value === def)?.value
            || availableQualities.value[0]?.value
            || '';
    }
};

const close = () => {
    visible.value = false;
    onConfirmCallback = null;
};

const confirm = () => {
    if (!selectedQuality.value) return;
    const cb = onConfirmCallback;
    close();
    if (typeof cb === 'function') cb(selectedQuality.value);
};

defineExpose({ open });
</script>

<style lang="scss" scoped>
.quality-modal-mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.quality-modal {
    width: 340px;
    max-width: calc(100vw - 32px);
    background: var(--background-color, #fff);
    border-radius: 14px;
    padding: 20px 18px 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.quality-modal-title {
    margin: 0 0 6px;
    font-size: 17px;
    color: var(--text-color, #333);
    text-align: center;
}

.quality-modal-sub {
    margin: 0 0 14px;
    font-size: 12px;
    color: var(--search-result-meta, #888);
    text-align: center;
}

.quality-modal-loading,
.quality-modal-empty {
    padding: 24px 0;
    text-align: center;
    color: var(--search-result-meta, #888);

    .fa-spinner {
        margin-right: 8px;
    }
}

.quality-list {
    list-style: none;
    margin: 0 0 16px;
    padding: 0;
    max-height: 280px;
    overflow-y: auto;
}

.quality-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    border-radius: 10px;
    cursor: pointer;
    color: var(--text-color, #333);
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        background: var(--hover-color, #f5f5f5);
    }

    &.active {
        background: var(--color-primary-light, rgba(255, 105, 180, 0.12));
        color: var(--primary-color, #ff69b4);
    }
}

.quality-check {
    color: var(--primary-color, #ff69b4);
}

.quality-modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.quality-btn {
    min-width: 88px;
    height: 36px;
    border-radius: 9px;
    border: 1px solid var(--border-color, #e4e7ed);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &.cancel {
        background: transparent;
        color: var(--text-color, #606266);

        &:hover {
            background: var(--hover-color, #f5f5f5);
        }
    }

    &.confirm {
        background: var(--primary-color, #ff69b4);
        color: #fff;
        border-color: var(--primary-color, #ff69b4);

        &:hover:not(:disabled) {
            opacity: 0.9;
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
}
</style>
