'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Define o diretório base para os uploads
const storageDir = path.join(__dirname, '..', 'storage');

// Garante que o diretório base exista
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const year = new Date().getFullYear().toString();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const destPath = path.join(storageDir, year, month);

    // Cria o diretório do ano/mês se não existir
    fs.mkdirSync(destPath, { recursive: true });
    
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo único para evitar colisões
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // Limite de 100 MB
  },
  fileFilter: (req, file, cb) => {
    // Aqui você pode adicionar lógica para permitir/rejeitar certos tipos de arquivo
    // Por enquanto, aceita todos.
    cb(null, true);
  }
});

module.exports = upload;
