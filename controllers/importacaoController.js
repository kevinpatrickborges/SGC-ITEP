const { Desarquivamento, sequelize } = require('../models');
const xlsx = require('xlsx');
const logger = require('../utils/importLogger');

// --- Funções de Helper ---

/**
 * Normaliza os cabeçalhos da planilha para corresponderem às chaves do modelo.
 * @param {string} header - O cabeçalho original da coluna.
 * @returns {string|null} - A chave do modelo correspondente ou null.
 */
const normalizeHeader = (header) => {
    const normalized = (header || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');

    const keyMap = {
        // Mapeamento exato da planilha fornecida
        'DESARQUIVAMENTO FÍSICO/DIGITAL': 'solicitacao',
        'STATUS': 'status',
        'NOME COMPLETO': 'nomeCompleto',
        'Nº DO NIC/LAUDO/AUTO/ INFORMAÇÃO TÉCNICA': 'numDocumento',
        'Nº PROCESSO': 'numProcesso',
        'TIPO DE DOCUMENTO': 'tipoDocumento',
        'DATA DE SOLICITAÇÃO': 'dataSolicitacao',
        'DATA DO DESARQUIVAMENTO - SAG': 'dataDesarquivamento',
        'DATA DA DEVOLUÇÃO PELO SETOR': 'dataDevolucao',
        'SETOR DEMANDANTE': 'setorDemandante',
        'SERVIDOR DO ITEP RESPONSÁVEL (MATRÍCULA)': 'servidorResponsavel',
        'FINALIDADE DO DESARQUIVAMENTO': 'finalidade',
        'SOLICITAÇÃO DE PRORROGAÇÃO DE PRAZO DE DESARQUIVAMENTO': 'solicitacaoProrrogacao'
    };

    return keyMap[normalized] || null;
};

/**
 * Converte datas do formato Excel (número) para objeto Date do JS.
 * @param {number} excelDate - O número da data do Excel.
 * @returns {Date|null} - O objeto Date ou null se a entrada for inválida.
 */
const convertExcelDate = (excelDate) => {
    if (!excelDate) return null;

    // Se já for um objeto Date válido, retorna ele mesmo.
    if (excelDate instanceof Date && !isNaN(excelDate)) {
        return excelDate;
    }

    // Se for um número (formato de data do Excel)
    if (typeof excelDate === 'number' && excelDate > 0) {
        // Adiciona o fuso horário para evitar problemas de off-by-one-day
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + offset);
    }
    
    // Se for uma string, tenta converter
    if (typeof excelDate === 'string') {
        const cleanedDate = excelDate.trim().split(' ')[0]; // Remove a hora, se houver
        let date;

        if (cleanedDate.includes('/')) {
            // Assume o formato DD/MM/YYYY
            const parts = cleanedDate.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);
                if (day && month && year && year > 1000) {
                    date = new Date(Date.UTC(year, month - 1, day));
                }
            }
        } else if (cleanedDate.includes('-')) {
            // Assume o formato YYYY-MM-DD
            const parts = cleanedDate.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                 if (day && month && year && year > 1000) {
                    date = new Date(Date.UTC(year, month - 1, day));
                }
            }
        }
        
        if (date && !isNaN(date.getTime())) {
            return date;
        }
    }
    
    // Se não for uma data válida, retorna null
    return null;
};


// --- Funções de Importação para Desarquivamentos ---

// 1. Renderiza o formulário de importação inicial
exports.formImportacaoDesarquivamento = (req, res) => {
    // Limpa dados da sessão de importação anterior, se houver
    if (req.session.importData) {
        req.session.importData = null;
    }
    res.render('nugecid/importar', {
        preview: null,
        erros: null,
        csrfToken: req.csrfToken()
    });
};

