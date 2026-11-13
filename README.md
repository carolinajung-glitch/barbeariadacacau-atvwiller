# Barbearia da Cacau — Sistema de Gestão e Agendamento

Aplicação web (Node.js + Express + PostgreSQL) para controle de clientes, barbeiros, serviços e agendamentos.

## Como executar
1. Crie o banco no pgAdmin com o nome `saep_db` e execute o arquivo `saep_db.sql` (Query Tool), ou pelo terminal:
   `createdb -U postgres saep_db` e `psql -U postgres -d saep_db -f saep_db.sql`
2. `cd sistema && npm install`
3. (Opcional) variáveis de ambiente — os padrões já são `postgres` / senha `senai` / banco `saep_db` / `localhost:5432`:
   `$env:DB_PASS="senai"`, `$env:DB_NAME="saep_db"`, `$env:DB_USER="postgres"`
4. `npm start` e acesse http://localhost:3000/login.html

**Logins de teste:** `admin@cacau.com` / `Admin@123` · `recepcao@cacau.com` / `Recep@123` · `gerente@cacau.com` / `Gerente@123`
Para regenerar a massa de dados: `npm run seed` (reescreve `saep_db.sql`).

## Estrutura
| Caminho | Conteúdo |
|---|---|
| `saep_db.sql` | Criação das tabelas + massa de dados (3+ registros por tabela) |
| `DER.png` | Diagrama Entidade-Relacionamento |
| `sistema/server.js` | API REST e rotas protegidas |
| `sistema/seguranca.js` | bcrypt (senha), AES-256 (CPF), JWT com expiração de 30 min |
| `sistema/gerar_seed.js` | Gera o `saep_db.sql` com dados já criptografados |
| `sistema/public/` | login, painel, clientes, barbeiros/serviços, agendamentos |

## Documentação de software (Anexo 1)

### Requisitos funcionais
| Cód. | Requisito |
|---|---|
| RF01 | Autenticar usuário por e-mail/senha com mensagem de erro "Usuário ou senha inválidos." |
| RF02 | Sessão com expiração (30 min); redireciona ao login ao expirar |
| RF03 | Painel com nome do usuário logado, menu de navegação, resumo e botão de logout |
| RF04 | Cadastrar, listar, editar e excluir clientes |
| RF05 | Buscar clientes por termo (nome, telefone, e-mail), atualizando a listagem após confirmar |
| RF06 | Cadastrar, editar e excluir barbeiros |
| RF07 | Cadastrar serviços obrigatoriamente vinculados a um barbeiro existente |
| RF08 | Criar agendamentos (cliente + serviço + barbeiro + data + hora) |
| RF09 | Impedir dois atendimentos do mesmo barbeiro no mesmo dia e horário |
| RF10 | Listar agendamentos ordenados por data e hora com dados completos de cliente, serviço e barbeiro |
| RF11 | Concluir, cancelar ou excluir agendamentos |

### Requisitos não funcionais
- **RNF01 (LGPD):** senhas com bcrypt; CPF de clientes e barbeiros com AES-256-CBC; CPF exibido mascarado.
- **RNF02:** todas as rotas `/api` (exceto login) exigem token JWT válido.
- **RNF03:** consultas parametrizadas (prevenção de SQL Injection) e escape de HTML no front-end (XSS).
- **RNF04:** interface responsiva (desktop e celular).

### Regras de negócio atendidas
Massa de dados inicial · validação de login · criptografia de dados sensíveis · painel com logout · busca de clientes · serviço vinculado a barbeiro · agenda ordenada por dia/horário.

### Modelo de dados
Veja `DER.png`: `barbeiros 1—N servicos`, `barbeiros 1—N agendamentos`, `servicos 1—N agendamentos`, `clientes 1—N agendamentos`; `usuarios` é independente (acesso ao sistema).
