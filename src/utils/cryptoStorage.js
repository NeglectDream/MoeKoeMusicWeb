import CryptoJS from 'crypto-js';

/**
 * 登录信息加密存储适配器。
 *
 * 说明：密钥派生材料（SALT + navigator.userAgent）位于前端，
 * 因此本措施仅用于防止 localStorage 明文直读与 casual 窥探，
 * 无法抵御 XSS（攻击者可同样获取密钥派生材料）。
 * 这是“客户端运行在他人服务器”场景下前端能做的本地加固上限。
 */

const SALT = 'MoeKoe::LocalAuth::v1';
const DELIMITER = '::';

// 派生 32 字节 AES 密钥（AES-256-CBC）
const deriveKey = () => {
    const material = SALT + (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    return CryptoJS.SHA256(material).toString(CryptoJS.enc.Hex).slice(0, 32);
};

const getKey = () => CryptoJS.enc.Utf8.parse(deriveKey());

const encrypt = (plain) => {
    try {
        const iv = CryptoJS.lib.WordArray.random(16);
        const encrypted = CryptoJS.AES.encrypt(plain, getKey(), {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        return iv.toString(CryptoJS.enc.Base64) + DELIMITER + encrypted.toString();
    } catch {
        return null;
    }
};

const decrypt = (stored) => {
    if (!stored || typeof stored !== 'string') return null;
    try {
        const [ivB64, cipherB64] = stored.split(DELIMITER);
        if (!ivB64 || !cipherB64) return null;
        const iv = CryptoJS.enc.Base64.parse(ivB64);
        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(cipherB64),
        });
        const decrypted = CryptoJS.AES.decrypt(cipherParams, getKey(), {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        const text = decrypted.toString(CryptoJS.enc.Utf8);
        return text || null;
    } catch {
        return null;
    }
};

/**
 * pinia-plugin-persistedstate 兼容的 storage 适配器。
 * setItem 接收已序列化的字符串，加密后写入；getItem 读取并解密返回原字符串。
 */
export const encryptedStorage = {
    getItem(key) {
        return decrypt(localStorage.getItem(key));
    },
    setItem(key, value) {
        const encrypted = encrypt(value);
        if (encrypted) {
            localStorage.setItem(key, encrypted);
        } else {
            localStorage.removeItem(key);
        }
    },
    removeItem(key) {
        localStorage.removeItem(key);
    },
};

export { encrypt, decrypt };
