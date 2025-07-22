/**
 * Serviço de Editor Colaborativo para SGC-ITEP
 * Gerencia as conexões WebSocket e sincronização de documentos
 */

const socketIo = require('socket.io');
const { Op } = require('sequelize');

class CollaborativeEditorService {
    constructor() {
        this.io = null;
        this.documents = new Map(); // Cache de documentos em memória
        this.userSessions = new Map(); // Sessões de usuários
    }

    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.setupSocketHandlers();
        console.log('Serviço de Editor Colaborativo inicializado');
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Novo cliente conectado:', socket.id);

            // Entrar em um documento
            socket.on('join-document', async (data) => {
                try {
                    await this.handleJoinDocument(socket, data);
                } catch (error) {
                    console.error('Erro ao entrar no documento:', error);
                    socket.emit('error', { message: 'Erro ao entrar no documento' });
                }
            });

            // Mudança de texto
            socket.on('text-change', (data) => {
                this.handleTextChange(socket, data);
            });

            // Mudança de cursor
            socket.on('cursor-change', (data) => {
                this.handleCursorChange(socket, data);
            });

            // Salvar documento
            socket.on('save-document', async (data) => {
                try {
                    await this.handleSaveDocument(socket, data);
                } catch (error) {
                    console.error('Erro ao salvar documento:', error);
                    socket.emit('error', { message: 'Erro ao salvar documento' });
                }
            });

            // Desconexão
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    async handleJoinDocument(socket, data) {
        const { documentId, userName, userColor } = data;
        
        // Validar dados
        if (!documentId || !userName) {
            socket.emit('error', { message: 'DocumentId e userName são obrigatórios' });
            return;
        }

        // Entrar na sala do documento
        socket.join(documentId);
        
        // Armazenar informações da sessão
        socket.documentId = documentId;
        socket.userName = userName;
        socket.userColor = userColor;
        
        this.userSessions.set(socket.id, {
            documentId,
            userName,
            userColor,
            socketId: socket.id
        });

        // Carregar conteúdo do documento
        let documentContent = await this.loadDocumentContent(documentId);
        
        // Enviar conteúdo atual para o usuário
        socket.emit('document-content', {
            content: documentContent
        });

        // Notificar outros usuários sobre a entrada
        socket.to(documentId).emit('user-joined', {
            userName,
            userColor
        });

        // Enviar lista de usuários online para o novo usuário
        const onlineUsers = this.getOnlineUsers(documentId);
        socket.emit('users-list', onlineUsers);

        console.log(`${userName} entrou no documento ${documentId}`);
    }

    handleTextChange(socket, data) {
        const { documentId, delta, userName } = data;
        
        if (socket.documentId !== documentId) {
            return; // Segurança: verificar se o usuário está na sala correta
        }

        // Atualizar documento em cache
        this.updateDocumentCache(documentId, delta);

        // Broadcast para outros usuários na sala
        socket.to(documentId).emit('text-change', {
            delta,
            userName
        });

        // Auto-save periódico (opcional)
        this.scheduleAutoSave(documentId);
    }

    handleCursorChange(socket, data) {
        const { documentId, range, userName, userColor } = data;
        
        if (socket.documentId !== documentId) {
            return;
        }

        // Broadcast posição do cursor para outros usuários
        socket.to(documentId).emit('cursor-change', {
            range,
            userName,
            userColor
        });
    }

    async handleSaveDocument(socket, data) {
        const { documentId, content } = data;
        
        if (socket.documentId !== documentId) {
            socket.emit('error', { message: 'Não autorizado a salvar este documento' });
            return;
        }

        try {
            await this.saveDocumentToDB(documentId, content, socket.userName);
            socket.emit('document-saved', { success: true });
            
            // Notificar outros usuários sobre o salvamento
            socket.to(documentId).emit('document-saved-by', {
                userName: socket.userName
            });
            
            console.log(`Documento ${documentId} salvo por ${socket.userName}`);
        } catch (error) {
            console.error('Erro ao salvar documento:', error);
            socket.emit('document-saved', { success: false, error: error.message });
        }
    }

    handleDisconnect(socket) {
        const session = this.userSessions.get(socket.id);
        
        if (session) {
            const { documentId, userName } = session;
            
            // Notificar outros usuários sobre a saída
            socket.to(documentId).emit('user-left', {
                userName
            });
            
            // Remover sessão
            this.userSessions.delete(socket.id);
            
            console.log(`${userName} saiu do documento ${documentId}`);
        }
        
        console.log('Cliente desconectado:', socket.id);
    }

    async loadDocumentContent(documentId) {
        // Verificar cache primeiro
        if (this.documents.has(documentId)) {
            return this.documents.get(documentId).content;
        }

        try {
            // Carregar do banco de dados (adaptar conforme seu modelo)
            // Por enquanto, retornar conteúdo vazio
            const content = { ops: [] }; // Formato Delta do Quill
            
            // Armazenar em cache
            this.documents.set(documentId, {
                content,
                lastModified: new Date(),
                autoSaveTimeout: null
            });
            
            return content;
        } catch (error) {
            console.error('Erro ao carregar documento:', error);
            return { ops: [] };
        }
    }

    updateDocumentCache(documentId, delta) {
        if (!this.documents.has(documentId)) {
            this.documents.set(documentId, {
                content: { ops: [] },
                lastModified: new Date(),
                autoSaveTimeout: null
            });
        }

        const doc = this.documents.get(documentId);
        
        // Aplicar delta ao conteúdo (implementação simplificada)
        // Em produção, usar a biblioteca quill-delta para aplicar corretamente
        if (!doc.content.ops) {
            doc.content.ops = [];
        }
        
        doc.lastModified = new Date();
        this.documents.set(documentId, doc);
    }

    scheduleAutoSave(documentId) {
        const doc = this.documents.get(documentId);
        if (!doc) return;

        // Cancelar auto-save anterior
        if (doc.autoSaveTimeout) {
            clearTimeout(doc.autoSaveTimeout);
        }

        // Agendar novo auto-save em 30 segundos
        doc.autoSaveTimeout = setTimeout(async () => {
            try {
                await this.saveDocumentToDB(documentId, doc.content, 'sistema');
                console.log(`Auto-save realizado para documento ${documentId}`);
            } catch (error) {
                console.error('Erro no auto-save:', error);
            }
        }, 30000);
    }

    async saveDocumentToDB(documentId, content, userName) {
        // Implementar salvamento no banco de dados
        // Adaptar conforme seu modelo de dados
        
        try {
            // Exemplo de como poderia ser implementado:
            /*
            const { File } = require('../models');
            
            await File.upsert({
                id: documentId,
                content: JSON.stringify(content),
                lastModifiedBy: userName,
                lastModified: new Date()
            });
            */
            
            console.log(`Documento ${documentId} salvo no banco por ${userName}`);
        } catch (error) {
            console.error('Erro ao salvar no banco:', error);
            throw error;
        }
    }

    getOnlineUsers(documentId) {
        const users = {};
        
        for (const [socketId, session] of this.userSessions) {
            if (session.documentId === documentId) {
                users[session.userName] = {
                    color: session.userColor
                };
            }
        }
        
        return users;
    }

    // Método para obter estatísticas
    getStats() {
        return {
            documentsInCache: this.documents.size,
            activeSessions: this.userSessions.size,
            connectedClients: this.io ? this.io.engine.clientsCount : 0
        };
    }
}

module.exports = new CollaborativeEditorService();