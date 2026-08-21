import { defineStore } from 'pinia';
import { encryptedStorage } from '../utils/cryptoStorage';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

// 设备注册：调用后端 /register/dev 获取 dfid（酷狗用户类接口必需的设备标识）
// 用原生 fetch 而非 httpClient，避免与 request.js 形成循环依赖
async function fetchDfid() {
    try {
        const res = await fetch(`${getApiBaseUrl()}/register/dev`, { credentials: 'include' });
        const json = await res.json();
        return json?.data?.dfid || '';
    } catch (e) {
        console.warn('[store] fetchDfid failed:', e);
        return '';
    }
}

export const MoeAuthStore = defineStore('MoeData', {
    state: () => ({
        UserInfo: null, // 用户信息（登录后写入，加密持久化）
        Device: { dfid: '' }, // 设备标识（持久化，避免每次刷新重新注册）
    }),
    actions: {
        setData(data) {
            if (data?.UserInfo) this.UserInfo = data.UserInfo;
        },
        clearData() {
            this.UserInfo = null;
        },
        // 启动时注册设备拿 dfid；已存在则跳过（persist 恢复后直接命中）
        async initDevice() {
            if (this.Device?.dfid) return;
            const dfid = await fetchDfid();
            if (dfid) this.Device = { dfid };
        },
    },
    getters: {
        isAuthenticated: (state) => !!state.UserInfo,
    },
    persist: {
        key: 'MoeData',
        storage: encryptedStorage,
        pick: ['UserInfo', 'Device'],
    },
});
