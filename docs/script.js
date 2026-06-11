/* =========================================================
   OneDocs 2.0 · Site interactions
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
    const nav = document.getElementById('nav');
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTop = document.getElementById('backToTop');

    // 移动端导航
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            navMenu.classList.toggle('open');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navMenu.classList.remove('open');
        });
    });

    // 滚动时导航样式
    let lastScroll = 0;
    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 30) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        if (scrollTop > 600) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        lastScroll = scrollTop;
    }, { passive: true });

    // 回到顶部
    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 平滑滚动（带偏移）
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.length > 1) {
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    const offset = 52;
                    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            }
        });
    });

    // 滚动入场动画
    const revealTargets = document.querySelectorAll(
        '.section-head, .whats-new-card, .feature-inner, .model-card, ' +
        '.download-card, .ack-card, .showcase-screen, .showcase-tile, .privacy-inner'
    );
    revealTargets.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // 错开兄弟元素的延迟
                const siblings = entry.target.parentElement
                    ? Array.from(entry.target.parentElement.children).filter(c => c.classList.contains('reveal'))
                    : [];
                const idx = siblings.indexOf(entry.target);
                const delay = idx > 0 ? Math.min(idx * 60, 240) : 0;

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);

                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });

    revealTargets.forEach(el => revealObserver.observe(el));

    // 模型卡片 3D 倾斜
    document.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 25;
            const rotateY = (centerX - x) / 25;
            card.style.transform = `translateY(-4px) perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });

    // What's New 卡片视差
    document.querySelectorAll('.whats-new-card').forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
            card.style.transform = `translateY(-6px) perspective(800px) rotateX(${-y}deg) rotateY(${x}deg)`;
        });
        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });

    // 平台徽章在 hero 视口中循环高亮
    const platformPills = document.querySelectorAll('.platform-pill');
    if (platformPills.length) {
        let i = 0;
        setInterval(() => {
            platformPills.forEach(p => p.style.boxShadow = '');
            platformPills[i].style.boxShadow = '0 4px 14px rgba(0, 113, 227, 0.25)';
            i = (i + 1) % platformPills.length;
        }, 1800);
    }

    // 键盘快捷键
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
        }
    });
});

/* =========================================================
   下载逻辑
   ========================================================= */
function downloadApp(platform, type) {
    const useProxy = document.getElementById('useProxy').checked;
    const baseUrl = 'https://github.com/LYOfficial/OneDocs/releases/download/v2.0.0/';
    const proxyUrl = 'https://gh-proxy.com/';

    let filename = '';
    let platformName = '';

    switch (platform) {
        case 'windows':
            platformName = 'Windows';
            if (type === 'msi') {
                filename = 'onedocs_2.0.0_x64_en-US.msi';
            } else {
                filename = 'onedocs_2.0.0_x64-setup.exe';
            }
            break;
        case 'macos':
            platformName = 'macOS';
            filename = 'onedocs_2.0.0_aarch64.dmg';
            break;
        case 'linux':
            platformName = 'Linux';
            if (type === 'deb') {
                filename = 'onedocs_2.0.0_amd64.deb';
            } else {
                filename = 'onedocs_2.0.0_amd64.AppImage';
            }
            break;
        default:
            showToast('该平台版本暂未发布', 'warning');
            return;
    }

    let downloadUrl = baseUrl + filename;
    if (useProxy) {
        downloadUrl = proxyUrl + downloadUrl;
    }

    showToast(`正在下载 ${platformName} ${type ? '.' + type : ''} 版本…若被浏览器拦截，请点击「保留」`, 'info', 4500);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    link.style.display = 'none';
    document.body.appendChild(link);
    setTimeout(() => {
        link.click();
        document.body.removeChild(link);
    }, 400);
}

function openWiki() {
    showToast('正在跳转到使用说明…', 'info', 2000);
    setTimeout(() => {
        window.open('https://github.com/LYOfficial/OneDocs/wiki', '_blank', 'noopener');
    }, 400);
}

/* =========================================================
   Toast
   ========================================================= */
function showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} visible`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* =========================================================
   Showcase · 点击右侧小图 → 左侧大图
   ========================================================= */
function selectShowcase(tile) {
    const screen = document.getElementById('showcaseScreen');
    const mainImg = document.getElementById('showcaseMainImg');
    if (!screen || !mainImg) return;

    const newSrc = tile.dataset.src;
    const newAlt = tile.dataset.alt;
    if (!newSrc || mainImg.src === newSrc) return;

    // 切换 active
    document.querySelectorAll('.showcase-tile').forEach(t => t.classList.remove('active'));
    tile.classList.add('active');

    // 淡出旧图 → 换 src → 淡入
    screen.classList.add('is-changing');
    setTimeout(() => {
        mainImg.src = newSrc;
        mainImg.alt = newAlt;
        screen.classList.remove('is-changing');
    }, 220);
}
