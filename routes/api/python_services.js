const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// @route   GET api/python/spreadsheet
// @desc    Gera uma planilha com dados de vestígios
// @access  Private
router.get('/spreadsheet', (req, res) => {
    // No futuro, vamos buscar dados reais do banco de dados aqui.
    const vestigiosData = [
        { id: 1, descricao: 'Faca encontrada na cena do crime', status: 'Coletado', dataColeta: '2025-06-15' },
        { id: 2, descricao: 'Amostra de sangue', status: 'Em análise', dataColeta: '2025-06-16' },
        { id: 3, descricao: 'Celular da vítima', status: 'Analisado', dataColeta: '2025-06-17' },
    ];

    const pythonScriptPath = path.resolve(__dirname, '../../../python_services/generate_spreadsheet.py');
    const tempFileName = `vestigios_${Date.now()}.xlsx`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);
    
    // Converte os dados para uma string JSON para passar para o script Python.
    const dataString = JSON.stringify(vestigiosData);

    // Chama o script Python, passando o caminho do arquivo de saída e os dados.
    // Usaremos 'python' ou 'python3' dependendo do ambiente do usuário.
    const pythonProcess = spawn('python', [pythonScriptPath, tempFilePath, dataString]);

    let scriptOutput = '';
    pythonProcess.stdout.on('data', (data) => {
        scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Erro no script Python: ${data}`);
        // Não envie um erro 500 imediatamente, espere o processo terminar.
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Falha ao gerar a planilha.' });
        }
        
        // Verifica se o arquivo foi criado.
        if (fs.existsSync(tempFilePath)) {
            res.download(tempFilePath, tempFileName, (err) => {
                if (err) {
                    console.error('Erro ao enviar o arquivo:', err);
                }
                // Limpa o arquivo temporário após o download.
                fs.unlinkSync(tempFilePath);
            });
        } else {
            console.error('O script Python terminou, mas o arquivo não foi encontrado.');
            res.status(500).json({ error: 'Arquivo da planilha não foi gerado.' });
        }
    });
});

module.exports = router; 