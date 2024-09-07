// Initialization of pdfjsLib
import "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
const pdfjsLib = globalThis.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

// Constant declaration 
const PDF_URL = globalThis.pdfUrl; // This value is passed through by EJS with a script tag

// Global variables
let pdf;
let viewerState;
let zoomPercent;

document.addEventListener("DOMContentLoaded", async event => {
    // Centering the page selector (do it before loading pdf, or it would stay off center until pdf fully loaded)
    balanceToolbar();

    // Loading PDF (This must be done very early as nearly all others functions rely on the pdf global variable)
    console.log("Loading:", PDF_URL);
    pdf = await pdfjsLib.getDocument(PDF_URL).promise
    console.log("Pdf successfully loaded.");

    // Global variable initialization
    viewerState = {
        leftPageNumber: 1,
        rightPageNumber: -1,
        showRightPage: false
    };
    zoomPercent = 100;

    // Initial canvas draw.
    queueDraw();

    // Initializing toolbar
    initPageSelector();

    // Event registering
    window.addEventListener('resize', () => {
        resizeAllCanvases();
        scheduleDraw();
    });

    document.getElementById("zoom-in-button").addEventListener('click', onZoomIn);
    document.getElementById("zoom-out-button").addEventListener('click', onZoomOut);
    document.getElementById("zoom-reset-button").addEventListener('click', onZoomReset);
    document.getElementById("next-page-button").addEventListener('click', onNextPage);
    document.getElementById("prev-page-button").addEventListener('click', onPrevPage);
    document.getElementById("page-number-field").addEventListener('change', onInputChange);
    document.getElementById("page-number-field").addEventListener('focus', onInputFocus);
});

// ### PDF RENDERING / CANVAS MANIPULATION ###

function resizeAllCanvases() {
    const maxSize = getCanvasMaxSize();
    updateCanvasSize(pdf, viewerState.leftPageNumber, 'left-page', maxSize);
    if (viewerState.showRightPage)
        updateCanvasSize(pdf, viewerState.rightPageNumber, 'right-page', maxSize);
}

async function updateCanvasSize(pdf, pageNumber, canvasId, maxSize) {
    let page = await pdf.getPage(pageNumber)
    let viewport = getScaledViewport(page, maxSize);
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
        queueDraw();
    }, 500);
}

function queueDraw() {
    queueDrawPage(pdf, viewerState.leftPageNumber, 'left-page');

    if (viewerState.showRightPage) {
        queueDrawPage(pdf, viewerState.rightPageNumber, 'right-page');
        document.getElementById('right-page').style.display = "";
    } else {
        document.getElementById('right-page').style.display = "none";
    }
}

let drawingJobs = {};

async function queueDrawPage(pdf, pageNumber, canvasId) {
    let job = drawingJobs[canvasId];

    // If uninitialized, initialize
    if (!job) {
        job = drawingJobs[canvasId] = {
            isDrawing: false,
            pendingDraw: undefined,
        };
    }

    job.pendingDraw = { pdf, pageNumber };

    // If not already doing so, draw until there is no pending tasks.
    if (!job.isDrawing) {
        job.isDrawing = true;

        while (job.pendingDraw) {
            let pendingPdf = job.pendingDraw.pdf;
            let pendingPageNumber = job.pendingDraw.pageNumber;
            job.pendingDraw = undefined;
            await drawPage(pendingPdf, pendingPageNumber, canvasId);
        }

        job.isDrawing = false;
    }
}

async function drawPage(pdf, pageNumber, canvasId) {
    const maxSize = getCanvasMaxSize();
    updateCanvasSize(pdf, pageNumber, canvasId, maxSize);

    // Support HiDPI-screens.
    let resolutionFactor = window.devicePixelRatio || 1;

    let page = await pdf.getPage(pageNumber);
    let viewport = getScaledViewport(page, maxSize);
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

    const renderTask = page.render(renderContext);
    await renderTask.promise; // Wait for the task to complete before returning.
}

