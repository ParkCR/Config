// ==UserScript==
// @name         媒体链接导出工具
// @namespace    Home
// @version      1.9.7
// @description  点击按钮获取当前页面的所有媒体链接，并提供导出功能
// @author       您的名字
// @match        *://*/*
// @grant        none
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
        modalContent.style.background = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.maxWidth = '900px'; // 增加最大宽度
        modalContent.style.maxHeight = '800px'; // 增加最大高度
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

        const closeButton = createStyledButton('关闭', () => closeModal(modal));
        header.appendChild(closeButton);

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

        const pasteLinkButton = createStyledButton('粘贴链接', () => openPasteLinkModal(modal));
        buttonsRow.appendChild(pasteLinkButton);

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

        function filterMedia() {
            const searchValue = searchInput.value.trim().toLowerCase(); // 获取搜索框内容
            const minWidth = parseInt(minWidthSlider.value, 10);
            const minHeight = parseInt(minHeightSlider.value, 10);

            // 批量更新DOM
            const fragment = document.createDocumentFragment();

            mediaElements.forEach((media, index) => {
                const isImage = media.tagName === 'IMG' || (media.tagName === 'SOURCE' && media.type === 'image/gif');
                const isVideo = media.tagName === 'VIDEO';
                const mediaType = getMediaType(media);

                if (
                    (searchValue === '' || mediaType.endsWith(searchValue)) &&
                    (isImage ? media.naturalWidth >= minWidth && media.naturalHeight >= minHeight : true)
                ) {
                    const mediaElement = isImage ? media.cloneNode() : media.cloneNode();
                    mediaElement.style.maxWidth = '100%';
                    mediaElement.style.height = 'auto';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = media.src || media.currentSrc || media.getAttribute('data-src') || media.parentNode.src;
                    checkboxes.push(checkbox);

                    const mediaWrapper = document.createElement('div');
                    mediaWrapper.style.position = 'relative';
                    mediaWrapper.style.cursor = 'pointer';
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
                    formatLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // 调整透明度
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
                    sizeLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // 不透明度为0.5
                    sizeLabel.style.color = '#fff';
                    sizeLabel.style.padding = '2px 5px';
                    sizeLabel.style.borderRadius = '3px';
                    sizeLabel.style.fontSize = '12px';
                    sizeLabel.style.zIndex = '2';
                    sizeLabel.innerText = `${media.naturalWidth}x${media.naturalHeight}`;
                    sizeLabel.style.display = 'none';
                    sizeLabel.style.width = '100%'; // 宽度与媒体元素一致
                    sizeLabel.style.textAlign = 'center'; // 文字居中
                    mediaWrapper.appendChild(sizeLabel);

                    mediaWrapper.onmouseover = () => {
                        sizeLabel.style.display = 'block';
                    };
                    mediaWrapper.onmouseout = () => {
                        sizeLabel.style.display = 'none';
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
                    };

                    fragment.appendChild(mediaWrapper);
                }
            });

            mediaListContainer.innerHTML = ''; // 清空现有媒体
            mediaListContainer.appendChild(fragment); // 批量插入新媒体
        }

        function updateMediaBorder(checkbox, mediaElement) {
            if (checkbox.checked) {
                mediaElement.style.border = '2px solid #007bff'; // 选中时显示蓝色边框
            } else {
                mediaElement.style.border = 'none'; // 未选中时移除边框
            }
        }

        function selectAllCheckboxes(select) {
            checkboxes.forEach(checkbox => {
                checkbox.checked = select;
                updateMediaBorder(checkbox, checkbox.parentElement.querySelector('img, video'));
            });
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

            switch(format.toLowerCase()) {
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
                    content = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Media Links</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    padding: 20px;
                                    box-sizing: border-box;
                                }
                                h1 {
                                    margin-bottom: 20px;
                                }
                                .media-grid {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                                    gap: 10px;
                                    width: 100%;
                                    max-width: 1200px;
                                }
                                img, video {
                                    max-width: 100%;
                                    height: auto;
                                }
                            </style>
                        </head>
                        <body>
                            <h1>页面地址: <a href="${currentPageUrl}">${currentPageUrl}</a></h1>
                            <div class="media-grid">
                                ${media.map(url => {
                                    const ext = url.split('.').pop().toLowerCase();
                                    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                                        return `<img src="${url}" alt="Image">`;
                                    } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
                                        return `<video controls src="${url}"></video>`;
                                    } else {
                                        return `<a href="${url}">${url}</a>`; // 其他类型的链接
                                    }
                                }).join('\n')}
                            </div>
                        </body>
                        </html>
                    `;
                    break;
                default:
                    alert('未知格式！');
                    return;
            }
            const blob = new Blob([content], { type: 'text/html' }); // 修改为 text/html
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = cleanFileName(`${document.title}.${format}`); // 使用清理后的网页标题作为文件名
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
            button.style.padding = '10px 20px';
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