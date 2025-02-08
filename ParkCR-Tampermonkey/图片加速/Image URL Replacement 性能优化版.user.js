// ==UserScript==
// @name         Image URL Replacement 性能优化版
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在网页中将以指定前缀开头的图片 URL 进行替换
// @author       ParkCR&豆包
// @match        *://*/*
// @exclude      https://kaifolog.net/*
// @exclude      https://fapreactor.com/*
// @exclude      https://*.boombo.biz/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 构建正则表达式，匹配 https://任意字符.任意字符/(wp-content|uploads/posts|pics/post)/ 格式
    const prefixRegex = /^https:\/\/[^\/]+\.[^\/]+\/(wp-content|uploads\/posts|pics\/post)\//;

    // 随机生成 i0 - i3
    function getRandomPrefix() {
        const randomIndex = Math.floor(Math.random() * 4);
        return `i${randomIndex}`;
    }

    // 替换图片 URL 的函数
    function replaceImageUrl(image) {
        try {
            const imgSrc = image.src;
            if (prefixRegex.test(imgSrc)) {
                const randomPrefix = getRandomPrefix();
                const replacedUrl = `https://${randomPrefix}.wp.com/${imgSrc.replace(/^https:\/\//, '')}`;
                image.src = replacedUrl;
            }
        } catch (error) {
            console.error('Error replacing image URL:', error);
        }
    }

    // 处理页面上的所有图片元素
    function processImages() {
        const images = document.querySelectorAll('img');
        images.forEach(replaceImageUrl);
    }

    // 批量处理新增的图片节点
    let pendingImages = [];
    function processPendingImages() {
        if (pendingImages.length > 0) {
            pendingImages.forEach(replaceImageUrl);
            pendingImages = [];
        }
    }

    // 页面加载完成后立即执行替换操作
    processImages();

    // 监听 DOM 变化，以处理动态加载的图片
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'IMG') {
                        pendingImages.push(node);
                    }
                });
            }
        }
        // 使用 requestAnimationFrame 批量处理新增的图片节点
        requestAnimationFrame(processPendingImages);
    });

    // 配置观察选项
    const config = { childList: true, subtree: true };
    // 开始观察文档的 body 元素
    observer.observe(document.body, config);

})();