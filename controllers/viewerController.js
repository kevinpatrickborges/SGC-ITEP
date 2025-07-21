const path = require('path');
const mammoth = require('mammoth');

exports.showViewer = (req, res) => {
    res.render('viewer/index', { 
        title: 'Visualizador de DOCX', 
        user: req.user, 
        html: null, 
        error: null,
        csrfToken: res.locals.csrfToken
    });
};

exports.uploadAndDisplay = async (req, res) => {
    if (!req.file) {
        return res.render('viewer/index', { 
            title: 'Visualizador de DOCX', 
            user: req.user, 
            html: null, 
            error: 'Nenhum arquivo enviado.',
            csrfToken: res.locals.csrfToken
        });
    }

    // Validação do tipo de arquivo
    if (!req.file.originalname.toLowerCase().endsWith('.docx')) {
        return res.render('viewer/index', { 
            title: 'Visualizador de DOCX', 
            user: req.user, 
            html: null, 
            error: 'Por favor, selecione apenas arquivos .docx válidos.',
            csrfToken: res.locals.csrfToken
        });
    }

    // Validação do tamanho do arquivo (máximo 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
        return res.render('viewer/index', { 
            title: 'Visualizador de DOCX', 
            user: req.user, 
            html: null, 
            error: 'Arquivo muito grande. Tamanho máximo permitido: 10MB.',
            csrfToken: res.locals.csrfToken
        });
    }

    try {
        // Verificação básica se o buffer não está vazio
        if (!req.file.buffer || req.file.buffer.length === 0) {
            throw new Error('Arquivo vazio ou corrompido');
        }

        // Verificação adicional do tipo de buffer
        if (!Buffer.isBuffer(req.file.buffer)) {
            throw new Error('Formato de dados inválido');
        }

        const result = await mammoth.convertToHtml({ 
            buffer: req.file.buffer,
            options: {
                includeDefaultStyleMap: true,
                includeEmbeddedStyleMap: true
            }
        });
        
        const html = result.value; // The generated HTML
        
        // Log de warnings se houver
        if (result.messages && result.messages.length > 0) {
            console.warn('Avisos durante a conversão:', result.messages);
        }
        
        res.render('viewer/index', { 
            title: 'Visualizador de DOCX', 
            user: req.user, 
            html: html, 
            error: null,
            csrfToken: res.locals.csrfToken
        });
    } catch (error) {
        console.error('Erro ao converter DOCX para HTML:', error);
        
        let errorMessage = 'Erro ao processar o arquivo DOCX.';
        
        if (error.message.includes('zip file') || error.message.includes('JSZip') || error.message.includes('supported JavaScript type')) {
            errorMessage = 'O arquivo parece estar corrompido ou não é um documento DOCX válido. Verifique se o arquivo não está danificado e tente novamente.';
        } else if (error.message.includes('Arquivo vazio') || error.message.includes('Formato de dados inválido')) {
            errorMessage = 'O arquivo está vazio ou em formato inválido.';
        }
        
        res.render('viewer/index', { 
             title: 'Visualizador de DOCX', 
             user: req.user, 
             html: null, 
             error: errorMessage,
             csrfToken: res.locals.csrfToken
         });
    }
};

exports.displayTermo = async (req, res) => {
    if (!req.session.docxBuffer) {
        req.flash('error_msg', 'Nenhum termo para visualizar. Por favor, gere um primeiro.');
        return res.redirect('/nugecid');
    }

    try {
        const sessionData = req.session.docxBuffer;
        
        // Log detalhado para diagnóstico
        console.log('Session data info:', {
            exists: !!sessionData,
            type: typeof sessionData,
            isObject: typeof sessionData === 'object',
            hasData: sessionData && sessionData.data,
            dataType: sessionData && sessionData.type
        });
        
        let buffer;
        
        // Verificação se é o novo formato base64
        if (sessionData && typeof sessionData === 'object' && sessionData.type === 'base64') {
            console.log('Convertendo de base64 para buffer');
            buffer = Buffer.from(sessionData.data, 'base64');
        } else if (Buffer.isBuffer(sessionData)) {
            // Formato antigo (buffer direto)
            buffer = sessionData;
        } else {
            throw new Error('Formato de dados do termo inválido');
        }
        
        // Verificação básica se o buffer não está vazio
        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer do termo vazio ou corrompido');
        }

        console.log('Buffer final info:', {
            isBuffer: Buffer.isBuffer(buffer),
            length: buffer.length
        });
        
        const result = await mammoth.convertToHtml({ 
            buffer,
            options: {
                includeDefaultStyleMap: true,
                includeEmbeddedStyleMap: true,
                convertImage: mammoth.images.imgElement(function(image) {
                    return image.read("base64").then(function(imageBuffer) {
                        return {
                            src: "data:" + image.contentType + ";base64," + imageBuffer
                        };
                    });
                }),
                styleMap: [
                    "p[style-name='Header'] => h1:fresh",
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Title'] => h1.title:fresh",
                    "r[style-name='Strong'] => strong",
                    "table => table.table.table-bordered"
                ],
                ignoreEmptyParagraphs: false,
                preserveEmptyParagraphs: true
            }
        });
        
        const html = result.value;
        
        // Log detalhado do resultado da conversão
        console.log('=== RESULTADO DA CONVERSÃO MAMMOTH ===');
        console.log('HTML gerado (primeiros 500 caracteres):', html.substring(0, 500));
        console.log('Tamanho total do HTML:', html.length);
        console.log('Mensagens do mammoth:', result.messages);
        console.log('=== FIM DO RESULTADO ===');
        
        // Log de warnings se houver
        if (result.messages && result.messages.length > 0) {
            console.warn('Avisos durante a conversão do termo:', result.messages);
        }

        // Limpa o buffer da sessão após o uso
        delete req.session.docxBuffer;

        res.render('viewer/index', { 
            title: 'Visualizar Termo', 
            user: req.user, 
            html: html, 
            error: null,
            csrfToken: res.locals.csrfToken
        });
    } catch (error) {
        console.error('Erro ao converter o termo DOCX para HTML:', error);
        delete req.session.docxBuffer; // Garante a limpeza mesmo em caso de erro
        
        let errorMessage = 'Erro ao exibir o termo.';
        
        if (error.message.includes('zip file') || error.message.includes('JSZip') || error.message.includes('supported JavaScript type')) {
            errorMessage = 'O termo gerado parece estar corrompido. Tente gerar novamente.';
        } else if (error.message.includes('Buffer do termo vazio') || error.message.includes('Formato de dados do termo inválido')) {
            errorMessage = 'Termo vazio ou em formato inválido. Tente gerar novamente.';
        }
        
        req.flash('error_msg', errorMessage);
        res.redirect('/nugecid');
    }
};