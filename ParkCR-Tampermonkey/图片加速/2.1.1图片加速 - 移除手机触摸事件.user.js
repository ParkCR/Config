// ==UserScript==
// @name         Image URL Replacement Enhanced Version
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  在网页中将以指定前缀开头的图片URL进行替换，支持多个CDN节点选择，优化图片加载速度，并提供“加速全部图片”和“移除加速”功能
// @author       ParkCR&豆包 (改进版 by 通义)
// @match        *://*/*
// @exclude      https://kaifolog.net/*
// @exclude      https://fapreactor.com/*
// @exclude      https://*.boombo.biz/*
// @grant        none
// @changelog    2.1: 移除手机触摸事件
//               2.1: 封装悬浮按钮
//               2.0: 优化性能，增加全局移除加速效果
//               1.7: 优化性能，可自选部分加速还是全部加速
//               1.6: 优化性能，默认只加速未加载的图片版-仅对尚未加载或未完成加载的图片进行加速链接替换
//               1.5: 修改逻辑，默认脚本加载全页面图片都使用加速链接
//               1.3: 新增CDNjson节点
//               1.2: 新增Picseed节点
//               1.1: 新增ImageCDN节点
//               1.0: 新增Flyimg节点
//               0.9: 新增Wsrv节点
//               0.8: 保留选择节点自动替换和按钮点击替换功能，新增Weserv节点
//               0.7: 调整Daum节点逻辑，不再使用单独的daumRegex
//               0.6: 优化切换节点时清除之前替换效果的逻辑
//               0.5: 增加清除之前替换效果并恢复原网址的功能
//               0.4: 2025.2.9 支持livedoor博客，推特twimg
//               0.3: 2025.2.9 支持buondua,和图片聚合脚本冲突，要关掉它才生效
//               0.2: 2025.2.8 增加按钮，支持手动触发
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 存储原始图片URL的映射，用于恢复
    const originalUrls = new Map();

    // 构建正则表达式，匹配特定前缀的图片URL
    const prefixRegex = /^https:\/\/[^\/]+\.[^\/]+\/(wp-content|uploads\/posts|pics\/post)\//;
    const buonduaRegex = /^https?:\/\/(cdn.buondua.com\/.*)/;
    const livedoorRegex = /^https:\/\/(livedoor.blogimg.jp\/.*)/;
    const twimgRegex = /^https:\/\/(pbs.twimg.com\/.*)/;
    const blogspotRegex = /^http(s)?:\/\/\d\.bp\.blogspot\.com\/.*$/;

    // 随机生成i0 - i3
    function getRandomPrefix() {
        const randomIndex = Math.floor(Math.random() * 4);
        return `i${randomIndex}`;
    }

    // WP节点图片替换逻辑
    function wpReplaceImageUrl(imgSrc) {
        const randomPrefix = getRandomPrefix();
        return `https://${randomPrefix}.wp.com/${imgSrc.replace(/^https?:\/\//, '')}`;
    }

    // Daum节点图片替换逻辑
    function daumReplaceImageUrl(imgSrc) {
        return `https://t1.daumcdn.net/thumb/R2000x0/?fname=${imgSrc}`;
    }

    // Weserv节点图片替换逻辑
    function weservReplaceImageUrl(imgSrc) {
        return `https://images.weserv.nl/?url=${imgSrc}`;
    }

    // Wsrv节点图片替换逻辑
    function wsrvReplaceImageUrl(imgSrc) {
        return `https://wsrv.nl/?url=${imgSrc.replace(/^https?:\/\//, '')}`;
    }

    // Flyimg节点图片替换逻辑
    function flyimgReplaceImageUrl(imgSrc) {
        const encodedUrl = encodeURIComponent(imgSrc);
        return `https://demo.flyimg.io/upload/q_100/${encodedUrl}`;
    }

    // ImageCDN节点图片替换逻辑
    function imageCDNReplaceImageUrl(imgSrc) {
        const encodedUrl = encodeURIComponent(imgSrc);
        return `https://imagecdn.app/v2/image/${encodedUrl}`;
    }

    // Picseed节点图片替换逻辑
    function picseedReplaceImageUrl(imgSrc) {
        return `https://cdn1.picseed.com/?url=${imgSrc}`;
    }

    // CDNjson节点图片替换逻辑
    function cdnjsonReplaceImageUrl(imgSrc) {
        return `https://cdn.cdnjson.com/pic.html?url=${imgSrc}`;
    }

    // 恢复图片URL为原始地址
    function restoreOriginalUrls() {
        originalUrls.forEach((originalUrl, imgElement) => {
            if (imgElement.src !== originalUrl) { // 确保只恢复被修改过的链接
                imgElement.src = originalUrl;
            }
        });
        originalUrls.clear(); // 清空存储的映射
    }

    // 替换图片URL的函数
    function replaceImageUrl(image, selectedNode) {
        try {
            const imgSrc = image.src;
            const isMatch = prefixRegex.test(imgSrc) || buonduaRegex.test(imgSrc) || livedoorRegex.test(imgSrc) || twimgRegex.test(imgSrc) || blogspotRegex.test(imgSrc);

            if (isMatch) {
                let replacedUrl;
                if (selectedNode === 'WP') {
                    replacedUrl = wpReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Daum') {
                    replacedUrl = daumReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Weserv') {
                    replacedUrl = weservReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Wsrv') {
                    replacedUrl = wsrvReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Flyimg') {
                    replacedUrl = flyimgReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'ImageCDN') {
                    replacedUrl = imageCDNReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Picseed') {
                    replacedUrl = picseedReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'CDNjson') {
                    replacedUrl = cdnjsonReplaceImageUrl(imgSrc);
                }

                if (replacedUrl && imgSrc !== replacedUrl) {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc); // 存储原始链接
                    }
                    image.src = ''; // 清空 src，阻止默认加载行为
                    image.src = replacedUrl; // 设置加速链接
                    console.log(`Original URL: ${imgSrc}, Replaced URL: ${replacedUrl}`);
                }
            }
        } catch (error) {
            console.error('Error replacing image URL:', error);
        }
    }

    // 创建选择节点的下拉框
    const select = document.createElement('select');
    const wpOption = document.createElement('option');
    wpOption.value = 'WP';
    wpOption.textContent = 'WP节点';
    const daumOption = document.createElement('option');
    daumOption.value = 'Daum';
    daumOption.textContent = 'Daum节点';
    const weservOption = document.createElement('option');
    weservOption.value = 'Weserv';
    weservOption.textContent = 'Weserv节点';
    const wsrvOption = document.createElement('option');
    wsrvOption.value = 'Wsrv';
    wsrvOption.textContent = 'Wsrv节点';
    const flyimgOption = document.createElement('option');
    flyimgOption.value = 'Flyimg';
    flyimgOption.textContent = 'Flyimg节点';
    const imageCDNOption = document.createElement('option');
    imageCDNOption.value = 'ImageCDN';
    imageCDNOption.textContent = 'ImageCDN节点';
    const picseedOption = document.createElement('option');
    picseedOption.value = 'Picseed';
    picseedOption.textContent = 'Picseed节点';
    const cdnjsonOption = document.createElement('option');
    cdnjsonOption.value = 'CDNjson';
    cdnjsonOption.textContent = 'CDNjson节点';
    select.appendChild(wpOption);
    select.appendChild(daumOption);
    select.appendChild(weservOption);
    select.appendChild(wsrvOption);
    select.appendChild(flyimgOption);
    select.appendChild(imageCDNOption);
    select.appendChild(picseedOption);
    select.appendChild(cdnjsonOption);

    // 创建加速图片按钮
    const accelerateButton = document.createElement('button');
    accelerateButton.textContent = '加速图片';

    // 创建加速全部图片按钮
    const fullAccelerateButton = document.createElement('button');
    fullAccelerateButton.textContent = '加速全部图片';

    // 创建移除加速按钮
    const removeAccelerationButton = document.createElement('button');
    removeAccelerationButton.textContent = '移除加速';

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';

    // 创建模态窗口
    const modal = document.createElement('div');
    modal.id = 'image-url-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '10000';
    modal.style.left = '50%';
    modal.style.top = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.border = '1px solid #ccc';
    modal.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    modal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    modal.style.opacity = '0';
    modal.style.maxWidth = '90%';
    modal.style.width = '350px';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.gap = '15px';

    // 添加元素到模态窗口
    modal.appendChild(select);
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.gap = '10px';
    buttonContainer.appendChild(accelerateButton);
    buttonContainer.appendChild(fullAccelerateButton);
    buttonContainer.appendChild(removeAccelerationButton);
    buttonContainer.appendChild(closeButton);
    modal.appendChild(buttonContainer);

    // 创建可拖拽的圆形按钮
    const dragButton = document.createElement('div');
    dragButton.textContent = '加速';
    dragButton.style.position = 'fixed';
    dragButton.style.top = '10px';
    dragButton.style.left = '10px';
    dragButton.style.zIndex = '9999';
    dragButton.style.backgroundColor = '#007BFF';
    dragButton.style.color = '#fff';
    dragButton.style.width = '50px';
    dragButton.style.height = '50px';
    dragButton.style.borderRadius = '50%';
    dragButton.style.display = 'flex';
    dragButton.style.justifyContent = 'center';
    dragButton.style.alignItems = 'center';
    dragButton.style.cursor = 'move';

    // 实现拖拽功能
    let isDragging = false;
    let offsetX, offsetY;
    dragButton.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - dragButton.offsetLeft;
        offsetY = e.clientY - dragButton.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            dragButton.style.left = `${e.clientX - offsetX}px`;
            dragButton.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // 双击打开模态窗口
    dragButton.addEventListener('dblclick', () => {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    });

    // 点击关闭按钮关闭模态窗口
    closeButton.addEventListener('click', () => {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });

    // 点击页面空白处关闭模态窗口
    document.addEventListener('click', (e) => {
        if (e.target!== modal &&!modal.contains(e.target) && e.target!== dragButton) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });

    // 确保在 body 存在时插入按钮和模态窗口
    function insertElements() {
        if (document.body) {
            document.body.appendChild(dragButton);
            document.body.appendChild(modal);
        } else {
            setTimeout(insertElements, 100); // 如果 body 尚未加载，则稍后再试
        }
    }
    insertElements();

    // 监听下拉框选择变化
    select.addEventListener('change', function () {
        const selectedNode = this.value;
        restoreOriginalUrls(); // 切换节点时，先恢复所有图片为原始链接
        processImages(selectedNode); // 再应用新的加速逻辑
    });

    // 为加速图片按钮添加点击事件监听器
    accelerateButton.addEventListener('click', function () {
        const selectedNode = select.value;
        restoreOriginalUrls(); // 点击加速图片按钮时，先恢复所有图片为原始链接
        processImages(selectedNode); // 再应用新的加速逻辑
    });

    // 为加速全部图片按钮添加点击事件监听器
    fullAccelerateButton.addEventListener('click', function () {
        const selectedNode = select.value;
        restoreOriginalUrls(); // 点击加速全部图片按钮时，先恢复所有图片为原始链接
        forceProcessAllImages(selectedNode); // 再应用新的加速逻辑
    });

    // 为移除加速按钮添加点击事件监听器
    removeAccelerationButton.addEventListener('click', function () {
        restoreOriginalUrls(); // 恢复所有图片为原始链接
    });

    // 处理页面上的所有图片元素（跳过已加载图片）
    function processImages(selectedNode) {
        const images = document.querySelectorAll('img');
        images.forEach((image) => {
            if (!image.complete || image.naturalWidth <= 0) { // 跳过已加载完成的图片
                replaceImageUrl(image, selectedNode);
            }
        });
    }

    // 强制处理所有图片元素（包括已加载图片）
    function forceProcessAllImages(selectedNode) {
        const images = document.querySelectorAll('img');
        images.forEach((image) => {
            replaceImageUrl(image, selectedNode); // 不跳过任何图片
        });
    }

    // 创建一个 MutationObserver 实例
    const observer = new MutationObserver((mutationsList) => {
        const selectedNode = select.value || 'WP'; // 默认使用 WP 节点
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = mutation.addedNodes;
                for (const node of addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
                        const img = node;
                        if (!img.src || img.src.startsWith('data:')) continue; // 忽略 base64 图片
                        replaceImageUrl(img, selectedNode); // 替换为加速链接
                    }
                }
            }
        }
    });

    // 配置观察选项
    const config = { childList: true, subtree: true };

    // 开始观察 document.body
    function startObserving() {
        if (document.body) {
            observer.observe(document.body, config);
        } else {
            setTimeout(startObserving, 100); // 如果 body 尚未加载，则稍后再试
        }
    }
    startObserving();

    // 页面DOM解析完成后，默认使用WP节点进行替换
    document.addEventListener('DOMContentLoaded', function () {
        select.value = 'WP';
        processImages('WP'); // 默认行为：跳过已加载完成的图片
    });
})();