// 2. Processa o upload, lê a planilha e mostra a pré-visualização
exports.previewImportacaoDesarquivamento = (req, res) => {
    logger.iniciarLog();
    logger.log('Iniciando pré-visualização da importação.');

    if (!req.file) {
        logger.logErro('Nenhum arquivo foi enviado.');
        req.flash('error_msg', 'Nenhum arquivo foi enviado.');
        return res.redirect('/nugecid/importar');
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converte para JSON, lendo todas as células como texto puro para evitar formatação automática
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null });

        if (data.length < 2) {
            req.flash('error_msg', 'A planilha está vazia ou não contém cabeçalhos.');
            return res.redirect('/nugecid/importar');
        }

        const headers = data[0].map(normalizeHeader);
        const registros = data.slice(1).map(row => {
            const registro = {};
            headers.forEach((key, index) => {
                if (key) {
                    let value = row[index];
                    // Limpa e valida os dados
                    if (typeof value === 'string') value = value.trim();
                    if (value === undefined || value === null || value === '') return;

                    if (key.toLowerCase().includes('data')) {
                        registro[key] = convertExcelDate(value);
                    } else {
                        registro[key] = value;
                    }
                }
            });
            return registro;
        }).filter(reg => reg.numDocumento); // Filtra registros que não têm um numDocumento

        if (registros.length === 0) {
            req.flash('error_msg', 'Nenhum registro válido com "Nº do Documento" foi encontrado na planilha.');
            return res.redirect('/nugecid/importar');
        }
        
        // Armazena os dados processados na sessão para a confirmação
        req.session.importData = registros;
        logger.log(`Pré-visualização gerada com ${registros.length} registros válidos.`);

        res.render('nugecid/importar', {
            preview: registros,
            erros: null,
            csrfToken: req.csrfToken()
        });

    } catch (error) {
        logger.logErro('Erro detalhado ao processar a planilha para pré-visualização.', {
            message: error.message,
            stack: error.stack
        });
        req.flash('error_msg', `Ocorreu um erro grave ao processar o arquivo. Detalhes: ${error.message}`);
        res.redirect('/nugecid/importar');
    }
};

// 3. Confirma e executa a importação
exports.confirmarImportacaoDesarquivamento = async (req, res) => {
    logger.log('Iniciando confirmação da importação.');
    const registros = req.session.importData;

    if (!registros || registros.length === 0) {
        logger.logErro('Nenhum dado de importação encontrado na sessão.');
        req.flash('error_msg', 'Sua sessão expirou ou não há dados para importar. Por favor, envie a planilha novamente.');
        return res.redirect('/nugecid/importar');
    }

    // **CORREÇÃO CRÍTICA FINAL**: Re-hidrata os objetos Date que foram convertidos para string na sessão,
    // usando a mesma função robusta da etapa de pré-visualização para garantir consistência.
    registros.forEach(item => {
        for (const key in item) {
            if (key.toLowerCase().includes('data')) {
                item[key] = convertExcelDate(item[key]);
            }
        }
    });

    const t = await sequelize.transaction();
    logger.log('Transação com o banco de dados iniciada.');
    let createdCount = 0;
    let updatedCount = 0;

    try {
        const userId = req.session.user.id;

        for (const [index, item] of registros.entries()) {
            if (!item.numDocumento) continue; // Pula se não houver o identificador principal

            // Validações CRÍTICAS
            if (!item.dataSolicitacao || !(item.dataSolicitacao instanceof Date)) {
                throw new Error(`A 'DATA DE SOLICITAÇÃO' na linha ${index + 2} da planilha está vazia ou em um formato inválido.`);
            }
            if (!item.status || typeof item.status !== 'string') {
                 throw new Error(`O 'STATUS' na linha ${index + 2} da planilha está vazio ou inválido.`);
            }

            const [record, created] = await Desarquivamento.findOrCreate({
                where: { numDocumento: item.numDocumento },
                defaults: { ...item, createdBy: userId, updatedBy: userId },
                transaction: t
            });

            if (created) {
                createdCount++;
            } else {
                // Se não foi criado, atualiza o registro existente
                await record.update({ ...item, updatedBy: userId }, { transaction: t });
                updatedCount++;
            }
        }

        await t.commit();
        logger.log(`Transação commitada. ${createdCount} criados, ${updatedCount} atualizados.`);
        
        // Limpa os dados da sessão
        req.session.importData = null;

        req.flash('success_msg', `${createdCount} registros criados e ${updatedCount} atualizados com sucesso!`);
        return res.redirect('/nugecid');

    } catch (error) {
        await t.rollback();
        
        let detailedMessage = error.message;
        // Sequelize validation errors têm um array 'errors' com detalhes.
        if (error.name === 'SequelizeValidationError' && error.errors && error.errors.length > 0) {
            detailedMessage = error.errors.map(e => `Campo '${e.path}' com valor '${e.value}' falhou na validação: ${e.message}`).join('; ');
        }

        logger.logErro('Erro detalhado durante a transação com o banco de dados.', {
            message: detailedMessage,
            originalError: error
        });
        
        req.session.importData = null;

        req.flash('error_msg', `Erro de Validação ao Salvar: ${detailedMessage}`);
        return res.redirect('/nugecid/importar');
    }
};
