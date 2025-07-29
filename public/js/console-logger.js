// Console Logger para Debug
(function() {
  // Capturar logs originais
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Array para armazenar logs
  window.consoleLogs = window.consoleLogs || [];
  
  // Função para adicionar log ao array
  function addLog(type, args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = Array.from(args).map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    window.consoleLogs.push({
      timestamp,
      type,
      message
    });
    
    // Manter apenas os últimos 50 logs
    if (window.consoleLogs.length > 50) {
      window.consoleLogs.shift();
    }
  }
  
  // Sobrescrever métodos do console
  console.log = function() {
    addLog('log', arguments);
    originalLog.apply(console, arguments);
  };
  
  console.error = function() {
    addLog('error', arguments);
    originalError.apply(console, arguments);
  };
  
  console.warn = function() {
    addLog('warn', arguments);
    originalWarn.apply(console, arguments);
  };
  
  // Função para exibir logs na página
  window.showConsoleLogs = function() {
    const logs = window.consoleLogs || [];
    let logHtml = '<div style="position: fixed; top: 10px; right: 10px; width: 400px; max-height: 500px; overflow-y: auto; background: #000; color: #fff; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 9999; border: 2px solid #333;">';
    logHtml += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><strong>Console Logs</strong><button onclick="document.getElementById(\'consoleLogViewer\').remove()" style="background: #ff4444; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; margin-left: auto;">✕</button></div>';
    
    if (logs.length === 0) {
      logHtml += '<div style="color: #888;">Nenhum log encontrado</div>';
    } else {
      logs.forEach(log => {
        const color = log.type === 'error' ? '#ff4444' : log.type === 'warn' ? '#ffaa00' : '#00ff00';
        logHtml += `<div style="margin-bottom: 5px; border-left: 3px solid ${color}; padding-left: 8px;">`;
        logHtml += `<span style="color: #888;">[${log.timestamp}]</span> `;
        logHtml += `<span style="color: ${color};">${log.type.toUpperCase()}:</span> `;
        logHtml += `<span>${log.message}</span>`;
        logHtml += '</div>';
      });
    }
    
    logHtml += '</div>';
    
    // Remover viewer anterior se existir
    const existingViewer = document.getElementById('consoleLogViewer');
    if (existingViewer) {
      existingViewer.remove();
    }
    
    // Adicionar novo viewer
    const viewer = document.createElement('div');
    viewer.id = 'consoleLogViewer';
    viewer.innerHTML = logHtml;
    document.body.appendChild(viewer);
  };
  
  // Adicionar botão para mostrar logs
  window.addEventListener('load', function() {
    const button = document.createElement('button');
    button.innerHTML = '📋 Ver Console';
    button.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; z-index: 9998; font-size: 12px;';
    button.onclick = window.showConsoleLogs;
    document.body.appendChild(button);
  });
})();