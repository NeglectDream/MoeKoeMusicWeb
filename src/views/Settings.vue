<template>
    <div class="settings-page">
        <div class="settings-sidebar">
            <div v-for="(section, sectionIndex) in visibleSections" :key="sectionIndex" class="sidebar-item"
                :class="{ active: activeTab === sectionIndex }" @click="activeTab = sectionIndex">
                <i :class="section.icon"></i>
                <span>{{ section.title }}</span>
            </div>
        </div>

        <div class="settings-content">
            <div v-for="(section, sectionIndex) in visibleSections" :key="sectionIndex" class="setting-section"
                v-show="activeTab === sectionIndex">
                <h3>{{ section.title }}</h3>
                <div class="settings-cards">
                    <div v-for="(item, itemIndex) in getVisibleItems(section)" :key="itemIndex" class="setting-card"
                        :class="{ 'setting-card--toggle': isToggleItem(item) }" @click="handleCardClick(item)">
                        <div class="setting-card-header">
                            <div class="setting-card-title">
                                <i :class="item.itemIcon || 'fas fa-sliders-h'"></i>
                                <span>{{ item.label }}</span>
                                <span v-if="item.showRefreshHint && showRefreshHint[item.key]" class="refresh-hint">
                                    {{ item.refreshHintText }}
                                </span>
                            </div>
                            <button v-if="item.helpLink" type="button" class="card-help-link"
                                :title="$t('bang-zhu')" :aria-label="$t('bang-zhu')"
                                @click.stop="openHelpLink(item.helpLink)">
                                <i class="fas fa-question-circle"></i>
                            </button>
                        </div>
                        <div class="setting-card-value">
                            <template v-if="isToggleItem(item)">
                                <span>{{ item.icon }}{{ selectedSettings[item.key]?.displayText }}</span>
                                <button type="button" class="setting-switch" :class="{ active: isToggleEnabled(item) }"
                                    :aria-checked="isToggleEnabled(item)" role="switch"
                                    @click.stop="toggleSetting(item)">
                                    <span class="setting-switch-thumb"></span>
                                </button>
                            </template>
                            <template v-else>
                                <span>{{ item.icon }}{{ item.customText || selectedSettings[item.key]?.displayText }}</span>
                                <i class="fas fa-chevron-right"></i>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <div class="privacy-info">
                <p><i class="fas fa-shield-alt"></i> {{ $t('deng-lu-xin-xi-jia-mi-cun-chu') }}</p>
                <p><i class="fas fa-hdd"></i> {{ $t('she-zhi-jin-cun-ben-ji') }}</p>
            </div>

            <div class="reset-settings-container">
                <button @click="openResetConfirmation" class="reset-settings-button">
                    <i class="fas fa-sync-alt"></i>
                    {{ $t('hui-fu-chu-chang-she-zhi') }}
                </button>
            </div>
            <div class="version-info">
                <p>© MoeKoe Music</p>
                <span v-if="appVersion">V{{ appVersion }} - {{ platform }}</span>
            </div>
        </div>

        <teleport to="body">
        <div v-if="isSelectionOpen" class="modal" @click.self="closeSelection">
            <div class="modal-content">
                <a v-if="currentHelpLink" class="help-link" @click="openHelpLink" :title="$t('bang-zhu')"
                    :aria-label="$t('bang-zhu')">
                    <i class="fas fa-question-circle"></i>
                </a>
                <h3>{{ getSettingItem(selectionType)?.selectionTitle }}</h3>
                <input v-if="isFontSelection()" class="font-search" placeholder="搜索字体..."
                    v-model="fontSearch" />
                <ul v-if="!isFontSelection() && selectionType !== 'audioOutputDevice'">
                    <li v-for="option in getSettingItem(selectionType)?.options || []" :key="option.value"
                        @click="selectOption(option)">
                        {{ option.displayText }}
                    </li>
                </ul>

                <ul v-else-if="selectionType === 'audioOutputDevice'">
                    <li v-if="audioOutputDevicesLoading">正在获取设备列表...</li>
                    <li v-else-if="audioOutputDeviceOptions.length === 0">未检测到音频输出设备</li>
                    <li v-else v-for="option in audioOutputDeviceOptions" :key="option.value"
                        @click="selectOption(option)">
                        {{ option.displayText }}
                    </li>
                </ul>

                <ul v-else-if="isFontSelection()" class="font-list">
                    <li v-if="fontOptionsLoading">{{ $t('jia-zai-zhong') }}</li>
                    <li v-else-if="fontOptions.length === 0" class="font-manual-entry">
                        <input v-model="manualFontName" placeholder="输入字体名，如 Microsoft YaHei" />
                        <button type="button" @click="applyManualFont">应用</button>
                    </li>
                    <template v-else v-for="option in fontOptions" :key="option.value">
                        <li v-if="!fontSearch || option.displayText.toLowerCase().includes(fontSearch.toLowerCase())"
                            :style="{ fontFamily: option.value }"
                            @click="selectFontOption(option)"
                            v-html="fontSearch? option.displayText.replace(
                                new RegExp(fontSearch, 'ig'),
                                `<mark>${fontSearch}</mark>`
                            ): option.displayText">
                        </li>
                    </template>
                    
                </ul>

                <button @click="closeSelection">{{ $t('guan-bi-an-niu') }}</button>
            </div>
        </div>
        </teleport>
    </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MoeAuthStore } from '../stores/store';
