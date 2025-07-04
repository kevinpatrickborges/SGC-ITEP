// public/js/notification-handler.js

document.addEventListener('DOMContentLoaded', () => {
    const notificationButton = document.getElementById('notification-bell');
    if (!notificationButton) return;

    if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações de desktop.');
        notificationButton.style.display = 'none';
        return;
    }

    // Função para pedir permissão
    function requestNotificationPermission() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Permissão para notificações concedida.');
                updateBellIcon(true);
                fetchAndShowNotifications();
            } else {
                console.log('Permissão para notificações negada.');
                updateBellIcon(false);
            }
        });
    }

    // Função para buscar e mostrar notificações
    async function fetchAndShowNotifications() {
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const pendingItems = await response.json();

            if (pendingItems.length > 0) {
                // Notifica cada item individualmente
                pendingItems.forEach(item => {
                    const title = `Pendência: ${item.status}`;
                    const body = `O item com Nº de Documento ${item.numDocumento} requer atenção.`;
                    new Notification(title, { 
                        body: body,
                        icon: '/img/itep_logo.png' 
                    });
                });
            }
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        }
    }

    // Atualiza o ícone do sino baseado na permissão
    function updateBellIcon(isGranted) {
        if (isGranted) {
            notificationButton.classList.remove('text-secondary');
            notificationButton.classList.add('text-success');
            notificationButton.setAttribute('title', 'Notificações ativadas');
        } else {
            notificationButton.classList.remove('text-success');
            notificationButton.classList.add('text-secondary');
             notificationButton.setAttribute('title', 'Ativar notificações');
        }
    }

    // Configuração inicial
    if (Notification.permission === 'granted') {
        updateBellIcon(true);
        fetchAndShowNotifications();
    } else {
        updateBellIcon(false);
    }

    notificationButton.addEventListener('click', () => {
        if (Notification.permission !== 'granted') {
            requestNotificationPermission();
        } else {
            // Se já tem permissão, talvez apenas mostrar as notificações novamente
            fetchAndShowNotifications();
        }
    });
}); 