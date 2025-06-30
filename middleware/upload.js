const multer = require('multer');

// Configura o multer para usar o armazenamento em memória.
// Isso disponibiliza o arquivo como um buffer (req.file.buffer), 
// o que é ideal para processamento sem salvar no disco.
const storage = multer.memoryStorage();

// Filtro para garantir que apenas arquivos com a extensão .xlsx sejam aceitos.
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.originalname.endsWith('.xlsx')) {
    cb(null, true);
  } else {
    // Rejeita o arquivo com uma mensagem de erro
    cb(new Error('Formato de arquivo inválido. Apenas .xlsx é permitido.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de 5MB para o arquivo
  }
});

module.exports = upload;