import { applyCustomFont } from '../utils/utils';
import { useSettingsConfig } from '@/config/settings';
import { ONBOARDING_GUIDE_EVENT } from '@/config/onboardingGuide';

const MoeAuth = MoeAuthStore();
const { t } = useI18n();
const { proxy } = getCurrentInstance();
const appVersion = ref('');
const platform = ref('');
const activeTab = ref(0);

const {
    settingSections
} = useSettingsConfig(t, {
    openOnboardingGuide: () => openOnboardingGuide()
});

const visibleSections = computed(() => settingSections.value);

const createSelectedSettings = (sections) => {
    const selectedSettings = {};

    sections.forEach(section => {
        section.items.forEach(item => {
            if (!Object.prototype.hasOwnProperty.call(item, 'defaultValue')) return;
            const option = item.options?.find(option => option.value === item.defaultValue);
            selectedSettings[item.key] = {
                displayText: item.defaultDisplayText ?? option?.displayText ?? '',
                value: item.defaultValue
            };
        });
    });

    return selectedSettings;
};

const selectedSettings = ref(createSelectedSettings(settingSections.value));

const isSelectionOpen = ref(false);
const currentHelpLink = ref('');
const selectionType = ref('');
const fontOptions = ref([]);
const fontOptionsLoading = ref(false);
const fontSearch = ref('');
const manualFontName = ref('');

const showRefreshHint = ref({});

const audioOutputDeviceOptions = ref([]);
const audioOutputDevicesLoading = ref(false);

const isFontSelection = (type = selectionType.value) => ['font', 'desktopLyricsFont'].includes(type);

const updateAudioOutputDeviceDisplayText = async (deviceId) => {
    if (!deviceId || deviceId === 'default') {
        selectedSettings.value.audioOutputDevice = { displayText: '默认', value: 'default' };
        return;
    }

    let displayText = `已选择设备 (${deviceId.slice(0, 8)}...)`;
    try {
        if (navigator?.mediaDevices?.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const matched = devices.find(d => d.kind === 'audiooutput' && d.deviceId === deviceId);
            if (matched?.label) displayText = matched.label;
        }
    } catch {
        // 忽略枚举失败
    }

    selectedSettings.value.audioOutputDevice = { displayText, value: deviceId };
};

const loadAudioOutputDevices = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
        audioOutputDeviceOptions.value = [];
        return;
    }

    audioOutputDevicesLoading.value = true;

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');

        const options = [{ displayText: '默认', value: 'default' }];
        let unnamedIndex = 1;

        for (const output of outputs) {
            if (!output.deviceId) continue;
            const displayText = output.label || `输出设备 ${unnamedIndex++}`;
            options.push({ displayText, value: output.deviceId });
        }

        const seen = new Set();
        audioOutputDeviceOptions.value = options.filter(opt => {
            if (seen.has(opt.value)) return false;
            seen.add(opt.value);
            return true;
        });
    } catch {
        audioOutputDeviceOptions.value = [{ displayText: '默认', value: 'default' }];
    } finally {
        audioOutputDevicesLoading.value = false;
    }
};

