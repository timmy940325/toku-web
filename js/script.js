/**
 * Tuku GO - Professional Travel Guide
 *
 * This script handles the main homepage functionality, including loading attraction
 * data, rendering attraction cards, and initializing interactive components.
 *
 * @version 3.0.0
 * @author Gemini
 */
"use strict";

document.addEventListener('DOMContentLoaded', () => {

    class App {
        constructor() {
            this.attractions = [];
            this.map = null; // To hold the map instance
            this.init();
        }

        async init() {
            try {
                // Initialize the i18n module first
                await window.I18n.init();
                
                // Translate static parts of the page
                window.I18n.translatePage();

                this.initSmoothScroll();
                this.initMobileNavigation();
                this.initHeaderScrollEffect();
                
                await this.loadAttractions();
                
                this.initMap();
                this.initScrollAnimations();

                // Listen for language changes to re-render content
                document.addEventListener('language-changed', () => {
                    window.I18n.translatePage();
                    this.renderAttractionCards();
                    // We might need to update map popups as well
                    this.updateMapPopups();
                });

            } catch (error) {
                console.error("Website initialization failed:", error);
            }
        }

        async loadAttractions() {
            try {
                const response = await fetch('/toku-web/attractions.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.attractions = await response.json();
                this.renderAttractionCards();
            } catch (error) {
                console.error("Failed to load attraction data:", error);
                const grid = document.getElementById('attraction-grid');
                if (grid) {
                    grid.innerHTML = `<p class="error-message">${window.I18n.t('error_db_load')}</p>`;
                }
            }
        }

        initMap() {
            if (typeof L === 'undefined') {
                console.error("Leaflet library not loaded.");
                return;
            }
            const mapCenter = [23.6766, 120.3906];
            this.map = L.map('map').setView(mapCenter, 15);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);

            this.updateMapPopups();
        }
        
        updateMapPopups() {
            if (!this.map) return;
            // Clear existing markers
            this.map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    this.map.removeLayer(layer);
                }
            });

            this.attractions.forEach(attraction => {
                if (attraction.coordinates && attraction.coordinates.lat) {
                    const marker = L.marker([attraction.coordinates.lat, attraction.coordinates.lon]).addTo(this.map);
                    const popupContent = `<b>${attraction.name[window.I18n.currentLang]}</b><br><a href="pages/detail.html?id=${attraction.id}">${window.I18n.t('card_button')}</a>`;
                    marker.bindPopup(popupContent);
                }
            });
        }

        renderAttractionCards() {
            const grid = document.getElementById('attraction-grid');
            if (!grid) return;

            grid.innerHTML = ''; // Clear existing cards
            const fragment = document.createDocumentFragment();
            const lang = window.I18n.currentLang;

            this.attractions.forEach(attraction => {
                const detailUrl = `pages/detail.html?id=${attraction.id}`;
                const imageUrl = `images/${attraction.folder}/${attraction.card_image}`;

                const card = document.createElement('a');
                card.href = detailUrl;
                card.className = 'card fade-in-element';

                card.innerHTML = `
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${attraction.name[lang]}" loading="lazy">
                        <div class="card-category">${attraction.category[lang]}</div>
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${attraction.name[lang]}</h3>
                        <p class="card-description">${attraction.description[lang]}</p>
                        <span class="card-button" data-i18n="card_button">${window.I18n.t('card_button')}</span>
                    </div>
                `;
                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
        }

        initSmoothScroll() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
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

        initHeaderScrollEffect() {
            const header = document.querySelector('.main-header');
            if (!header) return;
            const scrollThreshold = 50;

            window.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', window.scrollY > scrollThreshold);
            }, { passive: true });
        }

        initScrollAnimations() {
            const animatedElements = document.querySelectorAll('.fade-in-element');
            if (animatedElements.length === 0) return;

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '0px',
                threshold: 0.1
            });

            animatedElements.forEach(el => observer.observe(el));
        }
    }

    new App();
});
