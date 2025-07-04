'use strict';

const Desarquivamento = require('../models/Desarquivamento');
const { Op, Sequelize } = require('sequelize');

/**
 * @desc Retorna todos os desarquivamentos com pendências de prazo.
 * @route GET /api/notifications
 */
exports.getPendingNotifications = async (req, res) => {
    try {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const today = new Date();

        const pendingItems = await Desarquivamento.findAll({
            where: {
                [Op.or]: [
                    // 1. Status 'Retirado pelo setor' com prazo vencido
                    {
                        status: 'Retirado pelo setor',
                        dataPrazoDevolucao: { [Op.lt]: today }
                    },
                    // 2. Status 'Desarquivado' ou 'Não coletado' há mais de 5 dias
                    {
                        status: { [Op.in]: ['Desarquivado', 'Não coletado'] },
                        updatedAt: { [Op.lt]: fiveDaysAgo }
                    },
                    // 3. Status 'Solicitado' há mais de 5 dias
                    {
                        status: 'Solicitado',
                        dataSolicitacao: { [Op.lt]: fiveDaysAgo }
                    },
                    // 4. Status 'Rearquivamento solicitado' há mais de 5 dias
                    {
                        status: 'Rearquivamento solicitado',
                        updatedAt: { [Op.lt]: fiveDaysAgo }
                    },
                    // 5. Status 'Não localizado' há mais de 5 dias
                    {
                        status: 'Não localizado',
                        updatedAt: { [Op.lt]: fiveDaysAgo }
                    }
                ]
            },
            raw: true
        });

        res.json(pendingItems);

    } catch (error) {
        console.error('Erro ao buscar notificações pendentes:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}; 