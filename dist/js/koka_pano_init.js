document.addEventListener('DOMContentLoaded', function() {
    pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": "/toku-web/images/koka-coffee/panorama.jpg",
        "autoLoad": true,
        "errorMsg": "圖片載入失敗，這已是最終的除錯步驟。"
    });
});
