
function loadMedia() {
    const mediaGrid = document.getElementById('media-grid');
    const filterBar = document.getElementById('filter-bar');

    // 创建过滤按钮
    const extensions = new Set();
    resources.forEach(url => {
        const ext = url.split('.').pop().toLowerCase();
        extensions.add(ext);
    });

    // 添加“全部”按钮
    const allButton = document.createElement('button');
    allButton.className = 'filter-button';
    allButton.innerText = '全部';
    allButton.addEventListener('click', showAllMedia);
    filterBar.appendChild(allButton);

    const filterButtons = document.createDocumentFragment();
    extensions.forEach(ext => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.innerText = `${ext.toUpperCase()} (${resources.filter(url => url.endsWith(`.${ext}`)).length})`;
        button.addEventListener('click', () => filterMedia(ext));
        filterButtons.appendChild(button);
    });
    filterBar.appendChild(filterButtons);

    // 使用 DocumentFragment 批量插入媒体项
    const mediaItemsFragment = document.createDocumentFragment();
    resources.forEach((url, index) => {
        const item = createMediaItem(url, index);
        mediaItemsFragment.appendChild(item);
    });
    mediaGrid.appendChild(mediaItemsFragment);

    // 默认显示所有媒体
    showAllMedia();
}

function isImage(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext); // 增加对 webp 的支持
}

function isVideo(ext) {
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
}

function createMediaElement(tagName, src) {
    const element = document.createElement(tagName);
    element.src = src; // 直接设置 src 属性
    return element;
}

function createMediaItem(url, index) {
    const item = document.createElement('div');
    item.className = 'media-item';

    const ext = url.split('.').pop().toLowerCase();
    let mediaElement;

    if (isImage(ext)) {
        mediaElement = createMediaElement('img', url);
        mediaElement.addEventListener('load', () => {
            item.style.animation = `slideIn 0.5s forwards ${index * 0.1}s`;
            removeLoadingIndicator(item);
            mediaElement.addEventListener('click', () => openModal(mediaElement));
        });
    } else if (isVideo(ext)) {
        mediaElement = createMediaElement('video', url);
        mediaElement.controls = true;
        mediaElement.muted = true;
        mediaElement.preload = 'metadata'; // 预加载元数据
        mediaElement.addEventListener('loadedmetadata', () => {
            item.style.animation = `slideIn 0.5s forwards ${index * 0.1}s`;
            removeLoadingIndicator(item);
            mediaElement.addEventListener('click', () => openModal(mediaElement));
        });
    }

    mediaElement.addEventListener('error', (event) => {
        console.error(`Failed to load media: ${url}`, event);
        item.style.display = 'none'; // 隐藏加载失败的项目
    });

    // 添加加载指示器
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    item.appendChild(loadingIndicator);
    item.appendChild(mediaElement);

    return item;
}

function removeLoadingIndicator(item) {
    const loadingIndicator = item.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

function filterMedia(ext) {
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        const mediaElement = item.querySelector('img, video');
        if (mediaElement) {
            const url = mediaElement.src;
            const isMatch = url.endsWith(`.${ext}`);
            item.style.display = isMatch ? 'block' : 'none';
        } else {
            item.style.display = 'none'; // 如果没有 src 属性，隐藏该元素
        }
    });
}

function showAllMedia() {
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        item.style.display = 'block';
    });
}

function openModal(content) {
    const modal = document.getElementById('modal');
    const img = document.getElementById('img01');
    const vid = document.getElementById('vid01');
    
    if (content.tagName.toLowerCase() === 'img') {
        img.src = content.src;
        img.style.display = 'block';
        img.style.transform = ''; // 确保每次打开图片时都是正常大小
        vid.style.display = 'none';
        img.addEventListener('click', () => toggleZoom(img));
    } else if (content.tagName.toLowerCase() === 'video') {
        vid.src = content.src;
        vid.load(); // 确保视频重新加载
        vid.play();
        vid.style.display = 'block';
        img.style.display = 'none';
    }
    modal.classList.add('show');
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', outsideClick);
}

function closeModal() {
    const modal = document.getElementById('modal');
    const img = document.getElementById('img01');
    const vid = document.getElementById('vid01');
    vid.pause();
    modal.classList.remove('show');
    document.querySelector('.close').removeEventListener('click', closeModal);
    window.removeEventListener('click', outsideClick);
    img.removeEventListener('click', () => toggleZoom(img)); // 移除点击事件
    img.style.transform = ''; // 重置图片缩放状态
}

function outsideClick(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
}

function toggleZoom(img) {
    const isZoomed = img.classList.contains('zoomed');
    if (isZoomed) {
        img.style.transform = '';
        img.classList.remove('zoomed');
    } else {
        img.style.transform = 'scale(1.3)';
        img.classList.add('zoomed');
    }
}

// 返回顶部按钮功能
function backToTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// 显示或隐藏返回顶部按钮
window.onscroll = function() {
    const backToTopButton = document.getElementById('back-to-top');
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
};

// 设置每行显示的媒体项个数
function setColumns(columns) {
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        item.style.flexBasis = `calc(${100 / columns}% - 20px)`;
        item.style.paddingBottom = `calc((${100 / columns}% - 20px) * 4 / 3)`;
    });
}

// 页面加载完成后调用
document.addEventListener("DOMContentLoaded", function() {
    loadMedia();
    const backToTopButton = document.getElementById('back-to-top');
    backToTopButton.addEventListener('click', backToTop);
});