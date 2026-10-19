# 🛍️ MS² Vestuário — Sistema de Gestão e Frente de Caixa (PDV)

Sistema de gestão para loja de vestuário com foco em caixa, controle de produtos, clientes, usuários e histórico de vendas.

## Visão geral

O projeto foi desenvolvido em arquitetura full stack com:

- Frontend em React + Vite
- Backend em Node.js + Express + TypeScript
- Banco de dados em MySQL
- Autenticação por JWT
- Controle de acesso por perfil: CAIXA, SUPERVISOR e GERENTE

A aplicação permite:

- realizar vendas com cálculo de subtotal, desconto e valor final;
- controlar estoque em tempo real;
- cadastrar clientes e consultar histórico;
- gerenciar produtos e usuários conforme perfil;
- impedir ações sensíveis sem autorização do gerente.

## Stack tecnológica

| Camada | Tecnologia | Uso no projeto |
| --- | --- | --- |
| Frontend | React | Interface do usuário |
| Frontend | Vite | Servidor de desenvolvimento e build |
| Frontend | React Router DOM | Rotas protegidas e navegação |
| Backend | Node.js | Execução da API |
| Backend | Express | Rotas e middlewares |
| Backend | TypeScript | Tipagem e organização do código |
| Backend | MySQL2 | Conexão com banco de dados |
| Backend | JWT | Autenticação e autorização |
| Backend | bcrypt | Criptografia de senhas |
| Banco | MySQL | Persistência de clientes, produtos, usuários e vendas |

## Estrutura do projeto

```text
PDV/
├── back-end/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   ├── seed.ts
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.*.json
├── README.md
└── package.json
```

## Pré-requisitos

Antes de rodar o projeto, verifique se a máquina possui:

- Node.js 20+
- npm
- MySQL 8+
- editor como VS Code

## Configuração do banco de dados

Crie o banco e as tabelas no MySQL com o script abaixo. Esse bloco gera o esquema necessário para o funcionamento da API e do módulo de vendas.

```sql
CREATE DATABASE IF NOT EXISTS ms2_vestuario;
USE ms2_vestuario;

CREATE TABLE clientes (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cpf CHAR(11) NOT NULL,
    telefone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY cpf_unique (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE produtos (
    id INT NOT NULL AUTO_INCREMENT,
    codigo_barras VARCHAR(50) NOT NULL,
    descricao VARCHAR(150) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY codigo_barras_unique (codigo_barras)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vendas (
    id INT NOT NULL AUTO_INCREMENT,
    cliente_id INT NULL,
    usuario_id INT NOT NULL,
    autorizado_por INT NULL,
    valor_subtotal DECIMAL(10,2) NOT NULL,
    percentual_desconto DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    valor_desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_total DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'FINALIZADA',
    motivo_cancelamento TEXT NULL,
    cancelado_por INT NULL,
    cancelado_em DATETIME NULL,
    data_venda DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY cliente_id_idx (cliente_id),
    KEY usuario_id_idx (usuario_id),
    KEY autorizado_por_idx (autorizado_por),
    KEY cancelado_por_idx (cancelado_por),
    CONSTRAINT fk_vendas_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_vendas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_vendas_autorizado_por
        FOREIGN KEY (autorizado_por) REFERENCES usuarios(id),
    CONSTRAINT fk_vendas_cancelado_por
        FOREIGN KEY (cancelado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE itens_venda (
    id INT NOT NULL AUTO_INCREMENT,
    venda_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_venda_produto (venda_id, produto_id),
    KEY produto_id_idx (produto_id),
    CONSTRAINT fk_itens_venda_venda
        FOREIGN KEY (venda_id) REFERENCES vendas(id),
    CONSTRAINT fk_itens_venda_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Tabela principal do projeto:

- clientes
- produtos
- usuarios
- vendas
- itens_venda

## Backend

### 1) Instalar dependências

```bash
cd back-end
npm install
```

### 2) Criar arquivo .env

Crie um arquivo `.env` dentro de `back-end` com o seguinte conteúdo:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_PORT=3306
DB_NAME=ms2_vestuario
JWT_SECRET=chave_secreta_pdv_2026
```

### 3) Rodar a API

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

O endpoint de saúde:

```text
http://localhost:3000/api/health
```

## Frontend

### 1) Instalar dependências

```bash
cd frontend
npm install
```

### 2) Rodar a aplicação

```bash
npm run dev
```

A interface normalmente abre em:

```text
http://localhost:5173
```

## Fluxo de autenticação e permissões

O sistema usa JWT para autenticar usuários.

Perfis disponíveis:

- CAIXA: acesso ao caixa e cadastro de clientes
- SUPERVISOR: gestão de produtos
- GERENTE: acesso completo, como gestão de usuários e histórico de vendas

As rotas são protegidas por middlewares de autenticação e autorização, evitando acesso indevido.

## Funcionalidades principais

### PDV

- busca de produtos por código ou descrição;
- inserção no carrinho;
- alteração de quantidade;
- cálculo de subtotal e desconto;
- escolha de forma de pagamento;
- integração com autorização de gerente em descontos maiores.

