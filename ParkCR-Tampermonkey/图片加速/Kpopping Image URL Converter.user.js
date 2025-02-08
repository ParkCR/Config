// ==UserScript==
// @name         Kpopping Image URL Converter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在网页中将以 https://kpopping.com/documents/ 开头的图片 URL 进行替换
// @author       You
// @match        https://kpopping.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 随机生成 i0 - i3
    function getRandomPrefix() {
        const randomIndex = Math.floor(Math.random() * 4);
        return `i${randomIndex}`;
    }

    // 替换图片 URL 的函数
    function replaceImageUrl(image) {
        const imgSrc = image.src;
        if (imgSrc.startsWith('https://kpopping.com/documents/')) {
            const randomPrefix = getRandomPrefix();
            const replacedUrl = `https://${randomPrefix}.wp.com/${imgSrc.slice(8)}`;
            image.src = replacedUrl;
        }
    }

    // 处理页面上的所有图片元素
    function processImages() {
        const images = document.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            replaceImageUrl(images[i]);
        }
    }

    // 延迟初始化观察器
    function initObserver() {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        if (node.nodeName === 'IMG') {
                            replaceImageUrl(node);
                        }
                    }
                }
            }
        });

        const config = { childList: true, subtree: true };
        observer.observe(document.body, config);
    }

    // 页面加载完成后立即执行替换操作
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        processImages();
        initObserver();
    } else {
        window.addEventListener('load', () => {
            processImages();
            initObserver();
        });
    }
})();