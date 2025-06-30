document.addEventListener('DOMContentLoaded', function () {
    // --- Search Functionality ---
    const searchInput = document.querySelector('.sei-menu-search');
    const menu = document.querySelector('.sei-menu');

    if (searchInput && menu) {
        const menuItems = Array.from(menu.querySelectorAll('li'));
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            menuItems.forEach(function (li) {
                if (li.classList.contains('has-submenu')) {
                    const parentLink = li.querySelector('a');
                    const parentText = parentLink.textContent.toLowerCase();
                    const submenuItems = li.querySelectorAll('.submenu li');
                    let hasVisibleChild = false;
                    submenuItems.forEach(function (subLi) {
                        const subText = subLi.textContent.toLowerCase();
                        if (subText.includes(searchTerm)) {
                            subLi.style.display = '';
                            hasVisibleChild = true;
                        } else {
                            subLi.style.display = 'none';
                        }
                    });
                    if (parentText.includes(searchTerm) || hasVisibleChild) {
                        li.style.display = '';
                    } else {
                        li.style.display = 'none';
                    }
                } else if (!li.closest('.submenu')) {
                    const linkText = li.textContent.toLowerCase();
                    if (linkText.includes(searchTerm)) {
                        li.style.display = '';
                    } else {
                        li.style.display = 'none';
                    }
                }
            });
        });
    }

    // --- Sidebar Collapse Functionality ---
    const sidebar = document.querySelector('.sei-sidebar');
    const toggleButton = document.querySelector('#sidebar-toggle');

    if (sidebar && toggleButton) {
        const applySidebarState = () => {
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            sidebar.classList.toggle('collapsed', isCollapsed);
        };

        toggleButton.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));

            // If we are collapsing the sidebar, ensure any open submenus are closed
            if (sidebar.classList.contains('collapsed')) {
                const openSubmenus = sidebar.querySelectorAll('.submenu.show');
                openSubmenus.forEach(submenu => {
                    const collapseInstance = bootstrap.Collapse.getInstance(submenu) || new bootstrap.Collapse(submenu);
                    collapseInstance.hide();
                });
            }
        });

        // Apply state on page load
        applySidebarState();
    }
});
