'use strict';

const xlsx = require('xlsx');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    const filePath = path.join(__dirname, '..', 'data', 'desarquivamento.xlsx');
    let workbook;
    try {
       workbook = xlsx.readFile(filePath);
    } catch(e) {
        console.log(`\nArquivo de seed não encontrado em ${filePath}, pulando seeder de desarquivamento.\n`);
        return;
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const registros = data.map(row => ({
      nome: row['Nome'],
      numero_prontuario: row['Nº prontuário'],
      motivo: row['Motivo'],
      solicitante: row['Solicitante'],
      status: row['Status'] || 'Concluído', // Assumindo que dados legados estão concluídos
      data_solicitacao: row['Data'] ? new Date(row['Data']) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (registros.length > 0) {
      await queryInterface.bulkInsert('desarquivamentos', registros, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('desarquivamentos', null, {});
  }
};
