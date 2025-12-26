"use strict";

document.addEventListener('DOMContentLoaded', () => {

    // A minimal App-like structure for the about page
    class AboutPage {
        constructor() {
            this.init();
        }

        async init() {
            try {
                // Set up basic UI stuff
                this.initMobileNavigation();
                this.initBackToTopButton();

                // Load translations
                await window.I18n.init();
                
                // Manually trigger the first translation
                window.I18n.translatePage();

                // Handle manual language changes
                this.initLangSelector();

            } catch (error) {
                console.error("About page initialization failed:", error);
            }
        }

        initLangSelector() {
            const langSelector = document.querySelector('.language-selector');
            if (!langSelector) return;
    
            langSelector.querySelectorAll('.lang-dropdown a').forEach(link => {
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const lang = e.target.getAttribute('data-lang');
                    if (lang && lang !== window.I18n.currentLang) {
                        await window.I18n.setLanguage(lang);
                        window.I18n.translatePage(); // Re-translate the page
                    }
                });
            });
        }

        initBackToTopButton() {
            const btn = document.getElementById('back-to-top-btn');
            if (!btn) return;

            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
            }, { passive: true });

            btn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        initMobileNavigation() {
            const hamburger = document.querySelector('.hamburger-menu');
            const mobileNav = document.querySelector('.mobile-nav');
            if (!hamburger || !mobileNav) return;

            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('is-active');
                mobileNav.classList.toggle('is-active');
                document.body.style.overflow = mobileNav.classList.contains('is-active') ? 'hidden' : '';
            });

            mobileNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('is-active');
                    mobileNav.classList.remove('is-active');
                    document.body.style.overflow = '';
                });
            });
        }
    }

    new AboutPage();
});
