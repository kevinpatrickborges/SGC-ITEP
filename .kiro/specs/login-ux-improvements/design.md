# Design Document

## Overview

Este documento descreve o design das melhorias na experiência do usuário da tela de login do SGC-ITEP. As mudanças focam em manter os dados do usuário após erro de autenticação e substituir notificações pop-up por mensagens inline na própria página.

## Architecture

### Current State
- Login form com campos usuário/senha
- Pop-up overlay para mensagens de erro
- Campos são limpos após erro de autenticação
- Controller retorna erro via `error_msg` no render

### Target State
- Login form mantém dados do usuário após erro
- Mensagens de erro inline abaixo dos campos
- Foco automático no campo senha após erro
- Melhor acessibilidade e responsividade

## Components and Interfaces

### 1. Frontend Components

#### Login Form Enhancement
- **File**: `views/auth/login.ejs`
- **Changes**:
  - Adicionar preservação de valores nos campos input
  - Substituir pop-up overlay por div de erro inline
  - Implementar foco automático no campo senha
  - Melhorar estrutura HTML para acessibilidade

#### CSS Styling
- **File**: `public/css/login-styles.css`
- **Changes**:
  - Adicionar estilos para mensagem de erro inline
  - Garantir responsividade da mensagem
  - Manter consistência visual com o design atual

### 2. Backend Components

#### Auth Controller
- **File**: `controllers/authController.js`
- **Changes**:
  - Modificar `postLogin` para retornar dados do usuário no render
  - Manter valor do campo matricula/email no contexto de erro
  - Preservar CSRF token adequadamente

## Data Models

### Login Form Data Flow

```
User Input → Form Submission → Controller Validation → Error Response
     ↓                                                        ↓
Preserved Values ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### Error Response Structure
```javascript
{
  error_msg: "Mensagem de erro específica",
  matricula: "valor_preservado", // Novo campo
  csrfToken: "token_csrf"
}
```

## Error Handling

### Error Types and Messages
1. **Usuário não encontrado**: "Usuário não encontrado."
2. **Senha incorreta**: "Senha incorreta."
3. **Campos vazios**: "Por favor, preencha todos os campos."

### Error Display Strategy
- Mensagens aparecem como alert inline abaixo dos campos
- Cor vermelha (#dc3545) para indicar erro
- Ícone de alerta para reforço visual
- Mensagem desaparece automaticamente no próximo submit

## Testing Strategy

### Unit Tests
- Testar preservação de dados no controller
- Validar renderização correta com dados preservados
- Verificar limpeza adequada do campo senha

### Integration Tests
- Testar fluxo completo de login com erro
- Verificar comportamento em diferentes navegadores
- Testar acessibilidade com leitores de tela

### Manual Testing Scenarios
1. **Usuário inválido**: Inserir usuário inexistente, verificar preservação
2. **Senha incorreta**: Inserir senha errada, verificar foco no campo senha
3. **Responsividade**: Testar em dispositivos móveis
4. **Acessibilidade**: Navegar apenas com teclado

## Implementation Details

### HTML Structure Changes
```html
<!-- Campos com valores preservados -->
<input type="text" name="matricula" value="<%= matricula || '' %>" />
<input type="password" name="senha" id="senha" />

<!-- Mensagem de erro inline -->
<% if (error_msg) { %>
<div class="alert alert-danger error-inline" role="alert">
  <i class="bi bi-exclamation-triangle-fill"></i> <%= error_msg %>
</div>
<% } %>
```

### CSS Classes
```css
.error-inline {
  margin-top: 12px;
  margin-bottom: 0;
  font-size: 0.9rem;
  border-left: 4px solid #dc3545;
}
```

### JavaScript Enhancements
```javascript
// Auto-focus no campo senha se houver erro e matricula preenchida
if (document.querySelector('.error-inline') && document.getElementById('matricula').value) {
  document.getElementById('senha').focus();
}
```

## Security Considerations

- Campo senha sempre limpo por segurança
- CSRF token mantido adequadamente
- Não exposição de informações sensíveis nas mensagens de erro
- Validação server-side mantida inalterada

## Accessibility Features

- Mensagens de erro com `role="alert"` para leitores de tela
- Foco gerenciado adequadamente
- Contraste adequado para mensagens de erro
- Navegação por teclado preservada