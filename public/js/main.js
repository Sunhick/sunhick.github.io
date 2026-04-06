// Portfolio — Main JS

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initScrollToTop();
    initSkillBars();
    initFadeIn();
    initQuote();
});

// --- Mobile Navigation ---
function initMobileNav() {
    const btn = document.querySelector('.hamburger-btn');
    const overlay = document.querySelector('.mobile-nav-overlay');
    const nav = document.querySelector('.mobile-nav');
    const items = document.querySelectorAll('.mobile-nav-item');
    if (!btn || !overlay) return;

    function open() {
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('active');
        overlay.classList.add('active');
        if (nav) nav.setAttribute('aria-hidden', 'false');
        items.forEach(i => i.setAttribute('tabindex', '0'));
        document.body.style.overflow = 'hidden';
        if (items.length) setTimeout(() => items[0].focus(), 150);
    }

    function close() {
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('active');
        overlay.classList.remove('active');
        if (nav) nav.setAttribute('aria-hidden', 'true');
        items.forEach(i => i.setAttribute('tabindex', '-1'));
        document.body.style.overflow = '';
        btn.focus();
    }

    btn.addEventListener('click', e => { e.preventDefault(); overlay.classList.contains('active') ? close() : open(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    items.forEach(i => i.addEventListener('click', close));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) { e.preventDefault(); close(); }
    });

    // Close on desktop resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && overlay.classList.contains('active')) close();
    });
}


// --- Scroll to Top ---
function initScrollToTop() {
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    btn.className = 'scroll-to-top';
    btn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.pageYOffset > 300);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- Skill Bar Animation ---
function initSkillBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.skill-progress');
                bars.forEach((bar, i) => {
                    const level = bar.getAttribute('data-level');
                    setTimeout(() => { bar.style.width = level + '%'; }, i * 80);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.skill-category-card').forEach(card => observer.observe(card));
}

// --- Fade-in on Scroll ---
function initFadeIn() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// --- Random CS Quote (home page only) ---
function initQuote() {
    const isHome = window.location.pathname === '/' ||
        window.location.pathname === '/index.html' ||
        (window.location.pathname.endsWith('/') && window.location.pathname.split('/').filter(Boolean).length === 0);

    if (!isHome) return;

    const quotes = [
        { q: "The best way to predict the future is to invent it.", a: "Alan Kay" },
        { q: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", a: "Martin Fowler" },
        { q: "First, solve the problem. Then, write the code.", a: "John Johnson" },
        { q: "Code is like humor. When you have to explain it, it's bad.", a: "Cory House" },
        { q: "Simplicity is the ultimate sophistication.", a: "Leonardo da Vinci" },
        { q: "Programs must be written for people to read, and only incidentally for machines to execute.", a: "Harold Abelson" },
        { q: "Talk is cheap. Show me the code.", a: "Linus Torvalds" },
        { q: "Debugging is twice as hard as writing the code in the first place.", a: "Brian Kernighan" },
        { q: "Good code is its own best documentation.", a: "Steve McConnell" },
        { q: "The function of good software is to make the complex appear to be simple.", a: "Grady Booch" }
    ];

    const pick = quotes[Math.floor(Math.random() * quotes.length)];
    const container = document.createElement('div');
    container.className = 'cs-quote-simple';
    container.innerHTML = `<p class="quote-text">"${pick.q}" — ${pick.a}</p>`;

    const title = document.querySelector('.page-title') || document.querySelector('h1');
    if (title && title.parentNode) {
        title.parentNode.insertBefore(container, title.nextSibling);
    }
}


// --- Theme Toggle (dark/light) ---
(function() {
    // Apply saved theme immediately to prevent flash
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.body.classList.add('dark-theme');

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;

        function updateIcon() {
            const isDark = document.body.classList.contains('dark-theme');
            btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        }

        updateIcon();

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
            updateIcon();
        });
    });
})();
