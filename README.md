# 🛍️ MS² Vestuário — Sistema de Gestão e Frente de Caixa (PDV)

> **Guia Didático e Documentação Técnica de Instalação e Arquitetura**
>
> *Material elaborado com foco em boas práticas de Full Stack, separação de responsabilidades, segurança (RBAC) e integridade transacional.*

## 📑 Sumário

1. [Visão Geral e Contexto do Projeto](#1-visão-geral-e-contexto-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Repositórios Oficiais](#3-repositórios-oficiais)
4. [Preparação do Ambiente de Desenvolvimento](#4-preparação-do-ambiente-de-desenvolvimento)
5. [Passo a Passo: Backend (API)](#5-passo-a-passo-backend-api)
   - [Configuração do Banco de Dados MySQL](#configuração-do-banco-de-dados-mysql)
   - [Instalação e Arquivo ](#instalação-e-arquivo-env)[`.env`](#instalação-e-arquivo-env)
   - [Inicialização e Teste da API](#inicialização-e-teste-da-api)
6. [Passo a Passo: Frontend (Interface Web)](#6-passo-a-passo-frontend-interface-web)
   - [Instalação e Variáveis de Conexão](#instalação-e-variáveis-de-conexão)
   - [Execução e Portas de Acesso](#execução-e-portas-de-acesso)
7. [Guia de Exploração Didática e Roteiro de Testes](#7-guia-de-exploração-didática-e-roteiro-de-testes)
8. [Pontos Críticos de Aprendizado Técnico](#8-pontos-críticos-de-aprendizado-técnico)

## 1. Visão Geral e Contexto do Projeto

O **MS² Vestuário** é uma aplicação Full Stack projetada para digitalizar e otimizar a operação de uma loja de roupas em expansão. O sistema substitui o controle manual (cadernos e calculadoras) por uma plataforma ágil e segura.

O software oferece:

- **Frente de Caixa (PDV):** Registro rápido de vendas com cálculo automático de subtotais, descontos e troco.
- **Catálogo Dinâmico:** Gestão de produtos e controle de estoque integrado, impedindo vendas de itens esgotados.
- **Controle de Clientes:** Base de dados centralizada com validação de CPF para fidelização e histórico de compras.
- **Hierarquia de Acessos (RBAC):** Proteção de rotas baseada em perfis (`CAIXA`, `SUPERVISOR`, `GERENTE`). Cancelamentos e descontos altos exigem autorização superior.

```
flowchart LR
    subgraph Frontend["Front-end (Vite + React)"]
        UI[Interface PDV]
        State[Gerenciador de Carrinho]
        Fetch[HTTP Fetch / Bearer Token]
    end

    subgraph Backend["Back-end (Node.js + Express)"]
        Router[Roteamento /api]
        Auth[Middleware JWT & Roles]
        Controllers[Venda Controller]
        Models[Transações ACID]
    end

    subgraph Database["Banco de Dados Relacional"]
        MySQL[(MySQL 8.x: ms2_vestuario)]
    end

    UI --> State --> Fetch
    Fetch -- "JSON / REST (HTTP :3000)" --> Router
    Router --> Auth --> Controllers --> Models
    Models --> MySQL

```

## 2. Stack Tecnológica

| Camada       | Tecnologia             | Versão         | Função Principal                                                        |
| ------------ | ---------------------- | -------------- | ----------------------------------------------------------------------- |
| **Backend**  | **Node.js**            | `>= 20.x`      | Ambiente de execução JavaScript server-side.                            |
| **Backend**  | **Express**            | `^5.x`         | Framework HTTP para criação de rotas, middlewares e APIs REST.          |
| **Backend**  | **TypeScript**         | `^5.x`         | Tipagem estática, reduzindo bugs em tempo de desenvolvimento.           |
| **Backend**  | **MySQL2 (Promise)**   | `^3.x`         | Driver de alta performance com suporte a Transações e Pool de Conexões. |
| **Backend**  | **bcrypt**             | `^6.x`         | Algoritmo criptográfico para hashing seguro de senhas.                  |
| **Backend**  | **jsonwebtoken (JWT)** | `^9.x`         | Autenticação stateless e controle de permissões de rota.                |
| **Frontend** | **React**              | `^18.x / 19.x` | Biblioteca componentizada para interfaces de usuário.                   |
| **Frontend** | **Vite**               | `^5.x`         | Build tool e servidor de desenvolvimento ultra-rápido.                  |
| **Frontend** | **Tailwind CSS**       | `^3.x / 4.x`   | Framework de estilização utilitária moderna e responsiva.               |
| **Frontend** | **React Router DOM**   | `^6.x / 7.x`   | Roteamento dinâmico e proteção de telas no lado do cliente.             |
| **Database** | **MySQL**              | `^8.x`         | Banco de dados relacional com integridade referencial.                  |

## 3. Repositórios Oficiais

*Caso o projeto esteja dividido em pastas, navegue conforme a estrutura local ou clone o repositório unificado:*

- 🔗 **Repositório Unificado:** `https://github.com/AngolanoDaIQoption/PDV_Senai`

> 💡 *Estrutura:*
>
> - `back-end/` (API Node.js + Express + TypeScript)
> - `front-end/` (Interface React + Vite + Tailwind)

## 4. Preparação do Ambiente de Desenvolvimento

Certifique-se de que sua máquina possui:

1. **Node.js**: Versão **20 LTS** ou superior (`node -v`).
2. **NPM**: Instalado junto com o Node (`npm -v`).
3. **MySQL Server**: Versão **8.0** ou superior rodando localmente.

## 5. Passo a Passo: Backend (API)

### Configuração do Banco de Dados MySQL

Abra seu cliente MySQL (Workbench, DBeaver ou extensão do VS Code) e execute o script DDL oficial abaixo para criar o esquema `ms2_vestuario` e suas entidades relacionais:

```
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema ms2_vestuario
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `ms2_vestuario` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `ms2_vestuario` ;

-- -----------------------------------------------------
-- Table `ms2_vestuario`.`clientes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ms2_vestuario`.`clientes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `cpf` CHAR(11) NOT NULL,
  `telefone` VARCHAR(20) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `cpf` (`cpf` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `ms2_vestuario`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ms2_vestuario`.`usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `perfil` VARCHAR(20) NOT NULL,
  `ativo` TINYINT(1) NOT NULL DEFAULT '1',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `ms2_vestuario`.`vendas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ms2_vestuario`.`vendas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cliente_id` INT NULL DEFAULT NULL,
  `usuario_id` INT NOT NULL,
  `autorizado_por` INT NULL DEFAULT NULL,
  `valor_subtotal` DECIMAL(10,2) NOT NULL,
  `percentual_desconto` DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `valor_desconto` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `valor_total` DECIMAL(10,2) NOT NULL,
  `forma_pagamento` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'FINALIZADA',
  `motivo_cancelamento` TEXT NULL DEFAULT NULL,
  `cancelado_por` INT NULL DEFAULT NULL,
  `cancelado_em` DATETIME NULL DEFAULT NULL,
  `data_venda` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `cliente_id` (`cliente_id` ASC) VISIBLE,
  INDEX `usuario_id` (`usuario_id` ASC) VISIBLE,
  INDEX `autorizado_por` (`autorizado_por` ASC) VISIBLE,
  INDEX `cancelado_por` (`cancelado_por` ASC) VISIBLE,
  CONSTRAINT `vendas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `ms2_vestuario`.`clientes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `vendas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `ms2_vestuario`.`usuarios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `vendas_ibfk_3` FOREIGN KEY (`autorizado_por`) REFERENCES `ms2_vestuario`.`usuarios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `vendas_ibfk_4` FOREIGN KEY (`cancelado_por`) REFERENCES `ms2_vestuario`.`usuarios` (`id`) ON DELETE RESTRICT)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `ms2_vestuario`.`produtos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ms2_vestuario`.`produtos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo_barras` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(150) NOT NULL,
  `preco` DECIMAL(10,2) NOT NULL,
  `estoque` INT NOT NULL,
  `ativo` TINYINT(1) NOT NULL DEFAULT '1',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `codigo_barras` (`codigo_barras` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `ms2_vestuario`.`itens_venda`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ms2_vestuario`.`itens_venda` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `venda_id` INT NOT NULL,
  `produto_id` INT NOT NULL,
  `quantidade` INT NOT NULL,
  `preco_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unq_venda_produto` (`venda_id` ASC, `produto_id` ASC) VISIBLE,
  INDEX `produto_id` (`produto_id` ASC) VISIBLE,
  CONSTRAINT `itens_venda_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `ms2_vestuario`.`vendas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `itens_venda_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `ms2_vestuario`.`produtos` (`id`) ON DELETE RESTRICT)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

```

### Instalação e Arquivo `.env`

1. Pelo terminal, navegue até a pasta da API:

   Bash
```
cd back-end

```
2. Instale as dependências:

   Bash
```
npm install

```
3. Crie um arquivo `.env` na raiz da pasta `back-end`:

   Snippet de código
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_PORT=3306
DB_NAME=ms2_vestuario
JWT_SECRET=chave_secreta_pdv_2026

```

### Inicialização e Teste da API

Inicie o servidor de desenvolvimento:

```
npm run dev

```

Se a porta `3000` estiver ocupada, libere-a com `npx kill-port 3000` antes de rodar o comando.

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

👨‍💻 *Desenvolvido para fins acadêmicos e práticas avançadas de arquitetura de software.*
