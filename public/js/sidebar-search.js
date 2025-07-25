/**
 * Funcionalidade de Pesquisa do Sidebar
 * Permite filtrar os itens do menu do sidebar em tempo real
 */

(function() {
    'use strict';

    // Aguarda o DOM estar carregado
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.getElementById('sidebarSearch');
        const menuItems = document.querySelectorAll('.sei-menu li');
        
        if (!searchInput || menuItems.length === 0) {
            return;
        }

        // Função para normalizar texto (remover acentos e converter para minúsculas)
        function normalizeText(text) {
            return text.toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');
        }

        // Função para filtrar itens do menu
        function filterMenuItems(searchTerm) {
            const normalizedSearchTerm = normalizeText(searchTerm);
            let hasVisibleItems = false;

            menuItems.forEach(function(item) {
                const link = item.querySelector('a');
                const span = link ? link.querySelector('span') : null;
                
                if (!span) {
                    return;
                }

                const itemText = normalizeText(span.textContent);
                const isMatch = itemText.includes(normalizedSearchTerm);
                
                let showItem = isMatch || searchTerm === '';
                
                const submenu = item.querySelector('.submenu');
                let hasVisibleSubItems = false;
                let parentMatches = isMatch;
                
                if (submenu) {
                    const subItems = submenu.querySelectorAll('li');
                    
                    subItems.forEach(function(subItem) {
                        const subLink = subItem.querySelector('a');
                        const subSpan = subLink ? subLink.querySelector('span') : null;
                        
                        if (subSpan) {
                            const subItemText = normalizeText(subSpan.textContent);
                            const subIsMatch = subItemText.includes(normalizedSearchTerm);
                            
                            if (subIsMatch || searchTerm === '' || parentMatches) {
                                subItem.style.display = '';
                                hasVisibleSubItems = true;
                            } else {
                                subItem.style.display = 'none';
                            }
                        }
                    });
                    
                    if (hasVisibleSubItems && searchTerm !== '') {
                        showItem = true;
                    }
                    
                    // Gerenciar expansão usando Bootstrap API
                    if (searchTerm !== '') {
                        const collapseInstance = bootstrap.Collapse.getOrCreateInstance(submenu, { toggle: false });
                        if (hasVisibleSubItems) {
                            collapseInstance.show();
                        } else {
                            collapseInstance.hide();
                        }
                    }
                }
                
                if (showItem) {
                    item.style.display = '';
                    hasVisibleItems = true;
                } else {
                    item.style.display = 'none';
                }
            });

            // After filtering
            if (searchTerm !== '') {
                menuItems.forEach(function(item) {
                    const submenu = item.querySelector('.submenu');
                    if (submenu) {
                        const visibleSubLinks = submenu.querySelectorAll('li:not([style*="display: none"]) a');
                        visibleSubLinks.forEach(function(link) {
                            link.addEventListener('click', function(event) {
                                event.preventDefault();
                                event.stopPropagation();
                                window.location.href = link.href;
                            });
                        });
                    }
                });
            }
            showNoResultsMessage(!hasVisibleItems && searchTerm !== '');
        }

        // Função para mostrar/ocultar mensagem de "nenhum resultado"
        function showNoResultsMessage(show) {
            let noResultsMsg = document.querySelector('.sidebar-no-results');
            
            if (show && !noResultsMsg) {
                noResultsMsg = document.createElement('li');
                noResultsMsg.className = 'sidebar-no-results';
                noResultsMsg.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--primary-200); font-size: 0.9rem;"><i class="bi bi-search"></i><br>Nenhum resultado encontrado</div>';
                document.querySelector('.sei-menu').appendChild(noResultsMsg);
            } else if (!show && noResultsMsg) {
                noResultsMsg.remove();
            }
        }

        // Função nomeada para forçar navegação
        function forceNavigation(event) {
            event.preventDefault();
            event.stopPropagation();
            window.location.href = this.href;
        }

        // Event listener para o input de pesquisa
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            filterMenuItems(searchTerm);

            if (searchTerm !== '') {
                // Adicionar listener aos subitens visíveis
                document.querySelectorAll('.submenu li:not([style*="display: none"]) a').forEach(function(link) {
                    link.addEventListener('click', forceNavigation);
                });
            } else {
                // Remover listener quando pesquisa é limpa
                document.querySelectorAll('.submenu li a').forEach(function(link) {
                    link.removeEventListener('click', forceNavigation);
                });
            }
        });

        // Limpar pesquisa ao pressionar Escape
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                e.target.value = '';
                filterMenuItems('');
                e.target.blur();
            }
        });

        // Focar na pesquisa com Ctrl+K ou Cmd+K
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    });
})();