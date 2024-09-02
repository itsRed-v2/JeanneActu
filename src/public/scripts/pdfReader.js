// Initialization of pdfjsLib
import "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
const pdfjsLib = globalThis.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

// Constant declaration 
const PDF_URL = globalThis.pdfUrl; // This value is passed through by EJS with a script tag

// Global variables
let pdf;
let viewerState;
let zoom = 100; // Zoom is in percentage (to prevent floating-point errors on repeated additions / subractions)

document.addEventListener("DOMContentLoaded", async event => {
    // PDF and state machine initialisation
    console.log("Loading:", PDF_URL);
    pdf = await pdfjsLib.getDocument(PDF_URL).promise
    console.log("Pdf has loaded.");

    viewerState = {
        leftPageNumber: 1,
        rightPageNumber: 2,
        showRightPage: true,
    };

    // Initial canvas draw.
    draw();

    // Event registering
    window.addEventListener('resize', () => {
        resizeAllCanvases();
        scheduleDraw();
    });

    document.getElementById("zoom-in-button").addEventListener('click', onZoomIn);
    document.getElementById("zoom-out-button").addEventListener('click', onZoomOut);
    document.getElementById("zoom-reset-button").addEventListener('click', onZoomReset);
});

// ### PDF RENDERING / CANVAS MANIPULATION ###

function resizeAllCanvases() {
    updateCanvasSize(pdf, viewerState.leftPageNumber, 'left-page');
    updateCanvasSize(pdf, viewerState.rightPageNumber, 'right-page');
}

async function updateCanvasSize(pdf, pageNumber, canvasId) {
    let page = await pdf.getPage(pageNumber)
    let viewport = getScaledViewport(page);
    let canvas = document.getElementById(canvasId);

    canvas.style.width = Math.floor(viewport.width - 1) + "px";
    canvas.style.height =  Math.floor(viewport.height - 1) + "px";
}

let drawScheduleId = undefined;

function scheduleDraw() {
    if (drawScheduleId) 
        clearTimeout(drawScheduleId);

    drawScheduleId = setTimeout(() => {
        drawScheduleId = undefined;
        draw();
    }, 500);
}

function draw() {
    drawPage(pdf, viewerState.leftPageNumber, 'left-page');
    drawPage(pdf, viewerState.rightPageNumber, 'right-page');
}

async function drawPage(pdf, pageNumber, canvasId) {
    updateCanvasSize(pdf, pageNumber, canvasId);

    // Support HiDPI-screens.
    let resolutionFactor = window.devicePixelRatio || 1;

    let page = await pdf.getPage(pageNumber);
    let viewport = getScaledViewport(page);
    let canvas = document.getElementById(canvasId);

    canvas.width = Math.floor(viewport.width * resolutionFactor);
    canvas.height = Math.floor(viewport.height * resolutionFactor);

    let context = canvas.getContext('2d');
    let transform = resolutionFactor !== 1 ? [resolutionFactor, 0, 0, resolutionFactor, 0, 0] : null;

    let renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport
    };
    page.render(renderContext);
}

function getScaledViewport(page) {
    const maxSize = getCanvasMaxSize();
    let viewport = page.getViewport({ scale: 1, });
    let scaleX = maxSize.width / viewport.width;
    let scaleY = maxSize.height / viewport.height;
    let minScale = Math.min(scaleX, scaleY);
    let scaledViewport = page.getViewport({ scale: minScale * (zoom / 100) });
    return scaledViewport;
}

function getCanvasMaxSize() {
    const view = document.getElementById("view-area");
    
    // "- 40" is for the margins (20px on both sides)
    // "- 5" is for the small space between the two pages
    // "/ 2" is because there are two pages: we split their available space in two.
    const maxWidth = (view.clientWidth - 40 - 5) / 2;
    const maxHeight = view.clientHeight - 40;

    return {
        width: maxWidth, 
        height: maxHeight 
    };
}

// ### ZOOM CONTROLS ###

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
    resizeAllCanvases();
    scheduleDraw();
    document.getElementById("toolbar__zoom-value").textContent = zoom + "%";
}