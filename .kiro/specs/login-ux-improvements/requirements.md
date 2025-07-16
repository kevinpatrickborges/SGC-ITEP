# Requirements Document

## Introduction

Esta especificação define melhorias na experiência do usuário (UX) da tela de login do SGC-ITEP. O objetivo é tornar o processo de autenticação mais amigável, mantendo os dados inseridos pelo usuário em caso de erro e exibindo mensagens de erro diretamente na tela ao invés de notificações push.

## Requirements

### Requirement 1

**User Story:** Como um usuário do sistema, eu quero que meus dados de login permaneçam preenchidos quando ocorrer um erro de autenticação, para que eu não precise digitá-los novamente.

#### Acceptance Criteria

1. WHEN o usuário submete o formulário de login com credenciais inválidas THEN o sistema SHALL manter o valor do campo "usuário" preenchido na tela de erro
2. WHEN o usuário submete o formulário de login com credenciais inválidas THEN o sistema SHALL limpar apenas o campo "senha" por questões de segurança
3. WHEN o usuário submete o formulário de login com credenciais inválidas THEN o sistema SHALL focar automaticamente no campo "senha" para facilitar a correção

### Requirement 2

**User Story:** Como um usuário do sistema, eu quero ver mensagens de erro diretamente na tela de login, para que eu tenha uma experiência mais fluida sem pop-ups ou notificações intrusivas.

#### Acceptance Criteria

1. WHEN o usuário submete credenciais inválidas THEN o sistema SHALL exibir a mensagem de erro como um alerta inline na própria página
2. WHEN uma mensagem de erro é exibida THEN ela SHALL aparecer abaixo dos campos de login de forma visualmente clara
3. WHEN uma mensagem de erro é exibida THEN ela SHALL usar cores e ícones apropriados para indicar erro (vermelho, ícone de alerta)
4. WHEN o usuário corrige os dados e submete novamente THEN a mensagem de erro anterior SHALL ser removida automaticamente

### Requirement 3

**User Story:** Como um usuário do sistema, eu quero que a interface de login seja responsiva e acessível, para que eu possa usar o sistema em diferentes dispositivos e condições.

#### Acceptance Criteria

1. WHEN a mensagem de erro é exibida THEN ela SHALL ser legível em dispositivos móveis e desktop
2. WHEN o usuário navega usando teclado THEN o foco SHALL ser gerenciado adequadamente entre os campos e mensagens de erro
3. WHEN uma mensagem de erro é exibida THEN ela SHALL ser anunciada por leitores de tela para usuários com deficiência visual