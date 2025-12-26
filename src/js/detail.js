/**
 * Tuku GO - Attraction Detail Page
 *
 * This script handles the dynamic loading of content for a single attraction
 * based on a URL parameter. It fetches attraction data and populates the
 * detail page template.
 *
 * @version 3.0.0
 * @author Gemini
 */
"use strict";

document.addEventListener('DOMContentLoaded', () => {

    class DetailPage {
        constructor() {
            this.attractions = [];
            this.currentAttraction = null;
            this.galleryImages = [];
            this.currentLightboxIndex = 0;
            this.detailMap = null;
            this.init();
        }

        async init() {
            try {
                // 1. Set up shared UI components
                this.initBackToTopButton();
                this.initLightbox();

                // 2. Load translations first
                await window.I18n.init();
                this.initLangSelector();

                // 3. Get attraction ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                const attractionId = urlParams.get('id');

                if (!attractionId) {
                    this.renderError(window.I18n.t('error_missing_id'));
                    return;
                }

                // 4. Load all attraction data
                await this.loadAttractionData(attractionId);
                
                // 5. Perform the initial page render
                this.renderPage();

            } catch (error) {
                console.error("Initialization failed:", error);
                this.renderError(error.message);
            }
        }

        getCategoryIcon(category, isCurrent = false) {
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
            const scale = isCurrent ? 'scale(1.2)' : 'scale(1)';
            const zIndex = isCurrent ? 1000 : 900;
            
            return L.divIcon({
                className: 'custom-fa-icon',
                html: `<div class="marker-icon-background" style="background-color: ${style.color}; transform: ${scale}; z-index: ${zIndex};"><i class="fa-solid ${style.icon}"></i></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });
        }

        initLightbox() {
            const modal = document.getElementById('lightbox-modal');
            if (!modal) return;

            const closeBtn = modal.querySelector('.lightbox-close');
            const prevBtn = modal.querySelector('.lightbox-prev');
            const nextBtn = modal.querySelector('.lightbox-next');

            closeBtn.addEventListener('click', () => this.closeLightbox());
            prevBtn.addEventListener('click', () => this.showPrevImage());
            nextBtn.addEventListener('click', () => this.showNextImage());
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeLightbox();
                }
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

        initLangSelector() {
            const langSelector = document.querySelector('.language-selector');
            if (!langSelector) return;
    
            langSelector.querySelectorAll('.lang-dropdown a').forEach(link => {
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const lang = e.target.getAttribute('data-lang');
                    if (lang && lang !== window.I18n.currentLang) {
                        await window.I18n.setLanguage(lang);
                        this.renderPage(); // Re-render page with new language
                    }
                });
            });
        }

        async loadAttractionData(attractionId) {
            try {
                const response = await fetch('../attractions.json');
                if (!response.ok) {
                    throw new Error(window.I18n.t('error_db_load'));
                }
                this.attractions = await response.json();
                this.currentAttraction = this.attractions.find(a => a.id === attractionId);

                if (!this.currentAttraction) {
                    throw new Error(window.I18n.t('error_not_found'));
                }

            } catch (error) {
                throw error;
            }
        }

        renderPage() {
            if (!this.currentAttraction) return;

            window.I18n.translatePage();
            const lang = window.I18n.currentLang;
            const attraction = this.currentAttraction;

            document.title = `Tuku GO - ${attraction.name[lang]}`;
            
            const hero = document.getElementById('detail-hero');
            const heroTitle = document.getElementById('hero-title');
            if (hero && heroTitle) {
                const heroImageUrl = `../images/${attraction.folder}/${attraction.card_image}`;
                hero.style.backgroundImage = `url('${heroImageUrl}')`;
                heroTitle.textContent = attraction.name[lang];
            }

            document.getElementById('detail-title').textContent = attraction.name[lang];
            document.getElementById('detail-description').textContent = attraction.description[lang];

            const storySection = document.getElementById('spot-story-section');
            const storyContent = document.getElementById('spot-story-content');
            if (storySection && storyContent && attraction.story && attraction.story[lang]) {
                storySection.style.display = 'block';
                storyContent.innerHTML = attraction.story[lang];
            } else if (storySection) {
                storySection.style.display = 'none';
            }

            const metaContainer = document.getElementById('detail-meta');
            if (metaContainer) {
                metaContainer.innerHTML = `
                    <p><strong>${window.I18n.t('detail_meta_address')}:</strong> ${attraction.address[lang]}</p>
                    <p><strong>${window.I18n.t('detail_meta_hours')}:</strong> ${attraction.opening_hours[lang]}</p>
                `;
            }
            
            const galleryContainer = document.getElementById('gallery-container');
            if (galleryContainer && attraction.gallery_images && attraction.gallery_images.length > 0) {
                 galleryContainer.style.display = 'block';
            }


            this.renderGallery();
            this.renderStripImage();
            this.renderNearbyAttractions();
            this.renderDetailMap();
        }

        renderDetailMap() {
            const mapContainer = document.getElementById('detail-map');
            // Guard clause: Do not render map if container or coordinates are missing/invalid.
            if (!mapContainer || !this.currentAttraction.coordinates || this.currentAttraction.coordinates.placeholder) {
                if(mapContainer) mapContainer.style.display = 'none'; // Ensure container is hidden
                return;
            }
            mapContainer.style.display = 'block';

            if (this.detailMap) {
                this.detailMap.remove();
            }

            const currentCoords = [this.currentAttraction.coordinates.lat, this.currentAttraction.coordinates.lon];
            this.detailMap = L.map('detail-map').setView(currentCoords, 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.detailMap);

            // Add marker for the current attraction
            const currentIcon = this.getCategoryIcon(this.currentAttraction.category['zh-TW'], true);
            L.marker(currentCoords, { icon: currentIcon }).addTo(this.detailMap)
                .bindPopup(`<b>${this.currentAttraction.name[window.I18n.currentLang]}</b>`)
                .openPopup();

            // Add markers for nearby attractions
            const nearbyAttractions = this.attractions
                .filter(a => a.id !== this.currentAttraction.id && a.coordinates && !a.coordinates.placeholder)
                .sort((a, b) => this.getDistance(this.currentAttraction.coordinates, a.coordinates) - this.getDistance(this.currentAttraction.coordinates, b.coordinates))
                .slice(0, 3);
                
            nearbyAttractions.forEach(attraction => {
                const icon = this.getCategoryIcon(attraction.category['zh-TW']);
                L.marker([attraction.coordinates.lat, attraction.coordinates.lon], { icon: icon })
                    .addTo(this.detailMap)
                    .bindPopup(`<b>${attraction.name[window.I18n.currentLang]}</b>`);
            });
        }

        renderGallery() {
            const attraction = this.currentAttraction;
            const imageGallery = document.getElementById('image-gallery');
            if (!imageGallery) return;

            this.galleryImages = []; // Reset for re-renders
            imageGallery.innerHTML = '';

            if (attraction.gallery_images && attraction.gallery_images.length > 0) {
                const fragment = document.createDocumentFragment();

                attraction.gallery_images.forEach((imageName, index) => {
                    const imageUrl = `../images/${attraction.folder}/${imageName}`;
                    this.galleryImages.push(imageUrl);

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = `${attraction.name[window.I18n.currentLang]} gallery image ${index + 1}`;
                    img.loading = 'lazy';
                    img.addEventListener('click', () => this.openLightbox(index));
                    fragment.appendChild(img);
                });

                imageGallery.appendChild(fragment);
            }
        }

        openLightbox(index) {
            const modal = document.getElementById('lightbox-modal');
            if (!modal || this.galleryImages.length === 0) return;

            this.currentLightboxIndex = index;
            modal.classList.add('visible');
            this.updateLightboxImage();
        }

        closeLightbox() {
            const modal = document.getElementById('lightbox-modal');
            if (modal) {
                modal.classList.remove('visible');
            }
        }

        showNextImage() {
            this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.galleryImages.length;
            this.updateLightboxImage();
        }

        showPrevImage() {
            this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
            this.updateLightboxImage();
        }

        updateLightboxImage() {
            const imageEl = document.getElementById('lightbox-image');
            const captionEl = document.getElementById('lightbox-caption');
            if (!imageEl || !captionEl) return;

            const newSrc = this.galleryImages[this.currentLightboxIndex];
            imageEl.src = newSrc;
            captionEl.textContent = `${this.currentLightboxIndex + 1} / ${this.galleryImages.length}`;
        }

        renderStripImage() {
            const attraction = this.currentAttraction;
            const section = document.getElementById('strip-image-section');
            const container = document.getElementById('strip-image-container');

            if (!section || !container) return;

            if (attraction.stripImage && attraction.stripImage.trim() !== '') {
                section.style.display = 'block';
                const imageUrl = `../images/${attraction.folder}/${attraction.stripImage}`;
                
                container.innerHTML = ''; // Clear previous image
                
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = `${attraction.name[window.I18n.currentLang]} - ${window.I18n.t('strip_image_title')}`;
                img.loading = 'lazy';
                
                container.appendChild(img);
            } else {
                section.style.display = 'none';
            }
        }

        getDistance(coords1, coords2) {
            const R = 6371; // km
            const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
            const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        renderNearbyAttractions() {
            const nearbySection = document.getElementById('nearby-section');
            const nearbyGrid = document.getElementById('nearby-grid');
            if (!nearbySection || !nearbyGrid) return;
            
            const lang = window.I18n.currentLang;

            const sorted = this.attractions
                .filter(a => a.id !== this.currentAttraction.id && a.coordinates && !a.coordinates.placeholder)
                .map(a => ({
                    ...a,
                    distance: this.getDistance(this.currentAttraction.coordinates, a.coordinates)
                }))
                .sort((a, b) => a.distance - b.distance);
            
            const nearbyAttractions = sorted.slice(0, 3);

            if (nearbyAttractions.length > 0) {
                nearbySection.style.display = 'block';
                nearbyGrid.innerHTML = '';
                const fragment = document.createDocumentFragment();

                nearbyAttractions.forEach(attraction => {
                    const detailUrl = `detail.html?id=${attraction.id}`;
                    const imageUrl = `../images/${attraction.folder}/${attraction.card_image}`;
                    const card = document.createElement('a');
                    card.href = detailUrl;
                    card.className = 'card';
                    card.innerHTML = `
                        <div class="card-image-container">
                            <img src="${imageUrl}" alt="${attraction.name[lang]}" loading="lazy">
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">${attraction.name[lang]}</h3>
                            <span class="card-button">${window.I18n.t('detail_nearby_button', {distance: attraction.distance.toFixed(2)})}</span>
                        </div>
                    `;
                    fragment.appendChild(card);
                });
                nearbyGrid.appendChild(fragment);
            }
        }

        renderError(message) {
            const mainContent = document.getElementById('detail-main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="page-container" style="text-align: center; padding-top: 5rem; padding-bottom: 5rem;">
                        <h1 class="section-title">Error</h1>
                        <p>${message}</p>
                        <a href="../index.html" class="cta-button" data-i18n="error_back_button">${window.I18n.t('error_back_button')}</a>
                    </div>
                `;
            }
        }
    }

    new DetailPage();
});
