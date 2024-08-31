// #####################
// ### PDF RENDERING ###
// #####################

import "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
const pdfjsLib = globalThis.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

const pdfUrl = globalThis.pdfUrl;

console.log("Loading:", pdfUrl);
pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
    console.log("Pdf has loaded.");

    const view = document.getElementById("view-area");
    // "- 40" is for the margins (20px on both sides)
    // "- 5" is for the small space between the two pages
    // "/ 2" is because there are two pages: we split their available space in two.
    const maxWidth = (view.clientWidth - 40 - 5) / 2;
    const maxHeight = view.clientHeight - 40;

    renderPage(pdf, 1, 'left-page', maxWidth, maxHeight);
    renderPage(pdf, 2, 'right-page', maxWidth, maxHeight);
});

function renderPage(pdf, pageNumber, canvasId, maxWidth, maxHeight) {
    pdf.getPage(pageNumber).then(page => {

        let viewport = page.getViewport({ scale: 1, });
        let scaleX = maxWidth / viewport.width;
        let scaleY = maxHeight / viewport.height;
        let effectiveScale = Math.min(scaleX, scaleY);
        let scaledViewport = page.getViewport({ scale: effectiveScale });
        
        // Support HiDPI-screens.
        let resolutionFactor = window.devicePixelRatio || 1;

        let canvas = document.getElementById(canvasId);
        let context = canvas.getContext('2d');

        canvas.width = Math.floor(scaledViewport.width * resolutionFactor);
        canvas.height = Math.floor(scaledViewport.height * resolutionFactor);
        canvas.style.width = Math.floor(scaledViewport.width) + "px";
        canvas.style.height =  Math.floor(scaledViewport.height) + "px";

        let transform = resolutionFactor !== 1 ? [resolutionFactor, 0, 0, resolutionFactor, 0, 0] : null;

        let renderContext = {
            canvasContext: context,
            transform: transform,
            viewport: scaledViewport
        };
        page.render(renderContext);
    });
}

// #####################
// ### ZOOM CONTROLS ###
// #####################

document.addEventListener("DOMContentLoaded", event => {
    document.getElementById("zoom-in-button").addEventListener('click', onZoomIn);
    document.getElementById("zoom-out-button").addEventListener('click', onZoomOut);
    document.getElementById("zoom-reset-button").addEventListener('click', onZoomReset);
});

let zoom = 100; // Zoom is in percentage (to prevent floating-point errors on repeated additions / subractions)

function onZoomIn() {
    if (zoom >= 300) return;

    if (zoom >= 160) zoom += 20;
    else zoom += 10;

    updateZoom();
}

function onZoomOut() {
    if (zoom <= 20) return;

    if (zoom >= 170) zoom -= 20;
    else zoom -= 10;

    updateZoom();
}

function onZoomReset () {
    zoom = 100;
    updateZoom();
}

function updateZoom() {
    document.getElementById("page-container").style.transform = `scale(${ zoom / 100 })`;
    document.getElementById("toolbar__zoom-value").textContent = Math.round(zoom) + "%";
}