const loadLocalFonts = async () => {
    fontOptionsLoading.value = true;

    try {
        if (!window.queryLocalFonts) {
            fontOptions.value = [];
            return;
        }

        const fonts = await window.queryLocalFonts();
        const familyMap = new Map();
        for (const font of fonts) {
            const family = font.family;
            const name = font.fullName;
            if (!family || !name) continue;

            if (!familyMap.has(family) || name.length < familyMap.get(family).name.length) {
                familyMap.set(family, {
                    // 如果 fullName 太长了那就说明是变体名，直接用字族名代替
                    name: name.length > family.length? family: name,
                    family
                });
            }
        }

        const families = [...familyMap.values()].sort((a, b) =>
            a.family.localeCompare(b.family)
        );
        fontOptions.value = [
            { displayText: t('mo-ren-zi-ti'), value: '' },
            ...families.map(f => ({
                displayText: f.name === f.family? f.family: `${f.name} (${f.family})`,
                value: f.family
            }))
        ];
    } catch {
        fontOptions.value = [];
    } finally {
        fontOptionsLoading.value = false;
    }
};

const openSelection = (type, helpLink) => {
    isSelectionOpen.value = true;
    selectionType.value = type;
    currentHelpLink.value = helpLink || getSettingItem(type)?.helpLink || '';

    if (isFontSelection(type)) void loadLocalFonts();

    if (type === 'audioOutputDevice') {
        void loadAudioOutputDevices();
    }
};

const openHelpLink = () => {
    const url = currentHelpLink.value;
    if (!url) return;
    window.open(url, '_blank');
};

const getSettingItem = (key) => {
    for (const section of settingSections.value) {
        const item = section.items.find(item => item.key === key);
        if (item) return item;
    }
    return null;
};

const getVisibleItems = (section) => section.items.filter(item => !item.hidden && !getUnavailableSettingText(item));

const isToggleItem = (item) => {
    if (!item?.options || item.options.length !== 2) return false;
    const values = item.options.map(option => option.value);
    return values.includes('on') && values.includes('off');
};

const isToggleEnabled = (item) => selectedSettings.value[item.key]?.value === 'on';

const handleCardClick = (item) => {
    if (item.action) {
        item.action(item.helpLink);
        return;
    }

    if (isToggleItem(item)) {
        return;
    }

    openSelection(item.key);
};

const markRefreshHint = (key) => {
    if (getSettingItem(key)?.showRefreshHint) {
        showRefreshHint.value[key] = true;
    }
};

const shouldKeepSelectionOpen = (key) => {
    return settingSections.value.some(section => section.items.some(item =>
        item.keepOpen && item.key === key
    ));
};

const getUnavailableSettingText = (item) => {
    return '';
};

const selectActions = {
    applyThemeColor: (option) => proxy.$applyColorTheme(option.value),
    applyTheme: (option) => proxy.$setTheme(option.value),
    applyLanguage: (option) => {
        proxy.$i18n.locale = option.value;
        document.documentElement.lang = option.value;
    },
    checkQualityAuth: () => {
        if (!MoeAuth.isAuthenticated) {
            window.$modal.alert(t('gao-pin-zhi-yin-le-xu-yao-deng-lu-hou-cai-neng-bo-fango'));
        }
    },
    dispatchLoudnessNormalization: (option) => {
        window.dispatchEvent(new CustomEvent('loudness-normalization-change', {
            detail: { enabled: option.value === 'on' }
        }));
    },
    updateAudioOutputWatch: (option) => {
        window.dispatchEvent(new CustomEvent('audio-output-device-watch-change', {
            detail: { enabled: option.value === 'on' }
        }));
    },
    dispatchAudioOutputDevice: (option) => {
        if (option.value !== 'default' && typeof document.createElement('audio').setSinkId !== 'function') {
            window.$modal.alert('当前浏览器不支持切换音频输出设备，请使用 Chrome/Edge 桌面端');
            selectedSettings.value.audioOutputDevice = { displayText: '默认', value: 'default' };
            saveSettings();
            return;
        }
        window.dispatchEvent(new CustomEvent('audio-output-device-change', {
            detail: { deviceId: option.value }
        }));
    }
};

