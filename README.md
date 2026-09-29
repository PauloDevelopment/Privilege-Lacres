# Privilege Lacres

Sistema de gestão empresarial em Flask + SQLAlchemy + MySQL, com cadastro de empresas, pedidos e produtos, dashboard interativo e um assistente de IA (Gemini) para consultas rápidas.

## 👥 Integrantes do Projeto

- **Paulo Henrique Pires Cordeiro** — 2402602  
- **Ronaldo Filgueira Cavalcante** — 2403661  
- **Maycon Pereira Ribeiro** — 2402929  
- **Luis Gabriel de Jesus Barbosa** — 2402947  
- **Gustavo Meirelles Festa** — 2403079

## 🚀 Visão Geral

- Backend: Flask (API REST) com autenticação JWT
- ORM: SQLAlchemy
- Banco de dados: MySQL (via docker-compose)
- Frontend: HTML/CSS/JS (Bootstrap e Chart.js) em `view/`
- Assistente de IA: Google Gemini (camada gratuita) via `controller/chat_controller.py`

## 📦 Funcionalidades

- CRUD de empresas, pedidos, produtos e usuários
- Validações de telefone e CNPJ
- Login com JWT e telas protegidas
- Dashboard interativo com indicadores e gráficos (`/dashboard-view`)
- Chat com IA integrado ao dashboard
- Mensagens JSON de sucesso/erro

### Empresas (`/empresas`)

- Listar empresas (`GET /empresas/`)
- Buscar empresa por ID (`GET /empresas/<id>`)
- Buscar empresas (`GET /empresas/buscar`)
- Listar pedidos da empresa (`GET /empresas/<id>/pedidos`)
- Cadastrar empresa (`POST /empresas/`)
- Atualizar empresa (`PUT /empresas/<id>`)
- Deletar empresa (`DELETE /empresas/<id>`)
- Tela: `http://localhost:5000/empresas-view`

### Pedidos (`/pedidos`)

- Listar pedidos (`GET /pedidos/`)
- Buscar pedido por ID (`GET /pedidos/<id>`)
- Cadastrar pedido (`POST /pedidos/`)
- Atualizar pedido (`PUT /pedidos/<id>`)
- Deletar pedido (`DELETE /pedidos/<id>`)
- Tela: `http://localhost:5000/pedidos-view`

### Produtos (`/produtos`)

- Listar produtos (`GET /produtos/`)
- Buscar produto por ID (`GET /produtos/<id>`)
- Buscar produtos por nome (`GET /produtos/buscar?q=...`)
- Cadastrar produto (`POST /produtos/`)
- Atualizar produto (`PUT /produtos/<id>`)
- Deletar produto (`DELETE /produtos/<id>`)
- Tela: `http://localhost:5000/produtos-view`

Os pedidos continuam armazenando o nome e o valor do produto no item, preservando os pedidos já existentes. A tela de pedidos usa o cadastro de produtos como autocomplete e preenche automaticamente o valor do milheiro quando o nome selecionado existir no catálogo.

### Usuários (`/usuarios`)

- Login (`POST /usuarios/login`)
- Perfil do usuário logado (`GET/PUT /usuarios/me`)
- CRUD de usuários (`/usuarios/`, `/usuarios/<id>`)
- Tela: `http://localhost:5000/usuarios-view`

## 🤖 Assistente de IA

O botão flutuante no dashboard abre um chat que consulta o banco de dados usando *function calling* do Gemini. A rota é `POST /chat/` e exige o token JWT.

### O que o chat consegue responder

| Assunto | Exemplos de pergunta |
|---|---|
| Resumo de pedidos | "Quantos pedidos temos?", "Quantos estão pendentes?" |
| Faturamento por empresa | "Qual o faturamento da empresa X?", "Quanto a X já comprou?" |
| Faturamento do mês | "Qual o faturamento deste mês?", "Quanto faturamos em agosto?", "Faturamento de março de 2026" |
| Consulta de pedido por número | "Me mostre o pedido 1234", "Qual o status do pedido 1234?", "Quais os itens do pedido 1234?" |

Regras de cálculo:

- Faturamento considera apenas pedidos com status **Concluído**.
- O faturamento do mês usa a **data do pedido** e o fuso `America/Sao_Paulo`. Sem mês/ano informados, usa o mês atual.
- A busca de empresa é por parte da razão social e retorna a primeira encontrada.
- A consulta por número retorna empresa, status, datas, NF, itens e total dos itens (até 5 pedidos, caso o número se repita).

### O que o chat ainda não responde

Pedidos "Em Produção" e outros status, faturamento por período livre, produtos (preços e cadastro), dados cadastrais de empresas, ranking de clientes e usuários do sistema. Nesses casos ele informa que não tem a informação.

### Como adicionar novas capacidades

Crie uma função Python com type hints e docstring clara em `controller/chat_controller.py` e inclua na lista `FERRAMENTAS`. A IA decide sozinha quando chamá-la.

### Camada gratuita

- A chave é gratuita, sem cartão, em [Google AI Studio](https://aistudio.google.com/apikey).
- A cota diária depende do modelo e pode mudar; confira o limite do seu projeto no AI Studio. Modelos Flash-Lite costumam ter cota maior. Troque o modelo com `GEMINI_MODEL`.
- Na camada gratuita, o Google pode usar as requisições para melhorar seus produtos. Considere isso ao enviar dados de clientes.

## 🏗️ Arquitetura do Projeto

Projeto MVC (Model-View-Controller):

- Model: `model/` (`empresa.py`, `pedidos.py`, `itens_pedido.py`, `produto.py`, `usuario.py`)
- View: `view/` (páginas HTML) e `view/static/` (CSS e JS)
- Controller: `controller/` (`empresa_controller.py`, `pedido_controller.py`, `produto_controller.py`, `usuario_controller.py`, `chat_controller.py`)
- Configuração e inicialização: `app.py`, `db.py`, `seed.py`
- Infra: `docker-compose.yml`, `Dockerfile`

## 🛠️ Requisitos

- Python 3.9+
- Docker + docker-compose (recomendado)
- Dependências Python em `requirements.txt`

## 🐳 Executando com Docker

1. Clonar o repositório
2. Criar o arquivo `.env` (veja a seção abaixo)
3. Subir os containers:

```bash
docker compose up -d --build
```

4. Acessar:

- Aplicação e login: `http://localhost:5000/`
- Dashboard: `http://localhost:5000/dashboard-view`

Comandos úteis:

```bash
docker compose logs -f web                 # acompanhar logs
docker compose down                        # derrubar containers (mantém o banco)
docker compose down -v                     # derrubar e APAGAR o banco
docker compose up -d --force-recreate      # reiniciar após mudar só o .env
```

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

Variável obrigatória para o chat de IA:

```env
GEMINI_API_KEY=cole-sua-chave-do-google-ai-studio
```

Opcional:

```env
GEMINI_MODEL=gemini-3.8-flash
```

A conexão MySQL já possui valores padrão compatíveis com o `docker-compose.yml`, mas também pode ser configurada no `.env` por `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.

Para gerar uma chave JWT aleatória:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Em produção (ex.: Railway), cadastre as mesmas variáveis no painel do serviço.

A aplicação fica em `http://localhost:5000`. O MySQL fica exposto na máquina host pela porta `3307`.