function getScaledViewport(page, maxSize) {
    let viewport = page.getViewport({ scale: 1, });
    let scaleX = maxSize.width / viewport.width;
    let scaleY = maxSize.height / viewport.height;
    let minScale = Math.min(scaleX, scaleY);
    let scaledViewport = page.getViewport({ scale: minScale * (zoomPercent / 100) });
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
    if (zoomPercent >= 300) return;
  
    if (zoomPercent >= 160) zoomPercent += 20;
    else zoomPercent += 10;

    updateZoom();
}

function onZoomOut() {
    if (zoomPercent <= 20) return;

    if (zoomPercent >= 170) zoomPercent -= 20;
    else zoomPercent -= 10;

    updateZoom();
}

function onZoomReset () {
    zoomPercent = 100;
    updateZoom();
}

function updateZoom() {
    resizeAllCanvases();
    scheduleDraw();
    document.getElementById("toolbar__zoom-value").textContent = zoomPercent + "%";
}

// ### TOOLBAR SPACE DISTRIBUTION ###

function balanceToolbar() {
    const leftSection = document.getElementById('toolbar__left');
    const rightSection = document.getElementById('toolbar__right');

    let maxWidth = Math.ceil(Math.max(
        leftSection.getBoundingClientRect().width,
        rightSection.getBoundingClientRect().width
    ));

    leftSection.style.width = maxWidth + "px";
    rightSection.style.width = maxWidth + "px";
}

// ### PAGE SELECTOR ###

let pagePairIndex = 0;
let lastPairIndex = 0;

function initPageSelector() {
    document.getElementById('page-count-inicator').textContent = pdf.numPages;
    lastPairIndex = Math.floor(pdf.numPages / 2);

    updatePageSelector();
}

function onNextPage() { // Fired when the "next page" button is pressed
    if (pagePairIndex >= lastPairIndex) return;

    pagePairIndex++;
    calculatePageNumbers();
    updatePageSelector();
    queueDraw();
}

function onPrevPage() { // Fired when the "previous page" button is pressed
    if (pagePairIndex <= 0) return;

    pagePairIndex--;
    calculatePageNumbers();
    updatePageSelector();
    queueDraw();
}

function onInputChange() {
    const input = document.getElementById("page-number-field");
    if (!input.value.trim().match(/^\d+$/)) return;

    pagePairIndex = Math.floor(parseInt(input.value) / 2);
    // Clamp between 0 and lastPairIndex
    pagePairIndex = Math.min(Math.max(pagePairIndex, 0), lastPairIndex);
    
    calculatePageNumbers();
    updatePageSelector();
    queueDraw();
}

function onInputFocus() {
    document.getElementById("page-number-field").select();
}

function calculatePageNumbers() {
    if (pagePairIndex === 0) {
        viewerState.leftPageNumber = 1;
        viewerState.rightPageNumber = -1; // Hide right page
    } else {
        viewerState.leftPageNumber = pagePairIndex * 2;
        viewerState.rightPageNumber = pagePairIndex * 2 + 1;
    }

    viewerState.showRightPage = viewerState.rightPageNumber <= pdf.numPages && viewerState.rightPageNumber >= 1;
}

function updatePageSelector() {
    const input = document.getElementById('page-number-field');
    const nextPageButton = document.getElementById('next-page-button');
    const prevPageButton = document.getElementById('prev-page-button');

    // Note the use of string to int coertion here. 
    // It is pretty helpful because more strict than parseInt (which would for example parse "4abcd" as 4),
    // but still accepts whitespaces: " 4" == 4 is true
    if (input.value != viewerState.leftPageNumber && input.value != viewerState.rightPageNumber) {
        input.value = viewerState.leftPageNumber;
    }
    nextPageButton.disabled = pagePairIndex === lastPairIndex
    prevPageButton.disabled = pagePairIndex === 0;
}