const runSelectAction = async (item, option) => {
    if (!item?.selectAction) return;
    await selectActions[item.selectAction]?.(option);
};

const toggleSetting = async (item) => {
    const currentValue = selectedSettings.value[item.key]?.value;
    const nextOption = item.options.find(option => option.value === (currentValue === 'on' ? 'off' : 'on'));
    if (!nextOption) return;

    selectedSettings.value[item.key] = { ...nextOption };
    await runSelectAction(item, nextOption);
    saveSettings();
    markRefreshHint(item.key);
};

const selectOption = async (option) => {
    const settingItem = getSettingItem(selectionType.value);
    const unavailableText = getUnavailableSettingText(settingItem);
    if (unavailableText) {
        window.$modal.alert(unavailableText);
        return;
    }
    selectedSettings.value[selectionType.value] = option;
    await runSelectAction(settingItem, option);
    saveSettings();
    if (!shouldKeepSelectionOpen(selectionType.value)) closeSelection();
    markRefreshHint(selectionType.value);
};

const selectFontOption = (option) => {
    const key = selectionType.value;
    selectedSettings.value[key] = {
        displayText: option.displayText,
        value: option.value
    };
    if (key === 'font') applyCustomFont(option.value);
    saveSettings();
    closeSelection();
    markRefreshHint(key);
};

const applyManualFont = () => {
    const name = manualFontName.value.trim();
    if (!name) return;
    selectFontOption({ displayText: name, value: name });
    manualFontName.value = '';
};

const saveSettings = () => {
    const settingsToSave = Object.fromEntries(
        Object.entries(selectedSettings.value).map(([key, setting]) => [key, setting.value])
    );
    localStorage.setItem('settings', JSON.stringify(settingsToSave));
    window.dispatchEvent(new CustomEvent('settings-change', {
        detail: { settings: settingsToSave }
    }));
};

const closeSelection = () => {
    isSelectionOpen.value = false;
};

onMounted(() => {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));

    if (savedSettings) {
        for (const key in savedSettings) {
            if (key === 'audioOutputDevice') continue;
            const settingItem = getSettingItem(key);
            if (key === 'quality') {
                const option = settingItem.options.find(option => option.value === savedSettings[key]) || settingItem.options[0];
                selectedSettings.value[key] = { ...option };
                continue;
            }
            if (isFontSelection(key)) {
                const value = savedSettings[key] || '';
                selectedSettings.value[key] = {
                    displayText: value || t('mo-ren-zi-ti'),
                    value: value
                };
                continue;
            }
            if (settingItem?.options) {
                // Always get displayText from current translation, not from localStorage
                const option = settingItem.options.find(
                    (opt) => opt.value === savedSettings[key]
                );
                const displayText = option?.displayText || '🌏 ' + t('zi-dong');
                selectedSettings.value[key] = { displayText, value: savedSettings[key] };
            }
        }
    }
    appVersion.value = __VERSION__ || '';
    platform.value = 'Web';

    if (savedSettings?.audioOutputDevice !== undefined) {
        void updateAudioOutputDeviceDisplayText(savedSettings.audioOutputDevice);
    }
});

const openOnboardingGuide = () => {
    window.dispatchEvent(new CustomEvent(ONBOARDING_GUIDE_EVENT, {
        detail: { reset: true }
    }));
};

const openResetConfirmation = async () => {
    const result = await window.$modal.confirm(t('ni-que-ren-hui-fu-chu-chang'));
    if (result) {
        localStorage.clear();
        window.$modal.alert(t('hui-fu-chu-chang-she-zhi-cheng-gong'));
    }
};
</script>