### Produtos

- cadastro de produto;
- edição de dados;
- ativação/inativação;
- ajuste de preço e estoque.

### Clientes

- cadastro com validação de CPF;
- máscara e formatação dos campos;
- consulta/listagem;
- edição dos dados cadastrais.

### Usuários

- cadastro de novos usuários;
- alteração de perfil;
- ativação/inativação;
- proteção para não inativar gerente.

### Vendas

- registro do histórico;
- detalhamento dos itens comprados;
- filtros por cliente e data.

## Primeiro acesso

No login, há a opção de criar o usuário inicial (setup). Essa ação cria o primeiro gerente do sistema.

Também é possível criar um usuário manualmente pelo painel administrativo, desde que haja login do gerente.

## Observações importantes

- O backend grava o histórico da venda e os itens comprados, preservando o preço na data da compra.
- O estoque é atualizado junto com a venda em uma mesma transação, evitando inconsistência.
- Descontos acima do limite permitido exigem autorização de gerente.
- A senha do usuário é armazenada com hash usando bcrypt.

## Scripts disponíveis

### Backend

```bash
npm run dev
npm run build
npm run start
npm run seed
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Conclusão

Este projeto representa uma aplicação de PDV funcional, com foco em arquitetura, segurança, permissões por perfil e consistência de dados. A estrutura atual está organizada para facilitar manutenção, evolução e apresentação do sistema em ambiente acadêmico ou profissional.

## 6. Passo a Passo: Frontend (Interface Web)

### Instalação e Variáveis de Conexão

1. Abra uma **nova aba de terminal** e navegue até a pasta do frontend:

   Bash
```
   cd front-end

```
2. Instale os pacotes:

   Bash
```
npm install

```

### Execução e Portas de Acesso

Execute o comando de inicialização do Vite:

```
npm run dev

```

Acesse o sistema no seu navegador através da URL fornecida (geralmente `http://localhost:5173/`).

## 7. Guia de Exploração Didática e Roteiro de Testes

```
sequenceDiagram
    autonumber
    actor Operador as Caixa (Navegador)
    participant Front as Frontend (React)
    participant Back as Backend (Express)
    participant DB as MySQL (Transação)

    Note over Operador,DB: Processo de Venda com Baixa de Estoque
    Operador->>Front: Adiciona produtos ao carrinho e finaliza
    Front->>Back: POST /api/vendas (Header: Bearer Token)
    Back->>DB: BEGIN TRANSACTION
    Back->>DB: INSERT INTO vendas (calcula totais)
    Back->>DB: Loop: INSERT INTO itens_venda (copia preço histórico)
    Back->>DB: Loop: UPDATE produtos SET estoque = estoque - qtd
    alt Sucesso no Estoque
        Back->>DB: COMMIT
        Back-->>Front: 201 Created (Venda Concluída)
    else Falha (Estoque Insuficiente)
        Back->>DB: ROLLBACK
        Back-->>Front: 400 Bad Request (Erro de Estoque)
    end

```

### Roteiro Prático:

1. **Autenticação:** Faça login no sistema. Verifique a liberação de menus baseada no seu perfil (`CAIXA` vê apenas PDV e Clientes; `GERENTE` vê o Histórico de Vendas e Gestão de Usuários).
2. **Catálogo de Produtos:** Com um perfil gerencial/supervisor, cadastre um produto com preço e estoque inicial.
3. **Frente de Caixa (PDV):** Adicione o produto ao carrinho. Aplique um desconto. (Se for maior que a alçada permitida, note a exigência de autorização do gerente).
4. **Finalização Segura:** Finalize a venda e verifique no banco de dados se a tabela `itens_venda` copiou o preço unitário e se a tabela `produtos` subtraiu corretamente a quantidade vendida.

## 8. Pontos Críticos de Aprendizado Técnico

- **Padrão Master-Detail (Mestre-Detalhe):** A arquitetura separa o "cabeçalho" do cupom fiscal (`vendas`) do "corpo" dos produtos comprados (`itens_venda`). Essa modelagem garante a normalização do banco relacional.
- **Preservação de Histórico Contábil:** A tabela `itens_venda` possui a coluna `preco_unitario`. O preço é copiado da tabela de produtos no momento exato do checkout. Se o preço do produto sofrer inflação no futuro, as vendas do passado permanecem intactas, evitando fraudes contábeis.
- **Transações SQL (ACID):** Durante o checkout, o sistema executa múltiplos comandos (`INSERT` na venda, `INSERT` nos itens, `UPDATE` no estoque). O uso de transações (`BEGIN`, `COMMIT`, `ROLLBACK`) garante que o banco de dados nunca ficará inconsistente caso haja uma queda de energia ou erro no meio do processo.
- **Segurança e RBAC:** Middlewares verificam não apenas a validade criptográfica do Token JWT, mas também a hierarquia da conta (`perfil`), bloqueando acessos indevidos antes mesmo que a rota seja executada.

 *Desenvolvido para fins acadêmicos e práticas avançadas de arquitetura de software.*
