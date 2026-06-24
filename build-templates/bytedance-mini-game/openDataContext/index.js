'use strict';

const runtime = typeof tt !== 'undefined' ? tt : typeof wx !== 'undefined' ? wx : null;
const sharedCanvas = runtime && runtime.getSharedCanvas ? runtime.getSharedCanvas() : null;
const context = sharedCanvas ? sharedCanvas.getContext('2d') : null;
const MEDAL_IMAGE_SOURCES = [
    'openDataContext/images/Icon_ImageIcon_Medal_Gold.png',
    'openDataContext/images/Icon_ImageIcon_Medal_Silver.png',
    'openDataContext/images/Icon_ImageIcon_Medal_Bronze.png',
];
const medalImages = [];
const avatarImages = {};
let medalImagesLoaded = false;
let medalImagesLoading = false;

function clear() {
    if (!context || !sharedCanvas) return;
    context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
}

function drawMessage(message) {
    if (!context || !sharedCanvas) return;
    clear();
    context.fillStyle = 'rgba(0, 0, 0, 0.62)';
    context.fillRect(0, 0, sharedCanvas.width, sharedCanvas.height);
    context.fillStyle = '#ffffff';
    context.font = '28px Arial';
    context.textAlign = 'center';
    context.fillText(message, sharedCanvas.width * 0.5, sharedCanvas.height * 0.5);
}

function createImage() {
    if (runtime && runtime.createImage) return runtime.createImage();
    if (typeof Image !== 'undefined') return new Image();
    return null;
}

function loadMedalImages(callback) {
    if (medalImagesLoaded) {
        callback();
        return;
    }
    if (medalImagesLoading) {
        setTimeout(() => loadMedalImages(callback), 50);
        return;
    }

    medalImagesLoading = true;
    let loadedCount = 0;
    const finishOne = () => {
        loadedCount += 1;
        if (loadedCount >= MEDAL_IMAGE_SOURCES.length) {
            medalImagesLoaded = true;
            medalImagesLoading = false;
            callback();
        }
    };

    MEDAL_IMAGE_SOURCES.forEach((src, index) => {
        const image = createImage();
        if (!image) {
            console.warn('OpenDataContext: create medal image failed', src);
            finishOne();
            return;
        }

        image.onload = () => {
            console.log('OpenDataContext: medal image loaded', src);
            medalImages[index] = image;
            finishOne();
        };
        image.onerror = (err) => {
            console.warn('OpenDataContext: medal image load failed', src, err);
            finishOne();
        };
        image.src = src;
    });
}

function setSharedCanvasSize(width, height) {
    if (!sharedCanvas) return;

    const nextWidth = Number(width) || 620;
    const nextHeight = Number(height) || 760;
    console.log('OpenDataContext: sharedCanvas size', sharedCanvas.width, sharedCanvas.height, nextWidth, nextHeight);
}

function drawRankMark(rank, x, y) {
    const medal = medalImages[rank - 1];
    if (rank <= 3 && medal) {
        context.drawImage(medal, x - 2, y - 29, 40, 40);
        return;
    }

    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(String(rank), x + 18, y);
}

function drawAvatar(item, x, y, size) {
    const image = item.avatarUrl ? avatarImages[item.avatarUrl] : null;

    context.save();
    context.beginPath();
    context.arc(x + size * 0.5, y + size * 0.5, size * 0.5, 0, Math.PI * 2);
    context.clip();
    if (image) {
        context.drawImage(image, x, y, size, size);
    } else {
        context.fillStyle = item.isSelf ? '#ffc44a' : '#7f8fa6';
        context.fillRect(x, y, size, size);
        context.fillStyle = '#ffffff';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText((item.nickname || '?').charAt(0), x + size * 0.5, y + size * 0.68);
    }
    context.restore();
}

function formatNickname(nickname) {
    const text = nickname || '匿名玩家';
    return text.length > 6 ? `${text.slice(0, 6)}..` : text;
}

function loadAvatarImages(dataList, callback) {
    const avatarUrls = dataList
        .map((item) => item && item.avatarUrl)
        .filter((url) => !!url && avatarImages[url] === undefined);
    if (avatarUrls.length <= 0) {
        callback();
        return;
    }

    let finishedCount = 0;
    const finishOne = () => {
        finishedCount += 1;
        if (finishedCount >= avatarUrls.length) callback();
    };

    avatarUrls.forEach((url) => {
        const image = createImage();
        if (!image) {
            avatarImages[url] = null;
            finishOne();
            return;
        }

        image.onload = () => {
            avatarImages[url] = image;
            finishOne();
        };
        image.onerror = (err) => {
            console.warn('OpenDataContext: avatar image load failed', url, err);
            avatarImages[url] = null;
            finishOne();
        };
        image.src = url;
    });
}

