// ==UserScript==
// @name         媒体链接导出支持打包版
// @namespace    Home
// @version      2.0.7
// @description  点击按钮获取当前页面的所有媒体链接，并提供导出功能
// @author       ParkCR 豆包
// @match        *://*/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @changelog    2.0.7: 2025.2.26 支持直接直接下载和打包下载，暂不支持gif,mp4文件下载
//               2.0.3: 2025.2.8 支持直接导出瀑布流html文件
//               2.0.2: 2025.2.8 支持按尺寸筛选，默认从大到小
//               2.0.1: 2025.2.8 修复模态窗口重复的空白对象，在获取媒体元素时，过滤掉那些样式中设置了 display: none 的元素，避免将不可见的元素添加到模态窗口中
//               2.0.0: 2025.2.8 新增分享按钮，点击可分享勾选媒体链接地址
//               1.9.9: 2025.2.7 新增复制按钮，修改关闭按钮位置，新增打开功能，调整模态背景透明度，模态背景适配手机端大小
// ==/UserScript==

(function() {
    'use strict';

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 创建按钮
    function createButton() {
        const button = document.createElement('button');
        button.innerText = '获取媒体链接';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.width = '150px'; // 固定宽度
        button.style.height = '50px'; // 固定高度
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#007bff';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'default'; // 默认鼠标图标
        button.style.zIndex = '1001';
        button.style.boxSizing = 'border-box'; // 确保内边距不影响尺寸

        // 拖动功能
        let isDragging = false;
        let offsetX, offsetY;

        // 检查鼠标是否在按钮的左下方
        function isMouseInDragArea(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const dragAreaWidth = 20; // 左侧可拖动区域的宽度
            const dragAreaHeight = 20; // 下方可拖动区域的高度
            return x < dragAreaWidth || y > rect.height - dragAreaHeight;
        }

        button.addEventListener('mousedown', (e) => {
            if (isMouseInDragArea(e)) {
                isDragging = true;
                offsetX = e.clientX - button.offsetLeft;
                offsetY = e.clientY - button.offsetTop;
                button.style.userSelect = 'none'; // 防止文本被选中
                e.preventDefault(); // 阻止默认行为，防止文本选中等
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                button.style.left = `${e.clientX - offsetX}px`;
                button.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            button.style.userSelect = ''; // 恢复文本选择
        });

        // 只有直接点击按钮才打开模态窗口
        button.addEventListener('click', (e) => {
            if (!isDragging && !isMouseInDragArea(e)) {
                openModal();
            }
        });

        // 改变鼠标图标
        button.addEventListener('mousemove', (e) => {
            if (isMouseInDragArea(e)) {
                button.style.cursor = 'move'; // 设置鼠标指针为移动图标
            } else {
                button.style.cursor = 'default'; // 恢复默认鼠标图标
            }
        });

        document.body.appendChild(button);
    }

    // 打开主模态窗口
    function openModal() {
        const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1002';
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s, transform 0.3s';
    modal.style.transform = 'scale(0.9)';

    const modalContent = document.createElement('div');
    // 为模态内容添加最大宽度和最大高度，确保在移动端不会溢出屏幕
    // 同时使用 max-width 和 max-height 结合视口单位 vw 和 vh，使其能根据屏幕大小自适应
    modalContent.style.background = 'rgba(255, 255, 255, 0.65)'; // 白色背景，透明度 0.8，可按需调整
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    // 最大宽度设置为视口宽度的 90%
    modalContent.style.maxWidth = '90vw';
    // 最大高度设置为视口高度的 90%
    modalContent.style.maxHeight = '90vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.boxSizing = 'border-box';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        modalContent.appendChild(header);

        const title = document.createElement('h2');
        title.innerText = '媒体链接管理';
        header.appendChild(title);

        // 新增：创建一个用于显示勾选数量的元素
        const selectedCountLabel = document.createElement('span');
        selectedCountLabel.style.marginLeft = '20px';
        // 初始显示勾选数量为 0
        selectedCountLabel.innerText = `已勾选: 0`;
        header.appendChild(selectedCountLabel);

        //const closeButton = createStyledButton('关闭', () => closeModal(modal)); 原关闭按钮
        //header.appendChild(closeButton);

        // 第一排：搜索框
        const searchRow = document.createElement('div');
        searchRow.style.display = 'flex';
        searchRow.style.justifyContent = 'center';
        searchRow.style.marginBottom = '20px';
        modalContent.appendChild(searchRow);

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '搜索媒体类型';
        searchInput.style.padding = '5px';
        searchInput.style.width = '200px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.borderRadius = '5px';
        searchInput.style.boxSizing = 'border-box';
        searchInput.addEventListener('input', debounce(() => filterMedia(), 300));
        searchRow.appendChild(searchInput);

        //创建按尺寸筛选按钮   2025.2.8 支持按尺寸筛选，默认从大到小
        const sortBySizeButton = createStyledButton('按尺寸排序', () => {
            if (sortBySizeButton.innerText === '按尺寸排序') {
                // 点击后切换按钮文本
                sortBySizeButton.innerText = '恢复排序';
                // 调用按尺寸排序函数
                sortMediaBySize();
            } else {
                // 再次点击切换按钮文本
                sortBySizeButton.innerText = '按尺寸排序';
                // 恢复初始过滤排序
                filterMedia();
            }
        });
        // 尺寸筛选部分按钮距离搜索框10px，避免拥挤
        sortBySizeButton.style.marginLeft = '10px';
        searchRow.appendChild(sortBySizeButton);

        // 尺寸筛选部分
        const sizeFilterContainer = document.createElement('div');
        sizeFilterContainer.style.display = 'flex';
        sizeFilterContainer.style.alignItems = 'center';
        sizeFilterContainer.style.justifyContent = 'center'; // 居中对齐
        sizeFilterContainer.style.marginBottom = '20px';

        const minWidthLabel = document.createElement('label');
        minWidthLabel.innerText = '最小宽度:';
        sizeFilterContainer.appendChild(minWidthLabel);

        const minWidthSlider = document.createElement('input');
        minWidthSlider.type = 'range';
        minWidthSlider.min = '0';
        minWidthSlider.max = '2000';
        minWidthSlider.value = '0';
        minWidthSlider.style.width = '150px';
        // 使用防抖处理
        minWidthSlider.oninput = debounce(updateSizeValues, 300);
        sizeFilterContainer.appendChild(minWidthSlider);

        const minWidthValue = document.createElement('span');
        minWidthValue.innerText = minWidthSlider.value;
        sizeFilterContainer.appendChild(minWidthValue);

        const minHeightLabel = document.createElement('label');
        minHeightLabel.innerText = '最小高度:';
        sizeFilterContainer.appendChild(minHeightLabel);

        const minHeightSlider = document.createElement('input');
        minHeightSlider.type = 'range';
        minHeightSlider.min = '0';
        minHeightSlider.max = '2000';
        minHeightSlider.value = '0';
        minHeightSlider.style.width = '150px';
        // 使用防抖处理
        minHeightSlider.oninput = debounce(updateSizeValues, 300);
        sizeFilterContainer.appendChild(minHeightSlider);

        const minHeightValue = document.createElement('span');
        minHeightValue.innerText = minHeightSlider.value;
        sizeFilterContainer.appendChild(minHeightValue);

        // 更新尺寸值
        function updateSizeValues() {
            minWidthValue.innerText = minWidthSlider.value;
            minHeightValue.innerText = minHeightSlider.value;
            filterMedia();
        }

        modalContent.appendChild(sizeFilterContainer);

        // 第三排：按钮组
        const buttonsRow = document.createElement('div');
        buttonsRow.style.display = 'flex';
        buttonsRow.style.justifyContent = 'center';
        buttonsRow.style.gap = '10px';
        buttonsRow.style.marginBottom = '20px';
        modalContent.appendChild(buttonsRow);

        const selectAllButton = createStyledButton('全选', () => selectAllCheckboxes(true));
        buttonsRow.appendChild(selectAllButton);

        const deselectAllButton = createStyledButton('反选', () => selectAllCheckboxes(false));
        buttonsRow.appendChild(deselectAllButton);

        const exportButton = createStyledButton('导出', () => exportSelectedMedia(modal));
        buttonsRow.appendChild(exportButton);

        // 添加复制按钮
        const copyButton = createStyledButton('复制', () => copySelectedMedia());
        buttonsRow.appendChild(copyButton);

        // 分享选中的媒体链接
        function shareSelectedMedia() {
        // 过滤出被选中的复选框，并提取其对应的媒体链接
        const selectedMedia = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
            if (selectedMedia.length > 0) {
                if (navigator.share) {
                    // 将选中的媒体链接用换行符连接成一个字符串
                    const shareText = selectedMedia.join('\n');
                    navigator.share({
                        title: '分享媒体链接',
                        text: shareText
                    })
                   .then(() => console.log('分享成功'))
                   .catch((error) => console.error('分享失败:', error));
                } else {
                    alert('当前浏览器不支持分享功能。');
                }
            } else {
                alert('请至少选择一个媒体链接！');
            }
        }

        // 在按钮组中新增分享按钮
        const shareButton = createStyledButton('分享', shareSelectedMedia);
        buttonsRow.appendChild(shareButton);

// 处理单个图片，返回 Promise
function processSingleImage(mediaSrc) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            try {
                ctx.drawImage(img, 0, 0);
                const ext = mediaSrc.split('.').pop().toLowerCase();
                let mimeType;
                switch (ext) {
                    case 'jpg':
                    case 'jpeg':
                        mimeType = 'image/jpeg';
                        break;
                    case 'png':
                        mimeType = 'image/png';
                        break;
                    case 'gif':
                        mimeType = 'image/gif';
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        break;
                    default:
                        mimeType = 'image/png'; // 默认使用 PNG 格式
                }
                const dataUri = canvas.toDataURL(mimeType);
                const byteCharacters = atob(dataUri.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const fileName = cleanFileName(mediaSrc.split('/').pop());
                resolve({ byteArray, fileName, mimeType });
            } catch (e) {
                console.error("Canvas is tainted:", e);
                alert(`无法下载图片: ${mediaSrc} (跨域污染)`);
                reject(new Error(`无法处理图片: ${mediaSrc}`));
            }
        };

        img.onerror = () => {
            alert(`无法加载图片: ${mediaSrc}`);
            reject(new Error(`无法加载图片: ${mediaSrc}`));
        };

        img.src = mediaSrc;
    });
}

// 下载选中的媒体文件（单独下载）
function downloadSelectedMedia() {
    const selectedMedia = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

    if (selectedMedia.length === 0) {
        alert('请至少选择一个媒体！');
        return;
    }

    selectedMedia.forEach(async (mediaSrc) => {
        try {
            const { byteArray, fileName, mimeType } = await processSingleImage(mediaSrc);
            const blob = new Blob([byteArray], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        }
    });
}

// 打包下载选中的媒体文件
function downloadSelectedMediaInZip() {
    const selectedMedia = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

    if (selectedMedia.length === 0) {
        alert('请至少选择一个媒体！');
        return;
    }

    const zip = new JSZip();
    const promises = selectedMedia.map(processSingleImage);

    Promise.allSettled(promises).then((results) => {
        let successCount = 0;
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                const { byteArray, fileName, mimeType } = result.value;
                zip.file(fileName, byteArray, { binary: true, type: mimeType });
                successCount++;
            }
        });

        if (successCount > 0) {
            zip.generateAsync({ type: 'blob' }).then((content) => {
                const a = document.createElement('a');
                a.style.display = 'none';
                const url = URL.createObjectURL(content);
                a.href = url;
                a.download = 'selected_images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                if (successCount === selectedMedia.length) {
                    alert('所有选中的媒体文件已打包下载完成！');
                } else {
                    alert('部分选中的媒体文件已打包下载完成！');
                }
            });
        }
    });
}

