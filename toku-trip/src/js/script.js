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

function startApp() {
    class App {
        constructor() {
            this.attractions = [];
            this.map = null;
            this.markers = {}; // To store marker instances
            this.markerClusterGroup = null; // For marker clustering
            this.categoryLayers = {}; // To hold layers for filtering
            
            this.init();
        }

        async init() {
            try {
                // 1. Set up basic UI stuff that doesn't depend on data
                this.initSmoothScroll();
                this.initMobileNavigation();
                this.initHeaderScrollEffect();
                this.initBackToTopButton();

                // 2. Load core data (translations and attractions)
                await window.I18n.init();
                this.initLangSelector(); // Init selector after i18n is ready
                await this.loadAttractions();
                
                // 3. Now that we have data, build the map
                this.initMap();
                this.createMarkers();
                
                // 4. Render UI components that depend on data
                this.renderMapFilters();
                this.renderAttractionCards();
                
                // 5. Perform the initial filtering and translation render
                this.filterMarkers('All');
                window.I18n.translatePage();

                // 6. Set up animations for dynamically added content
                this.initScrollAnimations();

            } catch (error) {
                console.error("Website initialization failed:", error);
            }
        }

        // Re-renders content when language changes
        updateLanguage() {
            window.I18n.translatePage();
            this.createMarkers();
            this.renderMapFilters();
            this.renderAttractionCards();
            this.filterMarkers('All'); 
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
        
        getCategoryIcon(category) {
            const icons = {
                '歷史建築': { icon: 'fa-landmark', color: '#8B4513' },
                '歷史街區': { icon: 'fa-landmark', color: '#A0522D' },
                '美食': { icon: 'fa-utensils', color: '#FFA500' },
                '信仰': { icon: 'fa-place-of-worship', color: '#FFD700' },
                '文化': { icon: 'fa-palette', color: '#800080' },
                '體驗': { icon: 'fa-hand-paper', color: '#008080' },
                '咖啡': { icon: 'fa-coffee', color: '#654321' }
            };
            const style = icons[category] || { icon: 'fa-map-marker-alt', color: '#708090' };
            
            return L.divIcon({
                className: 'custom-fa-icon',
                html: `<div class="marker-icon-background" style="background-color: ${style.color};"><i class="fa-solid ${style.icon}"></i></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });
        }

        panToMarker(attractionId) {
            const marker = this.markers[attractionId];
            if (marker) {
                this.map.flyTo(marker.getLatLng(), 17, {
                    animate: true,
                    duration: 1.5
                });
                this.markerClusterGroup.zoomToShowLayer(marker, () => {
                    marker.openPopup();
                });
            }
        }

        async loadAttractions() {
            try {
                const response = await fetch('attractions.json');
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
            if (this.map) {
                this.map.remove();
            }
            const mapCenter = [23.6766, 120.3906];
            this.map = L.map('map').setView(mapCenter, 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            this.markerClusterGroup = L.markerClusterGroup().addTo(this.map);
        }
        
        createMarkers() {
            if (!this.map) return;
            
            this.markerClusterGroup.clearLayers();
            Object.values(this.categoryLayers).forEach(layer => layer.clearLayers());
            this.markers = {};

            const lang = window.I18n.currentLang;

            this.attractions.forEach(attraction => {
                const category = attraction.category['zh-TW'];
                if (!this.categoryLayers[category]) {
                    this.categoryLayers[category] = L.layerGroup();
                }

                if (attraction.coordinates && attraction.coordinates.lat) {
                    const icon = this.getCategoryIcon(category);
                    const marker = L.marker([attraction.coordinates.lat, attraction.coordinates.lon], { icon: icon });
                    
                    const popupContent = `<b>${attraction.name[lang]}</b><br><a href="pages/detail.html?id=${attraction.id}">${window.I18n.t('card_button')}</a>`;
                    marker.bindPopup(popupContent);

                    this.markers[attraction.id] = marker;
                    this.categoryLayers[category].addLayer(marker);
                }
            });
        }

        renderMapFilters() {
            const filtersContainer = document.getElementById('map-filters');
            if (!filtersContainer) return;

            const categories = ['All', ...Object.keys(this.categoryLayers)];
            filtersContainer.innerHTML = '';
            const fragment = document.createDocumentFragment();

            categories.forEach(category => {
                const button = document.createElement('button');
                button.className = 'map-filter-button';
                button.dataset.filter = category;
                const buttonText = category === 'All' ? window.I18n.t('filter_all') : this.attractions.find(a => a.category['zh-TW'] === category).category[window.I18n.currentLang];
                button.textContent = buttonText;
                fragment.appendChild(button);
            });

            filtersContainer.appendChild(fragment);

            filtersContainer.querySelectorAll('.map-filter-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const filterKey = e.currentTarget.dataset.filter;
                    this.filterMarkers(filterKey);
                });
            });
        }

        filterMarkers(filterKey) {
            if (!this.markerClusterGroup) return; 
            this.markerClusterGroup.clearLayers();

            if (filterKey === 'All') {
                Object.values(this.categoryLayers).forEach(layer => {
                    this.markerClusterGroup.addLayer(layer);
                });
            } else {
                if (this.categoryLayers[filterKey]) {
                    this.markerClusterGroup.addLayer(this.categoryLayers[filterKey]);
                }
            }

            document.querySelectorAll('#map-filters .map-filter-button').forEach(button => {
                button.classList.toggle('active', button.dataset.filter === filterKey);
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

                const card = document.createElement('div');
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

            grid.querySelectorAll('.map-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const attractionId = e.currentTarget.getAttribute('data-id');
                    this.panToMarker(attractionId);
                    document.getElementById('map-container').scrollIntoView({ behavior: 'smooth' });
                });
            });

            this.initScrollAnimations();
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
                        this.updateLanguage();
                    }
                });
            });
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
}

