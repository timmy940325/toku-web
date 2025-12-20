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
            this.map = null;
            this.markers = {}; // To store marker instances
            // Define the global update function and bind it to the class instance
            window.updatePageLanguage = this.updateLanguage.bind(this);
            this.init();
        }

        async init() {
            try {
                await window.I18n.init();
                this.initSmoothScroll();
                this.initMobileNavigation();
                this.initHeaderScrollEffect();
                
                await this.loadAttractions();
                
                this.initMap();
                this.initScrollAnimations();
                
                // Perform initial translation
                this.updateLanguage();

            } catch (error) {
                console.error("Website initialization failed:", error);
            }
        }

        getCategoryStyle(category) {
            const styles = {
                '歷史建築': { color: '#8B4513' }, // SaddleBrown
                '歷史街區': { color: '#A0522D' }, // Sienna
                '美食': { color: '#FFA500' },     // Orange
                '信仰': { color: '#FFD700' },     // Gold
                '文化': { color: '#800080' },     // Purple
                '體驗': { color: '#008080' },     // Teal
                '咖啡': { color: '#654321' }      // DarkBrown (custom)
            };
            return styles[category] || { color: '#708090' }; // Default to SlateGray
        }

        panToMarker(attractionId) {
            const marker = this.markers[attractionId];
            if (marker) {
                this.map.flyTo(marker.getLatLng(), 17, {
                    animate: true,
                    duration: 1.5
                });
                marker.openPopup();
            }
        }
        
        // This function will be called by the i18n module
        updateLanguage() {
            window.I18n.translatePage();
            this.renderAttractionCards();
            this.updateMapPopups();
        }

        async loadAttractions() {
            try {
                const response = await fetch('/toku-web/attractions.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.attractions = await response.json();
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
            if (this.map) { // If map already exists, just update popups
                this.updateMapPopups();
                return;
            }
            const mapCenter = [23.6766, 120.3906];
            this.map = L.map('map').setView(mapCenter, 15);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);
        }
        
        updateMapPopups() {
            if (!this.map) return;
            
            // Clear existing markers from the map
            Object.values(this.markers).forEach(marker => marker.removeFrom(this.map));
            this.markers = {};

            const lang = window.I18n.currentLang;

            this.attractions.forEach(attraction => {
                if (attraction.coordinates && attraction.coordinates.lat) {
                    const style = this.getCategoryStyle(attraction.category['zh-TW']); // Use zh-TW for consistent key
                    const icon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: ${style.color};" class="marker-pin"></div>`,
                        iconSize: [30, 42],
                        iconAnchor: [15, 42]
                    });

                    const marker = L.marker([attraction.coordinates.lat, attraction.coordinates.lon], { icon: icon }).addTo(this.map);
                    const popupContent = `<b>${attraction.name[lang]}</b><br><a href="pages/detail.html?id=${attraction.id}">${window.I18n.t('card_button')}</a>`;
                    marker.bindPopup(popupContent);

                    this.markers[attraction.id] = marker;
                }
            });
        }

        renderAttractionCards() {
            const grid = document.getElementById('attraction-grid');
            if (!grid) return;

            grid.innerHTML = '';
            const fragment = document.createDocumentFragment();
            const lang = window.I18n.currentLang;

            this.attractions.forEach(attraction => {
                const detailUrl = `pages/detail.html?id=${attraction.id}`;
                const imageUrl = `images/${attraction.folder}/${attraction.card_image}`;

                const card = document.createElement('div'); // Changed from 'a' to 'div'
                card.className = 'card fade-in-element';

                card.innerHTML = `
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${attraction.name[lang]}" loading="lazy">
                        <div class="card-category">${attraction.category[lang]}</div>
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${attraction.name[lang]}</h3>
                        <p class="card-description">${attraction.description[lang]}</p>
                        <div class="card-actions">
                            <button class="card-button map-button" data-id="${attraction.id}">${window.I18n.t('map_button_text')}</button>
                            <a href="${detailUrl}" class="card-button learn-more-button">${window.I18n.t('card_button')}</a>
                        </div>
                    </div>
                `;
                fragment.appendChild(card);
            });

            grid.appendChild(fragment);

            // Add event listeners for the new map buttons
            grid.querySelectorAll('.map-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const attractionId = e.currentTarget.getAttribute('data-id');
                    this.panToMarker(attractionId);
                    // Scroll to the map
                    document.getElementById('map-container').scrollIntoView({ behavior: 'smooth' });
                });
            });

            // Re-initialize scroll animations for new cards
            this.initScrollAnimations();
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
            const animatedElements = document.querySelectorAll('.fade-in-element:not(.is-visible)');
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
