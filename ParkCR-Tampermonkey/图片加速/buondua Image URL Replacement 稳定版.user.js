// ==UserScript==
// @name         buondua Image URL Replacement 稳定版
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在网页中将以 https://cdn.buondua.com/ 开头的图片 URL 进行替换
// @author       ParkCR&豆包
// @match        *://*/*
// @exclude      https://kaifolog.net/*
// @exclude      https://fapreactor.com/*
// @exclude      https://*.boombo.biz/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 构建正则表达式，匹配 https://cdn.buondua.com/ 格式
    const prefixRegex = /^https:\/\/cdn.buondua.com\//;

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
        images.forEach((image) => {
            replaceImageUrl(image);
            // 监听图片加载完成事件，再次检查并替换 URL
            image.addEventListener('load', () => {
                replaceImageUrl(image);
            });
        });
    }

    // 多次尝试处理页面图片，应对初始加载不完全问题
    const maxAttempts = 10;
    let attempts = 0;
    const intervalId = setInterval(() => {
        processImages();
        attempts++;
        if (attempts >= maxAttempts) {
            clearInterval(intervalId);
        }
    }, 1500);

    // 监听 DOM 变化，以处理动态加载的图片
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'IMG') {
                        replaceImageUrl(node);
                        node.addEventListener('load', () => {
                            replaceImageUrl(node);
                        });
                    } else if (node.querySelectorAll) {
                        const nestedImages = node.querySelectorAll('img');
                        nestedImages.forEach((nestedImage) => {
                            replaceImageUrl(nestedImage);
                            nestedImage.addEventListener('load', () => {
                                replaceImageUrl(nestedImage);
                            });
                        });
                    }
                });
            }
        }
    });

    // 配置观察选项
    const config = { childList: true, subtree: true };
    // 开始观察文档的 body 元素
    observer.observe(document.body, config);

})();