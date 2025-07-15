const { Desarquivamento, Movimentacao } = require('../../../models');
const PDFDocument = require('pdfkit');

exports.getAll = async (req, res) => {
    try {
        const desarquivamentos = await Desarquivamento.findAll();
        res.render('desarquivamento/lista', { desarquivamentos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const desarquivamento = await Desarquivamento.create(req.body);
        res.status(201).json(desarquivamento);
    } catch (error) {
        res.status(400).json({ error: error.message });
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
    try {
        const deleted = await Desarquivamento.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Desarquivamento not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
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

exports.apagarTodos = async (req, res) => {
    try {
        await Desarquivamento.destroy({ where: {}, truncate: true });
        res.status(200).send({ message: 'Todos os desarquivamentos foram apagados.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
