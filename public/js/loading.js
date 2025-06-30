// Script para controlar a tela de carregamento
document.addEventListener('DOMContentLoaded', function() {
  // Função para mostrar a tela de carregamento
  window.showLoading = function(message = 'Carregando...') {
    // Verifica se já existe uma tela de carregamento
    let loadingOverlay = document.querySelector('.loading-overlay');
    
    if (!loadingOverlay) {
      // Cria a tela de carregamento se não existir
      loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      
      // Logo (opcional)
      const logo = document.createElement('img');
      logo.src = '/img/itep_logo.png';
      logo.alt = 'ITEP';
      logo.className = 'loading-logo';
      
      // Spinner
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      
      // Texto
      const text = document.createElement('div');
      text.className = 'loading-text';
      text.textContent = message;
      
      // Adiciona os elementos à tela de carregamento
      loadingOverlay.appendChild(logo);
      loadingOverlay.appendChild(spinner);
      loadingOverlay.appendChild(text);
      
      // Adiciona a tela de carregamento ao body
      document.body.appendChild(loadingOverlay);
    } else {
      // Atualiza a mensagem se a tela já existir
      const text = loadingOverlay.querySelector('.loading-text');
      if (text) text.textContent = message;
      
      // Mostra a tela se estiver escondida
      loadingOverlay.classList.remove('loading-hidden');
    }
  };
  
  // Função para esconder a tela de carregamento
  window.hideLoading = function() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('loading-hidden');
      
      // Remove a tela após a transição
      setTimeout(() => {
        if (loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      }, 300);
    }
  };
});

// Simula um tempo de carregamento para demonstração
function simulateLoading(duration = 1500) {
  showLoading('Carregando o sistema...');
  setTimeout(hideLoading, duration);
}
