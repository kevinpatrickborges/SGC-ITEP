function applyNugecidAssociations(sequelize) {
  const {
    Prontuario,
    EmprestimoProntuario,
    // ProntuarioMeta, 
    // DescarteAgenda
  } = sequelize.models;

  // Prontuario tem muitos Empréstimos
  Prontuario.hasMany(EmprestimoProntuario, { foreignKey: 'prontuarioId' });
  EmprestimoProntuario.belongsTo(Prontuario, { foreignKey: 'prontuarioId' });

  // Adicionar outras associações aqui quando os modelos forem criados
  // Prontuario.hasOne(ProntuarioMeta, { foreignKey: 'prontuarioId' });
  // ProntuarioMeta.belongsTo(Prontuario, { foreignKey: 'prontuarioId' });

  // Prontuario.hasMany(DescarteAgenda, { foreignKey: 'prontuarioId' });
  // DescarteAgenda.belongsTo(Prontuario, { foreignKey: 'prontuarioId' });
}

module.exports = { applyNugecidAssociations };