// 清理文件名，去除非法字符
function cleanFileName(name) {
    return name.replace(/[\\/*?:"<>|]/g, '');
}

        // 在按钮组中新增下载按钮
        const downloadButton = createStyledButton('下载', downloadSelectedMedia);
        buttonsRow.appendChild(downloadButton);

        // 在按钮组中新增打包下载按钮
        const zipDownloadButton = createStyledButton('打包下载', downloadSelectedMediaInZip);
        buttonsRow.appendChild(zipDownloadButton);

        const pasteLinkButton = createStyledButton('粘贴链接', () => openPasteLinkModal(modal));
        buttonsRow.appendChild(pasteLinkButton);

        // 创建关闭按钮，将其移到粘贴链接按钮旁边
        const closeButtonInRow = createStyledButton('关闭', () => closeModal(modal));
        buttonsRow.appendChild(closeButtonInRow);

        const mediaListContainer = document.createElement('div');
        mediaListContainer.style.display = 'grid';
        mediaListContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        mediaListContainer.style.gap = '10px';
        mediaListContainer.style.marginBottom = '20px';
        modalContent.appendChild(mediaListContainer);

        const mediaElements = Array.from(document.querySelectorAll('img, video, source[type="image/gif"]'));
        const checkboxes = [];
        let lastClickedCheckbox = null;

        // 缓存媒体类型
        const mediaTypesCache = {};

        function getMediaType(media) {
            const key = media.src || media.currentSrc || media.getAttribute('data-src') || media.parentNode.src;
            if (mediaTypesCache[key]) {
                return mediaTypesCache[key];
            }
            let mediaType = '';
            if (media.tagName === 'IMG') {
                mediaType = media.src.split(';').pop().split('/').pop().split('?')[0].split('.').pop();
            } else if (media.tagName === 'VIDEO') {
                mediaType = media.currentSrc.split(';').pop().split('/').pop().split('?')[0].split('.').pop();
            } else if (media.tagName === 'SOURCE' && media.type === 'image/gif') {
                mediaType = 'gif';
            } else {
                mediaType = 'unknown';
            }
            mediaTypesCache[key] = mediaType;
            return mediaType;
        }
        // 2025.2.8 修复模态窗口重复的空白对象，在获取媒体元素时，过滤掉那些样式中设置了 display: none 的元素，避免将不可见的元素添加到模态窗口中
        function filterMedia() {
            const searchValue = searchInput.value.trim().toLowerCase(); // 获取搜索框内容
            const minWidth = parseInt(minWidthSlider.value, 10);
            const minHeight = parseInt(minHeightSlider.value, 10);

            // 批量更新DOM
            const fragment = document.createDocumentFragment();
            // 清空复选框数组，避免重复添加
            checkboxes.length = 0;
            // 用于存储已经添加过的媒体链接
            const addedMediaLinks = new Set();

            // 过滤掉样式中设置了 display: none 的媒体元素
            const visibleMediaElements = mediaElements.filter(media => {
                const computedStyle = window.getComputedStyle(media);
                return computedStyle.display !== 'none';
            });

            visibleMediaElements.forEach((media, index) => {
                const isImage = media.tagName === 'IMG' || (media.tagName === 'SOURCE' && media.type === 'image/gif');
                const isVideo = media.tagName === 'VIDEO';
                const mediaType = getMediaType(media);

                // 获取媒体源
                const mediaSrc = media.src || media.currentSrc || media.getAttribute('data-src') || (media.parentNode && media.parentNode.src);

                // 检查媒体源是否有效且未被添加过
                if (mediaSrc && !addedMediaLinks.has(mediaSrc)) {
                    if (
                        (searchValue === '' || mediaType.endsWith(searchValue)) &&
                        (isImage ? media.naturalWidth >= minWidth && media.naturalHeight >= minHeight : true)
                    ) {
                        // 克隆媒体元素
                        const mediaElement = isImage ? media.cloneNode() : media.cloneNode();
                        mediaElement.style.maxWidth = '100%';
                        mediaElement.style.height = 'auto';

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.value = mediaSrc;
                        checkboxes.push(checkbox);

                        const mediaWrapper = document.createElement('div');
                        mediaWrapper.style.position = 'relative';
                        mediaWrapper.style.cursor = 'pointer';

                        // 处理媒体加载错误事件
                        mediaElement.onerror = () => {
                            console.error(`Failed to load media: ${mediaSrc}`);
                            // 若加载失败，移除该媒体包装元素
                            if (mediaWrapper.parentNode) {
                                mediaWrapper.parentNode.removeChild(mediaWrapper);
                            }
                        };

                        mediaWrapper.appendChild(mediaElement);

                        // 复选框放在媒体的右上角
                        checkbox.style.position = 'absolute';
                        checkbox.style.top = '0';
                        checkbox.style.right = '0';
                        checkbox.style.zIndex = '1';
                        mediaWrapper.appendChild(checkbox);

                        // 添加格式标签
                        const formatLabel = document.createElement('div');
                        formatLabel.style.position = 'absolute';
                        formatLabel.style.top = '0';
                        formatLabel.style.left = '0';
                        formatLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        formatLabel.style.color = '#fff';
                        formatLabel.style.padding = '2px 5px';
                        formatLabel.style.borderRadius = '3px';
                        formatLabel.style.fontSize = '12px';
                        formatLabel.style.zIndex = '2';
                        formatLabel.innerText = mediaType;
                        mediaWrapper.appendChild(formatLabel);

                        // 鼠标悬停显示尺寸
                        const sizeLabel = document.createElement('div');
                        sizeLabel.style.position = 'absolute';
                        sizeLabel.style.bottom = '0';
                        sizeLabel.style.left = '0';
                        sizeLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        sizeLabel.style.color = '#fff';
                        sizeLabel.style.padding = '2px 5px';
                        sizeLabel.style.borderRadius = '3px';
                        sizeLabel.style.fontSize = '12px';
                        sizeLabel.style.zIndex = '2';
                        sizeLabel.innerText = `${media.naturalWidth}x${media.naturalHeight}`;
                        sizeLabel.style.display = 'none';
                        sizeLabel.style.width = '100%';
                        sizeLabel.style.textAlign = 'center';
                        mediaWrapper.appendChild(sizeLabel);

                        // 创建打开链接小标签
                        const openLinkLabel = document.createElement('div');
                        openLinkLabel.style.position = 'absolute';
                        openLinkLabel.style.bottom = '25px'; // 确保不遮挡尺寸标签
                        openLinkLabel.style.left = '0';
                        openLinkLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        openLinkLabel.style.color = '#fff';
                        openLinkLabel.style.padding = '2px 5px';
                        openLinkLabel.style.borderRadius = '3px';
                        openLinkLabel.style.fontSize = '12px';
                        openLinkLabel.style.zIndex = '3'; // 确保在尺寸标签之上
                        openLinkLabel.style.cursor = 'pointer';
                        openLinkLabel.style.display = 'none'; // 初始隐藏
                        openLinkLabel.innerText = 'Open';

                        // 为小标签添加点击事件，在新标签页打开链接
                        openLinkLabel.addEventListener('click', () => {
                            window.open(mediaSrc, '_blank');
                        });

                        mediaWrapper.appendChild(openLinkLabel);

                        // 修改鼠标悬停和移出事件，同时控制打开链接标签和尺寸标签的显示与隐藏
                        mediaWrapper.onmouseover = () => {
                            sizeLabel.style.display = 'block';
                            openLinkLabel.style.display = 'block';
                        };
                        mediaWrapper.onmouseout = () => {
                            sizeLabel.style.display = 'none';
                            openLinkLabel.style.display = 'none';
                        };

                        // 点击媒体切换复选框状态
                        mediaWrapper.onclick = (event) => {
                            const shiftKey = event.shiftKey;
                            const checkboxIndex = checkboxes.indexOf(checkbox);

                            if (shiftKey && lastClickedCheckbox) {
                                const start = Math.min(lastClickedCheckbox.index, checkboxIndex);
                                const end = Math.max(lastClickedCheckbox.index, checkboxIndex);
                                for (let i = start; i <= end; i++) {
                                    checkboxes[i].checked = true;
                                    updateMediaBorder(checkboxes[i], checkboxes[i].parentElement.querySelector('img, video'));
                                }
                            } else {
                                checkbox.checked = !checkbox.checked;
                                updateMediaBorder(checkbox, mediaElement);
                            }
                            lastClickedCheckbox = { checkbox, index: checkboxIndex };
                            // 新增：更新勾选数量显示
                                updateSelectedCount();
                        };

                        fragment.appendChild(mediaWrapper);
                        // 将当前媒体链接添加到已添加集合中
                        addedMediaLinks.add(mediaSrc);
                    }
                }
            });

            mediaListContainer.innerHTML = ''; // 清空现有媒体
            mediaListContainer.appendChild(fragment); // 批量插入新媒体
        }

        // 2025.2.8  新增：按尺寸从大到小排序的函数
function sortMediaBySize() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const minWidth = parseInt(minWidthSlider.value, 10);
    const minHeight = parseInt(minHeightSlider.value, 10);

    const fragment = document.createDocumentFragment();
    checkboxes.length = 0;
    const addedMediaLinks = new Set();

    const visibleMediaElements = mediaElements.filter(media => {
        const computedStyle = window.getComputedStyle(media);
        return computedStyle.display !== 'none';
    });

    // 按尺寸从大到小排序
    visibleMediaElements.sort((a, b) => {
        const areaA = (a.naturalWidth || 0) * (a.naturalHeight || 0);
        const areaB = (b.naturalWidth || 0) * (b.naturalHeight || 0);
        return areaB - areaA;
    });

    visibleMediaElements.forEach((media, index) => {
        const isImage = media.tagName === 'IMG' || (media.tagName === 'SOURCE' && media.type === 'image/gif');
        const isVideo = media.tagName === 'VIDEO';
        const mediaType = getMediaType(media);

        const mediaSrc = media.src || media.currentSrc || media.getAttribute('data-src') || (media.parentNode && media.parentNode.src);

        if (mediaSrc && !addedMediaLinks.has(mediaSrc)) {
            if (
                (searchValue === '' || mediaType.endsWith(searchValue)) &&
                (isImage ? media.naturalWidth >= minWidth && media.naturalHeight >= minHeight : true)
            ) {
                const mediaElement = isImage ? media.cloneNode() : media.cloneNode();
                mediaElement.style.maxWidth = '100%';
                mediaElement.style.height = 'auto';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = mediaSrc;
                checkboxes.push(checkbox);

                const mediaWrapper = document.createElement('div');
                mediaWrapper.style.position = 'relative';
                mediaWrapper.style.cursor = 'pointer';

                mediaElement.onerror = () => {
                    console.error(`Failed to load media: ${mediaSrc}`);
                    if (mediaWrapper.parentNode) {
                        mediaWrapper.parentNode.removeChild(mediaWrapper);
                    }
                };

                mediaWrapper.appendChild(mediaElement);

                checkbox.style.position = 'absolute';
                checkbox.style.top = '0';
                checkbox.style.right = '0';
                checkbox.style.zIndex = '1';
                mediaWrapper.appendChild(checkbox);

                const formatLabel = document.createElement('div');
                formatLabel.style.position = 'absolute';
                formatLabel.style.top = '0';
                formatLabel.style.left = '0';
                formatLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                formatLabel.style.color = '#fff';
                formatLabel.style.padding = '2px 5px';
                formatLabel.style.borderRadius = '3px';
                formatLabel.style.fontSize = '12px';
                formatLabel.style.zIndex = '2';
                formatLabel.innerText = mediaType;
                mediaWrapper.appendChild(formatLabel);

                const sizeLabel = document.createElement('div');
                sizeLabel.style.position = 'absolute';
                sizeLabel.style.bottom = '0';
                sizeLabel.style.left = '0';
                sizeLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                sizeLabel.style.color = '#fff';
                sizeLabel.style.padding = '2px 5px';
                sizeLabel.style.borderRadius = '3px';
                sizeLabel.style.fontSize = '12px';
                sizeLabel.style.zIndex = '2';
                sizeLabel.innerText = `${media.naturalWidth}x${media.naturalHeight}`;
                sizeLabel.style.display = 'none';
                sizeLabel.style.width = '100%';
                sizeLabel.style.textAlign = 'center';
                mediaWrapper.appendChild(sizeLabel);

                const openLinkLabel = document.createElement('div');
                openLinkLabel.style.position = 'absolute';
                openLinkLabel.style.bottom = '25px';
                openLinkLabel.style.left = '0';
                openLinkLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                openLinkLabel.style.color = '#fff';
                openLinkLabel.style.padding = '2px 5px';
                openLinkLabel.style.borderRadius = '3px';
                openLinkLabel.style.fontSize = '12px';
                openLinkLabel.style.zIndex = '3';
                openLinkLabel.style.cursor = 'pointer';
                openLinkLabel.style.display = 'none';
                openLinkLabel.innerText = 'Open';

                openLinkLabel.addEventListener('click', () => {
                    window.open(mediaSrc, '_blank');
                });

                mediaWrapper.appendChild(openLinkLabel);

                mediaWrapper.onmouseover = () => {
                    sizeLabel.style.display = 'block';
                    openLinkLabel.style.display = 'block';
                };
                mediaWrapper.onmouseout = () => {
                    sizeLabel.style.display = 'none';
                    openLinkLabel.style.display = 'none';
                };

                mediaWrapper.onclick = (event) => {
                    const shiftKey = event.shiftKey;
                    const checkboxIndex = checkboxes.indexOf(checkbox);

                    if (shiftKey && lastClickedCheckbox) {
                        const start = Math.min(lastClickedCheckbox.index, checkboxIndex);
                        const end = Math.max(lastClickedCheckbox.index, checkboxIndex);
                        for (let i = start; i <= end; i++) {
                            checkboxes[i].checked = true;
                            updateMediaBorder(checkboxes[i], checkboxes[i].parentElement.querySelector('img, video'));
                        }
                    } else {
                        checkbox.checked = !checkbox.checked;
                        updateMediaBorder(checkbox, mediaElement);
                    }
                    lastClickedCheckbox = { checkbox, index: checkboxIndex };
                    // 新增：更新勾选数量显示
                    updateSelectedCount();
                };

                fragment.appendChild(mediaWrapper);
                addedMediaLinks.add(mediaSrc);
            }
        }
    });

    mediaListContainer.innerHTML = '';
    mediaListContainer.appendChild(fragment);
}

        function updateMediaBorder(checkbox, mediaElement) {
            if (checkbox.checked) {
                mediaElement.style.border = '2px solid #007bff'; // 选中时显示蓝色边框
            } else {
                mediaElement.style.border = 'none'; // 未选中时移除边框
            }
        }

        // 新增：定义更新勾选数量显示的函数
        function updateSelectedCount() {
            // 统计当前勾选的复选框数量
            const selectedCount = checkboxes.filter(checkbox => checkbox.checked).length;
            // 更新显示文本
            selectedCountLabel.innerText = `已勾选: ${selectedCount}`;
        }

        function selectAllCheckboxes(select) {
            checkboxes.forEach(checkbox => {
                checkbox.checked = select;
                updateMediaBorder(checkbox, checkbox.parentElement.querySelector('img, video'));
            });
                // 新增：更新勾选数量显示
                updateSelectedCount();
        }

        function exportSelectedMedia(modal) {
            const selectedMedia = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
            if (selectedMedia.length > 0) {
                exportMedia(selectedMedia, modal);
            } else {
                alert('请至少选择一个媒体链接！');
            }
        }

function exportMedia(media, modal) {
    const format = prompt('请选择导出格式 (json/md/txt/html):', 'json');
    let content = '';
    const currentPageUrl = window.location.href; // 获取当前页面的网址

    switch (format.toLowerCase()) {
        case 'json':
            content = `[\n  "${currentPageUrl}",\n${media.map(url => `  "${url}"`).join(',\n')}\n]`;
            break;
        case 'md':
            content = `页面地址: [${currentPageUrl}](${currentPageUrl})\n\n${media.map(url => `![](${url})`).join('\n')}`;
            break;
        case 'txt':
            content = `页面地址: ${currentPageUrl}\n\n${media.join('\n')}`;
            break;
        case 'html':
            // 替换为你实际的 GitHub 样式文件和脚本文件的原始链接
            const stylesheetUrl = 'https://fastly.jsdelivr.net/gh/ParkCR/Config@main/ParkCR-Tampermonkey/%E5%AA%92%E4%BD%93%E9%93%BE%E6%8E%A5%E5%AF%BC%E5%87%BA/styles.css';
            const scriptUrl = 'https://fastly.jsdelivr.net/gh/ParkCR/Config@main/ParkCR-Tampermonkey/%E5%AA%92%E4%BD%93%E9%93%BE%E6%8E%A5%E5%AF%BC%E5%87%BA/script.js';

            // 将选中的媒体链接转换为 JSON 格式的文本
            const resourcesJSON = JSON.stringify(media);

            content = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>媒体瀑布流</title>
    <!-- 引用 GitHub 上的样式文件 -->
    <link rel="stylesheet" href="${stylesheetUrl}">
</head>
<body>
    <div id="page-title">
        <a href="${currentPageUrl}" target="_blank">${document.title}</a>
    </div>
    <div id="filter-bar"></div>
    <div id="columns-selector">
        <button class="columns-button" onclick="setColumns(1)">1p</button>
        <button class="columns-button" onclick="setColumns(2)">2p</button>
        <button class="columns-button" onclick="setColumns(3)">3p</button>
        <button class="columns-button" onclick="setColumns(4)">4p</button>
    </div>
    <div id="media-container">
        <div id="media-grid"></div>
    </div>
    <div id="modal" class="modal">
        <span class="close">&times;</span>
        <img class="modal-content" id="img01">
        <video class="modal-content" id="vid01" controls muted></video>
    </div>
    <button id="back-to-top">↑</button>
    <!-- 引用 GitHub 上的脚本文件 -->
    <script>
        // 将选中的媒体链接赋值给 resources 数组
        const resources = ${resourcesJSON};
    </script>
    <script src="${scriptUrl}"></script>
</body>
</html>
            `;
            break;
        default:
            alert('未知格式！');
            return;
    }
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName(`${document.title}.${format}`);
    a.click();

    // 显示导出成功的提示
    showExportSuccessMessage(modal);
}

        // 清理文件名函数
        function cleanFileName(fileName) {
            return fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
        }

        // 显示导出成功的提示
        function showExportSuccessMessage(modal) {
            const successMessage = document.createElement('div');
            successMessage.style.position = 'fixed';
            successMessage.style.top = '50%';
            successMessage.style.left = '50%';
            successMessage.style.transform = 'translate(-50%, -50%)';
            successMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            successMessage.style.color = '#fff';
            successMessage.style.padding = '20px';
            successMessage.style.borderRadius = '5px';
            successMessage.style.zIndex = '1002';
            successMessage.innerText = '导出成功！';

            document.body.appendChild(successMessage);

            // 1秒后关闭提示
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 1000);
        }
// 复制选中的媒体链接到剪贴板
function copySelectedMedia() {
    // 过滤出被选中的复选框，并提取其对应的媒体链接
    const selectedMedia = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
    if (selectedMedia.length > 0) {
        // 将选中的媒体链接用换行符连接成一个字符串
        const textToCopy = selectedMedia.join('\n');
        // 使用现代的 navigator.clipboard.writeText API 进行复制操作
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
                // 显示复制成功的提示
                showCopySuccessMessage();
            })
          .catch((err) => {
                console.error('复制失败: ', err);
            });
    } else {
        alert('请至少选择一个媒体链接！');
    }
}

// 显示复制成功的提示
       function showCopySuccessMessage() {
            const successMessage = document.createElement('div');
            successMessage.style.position = 'fixed';
            successMessage.style.top = '50%';
            successMessage.style.left = '50%';
            successMessage.style.transform = 'translate(-50%, -50%)';
            successMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            successMessage.style.color = '#fff';
            successMessage.style.padding = '20px';
            successMessage.style.borderRadius = '5px';
            successMessage.style.zIndex = '1002';
            successMessage.innerText = '已复制到剪贴板！';

    document.body.appendChild(successMessage);

    // 1 秒后关闭提示
    setTimeout(() => {
        document.body.removeChild(successMessage);
    }, 1000);
}
        // 打开粘贴链接的模态窗口
        function openPasteLinkModal(mainModal) {
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '1002';
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s, transform 0.3s';
            modal.style.transform = 'scale(0.9)';

            const modalContent = document.createElement('div');
            modalContent.style.background = '#fff';
            modalContent.style.padding = '20px';
            modalContent.style.borderRadius = '5px';
            modalContent.style.maxWidth = '600px';
            modalContent.style.maxHeight = '400px';
            modalContent.style.overflowY = 'auto';
            modalContent.style.boxSizing = 'border-box';

            const inputLabel = document.createElement('label');
            inputLabel.innerText = '请粘贴链接:';
            modalContent.appendChild(inputLabel);

            const linkInput = document.createElement('textarea');
            linkInput.style.width = '100%';
            linkInput.style.height = '150px';
            linkInput.style.resize = 'none';
            modalContent.appendChild(linkInput);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.justifyContent = 'center';
            buttonsContainer.style.gap = '10px';
            modalContent.appendChild(buttonsContainer);

            const cancelButton = createStyledButton('取消', () => closeModal(modal));
            buttonsContainer.appendChild(cancelButton);

            const exportButton = createStyledButton('导出', () => {
                const links = linkInput.value.split('\n').filter(l => l.trim() !== '');
                if (links.length > 0) {
                    exportMedia(links, mainModal);
                } else {
                    alert('请至少输入一个有效的链接！');
                }
            });
            buttonsContainer.appendChild(exportButton);

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // 显示模态窗口
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
        }

        // 关闭模态窗口
        function closeModal(modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';

            // 等待过渡效果结束后再移除元素
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }

        // 创建样式化的按钮
        function createStyledButton(text, onClick) {
            const button = document.createElement('button');
            button.innerText = text;
             // 调整按钮的内边距，在移动端减少内边距以缩小按钮大小
            button.style.padding = '6px 12px'; // 原 padding 为 '10px 20px'，这里减少了内边距
            button.style.backgroundColor = '#007bff';
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';
            button.addEventListener('click', onClick);
            return button;
        }

        filterMedia(); // 初始加载时过滤媒体

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 显示模态窗口
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);

        // 监听点击事件，点击模态窗口外部关闭模态窗口
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    }

    // 初始化
    createButton();
})();