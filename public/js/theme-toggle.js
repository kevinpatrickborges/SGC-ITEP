/* ========================================
   CONTROLADOR DE TEMA CLARO/ESCURO
   SGC-ITEP - Sistema de Gestão Documental
   ======================================== */

class ThemeController {
  constructor() {
    this.themeToggle = document.getElementById('themeToggle');
    this.lightIcon = document.getElementById('lightIcon');
    this.darkIcon = document.getElementById('darkIcon');
    this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
    
    this.init();
  }

  init() {
    // Aplicar tema inicial
    this.setTheme(this.currentTheme);
    
    // Adicionar event listener para o botão
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    // Escutar mudanças na preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getStoredTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  getStoredTheme() {
    return localStorage.getItem('sgc-itep-theme');
  }

  getPreferredTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sgc-itep-theme', theme);
    this.updateIcons(theme);
  }

  updateIcons(theme) {
    if (!this.lightIcon || !this.darkIcon) return;
    
    if (theme === 'dark') {
      this.lightIcon.classList.add('hidden');
      this.lightIcon.classList.remove('visible');
      this.darkIcon.classList.remove('hidden');
      this.darkIcon.classList.add('visible');
    } else {
      this.darkIcon.classList.add('hidden');
      this.darkIcon.classList.remove('visible');
      this.lightIcon.classList.remove('hidden');
      this.lightIcon.classList.add('visible');
    }
  }

  toggleTheme() {
    // Adicionar animação ao botão
    if (this.themeToggle) {
      this.themeToggle.classList.add('animating');
      setTimeout(() => {
        this.themeToggle.classList.remove('animating');
      }, 600);
    }
    
    // Alternar tema
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    
    // Feedback visual adicional
    this.showThemeChangeNotification(newTheme);
  }

  showThemeChangeNotification(theme) {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.innerHTML = `
      <i class="bi bi-${theme === 'dark' ? 'moon-fill' : 'sun-fill'}"></i>
      Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativado
    `;
    
    // Adicionar estilos inline para a notificação
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: theme === 'dark' ? '#1e293b' : '#ffffff',
      color: theme === 'dark' ? '#f1f5f9' : '#1a202c',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remover após 2 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  // Método público para obter o tema atual
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Método público para definir tema programaticamente
  setThemeManually(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.setTheme(theme);
    }
  }
}

// Inicializar o controlador de tema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.themeController = new ThemeController();
});

// Aplicar tema imediatamente para evitar flash
(function() {
  const storedTheme = localStorage.getItem('sgc-itep-theme');
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = storedTheme || preferredTheme;
  
  document.documentElement.setAttribute('data-theme', theme);
})();