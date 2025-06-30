module.exports = (db) => {
  const { Vestigio, Localizacao, Movimentacao, Usuario, File, Publicacao, Role, Desarquivamento } = db;

  // Vestígio <-> Localizacao
  if (Vestigio && Localizacao) {
    Vestigio.belongsTo(Localizacao, { foreignKey: 'localizacaoId', as: 'localizacao' });
    Localizacao.hasMany(Vestigio, { foreignKey: 'localizacaoId', as: 'vestigios' });
  }

  // Movimentação <-> Vestígio
  if (Movimentacao && Vestigio) {
    Movimentacao.belongsTo(Vestigio, { foreignKey: 'vestigioId', as: 'vestigio' });
    Vestigio.hasMany(Movimentacao, { foreignKey: 'vestigioId', as: 'movimentacoes' });
  }

  // Publicacao <-> Usuario (Autor)
  if (Publicacao && Usuario) {
    Publicacao.belongsTo(Usuario, { foreignKey: 'autorId', as: 'autor' });
    Usuario.hasMany(Publicacao, { foreignKey: 'autorId', as: 'publicacoes' });
  }

  // Publicacao <-> File
  if (Publicacao && File) {
    Publicacao.belongsTo(File, { foreignKey: 'fileId', as: 'arquivo' });
    File.hasOne(Publicacao, { foreignKey: 'fileId' });
  }

  // Usuario <-> Role
  if (Usuario && Role) {
    Usuario.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  }

  // Desarquivamento <-> Usuario
  if (Desarquivamento && Usuario) {
    Desarquivamento.belongsTo(Usuario, { foreignKey: 'createdBy', as: 'criadoPor' });
    Desarquivamento.belongsTo(Usuario, { foreignKey: 'updatedBy', as: 'atualizadoPor' });
    Usuario.hasMany(Desarquivamento, { foreignKey: 'createdBy', as: 'desarquivamentosCriados' });
    Usuario.hasMany(Desarquivamento, { foreignKey: 'updatedBy', as: 'desarquivamentosAtualizados' });
  }
};