<style lang="scss" scoped>
$primary: var(--color-primary);
$primary-light: var(--color-primary-light);
$text-muted: #666;
$border-light: #eaeaea;
$shadow-light: rgba(0, 0, 0, 0.15);
$shadow-medium: rgba(0, 0, 0, 0.18);

.settings-page {
    display: flex;
    height: var(--settings-page-height, calc(100vh - 160px));
    min-height: 0;
    overflow: hidden;
    box-shadow: 0 0 30px $shadow-light;
    border-radius: 8px;
}

:global(main.app-main-scroll:has(.settings-page)) {
    --settings-page-height: calc(100vh - 160px);
    padding-bottom: 80px;
}

:global(main.side-navigation-main-content:has(.settings-page)) {
    --settings-page-height: calc(100vh - 132px);
}

.settings-sidebar {
    width: 220px;
    flex: 0 0 220px;
    box-shadow: 0 0 10px $shadow-light;
    padding: 20px 0;
    overflow-y: auto;
}

.sidebar-item {
    padding: 12px 20px;
    margin: 4px 10px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;

    i {
        margin-right: 12px;
        font-size: 16px;
        width: 20px;
        text-align: center;
    }

    &.active {
        background-color: $primary-light;
        color: $primary;
        font-weight: 500;
    }

    &:hover:not(.active) {
        background-color: var(--hover-color, #efefef);
    }
}

.settings-content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 20px;
    overflow-y: auto;
}

.setting-section {
    animation: fadeIn 0.3s ease;

    h3 {
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid $border-light;
    }
}

.settings-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
    gap: 16px;

    .setting-card-header i {
        color: var(--primary-color);
    }
}

.setting-card {
    min-width: 0;
    box-sizing: border-box;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 16px $shadow-light;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px $shadow-medium;
    }

    &-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    &-value {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 0;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        border: 1px solid $border-light;

        i {
            color: #999;
            font-size: 12px;
            flex: 0 0 auto;
        }

        span {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    &--toggle {
        .setting-card-value {
            gap: 12px;
            min-height: 38px;
            padding: 4px 12px;
            box-sizing: border-box;
        }
    }
}

.setting-card-title {
    display: flex;
    align-items: center;
    min-width: 0;

    i {
        color: $primary;
        margin-right: 10px;
        font-size: 16px;
        flex: 0 0 auto;
    }

    > span {
        min-width: 0;
        word-break: break-word;
    }
}

.card-help-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    margin-left: 12px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: $primary;
    cursor: pointer;
    flex: 0 0 auto;

    &:hover {
        opacity: 0.85;
    }
}

.setting-switch {
    position: relative;
    width: 40px;
    height: 22px;
    border: 0;
    border-radius: 999px;
    background: #d9d9d9;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.2s ease;
    flex: 0 0 auto;

    &.active {
        background: $primary;
    }
}

.setting-switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease;
}

.setting-switch.active .setting-switch-thumb {
    transform: translateX(18px);
}

.refresh-hint {
    color: #ff4d4f;
    font-size: 12px;
    margin-left: 8px;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-in-out;
    z-index: 999;
}

.modal-content {
    background: white;
    padding: 25px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-in-out;
    position: relative;
    max-height: 50vh;
    overflow: hidden;
    overscroll-behavior: contain;
    display: flex;
    flex-direction: column;

    h3 {
        flex: 0 0 auto;
        font-size: 20px;
        margin-bottom: 20px;
        color: #333;
    }

    .font-search {
        padding: 12px;
        margin: 6px 0;
        outline: 0;
        border: 0;
        border-radius: 8px;
        font-size: 1em;
    }

    ul {
        flex: 1 1 auto;
        min-height: 0;
        max-height: 46vh;
        overflow-y: auto;
        list-style: none;
        padding: 0 4px 0 0;
        margin: 0;
        overscroll-behavior: contain;
    }

    li {
        padding: 12px;
        margin: 6px 0;
        background-color: var(--background-color);
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
            background-color: var(--secondary-color);
        }
    }

    button {
        flex: 0 0 auto;
        margin-top: 20px;
        padding: 10px 20px;
        background-color: $primary;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;

        &:hover {
            background-color: $primary;
        }
    }

    > button {
        align-self: center;
        min-width: 96px;
    }
}

