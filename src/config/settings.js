import { computed } from 'vue';

export const createSettingSections = (t, actions = {}) => computed(() => [
    {
        title: t('jie-mian'),
        icon: 'fas fa-palette',
        items: [
            {
                key: 'language',
                selectAction: 'applyLanguage',
                defaultValue: '',
                defaultDisplayText: '🌏 ' + t('zi-dong'),
                itemIcon: 'fas fa-language',
                selectionTitle: t('xuan-ze-yu-yan'),
                options: [
                    { displayText: '🇨🇳 简体中文', value: 'zh-CN' },
                    { displayText: '🇨🇳 繁體中文', value: 'zh-TW' },
                    { displayText: '🇺🇸 English', value: 'en' },
                    { displayText: '🇷🇺 Русский', value: 'ru' },
                    { displayText: '🇯🇵 日本語', value: 'ja' },
                    { displayText: '🇰🇷 한국어', value: 'ko' }
                ],
                label: t('yu-yan')
            },
            {
                key: 'themeColor',
                selectAction: 'applyThemeColor',
                defaultValue: 'pink',
                itemIcon: 'fas fa-paint-brush',
                selectionTitle: t('xuan-ze-zhu-se-tiao'),
                options: [
                    { displayText: t('shao-nv-fen'), value: 'pink' },
                    { displayText: t('nan-nan-lan'), value: 'blue' },
                    { displayText: t('tou-ding-lv'), value: 'green' },
                    { displayText: t('mi-gan-cheng'), value: 'orange' }
                ],
                label: t('zhu-se-tiao'),
                icon: '🎨 '
            },
            {
                key: 'theme',
                selectAction: 'applyTheme',
                defaultValue: 'auto',
                itemIcon: 'fas fa-moon',
                selectionTitle: t('xuan-ze-wai-guan'),
                options: [
                    { displayText: '🌗 ' + t('zi-dong'), value: 'auto' },
                    { displayText: '☀️' + t('qian-se'), value: 'light' },
                    { displayText: '🌙 ' + t('shen-se'), value: 'dark' }
                ],
                label: t('wai-guan')
            },
            {
                key: 'searchMode',
                defaultValue: 'quick',
                itemIcon: 'fas fa-search',
                selectionTitle: '搜索模式',
                options: [
                    { displayText: '快速搜索', value: 'quick' },
                    { displayText: '推荐搜索', value: 'recommend' }
                ],
                label: '搜索模式'
            },
            {
                key: 'navigationMode',
                defaultValue: 'top',
                itemIcon: 'fas fa-bars',
                selectionTitle: '导航方式',
                options: [
                    { displayText: '顶部', value: 'top' },
                    { displayText: '左侧', value: 'side' }
                ],
                label: '导航方式'
            },
            {
                key: 'playerBarLayout',
                defaultValue: 'full',
                itemIcon: 'fas fa-window-maximize',
                selectionTitle: '播放栏布局',
                options: [
                    { displayText: '底部通栏', value: 'full' },
                    { displayText: '右侧对齐', value: 'content' }
                ],
                label: '播放栏布局'
            },
            {
                key: 'font',
                defaultValue: '',
                defaultDisplayText: t('mo-ren-zi-ti'),
                itemIcon: 'fas fa-font',
                selectionTitle: t('zi-ti-she-zhi'),
                keepOpen: true,
                label: t('zi-ti-she-zhi'),
                helpLink: 'https://music.moekoe.cn/guide/font-settings.html'
            },
            {
                key: 'startupPage',
                defaultValue: 'Index',
                itemIcon: 'fas fa-home',
                selectionTitle: '启动页',
                options: [
                    { displayText: t('shou-ye'), value: 'Index' },
                    { displayText: t('fa-xian'), value: 'Discover' },
                    { displayText: t('yin-le-ku'), value: 'Library' }
                ],
                label: '启动页'
            },
            {
                key: 'onboardingGuide',
                itemIcon: 'fas fa-map',
                label: '新手引导',
                customText: '重新查看',
                action: actions.openOnboardingGuide
            }
        ]
    },
    {
        title: t('sheng-yin'),
        icon: 'fas fa-volume-up',
        items: [
            {
                key: 'quality',
                selectAction: 'checkQualityAuth',
                defaultValue: '128',
                itemIcon: 'fas fa-headphones',
                selectionTitle: t('yin-zhi-xuan-ze'),
                options: [
                    { displayText: '标准音质 - 128Kbps', value: '128' },
                    { displayText: '高品音质 - 320Kbps', value: '320' },
                    { displayText: 'FLAC 无损', value: 'flac' },
                    { displayText: 'Hi-Res 无损', value: 'high' },
                    { displayText: '蝰蛇全景', value: 'viper_atmos' },
                    { displayText: '蝰蛇超清', value: 'viper_clear' },
                    { displayText: '蝰蛇母带', value: 'viper_tape' }
                ],
                label: t('yin-zhi-xuan-ze'),
                icon: '🎧 '
            },
            {
                key: 'loudnessNormalization',
                selectAction: 'dispatchLoudnessNormalization',
                defaultValue: 'off',
                itemIcon: 'fas fa-sliders-h',
                selectionTitle: t('ping-heng-yin-pin-xiang-du') + '(实验性)',
                options: [
                    { displayText: t('da-kai'), value: 'on' },
                    { displayText: t('guan-bi'), value: 'off' }
                ],
                label: t('ping-heng-yin-pin-xiang-du'),
                icon: '🎚️ ',
                showRefreshHint: true,
                refreshHintText: t('shua-xin-hou-sheng-xiao')
            },
            {
                key: 'pauseOnAudioOutputChange',
                selectAction: 'updateAudioOutputWatch',
                defaultValue: 'off',
                itemIcon: 'fas fa-exchange-alt',
                selectionTitle: '输出设备变化自动暂停(实验性)',
                options: [
                    { displayText: t('da-kai'), value: 'on' },
                    { displayText: t('guan-bi'), value: 'off' }
                ],
                label: '输出设备变化自动暂停',
                icon: '🎧 ',
                helpLink: 'https://music.moekoe.cn/guide/auto-pause-on-output-device-change.html'
            },
            {
                key: 'audioOutputDevice',
                selectAction: 'dispatchAudioOutputDevice',
                defaultValue: 'default',
                defaultDisplayText: '默认',
                itemIcon: 'fas fa-volume-up',
                selectionTitle: '音频输出设备(实验性)',
                options: [],
                label: '音频输出设备',
                icon: '🔊 ',
                helpLink: 'https://music.moekoe.cn/guide/audio-output-device.html'
            },
            {
                key: 'greetings',
                defaultValue: 'on',
                itemIcon: 'fas fa-comment',
                selectionTitle: t('qi-dong-wen-hou-yu'),
                options: [
                    { displayText: t('kai-qi'), value: 'on' },
                    { displayText: t('guan-bi'), value: 'off' }
                ],
                label: t('qi-dong-wen-hou-yu'),
                icon: '👋 '
            }
        ]
    },
    {
        title: t('ge-ci'),
        icon: 'fas fa-music',
        items: [
            {
                key: 'desktopLyricsFont',
                defaultValue: '',
                defaultDisplayText: t('mo-ren-zi-ti'),
                itemIcon: 'fas fa-font',
                selectionTitle: t('ge-ci-zi-ti-she-zhi'),
                keepOpen: true,
                label: t('ge-ci-zi-ti-she-zhi'),
                helpLink: 'https://music.moekoe.cn/guide/font-settings.html'
            },
            {
                key: 'lyricsTranslation',
                defaultValue: 'on',
                itemIcon: 'fas fa-language',
                selectionTitle: t('ge-ci-fan-yi'),
                options: [
                    { displayText: t('da-kai'), value: 'on' },
                    { displayText: t('guan-bi'), value: 'off' }
                ],
                label: t('ge-ci-fan-yi'),
                showRefreshHint: true,
                refreshHintText: t('shua-xin-hou-sheng-xiao')
            }
        ]
    }
]);

export const useSettingsConfig = (t, actions = {}) => ({
    settingSections: createSettingSections(t, actions)
});
