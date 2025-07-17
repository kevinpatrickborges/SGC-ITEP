const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../import-log.txt');

// Limpa o log no início de uma nova operação para evitar confusão
function iniciarLog() {
    const timestamp = new Date().toISOString();
    const message = `\n--- INÍCIO DO LOG DE IMPORTAÇÃO: ${timestamp} ---\n`;
    fs.writeFileSync(logFilePath, message, { flag: 'a' });
}

function log(mensagem) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${mensagem}\n`;
    fs.appendFileSync(logFilePath, message);
}

function logErro(mensagem, erro) {
    const timestamp = new Date().toISOString();
    const errorMessage = erro instanceof Error ? erro.stack : JSON.stringify(erro, null, 2);
    const message = `\n[${timestamp}] !!! ERRO !!!\n${mensagem}\nDetalhes: ${errorMessage}\n`;
    fs.appendFileSync(logFilePath, message);
}

module.exports = {
    iniciarLog,
    log,
    logErro
};
