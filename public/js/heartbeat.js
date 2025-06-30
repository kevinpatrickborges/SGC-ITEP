// Envia ping para manter sessão ativa e atualizar lastPing
setInterval(() => {
  fetch('/dashboard/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    .then(() => {
      if (window.console) console.log('Ping enviado ao servidor (' + new Date().toLocaleTimeString() + ')');
    })
    .catch(() => {
      if (window.console) console.warn('Falha ao enviar ping');
    });
}, 30000); // 30 segundos
