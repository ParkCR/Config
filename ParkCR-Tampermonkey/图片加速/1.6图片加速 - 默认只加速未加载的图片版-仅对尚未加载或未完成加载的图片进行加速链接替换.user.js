// ==UserScript==
// @name         Image URL Replacement Optimized Version
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  在网页中将以指定前缀开头的图片URL进行替换，支持多个CDN节点选择，优化图片加载速度，并跳过已加载的图片
// @author       ParkCR&豆包 (改进版 by 通义)
// @match        *://*/*
// @exclude      https://kaifolog.net/*
// @exclude      https://fapreactor.com/*
// @exclude      https://*.boombo.biz/*
// @grant        none
// @changelog    1.6: 优化性能，默认只加速未加载的图片版-仅对尚未加载或未完成加载的图片进行加速链接替换
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
            imgElement.src = originalUrl;
        });
        originalUrls.clear();
    }

    // 替换图片URL的函数
    function replaceImageUrl(image, selectedNode) {
        try {
            // 如果图片已经加载完成，则跳过处理
            if (image.complete || image.naturalWidth > 0) {
                return;
            }

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

                if (replacedUrl) {
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

    // 创建重新处理图片按钮
    const button = document.createElement('button');
    button.textContent = '替换图片';

    // 创建容器并添加样式
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.zIndex = '9999';
    container.style.backgroundColor = '#fff';
    container.style.padding = '10px';
    container.style.border = '1px solid #ccc';
    container.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    container.appendChild(select);
    container.appendChild(button);

    // 确保在 body 存在时插入容器
    function insertContainer() {
        if (document.body) {
            document.body.appendChild(container);
        } else {
            setTimeout(insertContainer, 100); // 如果 body 尚未加载，则稍后再试
        }
    }
    insertContainer();

    // 监听下拉框选择变化
    select.addEventListener('change', function () {
        const selectedNode = this.value;
        processImages(selectedNode);
    });

    // 为按钮添加点击事件监听器
    button.addEventListener('click', function () {
        const selectedNode = select.value;
        processImages(selectedNode);
    });

    // 处理页面上的所有图片元素
    function processImages(selectedNode) {
        restoreOriginalUrls(); // 恢复原始链接
        const images = document.querySelectorAll('img');
        images.forEach((image) => {
            replaceImageUrl(image, selectedNode);
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
        processImages('WP');
    });
})();