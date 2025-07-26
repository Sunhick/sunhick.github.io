// Main JavaScript for Sunil Murthy's Portfolio Website

document.addEventListener('DOMContentLoaded', function () {

    // Smooth scrolling for navigation links
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active class to navigation items based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.masthead__menu a[href^="#"]');

    function updateActiveNavigation() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNavigation);

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Special handling for skill bars
                if (entry.target.classList.contains('skill-category')) {
                    animateSkillBars(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Animate skill bars
    function animateSkillBars(container) {
        const skillBars = container.querySelectorAll('.skill-progress');

        skillBars.forEach((bar, index) => {
            const level = bar.getAttribute('data-level');
            setTimeout(() => {
                bar.style.width = level + '%';
            }, index * 100);
        });
    }

    // Add hover effects to project cards
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    // Contact form handling (placeholder functionality)
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Show a message (in a real implementation, you'd send the form data)
            alert('Thank you for your message! This is a demo form. In a real implementation, this would be sent to a form handling service.');

            // Reset form
            this.reset();
        });
    }

    // Add keyboard navigation support
    document.addEventListener('keydown', function (e) {
        // Press 'h' to go to home
        if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
            const homeLink = document.querySelector('a[href="/"]') || document.querySelector('a[href="#home"]');
            if (homeLink && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                homeLink.click();
            }
        }

        // Press 'p' to go to portfolio
        if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
            const portfolioLink = document.querySelector('a[href="/portfolio/"]') || document.querySelector('a[href="#portfolio"]');
            if (portfolioLink && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                portfolioLink.click();
            }
        }

        // Press 'c' to go to contact
        if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
            const contactLink = document.querySelector('a[href="/contact/"]') || document.querySelector('a[href="#contact"]');
            if (contactLink && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                contactLink.click();
            }
        }
    });

    // Add loading animation for images
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        if (!img.complete) {
            img.style.opacity = '0';
            img.addEventListener('load', function () {
                this.style.transition = 'opacity 0.3s ease';
                this.style.opacity = '1';
            });
        }
    });

    // Add scroll-to-top functionality
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollToTopBtn);

    // Show/hide scroll-to-top button
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top when button is clicked
    scrollToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    console.log('Sunil Murthy Portfolio - JavaScript loaded successfully!');
});

// Add CSS for scroll-to-top button
const scrollToTopStyles = `
.scroll-to-top {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: var(--secondary-color);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2em;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.scroll-to-top.visible {
    opacity: 1;
    visibility: visible;
}

.scroll-to-top:hover {
    background: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.masthead__menu a.active {
    color: var(--secondary-color) !important;
    font-weight: 600;
}

@media (max-width: 768px) {
    .scroll-to-top {
        bottom: 15px;
        right: 15px;
        width: 45px;
        height: 45px;
        font-size: 1.1em;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = scrollToTopStyles;
document.head.appendChild(styleSheet);
// Fixed Side Navigation Enhancement
document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for side navigation links
    const sideNavLinks = document.querySelectorAll('.fixed-side-nav .nav-link');

    sideNavLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Only prevent default for same-page links (if they have hash)
            if (this.getAttribute('href').includes('#')) {
                e.preventDefault();

                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Highlight current section in side navigation
    function updateSideNavigation() {
        const sections = document.querySelectorAll('section[id], .page__content');
        const sideNavLinks = document.querySelectorAll('.fixed-side-nav .nav-link');

        let current = '';
        const scrollPosition = window.pageYOffset + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id') || 'home';
            }
        });

        sideNavLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');

            // Check if current page matches the link
            if (window.location.pathname === href ||
                (window.location.pathname === '/' && href === '/') ||
                (href !== '/' && window.location.pathname.includes(href.replace('/', '')))) {
                link.classList.add('active');
            }
        });
    }

    // Update navigation on scroll
    window.addEventListener('scroll', updateSideNavigation);

    // Initial update
    updateSideNavigation();
});
