const ExcelJS = require('exceljs');

/**
 * Lê dados de um buffer de arquivo XLSX.
 * @param {Buffer} buffer O buffer do arquivo XLSX.
 * @returns {Promise<Array<Object>>} Uma promessa que resolve com um array de objetos, onde cada objeto é uma linha da planilha.
 */
async function lerXLSX(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  const jsonData = [];
  // Normaliza os cabeçalhos removendo espaços em branco e filtra valores vazios
  const headers = worksheet.getRow(1).values.map(h => (typeof h === 'string' ? h.trim() : h)).filter(Boolean);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Ignora o cabeçalho
      let obj = {};
      row.values.forEach((value, index) => {
        // Usa o cabeçalho correspondente, ajustando para o índice baseado em 0
        if (headers[index - 1]) { // headers é 1-based do ExcelJS, então ajustamos
          obj[headers[index - 1]] = value;
        }
      });
      jsonData.push(obj);
    }
  });
  return jsonData;
}

/**
 * Cria um buffer de arquivo XLSX a partir de um array de dados.
 * @param {Array<Object>} data Os dados a serem escritos na planilha.
 * @param {Array<Object>} columns As definições das colunas para o ExcelJS.
 * @returns {Promise<Buffer>} Uma promessa que resolve com o buffer do arquivo XLSX.
 */
async function escreverXLSX(data, columns) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dados');

  worksheet.columns = columns;
  worksheet.addRows(data);

  // Estilizar o cabeçalho
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' } // Azul padrão do Excel
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Ajustar altura da linha do cabeçalho
  worksheet.getRow(1).height = 45;

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Mapeia as colunas de um array de registros para novos nomes de chave.
 * @param {Array<Object>} registros O array de registros da planilha.
 * @param {Object} mapeamento Um objeto onde as chaves são os nomes das colunas na planilha e os valores são os novos nomes de chave.
 * @returns {Array<Object>} Um novo array de registros com as chaves mapeadas.
 */
function mapearColunas(registros, mapeamento) {
  return registros.map(registro => {
    const novoRegistro = {};
    for (const chaveOriginal in registro) {
      if (mapeamento[chaveOriginal]) {
        const novaChave = mapeamento[chaveOriginal];
        novoRegistro[novaChave] = registro[chaveOriginal];
      }
    }
    return novoRegistro;
  });
}

module.exports = {
  lerXLSX,
  escreverXLSX,
  mapearColunas
};
