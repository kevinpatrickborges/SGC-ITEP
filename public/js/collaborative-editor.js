/**
 * Editor Colaborativo para SGC-ITEP
 * Baseado no quill-ws
 */

class CollaborativeEditor {
    constructor(options = {}) {
        this.containerId = options.containerId || 'collaborative-editor';
        this.documentId = options.documentId || 'default';
        this.userName = options.userName || 'Usuário Anônimo';
        this.serverUrl = options.serverUrl || window.location.origin;
        this.socket = null;
        this.quill = null;
        this.users = {};
        this.userColor = this.generateColor();
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.createEditorHTML();
        this.initializeQuill();
        this.connectToServer();
    }

    createEditorHTML() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Container não encontrado:', this.containerId);
            return;
        }

        container.innerHTML = `
            <div class="collaborative-editor-wrapper">
                <div class="editor-header">
                    <div class="connection-status">
                        <span id="status-indicator" class="status-disconnected">●</span>
                        <span id="status-text">Conectando...</span>
                    </div>
                    <div class="user-info">
                        <span class="user-name">${this.userName}</span>
                        <span class="user-color" style="background-color: ${this.userColor}"></span>
                    </div>
                </div>
                <div id="quill-editor" class="quill-editor"></div>
                <div class="users-online">
                    <div class="users-header">Usuários Online:</div>
                    <div id="users-list" class="users-list"></div>
                </div>
            </div>
        `;
    }

    initializeQuill() {
        // Verificar se Quill está disponível
        if (typeof Quill === 'undefined') {
            console.error('Quill.js não está carregado');
            return;
        }

        this.quill = new Quill('#quill-editor', {
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Digite aqui para colaborar...',
            theme: 'snow'
        });

        // Eventos do Quill
        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user' && this.socket && this.isConnected) {
                this.socket.emit('text-change', {
                    documentId: this.documentId,
                    delta: delta,
                    userName: this.userName
                });
            }
        });

        this.quill.on('selection-change', (range, oldRange, source) => {
            if (source === 'user' && this.socket && this.isConnected && range) {
                this.socket.emit('cursor-change', {
                    documentId: this.documentId,
                    range: range,
                    userName: this.userName,
                    userColor: this.userColor
                });
            }
        });
    }

    connectToServer() {
        // Verificar se Socket.IO está disponível
        if (typeof io === 'undefined') {
            console.error('Socket.IO não está carregado');
            return;
        }

        this.socket = io(this.serverUrl);

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateStatus('Conectado', 'connected');
            
            // Entrar na sala do documento
            this.socket.emit('join-document', {
                documentId: this.documentId,
                userName: this.userName,
                userColor: this.userColor
            });
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateStatus('Desconectado', 'disconnected');
        });

        this.socket.on('document-content', (data) => {
            if (data.content) {
                this.quill.setContents(data.content, 'api');
            }
        });

        this.socket.on('text-change', (data) => {
            if (data.userName !== this.userName) {
                this.quill.updateContents(data.delta, 'api');
            }
        });

        this.socket.on('user-joined', (data) => {
            this.addUser(data.userName, data.userColor);
        });

        this.socket.on('user-left', (data) => {
            this.removeUser(data.userName);
        });

        this.socket.on('users-list', (users) => {
            this.updateUsersList(users);
        });

        this.socket.on('cursor-change', (data) => {
            if (data.userName !== this.userName) {
                this.updateUserCursor(data.userName, data.range, data.userColor);
            }
        });
    }

    updateStatus(text, status) {
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');
        
        if (statusText) statusText.textContent = text;
        if (statusIndicator) {
            statusIndicator.className = `status-${status}`;
        }
    }

    addUser(userName, userColor) {
        this.users[userName] = { color: userColor };
        this.updateUsersDisplay();
    }

    removeUser(userName) {
        delete this.users[userName];
        this.updateUsersDisplay();
    }

    updateUsersList(users) {
        this.users = users;
        this.updateUsersDisplay();
    }

    updateUsersDisplay() {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;

        usersList.innerHTML = '';
        Object.keys(this.users).forEach(userName => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <span class="user-color" style="background-color: ${this.users[userName].color}"></span>
                <span class="user-name">${userName}</span>
            `;
            usersList.appendChild(userElement);
        });
    }

    updateUserCursor(userName, range, userColor) {
        // Implementação básica de cursor - pode ser melhorada com quill-cursors
        console.log(`Cursor de ${userName} na posição:`, range);
    }

    generateColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Métodos públicos para controle externo
    getContent() {
        return this.quill ? this.quill.getContents() : null;
    }

    setContent(content) {
        if (this.quill) {
            this.quill.setContents(content, 'api');
        }
    }

    destroy() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Disponibilizar globalmente
window.CollaborativeEditor = CollaborativeEditor;