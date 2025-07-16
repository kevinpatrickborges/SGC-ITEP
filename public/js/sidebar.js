document.addEventListener('DOMContentLoaded', function () {

    const sidebar = document.querySelector('.sei-sidebar');
    const desktopToggle = document.querySelector('.sidebar-desktop-toggle');
    const mobileToggle = document.querySelector('.sidebar-mobile-toggle');
    let sidebarOverlay = document.querySelector('.sidebar-overlay');

    // Criar o overlay se ele não existir
    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
    }

    // --- Lógica para Encolher/Expandir em Desktop ---
    if (desktopToggle && sidebar) {
        // Aplicar estado salvo no carregamento da página
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('is-collapsed');
        }

        desktopToggle.addEventListener('click', () => {
            sidebar.classList.toggle('is-collapsed');
            // Salvar o estado no localStorage
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('is-collapsed'));
        });
    }

    // --- Lógica para Abrir/Fechar em Mobile ---
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.add('is-open');
            sidebarOverlay.classList.add('is-visible');
        });
    }

    // Fechar a sidebar mobile ao clicar no overlay
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('is-open');
        sidebarOverlay.classList.remove('is-visible');
    });

});
