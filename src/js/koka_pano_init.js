document.addEventListener('DOMContentLoaded', function() {
    pannellum.viewer('panorama', {
        // Viewer settings
        "title": "KOKA庫咖咖啡",
        "author": "Toku Web",
        "type": "equirectangular", // Correct type, but requires constraints for flat images
        
        // Use absolute path for reliability. 
        // The /toku-web/ part corresponds to the GitHub repository name.
        "panorama": "/toku-web/images/koka-coffee/panorama.jpg",
        
        // --- NEW SETTINGS FOR FLAT/PARTIAL PANORAMA ---
        "haov": 180,      // Horizontal Angle of View (degrees). A good starting guess for a wide panorama.
        "vaov": 80,       // Vertical Angle of View (degrees).
        "vOffset": 0,     // Vertical offset.
        "minPitch": -40,  // How far up user can look.
        "maxPitch": 40,   // How far down user can look.

        // Behavior settings
        "autoLoad": true,
        "autoRotate": -2, // Auto-rotate counter-clockwise at 2 degrees/second
        "compass": true, // Display a compass
        
        // UI Controls
        "showControls": true,
        "showZoomCtrl": true,
        "showFullscreenCtrl": true,

        // Error message for debugging
        "errorMsg": "圖片載入失敗... 請確認路徑是否正確，或檢查瀏覽器開發者工具中的網路請求錯誤。"
    });
});
