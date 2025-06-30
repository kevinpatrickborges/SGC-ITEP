'use strict';

// Configura o caminho para os 'workers' do PDF.js
// O ideal é que pdf.worker.js seja hospedado localmente, mas para simplificar usamos o CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.102/pdf.worker.min.js`;

const pdfUrl = document.getElementById('pdf-viewer-container').dataset.url;
const pdfContainer = document.getElementById('pdf-viewer');
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
const scale = 1.5;

function renderPage(num) {
  pageRendering = true;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Usando a página do documento PDF
  pdfDoc.getPage(num).then(function(page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Adiciona o canvas ao container
    pdfContainer.appendChild(canvas);

    // Renderiza a página PDF no contexto do canvas
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    const renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        // Nova página está esperando, vamos renderizá-la
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
}

// Carrega o documento PDF
pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
  pdfDoc = pdfDoc_;
  document.getElementById('page_count').textContent = pdfDoc.numPages;

  // Renderiza a primeira página
  renderPage(pageNum);
});
