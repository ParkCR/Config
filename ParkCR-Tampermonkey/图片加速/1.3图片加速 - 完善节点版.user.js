// ==UserScript==
// @name         Image URL Replacement 节点稳定版
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  在网页中将以指定前缀开头的图片URL进行替换，支持WP、Daum、Weserv、Wsrv、Flyimg、ImageCDN、Picseed和CDNjson节点选择，具备自动和手动替换功能
// @author       ParkCR&豆包
// @match        *://*/*
// @exclude      https://kaifolog.net/*
// @exclude      https://fapreactor.com/*
// @exclude      https://*.boombo.biz/*
// @grant        none
// @changelog    1.3: 新增CDNjson节点
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
// ==/UserScript==
(function () {
    'use strict';
    // 存储原始图片URL的映射，用于恢复
    const originalUrls = new Map();

    // 构建正则表达式，匹配https://任意字符.任意字符/(wp-content|uploads/posts|pics/post)/格式
    const prefixRegex = /^https:\/\/[^\/]+\.[^\/]+\/(wp-content|uploads\/posts|pics\/post)\//;
    // 新增匹配cdn.buondua.com的正则表达式
    const buonduaRegex = /^https?:\/\/(cdn.buondua.com\/.*)/;
    // 新增匹配livedoor.blogimg.jp的正则表达式
    const livedoorRegex = /^https:\/\/(livedoor.blogimg.jp\/.*)/;
    // 新增匹配pbs.twimg.com的正则表达式
    const twimgRegex = /^https:\/\/(pbs.twimg.com\/.*)/;
    // 新增匹配 http(s)?://\d\.bp\.blogspot\.com/ 的正则表达式
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
            const imgSrc = image.src;
            const isMatch = prefixRegex.test(imgSrc) || buonduaRegex.test(imgSrc) || livedoorRegex.test(imgSrc) || twimgRegex.test(imgSrc) || blogspotRegex.test(imgSrc);
            console.log(`Checking URL: ${imgSrc}, Match: ${isMatch}`);
            if (isMatch) {
                let replacedUrl;
                if (selectedNode === 'WP') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = wpReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Daum') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = daumReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Weserv') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = weservReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Wsrv') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = wsrvReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Flyimg') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = flyimgReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'ImageCDN') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = imageCDNReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'Picseed') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = picseedReplaceImageUrl(imgSrc);
                } else if (selectedNode === 'CDNjson') {
                    if (!originalUrls.has(image)) {
                        originalUrls.set(image, imgSrc);
                    }
                    replacedUrl = cdnjsonReplaceImageUrl(imgSrc);
                }

                if (replacedUrl) {
                    image.src = replacedUrl;
                    console.log(`Original URL: ${imgSrc}, Replaced URL: ${replacedUrl}`);
                }
            }
        } catch (error) {
            console.error('Error replacing image URL:', error);
        }
    }

    // 处理页面上的所有图片元素
    function processImages(selectedNode) {
        restoreOriginalUrls();
        const images = document.querySelectorAll('img');
        console.log(`Found ${images.length} images to process.`);
        images.forEach((image) => {
            console.log(`Processing image: ${image.src}`);
            replaceImageUrl(image, selectedNode);
        });
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

    // 将下拉框和按钮插入到body的开头
    const container = document.createElement('div');
    container.appendChild(select);
    container.appendChild(button);
    if (document.body.firstChild) {
        document.body.insertBefore(container, document.body.firstChild);
    } else {
        document.body.appendChild(container);
    }

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

    // 页面DOM解析完成后，默认使用WP节点进行替换
    document.addEventListener('DOMContentLoaded', function () {
        select.value = 'WP';
        setTimeout(() => {
            processImages('WP');
        }, 500);
    });

    // 创建一个 MutationObserver 实例
    const observer = new MutationObserver((mutationsList) => {
        const selectedNode = select.value;
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = mutation.addedNodes;
                for (const node of addedNodes) {
                    if (node.nodeName === 'IMG') {
                        replaceImageUrl(node, selectedNode);
                    }
                }
            }
        }
    });

    // 配置观察选项
    const config = { childList: true, subtree: true };

    // 开始观察 document.body
    observer.observe(document.body, config);

})();