// 共享音质定义与可用音质解析逻辑（播放与下载共用）
// 从 OnlineMusicQueue.js 提取，消除重复。

export const QUALITY_LEVELS = ['128', '320', 'flac', 'high', 'viper_atmos', 'viper_clear', 'viper_tape'];

export const QUALITY_LABELS = {
    '128': '标准',
    '320': '高品',
    flac: 'FLAC',
    high: 'Hi-Res',
    viper_atmos: '全景声',
    viper_clear: '超清',
    viper_tape: '母带',
};

export const normalizeQuality = (quality) => {
    return QUALITY_LEVELS.includes(quality) ? quality : '128';
};

export const getFallbackChain = (quality) =>
    QUALITY_LEVELS.slice(0, QUALITY_LEVELS.indexOf(normalizeQuality(quality)) + 1).reverse();

export const getQualityLabel = (quality) => QUALITY_LABELS[quality] || '';

// 从 /privilege/lite 响应中提取所有可用音质变体
export const getPrivilegeVariants = (response) => {
    const variants = [];
    for (const item of response?.data || []) {
        for (const variant of [item, ...(item?.relate_goods || [])]) {
            if (!variant?.hash || variant?.level === 0 || !QUALITY_LEVELS.includes(variant?.quality)) continue;
            variants.push(variant);
        }
    }
    return variants;
};

// 返回去重后的可用音质选项 [{value, hash, label}]，按音质从高到低
export const getQualityOptions = (response) => {
    const qualityOptions = new Map();
    for (const variant of getPrivilegeVariants(response)) {
        if (qualityOptions.has(variant.quality)) continue;
        qualityOptions.set(variant.quality, {
            value: variant.quality,
            hash: variant.hash,
            label: getQualityLabel(variant.quality),
        });
    }
    return [...qualityOptions.values()].sort((a, b) => QUALITY_LEVELS.indexOf(b.value) - QUALITY_LEVELS.indexOf(a.value));
};

// 按目标音质及其降级链生成候选 [{hash, quality}]
export const getPrivilegeCandidates = (qualityOptions, quality, originalHash) => {
    const candidatesByQuality = new Map();
    for (const option of qualityOptions) {
        if (!candidatesByQuality.has(option.value)) {
            candidatesByQuality.set(option.value, { hash: option.hash, quality: option.value });
        }
    }
    const fallbackChain = getFallbackChain(quality);
    const candidates = fallbackChain.map(q => candidatesByQuality.get(q)).filter(Boolean);
    return candidates.length > 0 ? candidates : fallbackChain.map(q => ({ hash: originalHash, quality: q }));
};
