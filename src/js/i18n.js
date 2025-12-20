/**
 * Tuku GO - Internationalization (i18n) Module
 *
 * This module handles language detection, loading of translation files,
 * and provides functions to translate content throughout the website.
 *
 * @version 1.0.0
 * @author Gemini
 */
"use strict";

const I18n = {
    supportedLangs: ['zh-TW', 'en', 'ja', 'ko'],
    defaultLang: 'zh-TW',
    currentLang: '',
    translations: {},

    async init() {
        this.currentLang = this.getLanguage();
        await this.loadTranslations(this.currentLang);
        this.initLangSelector();
        // The initial page render should be triggered by the main script AFTER i18n is ready.
        // After initial load and translation, make content visible
        document.body.classList.add('i18n-loaded');
    },

    getLanguage() {
        const storedLang = localStorage.getItem('tuku_go_lang');
        if (storedLang && this.supportedLangs.includes(storedLang)) {
            return storedLang;
        }

        const browserLang = navigator.language;
        if (this.supportedLangs.includes(browserLang)) {
            return browserLang;
        }
        
        // Find a supported language from the browser's languages
        for (const lang of navigator.languages) {
            if (this.supportedLangs.includes(lang)) {
                return lang;
            }
            // Check for broader matches e.g., 'en-US' -> 'en'
            const baseLang = lang.split('-')[0];
            if (this.supportedLangs.includes(baseLang)) {
                return baseLang;
            }
        }

        return this.defaultLang;
    },

    async loadTranslations(lang) {
        try {
            const response = await fetch(`/toku-web/locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Could not load translations for ${lang}`);
            }
            this.translations = await response.json();
        } catch (error) {
            console.error(error);
            // Fallback to default language if a translation file is missing
            if (lang !== this.defaultLang) {
                await this.loadTranslations(this.defaultLang);
            }
        }
    },

    t(key, replacements = {}) {
        let translation = this.translations[key];
        if (translation === undefined) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }

        // Handle replacements for dynamic values (e.g., "{distance}")
        for (const placeholder in replacements) {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        }

        return translation;
    },

    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            lang = this.defaultLang;
        }
        this.currentLang = lang;
        localStorage.setItem('tuku_go_lang', lang);
        await this.loadTranslations(lang);
        // The calling script is now responsible for triggering the re-render.
    },

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (element) {
                element.textContent = this.t(key);
            }
        });
        
        // Also update the lang attribute of the html tag for accessibility
        document.documentElement.lang = this.currentLang.split('-')[0];
        this.updateLangButtonText(); // Update the text on the language button
    },

    updateLangButtonText() {
        const langButtonTextElement = document.querySelector('.language-selector .current-lang-text');
        if (langButtonTextElement) {
            langButtonTextElement.textContent = this.t(`lang_${this.currentLang.replace('-', '_')}`);
        }
    },

    initLangSelector() {
        const langSelector = document.querySelector('.language-selector');
        if (!langSelector) return;

        const langButton = langSelector.querySelector('.lang-button');
        const langDropdown = langSelector.querySelector('.lang-dropdown');
        const currentLangText = langSelector.querySelector('.current-lang-text'); // Get the span for current language text

        // Initialize button text
        if (currentLangText) {
            currentLangText.textContent = this.t(`lang_${this.currentLang.replace('-', '_')}`);
        }

        if (langButton && langDropdown) {
            langButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent document click from immediately closing
                langDropdown.classList.toggle('is-open');
                langButton.classList.toggle('is-open'); // Add class to button as well
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!langSelector.contains(e.target)) {
                    langDropdown.classList.remove('is-open');
                    langButton.classList.remove('is-open');
                }
            });
        }

        langSelector.querySelectorAll('.lang-dropdown a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                langDropdown.classList.remove('is-open'); // Close dropdown on selection
                langButton.classList.remove('is-open'); // Remove class from button
                const lang = e.target.getAttribute('data-lang');
                if (lang && lang !== this.currentLang) {
                    this.setLanguage(lang);
                }
            });
        });
    }
};

// Expose the module to be used by other scripts
// This is a simple approach for vanilla JS projects
window.I18n = I18n;
