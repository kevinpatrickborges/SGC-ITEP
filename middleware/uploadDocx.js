const multer = require('multer');

// Configura o multer para usar o armazenamento em memória.
// Isso disponibiliza o arquivo como um buffer (req.file.buffer), 
// o que é ideal para processamento sem salvar no disco.
const storage = multer.memoryStorage();

// Filtro para garantir que apenas arquivos com a extensão .docx sejam aceitos.
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.originalname.toLowerCase().endsWith('.docx')) {
    cb(null, true);
  } else {
    // Rejeita o arquivo com uma mensagem de erro
    cb(new Error('Formato de arquivo inválido. Apenas .docx é permitido.'), false);
  }
};

const uploadDocx = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10 // Limite de 10MB para o arquivo DOCX
  }
});

module.exports = uploadDocx;