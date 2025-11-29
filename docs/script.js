// 导航栏功能
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTop = document.getElementById('backToTop');

    // 移动端菜单切换
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // 导航链接点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 移除所有活动状态
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加当前活动状态
            this.classList.add('active');
            
            // 移动端关闭菜单
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            
            // 平滑滚动到目标区域
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

    // 滚动事件处理
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 导航栏透明度控制
        const navbar = document.querySelector('.navbar');
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = 'var(--shadow-medium)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        // 返回顶部按钮显示/隐藏
        if (scrollTop > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
        
        // 活动导航项高亮
        updateActiveNavLink();
    });

    // 返回顶部功能
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 更新活动导航链接
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
        
        // 更新导航链接活动状态
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // 数字动画
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

    // 交叉观察器用于触发动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // 如果是统计数字区域，启动数字动画
                if (entry.target.classList.contains('about-stats')) {
                    animateNumbers();
                }
            }
        });
    }, observerOptions);

    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.feature-card, .download-card, .about-stats');
    animateElements.forEach(el => observer.observe(el));

    // 功能卡片交互效果
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // 格式项目悬停效果
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

// 下载功能
function downloadApp(platform) {
    let downloadUrl = '';
    let platformName = '';
    
    switch(platform) {
        case 'windows':
            downloadUrl = 'https://gh-proxy.com/https://github.com/LYOfficial/OneDocs/releases/download/v1.2.0/OneDocs-1.2.0.exe';
            platformName = 'Windows';
            break;
        case 'macos':
            downloadUrl = 'https://gh-proxy.com/https://github.com/LYOfficial/OneDocs/releases/download/v1.2.0/OneDocs-macos-1.2.0.zip';
            platformName = 'macOS';
            break;
        default:
            showToast('该平台版本暂未发布', 'warning');
            return;
    }
    
    // 显示下载提示
    showToast(`正在下载 ${platformName} 版本...如果被浏览器拦截，请点击"保留"`, 'info', 4000);
    
    // 创建隐藏的下载链接
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // 触发下载
    setTimeout(() => {
        link.click();
        document.body.removeChild(link);
    }, 500);
}

// 使用说明功能
function openWiki() {
    showToast('正在跳转到使用说明...');
    setTimeout(() => {
        window.open('https://github.com/LYOfficial/OneDocs/wiki', '_blank');
    }, 500);
}

// 滚动到下载区域
function scrollToDownload() {
    const downloadSection = document.getElementById('download');
    const offsetTop = downloadSection.offsetTop - 70;
    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
}

// 显示提示信息
function showToast(message, type = 'info', duration = 3000) {
    // 移除现有的 toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的 toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    // 自动隐藏
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

// 复制文本到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('已复制到剪贴板', 'success');
        });
    } else {
        // 降级方案
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

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 移除加载状态
    document.body.classList.remove('loading');
    
    // 添加入场动画
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('animate');
    }
    
    // 预加载关键资源
    preloadResources();
});

// 预加载资源
function preloadResources() {
    // 预加载字体
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

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面发生错误:', e.error);
    // 可以在这里添加错误报告逻辑
});

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K 快速搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // 这里可以添加搜索功能
        showToast('搜索功能即将上线');
    }
    
    // ESC 关闭菜单
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    }
});

// 性能监控
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`页面加载时间: ${loadTime}ms`);
            
            // 如果加载时间过长，显示提示
            if (loadTime > 3000) {
                console.warn('页面加载时间较长，建议优化');
            }
        }, 0);
    });
}

// 主题切换功能（预留）
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    showToast(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式`);
}

// 恢复主题设置
function restoreTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
}

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时暂停动画
        document.querySelectorAll('.feature-icon').forEach(icon => {
            icon.style.animationPlayState = 'paused';
        });
    } else {
        // 页面显示时恢复动画
        document.querySelectorAll('.feature-icon').forEach(icon => {
            icon.style.animationPlayState = 'running';
        });
    }
});

// 响应式图片懒加载
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

// 初始化懒加载
document.addEventListener('DOMContentLoaded', lazyLoadImages);