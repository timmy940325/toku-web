"use strict";

document.addEventListener('DOMContentLoaded', () => {
    
    // Define the global update function for this page
    window.updatePageLanguage = () => {
        window.I18n.translatePage();
    };

    // Initialize the i18n module and perform initial translation
    async function init() {
        await window.I18n.init();
        window.updatePageLanguage();
    }

    init();
});
