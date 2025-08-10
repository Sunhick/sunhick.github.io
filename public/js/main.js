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

    // Mobile Navigation Functionality
    initializeMobileNavigation();

    console.log('Sunil Murthy Portfolio - JavaScript loaded successfully!');
});

// Mobile Navigation State Management System
function initializeMobileNavigation() {
    // Mobile navigation state object
    const mobileNavState = {
        isOpen: false,
        hamburgerBtn: document.querySelector('.hamburger-btn') || document.querySelector('.hamburger-btn-alt'),
        overlay: document.querySelector('.mobile-nav-overlay'),
        mobileNav: document.querySelector('.mobile-nav'),
        navItems: document.querySelectorAll('.mobile-nav-item'),
        focusedIndex: -1
    };

    // Check if mobile navigation elements exist
    if (!mobileNavState.hamburgerBtn || !mobileNavState.overlay) {
        return; // Exit if mobile nav elements don't exist
    }

    // Add event listeners for hamburger button click/touch
    mobileNavState.hamburgerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        toggleMobileMenu(mobileNavState);
    });

    // Handle keyboard events for hamburger button (Enter and Space)
    mobileNavState.hamburgerBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMobileMenu(mobileNavState);
        }
    });

    // Add click-outside-to-close functionality for overlay
    mobileNavState.overlay.addEventListener('click', function (e) {
        // Only close if clicking on the overlay itself, not the nav content
        if (e.target === mobileNavState.overlay) {
            closeMobileMenu(mobileNavState);
        }
    });

    // Handle navigation link clicks to close menu automatically
    mobileNavState.navItems.forEach(function (navItem, index) {
        navItem.addEventListener('click', function () {
            closeMobileMenu(mobileNavState);
        });

        // Handle keyboard activation (Enter and Space) for navigation items
        navItem.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Trigger click to navigate and close menu
                this.click();
            }
        });

        // Update focused index when item receives focus
        navItem.addEventListener('focus', function () {
            mobileNavState.focusedIndex = index;
        });
    });

    // Handle keyboard navigation within mobile menu
    document.addEventListener('keydown', function (e) {
        // Handle Escape key to close menu
        if (e.key === 'Escape' && mobileNavState.isOpen) {
            e.preventDefault();
            closeMobileMenu(mobileNavState);
            return;
        }

        // Handle Tab navigation within open menu (focus trap)
        if (mobileNavState.isOpen && (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            handleMenuNavigation(e, mobileNavState);
        }
    });

    // Handle window resize and orientation changes for responsive behavior
    let resizeTimeout;
    window.addEventListener('resize', function () {
        // Debounce resize events to improve performance
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            handleResponsiveResize(mobileNavState);
        }, 100);
    });

    // Handle orientation change events specifically for mobile devices
    window.addEventListener('orientationchange', function () {
        // Add a small delay to allow the viewport to adjust
        setTimeout(function () {
            handleResponsiveResize(mobileNavState);
        }, 200);
    });

    // Initialize responsive behavior on page load
    handleResponsiveResize(mobileNavState);

    // Test breakpoint behavior (for debugging - can be removed in production)
    if (window.location.search.includes('debug=true')) {
        setTimeout(testBreakpointBehavior, 1000);
    }
}

// Menu toggle functionality with proper state tracking
function toggleMobileMenu(state) {
    if (state.isOpen) {
        closeMobileMenu(state);
    } else {
        openMobileMenu(state);
    }
}

// Open mobile menu
function openMobileMenu(state) {
    state.isOpen = true;

    // Update ARIA attributes
    state.hamburgerBtn.setAttribute('aria-expanded', 'true');

    // Update ARIA state for mobile nav container
    if (state.mobileNav) {
        state.mobileNav.setAttribute('aria-hidden', 'false');
    }

    // Enable tabindex for menu items (make them focusable)
    state.navItems.forEach(function (item) {
        item.setAttribute('tabindex', '0');
    });

    // Add active classes for styling
    state.hamburgerBtn.classList.add('active');
    state.overlay.classList.add('active');

    // Prevent body scrolling when menu is open
    document.body.style.overflow = 'hidden';

    // Move focus to first menu item after a short delay to allow animation
    setTimeout(function () {
        if (state.navItems.length > 0) {
            state.navItems[0].focus();
            state.focusedIndex = 0;
        }
    }, 150);
}

// Close mobile menu
function closeMobileMenu(state) {
    state.isOpen = false;

    // Update ARIA attributes
    state.hamburgerBtn.setAttribute('aria-expanded', 'false');

    // Update ARIA state for mobile nav container
    if (state.mobileNav) {
        state.mobileNav.setAttribute('aria-hidden', 'true');
    }

    // Disable tabindex for menu items (remove from tab order)
    state.navItems.forEach(function (item) {
        item.setAttribute('tabindex', '-1');
    });

    // Remove active classes
    state.hamburgerBtn.classList.remove('active');
    state.overlay.classList.remove('active');

    // Restore body scrolling
    document.body.style.overflow = '';

    // Return focus to hamburger button
    state.hamburgerBtn.focus();
    state.focusedIndex = -1;
}

