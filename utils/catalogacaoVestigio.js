// Função utilitária para gerar código de catalogação tipo CDU para vestígios
// Pode ser expandida facilmente conforme necessidade

const mapCatalogacao = {
  'toxicologia': '1.1',
  'cabelos': '1.1',
  'biologia': '1.2',
  'documentoscopia': '2.1',
  'balística': '3.1',
  // Adicione outros tipos conforme necessário
};

function gerarCatalogacao(tipo) {
  if (!tipo) return '';
  const tipoNorm = tipo.trim().toLowerCase();
  return mapCatalogacao[tipoNorm] || '9.9'; // 9.9 = Outros
}

module.exports = { gerarCatalogacao };
