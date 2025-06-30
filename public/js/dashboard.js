// Dashboard Analytics
document.addEventListener('DOMContentLoaded', function() {
  const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
  };

  function initCharts(data) {
    if (!data) return;

    // 1. Gráfico de Pizza: Distribuição por Tipo (Físico/Digital)
    if (document.getElementById('tipoDesarquivamentoChart') && data.distribuicaoPorTipo) {
      const ctx = document.getElementById('tipoDesarquivamentoChart').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.distribuicaoPorTipo.map(d => d.tipoDesarquivamento),
          datasets: [{
            data: data.distribuicaoPorTipo.map(d => d.count),
            backgroundColor: [CHART_COLORS.blue, CHART_COLORS.green],
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
      });
    }

    // 2. Gráfico de Doughnut: Distribuição por Status
    if (document.getElementById('statusChart') && data.distribuicaoPorStatus) {
      const ctx = document.getElementById('statusChart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.distribuicaoPorStatus.map(d => d.status),
          datasets: [{
            data: data.distribuicaoPorStatus.map(d => d.count),
            backgroundColor: [CHART_COLORS.yellow, CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.red],
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
      });
    }

    // 3. Gráfico de Barras: Solicitações Mensais
    if (document.getElementById('solicitacoesMensaisChart') && data.solicitacoesMensais) {
      const ctx = document.getElementById('solicitacoesMensaisChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.solicitacoesMensais.map(d => d.mes),
          datasets: [{
            label: 'Solicitações',
            data: data.solicitacoesMensais.map(d => d.count),
            backgroundColor: CHART_COLORS.blue,
          }]
        },
        options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
      });
    }

    // 4. Gráfico de Barras: Top 5 Tipos de Documento
    if (document.getElementById('tipoDocumentoChart') && data.distribuicaoPorTipoDocumento) {
        const ctx = document.getElementById('tipoDocumentoChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.distribuicaoPorTipoDocumento.map(d => d.tipoDocumento || 'Não especificado'),
                datasets: [{
                    label: 'Quantidade',
                    data: data.distribuicaoPorTipoDocumento.map(d => d.count),
                    backgroundColor: [CHART_COLORS.purple, CHART_COLORS.orange, CHART_COLORS.red, CHART_COLORS.green, CHART_COLORS.grey],
                }]
            },
            options: { indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    updateDashboardCards(data);
  }

  function updateDashboardCards(data) {
    document.getElementById('totalDesarquivamentos').textContent = data.totalDesarquivamentos || 0;
    document.getElementById('desarquivamentosEmPosse').textContent = data.desarquivamentosEmPosse || 0;
    document.getElementById('solicitacoesRecentes').textContent = data.solicitacoesRecentes || 0;
    document.getElementById('vestigiosUrgentes').textContent = data.vestigiosUrgentes || 0;
  }

  function loadDashboardData() {
    fetch('/api/v1/dashboard/stats')
      .then(response => {
        if (!response.ok) throw new Error('Erro ao carregar dados do dashboard');
        return response.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        initCharts(data);
      })
      .catch(error => {
        console.error('Erro:', error);
        document.querySelectorAll('.chart-error').forEach(el => {
          el.style.display = 'block';
        });
      });
  }

  if (document.querySelector('.dashboard-container')) {
    loadDashboardData();
  }
});
