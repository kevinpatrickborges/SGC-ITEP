const { Desarquivamento, Movimentacao, Usuario } = require('../../../models');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { lerXLSX, mapearColunas } = require('../../../services/planilhaService');
const { sequelize } = require('../../../config/database');
const { spawn } = require('child_process');
const logger = require('../../../utils/importLogger');

exports.getAll = async (req, res) => {
    try {
        const { search, numDocumento, status, dataInicio, dataFim } = req.query;
        const { Op } = require('sequelize');
        let where = {};

        if (search) {
            where.nomeCompleto = { [Op.like]: `%${search}%` };
        }

        if (numDocumento) {
            where.numDocumento = { [Op.like]: `%${numDocumento}%` };
        }

        if (status) {
            where.status = status;
        }

        if (dataInicio && dataFim) {
            where.dataSolicitacao = {
                [Op.between]: [new Date(dataInicio), new Date(dataFim)]
            };
        } else if (dataInicio) {
            where.dataSolicitacao = {
                [Op.gte]: new Date(dataInicio)
            };
        } else if (dataFim) {
            where.dataSolicitacao = {
                [Op.lte]: new Date(dataFim)
            };
        }

        const desarquivamentos = await Desarquivamento.findAll({ where });
        res.render('desarquivamento/lista', { 
      desarquivamentos,
            search,
            numDocumento,
            status,
            dataInicio,
            dataFim
    });
  } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.formNovo = (req, res) => {
    res.render('desarquivamento/novo', {
        desarquivamento: {}
    });
};

exports.create = async (req, res) => {
    try {
        await Desarquivamento.create(req.body);
        req.flash('success_msg', 'Registro criado com sucesso!');
        res.redirect('/nugecid/desarquivamento');
    } catch (error) {
        req.flash('error_msg', `Erro ao criar registro: ${error.message}`);
        res.render('desarquivamento/novo', {
            desarquivamento: req.body
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const desarquivamento = await Desarquivamento.findByPk(req.params.id);
        if (desarquivamento) {
            res.render('desarquivamento/detalhes', { desarquivamento });
        } else {
            res.status(404).json({ error: 'Desarquivamento not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const [updated] = await Desarquivamento.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedDesarquivamento = await Desarquivamento.findByPk(req.params.id);
            res.json(updatedDesarquivamento);
        } else {
            res.status(404).json({ error: 'Desarquivamento not found' });
        }
      } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.session.user.id; // Correção: Obter usuário da sessão

    try {
        // Verificar a senha do usuário
        const usuario = await Usuario.findByPk(userId);
        if (!usuario || !bcrypt.compareSync(password, usuario.senha)) {
            req.flash('error_msg', 'Senha incorreta. A exclusão não foi autorizada.');
            return res.redirect('/nugecid/desarquivamento');
        }

        // Mover o item para a lixeira (soft delete)
        const deleted = await Desarquivamento.destroy({
            where: { id },
            individualHooks: true, // Garante que o hook beforeDestroy seja chamado
            userId: userId // Passa o ID do usuário para o hook
        });

        if (deleted) {
            req.flash('success_msg', 'Registro movido para a lixeira com sucesso.');
        } else {
            req.flash('error_msg', 'Não foi possível encontrar o registro para excluir.');
        }
        res.redirect('/nugecid/desarquivamento');
    } catch (error) {
        req.flash('error_msg', 'Ocorreu um erro ao tentar excluir o registro.');
        res.redirect('/nugecid/desarquivamento');
    }
};

exports.gerarTermo = async (req, res) => {
    try {
        const desarquivamento = await Desarquivamento.findByPk(req.params.id);
        if (!desarquivamento) {
            return res.status(404).send('Desarquivamento not found');
        }

        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(pdfData),
                'Content-Type': 'application/pdf',
                'Content-disposition': `attachment;filename=termo_desarquivamento_${desarquivamento.id}.pdf`,
            }).end(pdfData);
        });

        doc.fontSize(12).text('TERMO DE DESARQUIVAMENTO', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Nº. DE PROCESSO ELETRÔNICO: ${desarquivamento.num_processo_eletronico}`);
        doc.moveDown();
        doc.text(`Tipo de Documento: ${desarquivamento.tipo_documento}`);
        doc.text(`Nome: ${desarquivamento.nome}`);
        doc.text(`Número: ${desarquivamento.numero_documento}`);
        doc.text(`Observação: ${desarquivamento.observacao}`);
            doc.moveDown();
        doc.text(`DATA DO DESARQUIVAMENTO: ${new Date(desarquivamento.data_desarquivamento).toLocaleDateString('pt-BR')}`);
        doc.end();

    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.gerarTermoMassa = async (req, res) => {
    const { selecionados } = req.body;

    if (!selecionados || selecionados.length === 0) {
        req.flash('error_msg', 'Nenhum registro foi selecionado.');
        return res.redirect('/nugecid/desarquivamento');
    }

    try {
        const desarquivamentos = await Desarquivamento.findAll({
            where: {
                id: selecionados
            }
        });

        if (desarquivamentos.length === 0) {
            req.flash('error_msg', 'Nenhum registro válido encontrado para os IDs selecionados.');
            return res.redirect('/nugecid/desarquivamento');
        }

        const doc = new PDFDocument({ margin: 50, autoFirstPage: false });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(pdfData),
                'Content-Type': 'application/pdf',
                'Content-disposition': `attachment;filename=termos_desarquivamento.pdf`,
            }).end(pdfData);
        });

        desarquivamentos.forEach(desarquivamento => {
            doc.addPage();
            doc.fontSize(12).text('TERMO DE DESARQUIVAMENTO', { align: 'center' });
            doc.moveDown(2);
            doc.fontSize(10).text(`Nº do Documento: ${desarquivamento.numDocumento || 'N/A'}`);
            doc.text(`Nome Completo: ${desarquivamento.nomeCompleto || 'N/A'}`);
            doc.text(`Tipo de Documento: ${desarquivamento.tipoDocumento || 'N/A'}`);
            doc.text(`Setor Demandante: ${desarquivamento.setorDemandante || 'N/A'}`);
            doc.text(`Data da Solicitação: ${desarquivamento.dataSolicitacao ? new Date(desarquivamento.dataSolicitacao).toLocaleDateString('pt-BR') : 'N/A'}`);
            doc.moveDown();
            doc.text(`Finalidade: ${desarquivamento.finalidade || 'N/A'}`);
            doc.moveDown(3);
            doc.text('_________________________________________');
            doc.text('Assinatura do Responsável');
        });

        doc.end();

    } catch (error) {
        req.flash('error_msg', `Erro ao gerar termos: ${error.message}`);
        res.redirect('/nugecid/desarquivamento');
    }
};

exports.apagarTodos = async (req, res) => {
    try {
        await Desarquivamento.destroy({ where: {}, truncate: true });
        req.flash('success_msg', 'Todos os registros de desarquivamento foram excluídos com sucesso.');
        res.redirect('/nugecid/desarquivamento');
    } catch (error) {
        req.flash('error_msg', `Erro ao excluir os registros: ${error.message}`);
        res.redirect('/nugecid/desarquivamento');
    }
};

// Lixeira
exports.getLixeira = async (req, res) => {
    try {
        const desarquivamentos = await Desarquivamento.findAll({
            where: {
                deletedAt: {
                    [require('sequelize').Op.ne]: null
                }
            },
            paranoid: false
        });
        res.render('desarquivamento/lixeira', { desarquivamentos });
  } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.restaurar = async (req, res) => {
    try {
        await Desarquivamento.restore({
            where: { id: req.params.id }
        });
        req.flash('success_msg', 'Desarquivamento restaurado com sucesso!');
        res.redirect('/nugecid/desarquivamento/lixeira');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [updated] = await Desarquivamento.update({ status }, {
            where: { id: id }
        });

        if (updated) {
            req.flash('success_msg', 'Status atualizado com sucesso!');
        } else {
            req.flash('error_msg', 'Falha ao atualizar o status.');
        }
    res.redirect('/nugecid/desarquivamento');
    } catch (error) {
        req.flash('error_msg', 'Erro ao atualizar o status.');
    res.redirect('/nugecid/desarquivamento');
  }
};

exports.forcarDelete = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.session.user.id;

    try {
        const usuario = await Usuario.findByPk(userId);
        if (!usuario || !bcrypt.compareSync(password, usuario.senha)) {
            req.flash('error_msg', 'Senha incorreta. A exclusão não foi autorizada.');
            return res.redirect('/nugecid/desarquivamento/lixeira');
        }

        await Desarquivamento.destroy({
            where: { id: id },
            force: true
        });

        req.flash('success_msg', 'Desarquivamento excluído permanentemente!');
        res.redirect('/nugecid/desarquivamento/lixeira');
    } catch (error) {
        req.flash('error_msg', 'Ocorreu um erro ao tentar excluir o registro permanentemente.');
        res.redirect('/nugecid/desarquivamento/lixeira');
    }
};

exports.esvaziarLixeira = async (req, res) => {
    const { password } = req.body;
    const userId = req.session.user.id;

    try {
        const usuario = await Usuario.findByPk(userId);
        if (!usuario || !bcrypt.compareSync(password, usuario.senha)) {
            req.flash('error_msg', 'Senha incorreta. A operação não foi autorizada.');
            return res.redirect('/nugecid/desarquivamento/lixeira');
        }

        await Desarquivamento.destroy({
            where: {
                deletedAt: {
                    [require('sequelize').Op.ne]: null
                }
            },
            force: true,
            paranoid: false
        });
        req.flash('success_msg', 'Lixeira esvaziada com sucesso!');
        res.redirect('/nugecid/desarquivamento/lixeira');
    } catch (error) {
        console.error("Erro ao esvaziar a lixeira:", error);
        req.flash('error_msg', 'Ocorreu um erro ao tentar esvaziar a lixeira.');
        res.redirect('/nugecid/desarquivamento/lixeira');
    }
};

// --- Funções de Importação ---

// 1. Renderiza o formulário de importação
exports.formImportacao = (req, res) => {
    res.render('desarquivamento/importar', {
        preview: null,
        mensagem: null,
        erros: null
    });
};

// 2. Processa o upload e mostra a pré-visualização
exports.previewImportacao = async (req, res) => {
    logger.iniciarLog();
    logger.log('Iniciando pré-visualização da importação.');

    if (!req.file) {
        logger.logErro('Nenhum arquivo foi enviado.');
        req.flash('error_msg', 'Nenhum arquivo foi enviado.');
        return res.redirect('/nugecid/desarquivamento/importar');
    }

    const uploadsDir = 'uploads';
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const tempPath = path.join(uploadsDir, `temp_${Date.now()}.xlsx`);
    fs.writeFileSync(tempPath, req.file.buffer);
    logger.log(`Arquivo temporário criado em: ${tempPath}`);

    const tryCommands = ['python', 'python3'];
    let commandIndex = 0;

    const executePython = () => {
        if (commandIndex >= tryCommands.length) {
            logger.logErro('Nenhum executável Python (python/python3) foi encontrado.');
            try {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            } catch (e) { logger.logErro('Falha ao limpar arquivo temporário após erro de Python.', e); }
            req.flash('error_msg', 'Não foi possível encontrar um executável Python válido para pré-visualização.');
            return res.redirect('/nugecid/desarquivamento/importar');
        }

        const command = tryCommands[commandIndex];
        logger.log(`Tentando executar o script Python com o comando: ${command}`);
        const scriptPath = path.resolve(__dirname, '../../../python_services/read_spreadsheet.py');
        const pythonProcess = spawn(command, [scriptPath, tempPath]);

        let pythonData = '';
        let errorData = '';
        let responded = false;

        pythonProcess.stdout.on('data', (data) => { pythonData += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });

        pythonProcess.on('error', (err) => {
            logger.logErro(`Erro ao iniciar o processo Python com '${command}'.`, err);
            if (err.code === 'ENOENT') {
                commandIndex++;
                executePython();
            } else {
                if (!responded) {
                    responded = true;
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
                    req.flash('error_msg', `Erro inesperado ao executar o serviço Python para pré-visualização: ${err.message}`);
                    res.redirect('/nugecid/desarquivamento/importar');
                }
            }
        });

        pythonProcess.on('close', (code) => {
            logger.log(`Script Python finalizado com código: ${code}.`);
            if (!responded) {
                responded = true;
                if (code !== 0) {
                    logger.logErro(`Script Python (${command}) finalizou com erro.`, errorData);
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
                    req.flash('error_msg', `Falha ao processar a planilha para pré-visualização. Detalhes: ${errorData}`);
                    return res.redirect('/nugecid/desarquivamento/importar');
                }

                try {
                    logger.log('Dados brutos recebidos do Python:\n' + pythonData);
                    const registros = JSON.parse(pythonData);
                    if (registros.error) {
                        logger.logErro('Script Python retornou um erro de aplicação.', registros.error);
                        throw new Error(registros.error);
                    }
                    logger.log(`Dados parseados com sucesso. ${registros.length} registros encontrados.`);

                    if (registros.length === 0) {
                        logger.log('Nenhum registro encontrado na planilha.');
                        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
                        req.flash('error_msg', 'A planilha está vazia ou em um formato inválido.');
                        return res.redirect('/nugecid/desarquivamento/importar');
                    }

                    req.session.arquivoTemp = tempPath;
                    logger.log('Renderizando página de pré-visualização.');
                    res.render('desarquivamento/importar', {
                        preview: registros,
                        arquivoTemp: tempPath,
                        mensagem: null,
                        erros: null
                    });
                } catch (error) {
                    logger.logErro('Erro ao fazer parse do JSON ou renderizar a view.', error);
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
                    req.flash('error_msg', `Erro ao processar os dados da planilha: ${error.message}`);
                    res.redirect('/nugecid/desarquivamento/importar');
                }
            }
        });
    };

    executePython();
};

// 3. Confirma e executa a importação usando o serviço Python com fallback
exports.confirmarImportacao = async (req, res) => {
    logger.log('Iniciando confirmação da importação.');
    const { arquivoTemp } = req.body;

    if (!arquivoTemp || !fs.existsSync(arquivoTemp)) {
        logger.logErro('Arquivo temporário não encontrado na confirmação.', { arquivoTemp });
        req.flash('error_msg', 'Arquivo de importação não encontrado ou a sessão expirou.');
        return res.redirect('/nugecid/desarquivamento/importar');
    }

    const tryCommands = ['python', 'python3'];
    let commandIndex = 0;

    const executePython = () => {
        if (commandIndex >= tryCommands.length) {
            try {
                if (fs.existsSync(arquivoTemp)) fs.unlinkSync(arquivoTemp);
            } catch (e) { console.error("Erro ao limpar arquivo temp:", e); }
            req.flash('error_msg', 'Não foi possível encontrar um executável Python válido no sistema. Verifique a instalação e o PATH.');
            return res.redirect('/nugecid/desarquivamento/importar');
        }

        const command = tryCommands[commandIndex];
        // Caminho absoluto do script Python
        const scriptPath = path.resolve(__dirname, '../../../python_services/read_spreadsheet.py');
        const pythonProcess = spawn(command, [scriptPath, arquivoTemp]);

        let pythonData = '';
        let errorData = '';

        // Flag para evitar múltiplas respostas
        let responded = false;

        pythonProcess.stdout.on('data', (data) => { pythonData += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });

        pythonProcess.on('error', (err) => {
            if (err.code === 'ENOENT') {
                console.log(`Comando "${command}" não encontrado. Tentando o próximo...`);
                commandIndex++;
                executePython();
            } else {
                try {
                    if (fs.existsSync(arquivoTemp)) fs.unlinkSync(arquivoTemp);
                } catch (e) { console.error("Erro ao limpar arquivo temp:", e); }
                if (!responded) {
                    responded = true;
                    req.flash('error_msg', `Erro inesperado ao executar o serviço Python: ${err.message}`);
                    res.redirect('/nugecid/desarquivamento/importar');
                }
            }
        });

        pythonProcess.on('close', async (code) => {
            if (!responded) {
                responded = true;
                if (code !== 0) {
                    console.error(`Script Python (${command}) finalizou com erro (código ${code}): ${errorData}`);
                    if (errorData.includes('ModuleNotFoundError')) {
                        console.log(`ModuleNotFoundError com "${command}". Tentando o próximo...`);
                        commandIndex++;
                        executePython();
                        return;
                    }
                    try {
                        if (fs.existsSync(arquivoTemp)) fs.unlinkSync(arquivoTemp);
                    } catch (e) { console.error("Erro ao limpar arquivo temp:", e); }
                    req.flash('error_msg', 'Falha ao processar a planilha. Verifique o console do servidor para mais detalhes.');
                    return res.redirect('/nugecid/desarquivamento/importar');
                }

                const t = await sequelize.transaction();
                logger.log('Transação com o banco de dados iniciada.');
                try {
                const registrosDaPlanilha = JSON.parse(pythonData);
                logger.log(`Dados da planilha parseados para a confirmação. ${registrosDaPlanilha.length} registros.`);
                if (registrosDaPlanilha.error) throw new Error(registrosDaPlanilha.error);

                const mapeamento = {
                    'Nº': 'numDocumento',
                    'FÍSICO/DIGITAL': 'solicitacao',
                    'STATUS': 'status',
                    'NOME COMPLETO': 'nomeCompleto',
                    'Nº DO NIC/LAUDO/AUTO/ INFORMAÇÃO TÉCNICA': 'numNic',
                    'Nº DO PROCESSO': 'numProcesso',
                    'TIPO DE DOCUMENTO': 'tipoDocumento',
                    'DATA DE SOLICITAÇÃO': 'dataSolicitacao',
                    'DATA DE DESARQUIVAMENTO - SAG': 'dataDesarquivamento',
                    'DATA DE DEVOLUÇÃO PELO SETOR': 'dataDevolucao',
                    'SETOR DEMANTANTE': 'setorDemandante',
                    'SERVIDOR DO ITEP RESPONSÁVEL (MATRÍCULA)': 'servidorResponsavel',
                    'FINALIDADE DO DESARQUIVAMENTO': 'finalidade',
                    'SOLICITAÇÃO DE PRORROGAÇÃO DE PRAZO DE DESARQUIVAMENTO': 'solicitacaoProrrogacao'
                };
                const registrosMapeados = mapearColunas(registrosDaPlanilha, mapeamento);
                logger.log('Mapeamento de colunas concluído.');

                if (!registrosMapeados || registrosMapeados.length === 0) {
                    logger.logErro('Nenhum registro válido após o mapeamento.');
                    await t.rollback();
                    req.flash('error_msg', 'Nenhum registro válido foi encontrado na planilha. Verifique o conteúdo e o formato.');
                    return res.redirect('/nugecid/desarquivamento/importar');
                }

                // Validação dos campos obrigatórios
                const obrigatorios = ['solicitacao', 'nomeCompleto', 'numDocumento', 'dataSolicitacao', 'setorDemandante'];
                const registrosInvalidos = registrosMapeados.filter(reg => obrigatorios.some(campo => !reg[campo]));
                if (registrosInvalidos.length > 0) {
                    logger.logErro('Validação falhou. Registros inválidos encontrados.', registrosInvalidos);
                    await t.rollback();
                    let msg = `Registros inválidos encontrados (${registrosInvalidos.length}):\n`;
                    registrosInvalidos.forEach((reg, idx) => {
                        msg += `Linha ${idx + 1}: `;
                        obrigatorios.forEach(campo => {
                            if (!reg[campo]) msg += `[${campo}] `;
                        });
                        msg += '\n';
                    });
                    req.flash('error_msg', msg);
                    return res.redirect('/nugecid/desarquivamento/importar');
                }

                logger.log('Iniciando loop para salvar registros no banco de dados.');
                for (const registro of registrosMapeados) {
                    if (registro.numDocumento) {
                        await Desarquivamento.destroy({ where: { numDocumento: registro.numDocumento }, transaction: t, force: true });
                    }
                    await Desarquivamento.create(registro, { transaction: t });
                }
                logger.log('Loop de salvamento concluído.');

                await t.commit();
                logger.log('Transação commitada com sucesso.');
                req.flash('success_msg', `${registrosMapeados.length} registros importados com sucesso!`);
                res.redirect('/nugecid/desarquivamento');
                } catch (error) {
                    logger.logErro('Erro durante a transação com o banco de dados.', error);
                    await t.rollback();
                    req.flash('error_msg', `Erro durante a importação no banco de dados: ${error.message}`);
                    res.redirect('/nugecid/desarquivamento/importar');
                } finally {
                    try {
                        if (fs.existsSync(arquivoTemp)) {
                            fs.unlinkSync(arquivoTemp);
                            logger.log('Arquivo temporário limpo com sucesso.');
                        }
                    } catch (e) { logger.logErro('Falha ao limpar arquivo temporário na confirmação.', e); }
                }
            }
        });
    };
    executePython();
};