.font-manual-entry {
    display: flex;
    gap: 8px;
    align-items: center;
    background-color: transparent;

    &:hover {
        background-color: transparent;
    }

    input {
        flex: 1;
        min-width: 0;
        padding: 8px 10px;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: 0;
        font-size: 14px;
    }

    button {
        flex: 0 0 auto;
        padding: 8px 16px;
        border: 0;
        border-radius: 6px;
        background-color: var(--color-primary);
        color: #fff;
        cursor: pointer;
        font-size: 14px;
    }
}

.help-link {
    position: absolute;
    top: 12px;
    right: 12px;
    color: $primary;
    cursor: pointer;
    text-decoration: none;
    font-size: 18px;

    &:hover {
        opacity: 0.85;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        transform: translateY(-20px);
    }

    to {
        transform: translateY(0);
    }
}

.shortcut-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.shortcut-modal-content {
    background: white;
    border-radius: 12px;
    padding: 20px;
    width: 90%;
    max-width: 500px;

    h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        text-align: center;
    }
}

.shortcut-list {
    margin-bottom: 20px;
    max-height: 60vh;
    overflow-y: auto;
}

.shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.shortcut-input {
    position: relative;
    background: #f5f5f5;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    min-width: 150px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;

    &.recording {
        background: $primary;
        color: white;

        .clear-shortcut {
            background: rgba(255, 255, 255, 0.2);
            color: white;

            &:hover {
                background: rgba(255, 255, 255, 0.3);
                color: white;
            }
        }
    }
}

.clear-shortcut {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.1);
    cursor: pointer;
    font-size: 14px;
    color: $text-muted;
    transition: all 0.2s;
    position: absolute;
    right: 5px;
}

.shortcut-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;

    button {
        padding: 8px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;

        &.primary {
            background: $primary;
            color: white;
        }
    }
}

.privacy-info {
    margin: 20px 0 0 0;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    font-size: 13px;
    color: $text-muted;
    line-height: 1.8;

    p {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;

        i {
            color: rgba(76, 175, 80, 0.85);
        }
    }
}

.version-info {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: $text-muted;
}

.reset-settings-container {
    display: flex;
    justify-content: center;
    margin: 30px 0 20px 0;
}

.reset-settings-button {
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        background-color: #e53935;
    }
}

.scale-slider-container {
    margin-top: 15px;
    text-align: left;
    padding: 15px;
    background-color: var(--background-color);
    border-radius: 8px;
}

.scale-slider-label {
    font-weight: bold;
    margin-bottom: 10px;
}

.scale-slider-hint {
    font-size: 12px;
    color: $text-muted;
}

.scale-slider-wrapper {
    position: relative;
    padding-bottom: 20px;
}

.scale-slider {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: #ddd;
    outline: none;
    border-radius: 3px;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary;
        cursor: pointer;
    }

    &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary;
        cursor: pointer;
        border: none;
    }
}

.scale-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    font-size: 12px;
    color: $text-muted;
}

.api-settings-container,
.proxy-settings-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    .api-setting-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 10px;
        width: 100%;

        label {
            font-size: 14px;
            color: #333;
            margin-bottom: 5px;
        }

        .api-input {
            width: 100%;
            height: 35px;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 5px;
            padding-left: 10px;
            box-sizing: border-box;
        }
    }

    .api-hint {
        font-size: 12px;
        color: #999;
        text-align: center;
    }
}

.proxy-actions {
    display: flex;
    gap: 12px;
    width: 100%;

    button {
        flex: 1;
        min-width: 0;
        padding: 8px 0;
        border-radius: 6px;
    }
}

.proxy-test-result {
    font-size: 13px;
    line-height: 18px;
    margin-top: 5px;

    &.success {
        color: #4caf50;
    }

    &.error {
        color: #e53935;
    }
}
</style>
