'use strict';

const { File } = require('../models');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Função para calcular o hash SHA-256 de um arquivo
function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

// Processa o upload de um arquivo
exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const { path: tempPath, originalname, mimetype, size } = req.file;

  try {
    // 1. Calcular o hash do arquivo
    const sha256 = await calculateHash(tempPath);

    // 2. Verificar se um arquivo com o mesmo hash já existe
    const existingFile = await File.findOne({ where: { sha256 } });

    if (existingFile) {
      // Se o arquivo já existe, remove o arquivo duplicado que foi carregado
      fs.unlinkSync(tempPath);
      return res.status(200).json({ 
        message: 'Arquivo já existente no sistema.', 
        file: existingFile 
      });
    }

    // 3. Se for um arquivo novo, salvar no banco de dados
    const storageDir = path.join(__dirname, '..', 'storage');
    const relativePath = path.relative(storageDir, tempPath);

    const newFile = await File.create({
      path: relativePath.replace(/\\/g, '/'), // Normaliza para barras forward
      mimetype,
      size,
      sha256,
      originalName: originalname,
      ownerId: req.user ? req.user.id : null // Associa ao usuário logado
    });

    res.status(201).json({ 
      message: 'Arquivo carregado com sucesso!', 
      file: newFile 
    });

  } catch (error) {
    console.error('Erro no upload do arquivo:', error);
    // Remove o arquivo em caso de erro no processamento do banco de dados
    fs.unlinkSync(tempPath);
    res.status(500).json({ error: 'Erro interno ao processar o arquivo.' });
  }
};
