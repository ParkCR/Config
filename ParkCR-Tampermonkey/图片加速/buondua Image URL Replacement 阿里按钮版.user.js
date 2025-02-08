// ==UserScript==
// @name         buondua Image URL Replacement 阿里按钮版
// @namespace    http://tampermonkey.net/
// @version      0.2
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
    const prefixRegex = /^https:\/\/cdn\.buondua\.com\//;

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

    // 创建按钮
    function createButton() {
        const button = document.createElement('button');
        button.textContent = 'Replace Images';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.left = '10px';
        button.style.zIndex = '9999';
        button.addEventListener('click', processImages);
        document.body.appendChild(button);
    }

    // 初始化按钮
    createButton();

})();



