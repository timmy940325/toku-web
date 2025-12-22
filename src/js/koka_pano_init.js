document.addEventListener('DOMContentLoaded', function() {
    pannellum.viewer('panorama', {
        // Viewer settings
        "title": "KOKA庫咖咖啡",
        "author": "Toku Web",
        "type": "equirectangular",
        
        // Use absolute path for reliability. 
        // The /toku-web/ part corresponds to the GitHub repository name.
        "panorama": "/toku-web/images/koka-coffee/panorama.jpg",
        
        // Behavior settings
        "autoLoad": true,
        "autoRotate": -2, // Auto-rotate counter-clockwise at 2 degrees/second
        "compass": true, // Display a compass
        "northOffset": 180, // Adjust the center of the view
        
        // UI Controls
        "showControls": true,
        "showZoomCtrl": true,
        "showFullscreenCtrl": true,
        
        // Hotspot settings (example)
        // "hotSpots": [
        //     {
        //         "pitch": -10,
        //         "yaw": -5,
        //         "type": "info",
        //         "text": "這是咖啡吧檯"
        //     }
        // ],

        // Error message for debugging
        "errorMsg": "圖片載入失敗... 請確認路徑是否正確，或檢查瀏覽器開發者工具中的網路請求錯誤。"
    });
});
