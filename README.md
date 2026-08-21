# Privilege Lacres

Aplicação CRUD de empresas (gestão de cadastro) em Flask + SQLAlchemy + MySQL.

## 👥 Integrantes do Projeto

- **Paulo Henrique Pires Cordeiro** — 2402602  
- **Ronaldo Filgueira Cavalcante** — 2403661  
- **Maycon Pereira Ribeiro** — 2402929  
- **Luis Gabriel de Jesus Barbosa** — 2402947  
- **Gustavo Meirelles Festa** — 2403079

## 🚀 Visão Geral

- Backend: Flask (API REST)
- ORM: SQLAlchemy
- Banco de dados: MySQL (via docker-compose)
- Frontend simples: HTML/CSS/JS (em `view/empresa.html`)
- Rotas de API para empresas em `controller/empresa_controller.py`
- Modelo Empresa em `model/empresa.py`

## 📦 Funcionalidades

- Listar empresas (`GET /empresas/`)
- Buscar empresa por ID (`GET /empresas/<id>`)
- Cadastrar empresa (`POST /empresas/`)
- Atualizar empresa (`PUT /empresas/<id>`)
- Deletar empresa (`DELETE /empresas/<id>`)
- Validações de telefone e CNPJ
- Mensagens JSON de sucesso/erro
> Em breve: gestão de cadastro de pedidos e dashboard de indicadores do sistema.

## 🏗️ Arquitetura do Projeto

Projeto MVC (Model-View-Controller):
- Model: `model/empresa.py`
- View: `view/empresa.html`, `view/css`, `view/js`
- Controller: `controller/empresa_controller.py`
- Configuração e inicialização: `app.py`, `db.py`
- Infra: `docker-compose.yml`, `Dockerfile`

## 🛠️ Requisitos

- Python 3.9+
- Docker + docker-compose (recomendado)
- Dependências Python em `requirements.txt`

## 🐳 Executando com Docker

1. Clonar o repositório
2. Subir os containers:

```bash
docker-compose up -d --build
```

3. Acessar:

- API: `http://localhost:5000/`
- Frontend: `http://localhost:5000/`


## 📦 CRUD de Produtos

O projeto também possui gestão de produtos:

- Listar produtos (`GET /produtos/`)
- Buscar produto por ID (`GET /produtos/<id>`)
- Buscar produtos por nome (`GET /produtos/buscar?q=...`)
- Cadastrar produto (`POST /produtos/`)
- Atualizar produto (`PUT /produtos/<id>`)
- Deletar produto (`DELETE /produtos/<id>`)
- Tela: `http://localhost:5000/produtos-view`

Os pedidos continuam armazenando o nome e o valor do produto no item, preservando os pedidos já existentes. A tela de pedidos usa o cadastro de produtos como autocomplete e preenche automaticamente o valor do milheiro quando o nome selecionado existir no catálogo.

## 🔐 Variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Variáveis obrigatórias para a aplicação/seed:

```env
JWT_SECRET_KEY=troque-por-uma-chave-segura-e-aleatoria
EMAIL=admin@email.com
PASSWORD=troque-esta-senha
```

A conexão MySQL já possui valores padrão compatíveis com o `docker-compose.yml`, mas também pode ser configurada no `.env` por `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.

Para gerar uma chave JWT aleatória:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Depois, suba o projeto:

```bash
docker compose up -d --build
```

A aplicação fica em `http://localhost:5000`. O MySQL fica exposto na máquina host pela porta `3307`.
