module.exports = (db) => {
  const { 
    Vestigio, Localizacao, Movimentacao, Usuario, File, Publicacao, Role, Desarquivamento,
    Projeto, Quadro, Lista, Tarefa, ComentarioTarefa, MembroProjeto, RegistroTempo
  } = db;

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
    Desarquivamento.belongsTo(Usuario, { foreignKey: 'deletedBy', as: 'deletadoPor' }); // Associação adicionada
    Usuario.hasMany(Desarquivamento, { foreignKey: 'createdBy', as: 'desarquivamentosCriados' });
    Usuario.hasMany(Desarquivamento, { foreignKey: 'updatedBy', as: 'desarquivamentosAtualizados' });
  }

  // === ASSOCIAÇÕES DO SISTEMA DE GESTÃO DE TAREFAS ===
  
  // Projeto <-> Usuario
  if (Projeto && Usuario) {
    Projeto.belongsTo(Usuario, { foreignKey: 'criadoPor', as: 'criador' });
    Projeto.belongsTo(Usuario, { foreignKey: 'responsavel', as: 'responsavelProjeto' });
    Usuario.hasMany(Projeto, { foreignKey: 'criadoPor', as: 'projetosCriados' });
    Usuario.hasMany(Projeto, { foreignKey: 'responsavel', as: 'projetosResponsavel' });
  }

  // Projeto <-> Quadro
  if (Projeto && Quadro) {
    Projeto.hasMany(Quadro, { foreignKey: 'projetoId', as: 'quadros' });
    Quadro.belongsTo(Projeto, { foreignKey: 'projetoId', as: 'projeto' });
  }

  // Quadro <-> Usuario
  if (Quadro && Usuario) {
    Quadro.belongsTo(Usuario, { foreignKey: 'criadoPor', as: 'criador' });
    Usuario.hasMany(Quadro, { foreignKey: 'criadoPor', as: 'quadrosCriados' });
  }

  // Quadro <-> Lista
  if (Quadro && Lista) {
    Quadro.hasMany(Lista, { foreignKey: 'quadroId', as: 'listas' });
    Lista.belongsTo(Quadro, { foreignKey: 'quadroId', as: 'quadro' });
  }

  // Lista <-> Usuario
  if (Lista && Usuario) {
    Lista.belongsTo(Usuario, { foreignKey: 'criadoPor', as: 'criador' });
    Usuario.hasMany(Lista, { foreignKey: 'criadoPor', as: 'listasCriadas' });
  }

  // Lista <-> Tarefa
  if (Lista && Tarefa) {
    Lista.hasMany(Tarefa, { foreignKey: 'listaId', as: 'tarefas' });
    Tarefa.belongsTo(Lista, { foreignKey: 'listaId', as: 'lista' });
  }

  // Tarefa <-> Projeto
  if (Tarefa && Projeto) {
    Tarefa.belongsTo(Projeto, { foreignKey: 'projetoId', as: 'projeto' });
    Projeto.hasMany(Tarefa, { foreignKey: 'projetoId', as: 'tarefas' });
  }

  // Tarefa <-> Usuario
  if (Tarefa && Usuario) {
    Tarefa.belongsTo(Usuario, { foreignKey: 'criadoPor', as: 'criador' });
    Tarefa.belongsTo(Usuario, { foreignKey: 'responsavel', as: 'responsavelTarefa' });
    Usuario.hasMany(Tarefa, { foreignKey: 'criadoPor', as: 'tarefasCriadas' });
    Usuario.hasMany(Tarefa, { foreignKey: 'responsavel', as: 'tarefasResponsavel' });
  }

  // Tarefa <-> Tarefa (Subtarefas)
  if (Tarefa) {
    Tarefa.hasMany(Tarefa, { foreignKey: 'tarefaPaiId', as: 'subtarefas' });
    Tarefa.belongsTo(Tarefa, { foreignKey: 'tarefaPaiId', as: 'tarefaPai' });
  }

  // ComentarioTarefa <-> Tarefa
  if (ComentarioTarefa && Tarefa) {
    ComentarioTarefa.belongsTo(Tarefa, { foreignKey: 'tarefaId', as: 'tarefa' });
    Tarefa.hasMany(ComentarioTarefa, { foreignKey: 'tarefaId', as: 'comentarios' });
  }

  // ComentarioTarefa <-> Usuario
  if (ComentarioTarefa && Usuario) {
    ComentarioTarefa.belongsTo(Usuario, { foreignKey: 'autorId', as: 'autor' });
    Usuario.hasMany(ComentarioTarefa, { foreignKey: 'autorId', as: 'comentariosTarefas' });
  }

  // MembroProjeto <-> Projeto
  if (MembroProjeto && Projeto) {
    MembroProjeto.belongsTo(Projeto, { foreignKey: 'projetoId', as: 'projeto' });
    Projeto.hasMany(MembroProjeto, { foreignKey: 'projetoId', as: 'membros' });
  }

  // MembroProjeto <-> Usuario
  if (MembroProjeto && Usuario) {
    MembroProjeto.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
    MembroProjeto.belongsTo(Usuario, { foreignKey: 'convidadoPor', as: 'convidador' });
    Usuario.hasMany(MembroProjeto, { foreignKey: 'usuarioId', as: 'membrosProjetos' });
    Usuario.hasMany(MembroProjeto, { foreignKey: 'convidadoPor', as: 'convitesEnviados' });
  }

  // RegistroTempo <-> Tarefa
  if (RegistroTempo && Tarefa) {
    RegistroTempo.belongsTo(Tarefa, { foreignKey: 'tarefaId', as: 'tarefa' });
    Tarefa.hasMany(RegistroTempo, { foreignKey: 'tarefaId', as: 'registrosTempo' });
  }

  // RegistroTempo <-> Usuario
  if (RegistroTempo && Usuario) {
    RegistroTempo.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
    RegistroTempo.belongsTo(Usuario, { foreignKey: 'aprovadoPor', as: 'aprovador' });
    Usuario.hasMany(RegistroTempo, { foreignKey: 'usuarioId', as: 'registrosTempo' });
    Usuario.hasMany(RegistroTempo, { foreignKey: 'aprovadoPor', as: 'registrosAprovados' });
  }

  // RegistroTempo <-> Projeto
  if (RegistroTempo && Projeto) {
    RegistroTempo.belongsTo(Projeto, { foreignKey: 'projetoId', as: 'projeto' });
    Projeto.hasMany(RegistroTempo, { foreignKey: 'projetoId', as: 'registrosTempo' });
  }
};
