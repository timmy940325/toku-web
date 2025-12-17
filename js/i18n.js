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
        
        // Dispatch a custom event to notify other parts of the app that the language has changed
        document.dispatchEvent(new CustomEvent('language-changed'));
    },

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // Also update the lang attribute of the html tag for accessibility
        document.documentElement.lang = this.currentLang.split('-')[0];
    },

    initLangSelector() {
        const langSelector = document.querySelector('.language-selector');
        if (!langSelector) return;

        const langButton = langSelector.querySelector('.lang-button');
        if (langButton) {
            langButton.textContent = this.t(`lang_${this.currentLang.replace('-', '_')}`);
        }

        langSelector.querySelectorAll('.lang-dropdown a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
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