function drawRankList(dataList, key) {
    if (!context || !sharedCanvas) return;
    clear();

    context.fillStyle = 'rgba(0, 0, 0, 0.62)';
    context.fillRect(0, 0, sharedCanvas.width, sharedCanvas.height);

    context.fillStyle = '#ffffff';
    context.font = '32px Arial';
    context.textAlign = 'center';
    context.fillText('好友排行榜', sharedCanvas.width * 0.5, 56);

    const sortedList = dataList
        .map((item) => {
            const kv = (item.KVDataList || []).find((data) => data.key === key);
            return {
                nickname: formatNickname(item.nickname),
                avatarUrl: item.avatarUrl,
                isSelf: !!item.isSelf,
                score: Number(kv && kv.value ? kv.value : 0),
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
    console.log('OpenDataContext: drawRankList data count', sortedList.length, sortedList);

    if (sortedList.length <= 0) {
        drawMessage('暂无好友排行数据');
        return;
    }

    context.font = '24px Arial';
    sortedList.forEach((item, index) => {
        const rank = index + 1;
        const y = 110 + index * 48;
        context.fillStyle = item.isSelf ? 'rgba(255, 220, 96, 0.58)' : index % 2 === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)';
        context.fillRect(40, y - 30, sharedCanvas.width - 80, 40);
        if (item.isSelf) {
            context.strokeStyle = 'rgba(255, 255, 255, 0.82)';
            context.lineWidth = 2;
            context.strokeRect(40, y - 30, sharedCanvas.width - 80, 40);
        }

        drawRankMark(rank, 58, y);
        drawAvatar(item, 104, y - 28, 36);

        context.fillStyle = '#ffffff';
        context.textAlign = 'left';
        context.fillText(item.nickname, 152, y);
        context.textAlign = 'right';
        context.fillText(String(item.score), sharedCanvas.width - 60, y);
    });
}

function getSelfCloudStorage(key, callback) {
    if (!runtime || !runtime.getUserCloudStorage) {
        callback(null);
        return;
    }

    runtime.getUserCloudStorage({
        keyList: [key],
        success: (res) => {
            callback({
                nickname: '我',
                KVDataList: res.KVDataList || [],
                isSelf: true,
            });
        },
        fail: (err) => {
            console.warn('OpenDataContext: getUserCloudStorage fail', err);
            callback(null);
        },
    });
}

function getCloudStorageValue(item, key) {
    const kv = (item && item.KVDataList || []).find((data) => data.key === key);
    return kv && kv.value ? String(kv.value) : '';
}

function hasSelfRankData(rankData, selfData, key) {
    if (!selfData) return true;
    const selfValue = getCloudStorageValue(selfData, key);
    if (!selfValue) return false;

    return rankData.some((item) => {
        if (item.isSelf) return true;
        return getCloudStorageValue(item, key) === selfValue;
    });
}

function buildRankData(friendData, selfData, key) {
    const rankData = friendData ? friendData.slice() : [];
    if (!hasSelfRankData(rankData, selfData, key)) {
        rankData.push(selfData);
    }
    return rankData;
}

function showFriendRank(key, width, height) {
    if (!runtime || !runtime.getFriendCloudStorage) {
        drawMessage('当前平台不支持好友排行榜');
        return;
    }

    setSharedCanvasSize(width, height);
    runtime.getFriendCloudStorage({
        keyList: [key],
        success: (res) => {
            console.log('OpenDataContext: getFriendCloudStorage success data', res.data);
            getSelfCloudStorage(key, (selfData) => {
                const rankData = buildRankData(res.data, selfData, key);
                console.log('OpenDataContext: merged rank data', rankData);
                drawRankList(rankData, key);
                loadMedalImages(() => drawRankList(rankData, key));
                loadAvatarImages(rankData, () => drawRankList(rankData, key));
            });
        },
        fail: () => {
            drawMessage('好友排行榜加载失败');
        },
    });
}

if (runtime && runtime.onMessage) {
    runtime.onMessage((message) => {
        if (!message || !message.type) return;
        if (message.type === 'showFriendRank') {
            showFriendRank(message.key || 'level', message.width, message.height);
        } else if (message.type === 'hideFriendRank') {
            clear();
        }
    });
}

drawMessage('等待排行榜数据');
