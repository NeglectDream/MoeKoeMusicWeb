import { get } from './request';
import { MoeAuthStore } from '../stores/store';
import { getQualityOptions, QUALITY_LEVELS, getQualityLabel, getFallbackChain, normalizeQuality } from './quality';

/**
 * 字段归一化：把搜索结果歌曲 / 歌单曲目统一成 {hash, name, author}。
 * 搜索歌：FileHash/HQFileHash/SQFileHash + OriSongName + SingerName
 * 歌单曲：hash + name + author
 */
export const normalizeTrack = (song) => {
    if (!song) return { hash: '', name: '', author: '' };
    const hash = song.hash || song.HQFileHash || song.SQFileHash || song.FileHash || '';
    const name = song.name || song.OriSongName || song.SongName || '';
    const author = song.author || song.SingerName || '';
    return { hash, name, author };
};

// 获取某歌曲可用音质选项 [{value, hash, label}]
export const getAvailableQualities = async (hash) => {
    if (!hash) return [];
    try {
        const response = await get('/privilege/lite', { hash });
        return getQualityOptions(response);
    } catch (error) {
        console.error('[Download] 获取可用音质失败:', error);
        return [];
    }
};

// 取真实下载 URL
export const fetchDownloadUrl = async (hash, quality) => {
    const MoeAuth = typeof MoeAuthStore === 'function' ? MoeAuthStore() : null;
    const isAuth = !!MoeAuth?.isAuthenticated;

    const params = { hash };
    if (!isAuth) {
        params.free_part = 1;
    } else if (quality) {
        params.quality = quality;
        params.ppage_id = '356753938';
    }

    const response = await get('/song/url', params);
    if (response?.status !== 1 || !response.url?.[0]) {
        return { error: true, response };
    }
    return {
        url: response.url[0],
        extName: response.extName || '',
        timeLength: response.timeLength,
    };
};

const sanitizeFilename = (name) => {
    return String(name || '').replace(/[\\/:*?"<>|\r\n]/g, '_').trim() || '未知';
};

const pickFilename = ({ name, author, extName }) => {
    const ext = (extName || 'mp3').toLowerCase().replace(/^\./, '');
    const base = author ? `${author} - ${name}` : name;
    return `${sanitizeFilename(base)}.${ext}`;
};

// 触发浏览器下载：优先 fetch blob，跨域失败降级直开 URL
export const triggerDownload = async (url, filename) => {
    try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        return { ok: true };
    } catch (error) {
        console.warn('[Download] blob 下载失败，降级直开:', error);
        // 降级：新窗口打开，由浏览器决定下载或播放
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return { ok: false, fallback: true };
    }
};

// 单首下载（已知音质）
export const downloadSongWithQuality = async (song, quality) => {
    const { hash, name, author } = normalizeTrack(song);
    if (!hash) return { ok: false, reason: 'no_hash' };

    const result = await fetchDownloadUrl(hash, quality);
    if (result.error) return { ok: false, reason: 'no_url', song: { name, author } };

    // 视频格式自动降级到下一档可用音质
    let url = result.url;
    let extName = result.extName;
    let usedQuality = quality;
    if (extName === 'mp4' && quality) {
        for (const q of getFallbackChain(quality)) {
            if (q === quality) continue;
            const r = await fetchDownloadUrl(hash, q);
            if (!r.error && r.extName !== 'mp4') {
                url = r.url;
                extName = r.extName;
                usedQuality = q;
                break;
            }
        }
    }

    const filename = pickFilename({ name, author, extName });
    const down = await triggerDownload(url, filename);
    return { ok: down.ok, song: { name, author }, quality: usedQuality };
};

/**
 * 批量下载：对歌曲数组串行下载指定音质。
 * @param {Array} songs  原始歌曲数组（支持搜索/歌单两种结构）
 * @param {string} quality  选定音质
 * @param {(progress:{index,total,ok,name})=>void} onProgress  进度回调
 * @returns {{success:number,failed:Array}}
 */
export const downloadSongs = async (songs, quality, onProgress) => {
    const total = songs.length;
    let success = 0;
    const failed = [];
    const normalizedQuality = normalizeQuality(quality);

    for (let i = 0; i < total; i++) {
        const track = normalizeTrack(songs[i]);
        const result = await downloadSongWithQuality(songs[i], normalizedQuality);
        if (result.ok) {
            success++;
        } else {
            failed.push(track);
        }
        if (typeof onProgress === 'function') {
            onProgress({ index: i + 1, total, ok: result.ok, name: track.name });
        }
    }
    return { success, failed };
};

export { QUALITY_LEVELS, getQualityLabel };
