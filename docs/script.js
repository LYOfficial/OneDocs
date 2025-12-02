document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTop = document.getElementById('backToTop');

    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 70; // 考虑导航栏高度
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        const navbar = document.querySelector('.navbar');
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = 'var(--shadow-medium)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        if (scrollTop > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
        
        updateActiveNavLink();
    });

    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    function updateActiveNavLink() {
        const sections = ['home', 'features', 'download', 'about'];
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        let currentSection = 'home';
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const sectionTop = section.offsetTop - 100;
                const sectionBottom = sectionTop + section.offsetHeight;
                
                if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
                    currentSection = sectionId;
                }
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    function animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const increment = target / 100;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = target + (stat.textContent.includes('+') ? '+' : '');
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.ceil(current);
                }
            }, 20);
        });
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                if (entry.target.classList.contains('about-stats')) {
                    animateNumbers();
                }
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.feature-card, .download-card, .about-stats');
    animateElements.forEach(el => observer.observe(el));

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    const formatItems = document.querySelectorAll('.format-item');
    formatItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const icon = this.querySelector('i');
            icon.style.transform = 'scale(1.2) rotate(5deg)';
            icon.style.color = 'var(--accent-hover)';
        });
        
        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            icon.style.transform = 'scale(1) rotate(0deg)';
            icon.style.color = 'var(--accent-color)';
        });
    });
});

function downloadApp(platform, type) {
    const useProxy = document.getElementById('useProxy').checked;
    const baseUrl = 'https://github.com/LYOfficial/OneDocs/releases/download/v1.3.1/';
    const proxyUrl = 'https://gh-proxy.com/';
    
    let filename = '';
    let platformName = '';
    
    switch(platform) {
        case 'windows':
            platformName = 'Windows';
            if (type === 'msi') {
                filename = 'onedocs_1.3.1_x64_en-US.msi';
            } else {
                filename = 'onedocs_1.3.1_x64-setup.exe';
            }
            break;
        case 'macos':
            platformName = 'macOS';
            filename = 'onedocs_1.3.1_aarch64.dmg';
            break;
        case 'linux':
            platformName = 'Linux';
            if (type === 'deb') {
                filename = 'onedocs_1.3.1_amd64.deb';
            } else {
                filename = 'onedocs_1.3.1_amd64.AppImage';
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
    
    showToast(`正在下载 ${platformName} ${type ? type : ''} 版本...如果被浏览器拦截，请点击"保留"`, 'info', 4000);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    link.style.display = 'none';
    document.body.appendChild(link);
    
    setTimeout(() => {
        link.click();
        document.body.removeChild(link);
    }, 500);
}

function openWiki() {
    showToast('正在跳转到使用说明...');
    setTimeout(() => {
        window.open('https://github.com/LYOfficial/OneDocs/wiki', '_blank');
    }, 500);
}

function scrollToDownload() {
    const downloadSection = document.getElementById('download');
    const offsetTop = downloadSection.offsetTop - 70;
    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
}

function showToast(message, type = 'info', duration = 3000) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-30px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('已复制到剪贴板', 'success');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板', 'success');
        } catch (err) {
            showToast('复制失败', 'error');
        }
        document.body.removeChild(textArea);
    }
}

window.addEventListener('load', function() {
    document.body.classList.remove('loading');
    
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('animate');
    }
    
    preloadResources();
});

function preloadResources() {
    const fonts = [
        'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&display=swap'
    ];
    
    fonts.forEach(fontUrl => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = fontUrl;
        link.as = 'style';
        document.head.appendChild(link);
    });
}

window.addEventListener('error', function(e) {
    console.error('页面发生错误:', e.error);
});

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        showToast('搜索功能即将上线');
    }
    
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    }
});

if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`页面加载时间: ${loadTime}ms`);
            
            if (loadTime > 3000) {
                console.warn('页面加载时间较长，建议优化');
            }
        }, 0);
    });
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    showToast(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式`);
}

function restoreTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
}

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        document.querySelectorAll('.feature-icon').forEach(icon => {
            icon.style.animationPlayState = 'paused';
        });
    } else {
        document.querySelectorAll('.feature-icon').forEach(icon => {
            icon.style.animationPlayState = 'running';
        });
    }
});

function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

document.addEventListener('DOMContentLoaded', lazyLoadImages);
