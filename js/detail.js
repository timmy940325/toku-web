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
            // Define the global update function and bind it to the class instance
            window.updatePageLanguage = this.renderPage.bind(this);
            this.init();
        }

        async init() {
            try {
                await window.I18n.init();

                const urlParams = new URLSearchParams(window.location.search);
                const attractionId = urlParams.get('id');

                if (!attractionId) {
                    this.renderError(window.I18n.t('error_missing_id'));
                    return;
                }

                await this.loadAttractionData(attractionId);
                
                // Perform initial render
                this.renderPage();

            } catch (error) {
                console.error("Initialization failed:", error);
                this.renderError(error.message);
            }
        }

        async loadAttractionData(attractionId) {
            try {
                const response = await fetch('/toku-web/attractions.json');
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
            // This function is now the central point for all rendering on this page
            if (!this.currentAttraction) return; // Don't render if data isn't loaded yet

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

            const metaContainer = document.getElementById('detail-meta');
            if (metaContainer) {
                metaContainer.innerHTML = `
                    <p><strong>${window.I18n.t('detail_meta_address')}:</strong> ${attraction.address[lang]}</p>
                    <p><strong>${window.I18n.t('detail_meta_hours')}:</strong> ${attraction.opening_hours[lang]}</p>
                `;
            }

            this.renderGallery();
            this.renderPanorama();
            this.renderNearbyAttractions();
        }

        renderGallery() {
            const attraction = this.currentAttraction;
            const galleryContainer = document.getElementById('gallery-container');
            const imageGallery = document.getElementById('image-gallery');

            if (galleryContainer && imageGallery && attraction.gallery_images && attraction.gallery_images.length > 0) {
                galleryContainer.style.display = 'block';
                imageGallery.innerHTML = '';
                const fragment = document.createDocumentFragment();

                attraction.gallery_images.forEach(imageName => {
                    const img = document.createElement('img');
                    img.src = `../images/${attraction.folder}/${imageName}`;
                    img.alt = `${attraction.name[window.I18n.currentLang]} gallery image`;
                    img.loading = 'lazy';
                    fragment.appendChild(img);
                });

                imageGallery.appendChild(fragment);
            }
        }

        renderPanorama() {
            const attraction = this.currentAttraction;
            const panoramaContainer = document.getElementById('panorama-container');
            if (!panoramaContainer) return;

            // Clear previous instance if it exists
            if (panoramaContainer. pannellum) {
                 panoramaContainer.pannellum.destroy();
            }

            if (typeof pannellum === 'undefined') {
                console.error("Pannellum library not loaded.");
                return;
            }

            if (attraction.panorama_image) {
                panoramaContainer.style.display = 'block';
                pannellum.viewer('panorama', {
                    "type": "equirectangular",
                    "panorama": `../images/${attraction.folder}/${attraction.panorama_image}`,
                    "autoLoad": true,
                    "autoRotate": -2
                });
            } else {
                 panoramaContainer.style.display = 'none';
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