// Handle keyboard navigation within the mobile menu (focus trap)
function handleMenuNavigation(e, state) {
    const focusableItems = Array.from(state.navItems);
    const currentIndex = state.focusedIndex;

    if (e.key === 'Tab') {
        e.preventDefault();

        if (e.shiftKey) {
            // Shift+Tab: Move to previous item or wrap to last
            if (currentIndex <= 0) {
                state.focusedIndex = focusableItems.length - 1;
            } else {
                state.focusedIndex = currentIndex - 1;
            }
        } else {
            // Tab: Move to next item or wrap to first
            if (currentIndex >= focusableItems.length - 1) {
                state.focusedIndex = 0;
            } else {
                state.focusedIndex = currentIndex + 1;
            }
        }

        // Focus the new item
        if (focusableItems[state.focusedIndex]) {
            focusableItems[state.focusedIndex].focus();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Arrow Down: Move to next item or wrap to first
        if (currentIndex >= focusableItems.length - 1) {
            state.focusedIndex = 0;
        } else {
            state.focusedIndex = currentIndex + 1;
        }

        if (focusableItems[state.focusedIndex]) {
            focusableItems[state.focusedIndex].focus();
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Arrow Up: Move to previous item or wrap to last
        if (currentIndex <= 0) {
            state.focusedIndex = focusableItems.length - 1;
        } else {
            state.focusedIndex = currentIndex - 1;
        }

        if (focusableItems[state.focusedIndex]) {
            focusableItems[state.focusedIndex].focus();
        }
    }
}

// Handle responsive behavior and screen size changes
function handleResponsiveResize(state) {
    const currentWidth = window.innerWidth;
    const isMobile = currentWidth < 768;
    const isDesktop = currentWidth >= 768;

    // Automatically close mobile menu when screen size increases to desktop
    if (isDesktop && state.isOpen) {
        closeMobileMenu(state);

        // Log the transition for debugging (can be removed in production)
        console.log('Mobile menu closed due to screen size change to desktop view');
    }

    // Ensure proper behavior when switching between mobile and desktop views
    if (isMobile) {
        // Ensure mobile navigation elements are properly initialized for mobile view
        ensureMobileNavigation(state);
    } else {
        // Ensure desktop navigation is properly restored
        ensureDesktopNavigation(state);
    }

    // Update ARIA attributes based on current view
    updateResponsiveARIA(state, isMobile);
}

// Ensure mobile navigation is properly set up for mobile view
function ensureMobileNavigation(state) {
    // Ensure hamburger button is accessible
    if (state.hamburgerBtn) {
        state.hamburgerBtn.setAttribute('tabindex', '0');
        state.hamburgerBtn.style.display = 'flex';
    }

    // Ensure mobile navigation overlay is available
    if (state.overlay) {
        state.overlay.style.display = 'block';
    }

    // Reset any desktop-specific states that might interfere
    document.body.classList.add('mobile-view');
    document.body.classList.remove('desktop-view');
}

// Ensure desktop navigation is properly restored
function ensureDesktopNavigation(state) {
    // Ensure mobile menu is closed and reset
    if (state.isOpen) {
        closeMobileMenu(state);
    }

    // Reset body overflow in case it was locked by mobile menu
    document.body.style.overflow = '';

    // Update body classes for styling purposes
    document.body.classList.add('desktop-view');
    document.body.classList.remove('mobile-view');

    // Ensure focus is not trapped in mobile navigation elements
    if (document.activeElement &&
        (document.activeElement === state.hamburgerBtn ||
            Array.from(state.navItems).includes(document.activeElement))) {
        // Move focus to a safe element (like the main content or first sidebar link)
        const mainContent = document.querySelector('main') || document.querySelector('.content');
        const sidebarLink = document.querySelector('.sidebar-nav-item');

        if (sidebarLink) {
            sidebarLink.focus();
        } else if (mainContent) {
            mainContent.focus();
        }
    }
}

// Update ARIA attributes based on responsive state
function updateResponsiveARIA(state, isMobile) {
    if (isMobile) {
        // Mobile view: hamburger button should be available to screen readers
        if (state.hamburgerBtn) {
            state.hamburgerBtn.setAttribute('aria-hidden', 'false');
        }

        // Mobile navigation should be available but initially hidden
        if (state.mobileNav) {
            state.mobileNav.setAttribute('aria-hidden', state.isOpen ? 'false' : 'true');
        }
    } else {
        // Desktop view: hamburger button should be hidden from screen readers
        if (state.hamburgerBtn) {
            state.hamburgerBtn.setAttribute('aria-hidden', 'true');
        }

        // Mobile navigation should be completely hidden from screen readers
        if (state.mobileNav) {
            state.mobileNav.setAttribute('aria-hidden', 'true');
        }
    }
}

// Test breakpoint behavior at 768px threshold
function testBreakpointBehavior() {
    const testWidth = 768;
    const currentWidth = window.innerWidth;

    // Log current state for debugging
    console.log(`Current screen width: ${currentWidth}px`);
    console.log(`Breakpoint threshold: ${testWidth}px`);
    console.log(`Mobile view active: ${currentWidth < testWidth}`);

    // Test if CSS media queries are working correctly
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebar = document.querySelector('.sidebar');

    if (hamburgerBtn && sidebar) {
        const hamburgerDisplay = window.getComputedStyle(hamburgerBtn).display;
        const sidebarDisplay = window.getComputedStyle(sidebar).display;

        console.log(`Hamburger button display: ${hamburgerDisplay}`);
        console.log(`Sidebar display: ${sidebarDisplay}`);

        // Verify correct display states at breakpoint
        if (currentWidth < testWidth) {
            console.log('Expected: Hamburger visible, Sidebar hidden');
        } else {
            console.log('Expected: Hamburger hidden, Sidebar visible');
        }
    }
}

// Initialize responsive behavior testing (can be called from console for debugging)
window.testMobileNavBreakpoint = testBreakpointBehavior;

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
// Fixed Side Navigation Enhancement - Removed problematic active state management
// The Liquid template logic in sidebar.html now handles active states correctly


// Computer Science Quotes Feature
function displayRandomQuote() {
    // CS quotes data - embedded in JavaScript for immediate availability
    const csQuotes = [
        { quote: "The best way to predict the future is to invent it.", author: "Alan Kay" },
        { quote: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
        { quote: "First, solve the problem. Then, write the code.", author: "John Johnson" },
        { quote: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
        { quote: "The most important property of a program is whether it accomplishes the intention of its user.", author: "C.A.R. Hoare" },
        { quote: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
        { quote: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
        { quote: "The computer was born to solve problems that did not exist before.", author: "Bill Gates" },
        { quote: "Software is a great combination between artistry and engineering.", author: "Bill Gates" },
        { quote: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
        { quote: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
        { quote: "Debugging is twice as hard as writing the code in the first place.", author: "Brian Kernighan" },
        { quote: "It's not a bug – it's an undocumented feature.", author: "Anonymous" },
        { quote: "Good code is its own best documentation.", author: "Steve McConnell" },
        { quote: "The function of good software is to make the complex appear to be simple.", author: "Grady Booch" }
    ];

    // Get random quote
    const randomIndex = Math.floor(Math.random() * csQuotes.length);
    const selectedQuote = csQuotes[randomIndex];

    // Find or create quote container
    let quoteContainer = document.getElementById('cs-quote-container');

    if (!quoteContainer) {
        // Create quote container if it doesn't exist
        quoteContainer = document.createElement('div');
        quoteContainer.id = 'cs-quote-container';
        quoteContainer.className = 'cs-quote-simple';

        // Insert below the page title
        const pageTitle = document.querySelector('.page-title') || document.querySelector('h1');
        if (pageTitle) {
            // Insert after the page title
            pageTitle.parentNode.insertBefore(quoteContainer, pageTitle.nextSibling);
        } else {
            // Fallback: insert at the top of the content container
            const contentContainer = document.querySelector('.content');
            if (contentContainer) {
                contentContainer.insertBefore(quoteContainer, contentContainer.firstChild);
            }
        }
    }

    // Update quote content with fade effect
    quoteContainer.style.opacity = '0';

    setTimeout(() => {
        quoteContainer.innerHTML = `
            <p class="quote-text">"${selectedQuote.quote}" — ${selectedQuote.author}</p>
        `;
        quoteContainer.style.opacity = '1';
    }, 200);
}

// Initialize quote display on page load
document.addEventListener('DOMContentLoaded', function () {
    // Add a small delay to ensure page is fully loaded
    setTimeout(displayRandomQuote, 500);
});

// Add CSS styles for the quote display
const quoteStyles = `
.cs-quote-simple {
    margin-bottom: 1.5rem;
    text-align: center;
    transition: opacity 0.3s ease;
}

.quote-text {
    font-style: italic;
    color: #666;
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
}

@media (max-width: 768px) {
    .quote-text {
        font-size: 0.9rem;
    }
}
`;

// Inject quote styles
const quoteStyleSheet = document.createElement('style');
quoteStyleSheet.textContent = quoteStyles;
document.head.appendChild(quoteStyleSheet);
