document.addEventListener('DOMContentLoaded', () => {
  const exportButton = document.querySelector('.export-vestigios-btn');
  if (!exportButton) return;

  exportButton.addEventListener('click', (event) => {
    event.preventDefault();
    // Exporta para Excel. Para PDF, altere a URL abaixo
    const exportUrl = '/api/export/vestigios/excel';
    // Tenta abrir em nova aba (melhor UX)
    const win = window.open(exportUrl, '_blank');
    if (!win) {
      alert('Não foi possível abrir a exportação. Verifique se o navegador está bloqueando pop-ups.');
    }
  });
});
