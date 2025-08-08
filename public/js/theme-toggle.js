/**
 * Theme Toggle Functionality
 * Switches between light and dark themes
 */

(function () {
    'use strict';

    // Get elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    // Check for saved theme preference or default to light theme
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Apply the saved theme on page load
    if (currentTheme === 'dark') {
        body.classList.add('dark-theme');
        updateIcon('dark');
    } else {
        body.classList.remove('dark-theme');
        updateIcon('light');
    }

    // Theme toggle function
    function toggleTheme() {
        if (body.classList.contains('dark-theme')) {
            // Switch to light theme
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            updateIcon('light');
        } else {
            // Switch to dark theme
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            updateIcon('dark');
        }
    }

    // Update icon based on theme
    function updateIcon(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
            themeToggleBtn.title = 'Switch to Light Theme';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeToggleBtn.title = 'Switch to Dark Theme';
        }
    }

    // Add event listener to toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Add keyboard support
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        });
    }

    // Add smooth transition class after page load
    window.addEventListener('load', function () {
        document.body.classList.add('theme-transitions');
    });

})();
