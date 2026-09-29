import os
import time
from datetime import date, datetime

import pytz
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required
from google import genai
from google.genai import types, errors

from db import db
from model.pedidos import Pedido
from model.empresa import Empresa

chat_bp = Blueprint('chat_bp', __name__)

# Modelo principal + reservas (usadas quando o Google responde 500/503).
# Pode trocar o principal com GEMINI_MODEL e as reservas com GEMINI_FALLBACK_MODELS (separadas por vírgula).
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_MODELS = [
    m.strip() for m in
    os.getenv("GEMINI_FALLBACK_MODELS", "gemini-3.5-flash-lite,gemini-3.1-flash-lite").split(",")
    if m.strip()
]
FUSO = pytz.timezone("America/Sao_Paulo")
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
         "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

_client = None


def get_client():
    """Cria o cliente na primeira requisição (o .env já foi carregado)."""
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY não definida")
        _client = genai.Client(api_key=key)
    return _client


def _fmt_data(d):
    return d.strftime("%d/%m/%Y") if d else "não informada"


def _brl(valor):
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


# ==========================================
# FERRAMENTAS DA IA (FUNCTION CALLING)
# ==========================================
def buscar_resumo_pedidos() -> str:
    """Retorna a quantidade total de pedidos e quantos estão pendentes."""
    total = db.session.query(Pedido).count()
    pendentes = db.session.query(Pedido).filter_by(status='Pendente').count()
    return f"Temos {total} pedidos no total, sendo {pendentes} pendentes."


def buscar_faturamento_empresa(nome_empresa: str) -> str:
    """Busca o faturamento total de pedidos concluídos de uma empresa pelo nome (razão social)."""
    empresa = db.session.query(Empresa).filter(
        Empresa.razao_social.ilike(f'%{nome_empresa}%')).first()
    if not empresa:
        return f"A empresa {nome_empresa} não foi encontrada no banco de dados."

    total = sum(p.soma_total for p in empresa.pedidos if p.status == 'Concluído')
    return f"A empresa {empresa.razao_social} tem um faturamento de {_brl(total)} em pedidos concluídos."


def buscar_faturamento_mes(mes: int = 0, ano: int = 0) -> str:
    """Retorna o faturamento total (soma dos pedidos concluídos) de um mês.
    Use mes de 1 a 12 e ano com 4 dígitos. Se o usuário não informar, use 0 para o mês e o ano atuais."""
    hoje = datetime.now(FUSO).date()
    mes = mes or hoje.month
    ano = ano or hoje.year

    if not 1 <= mes <= 12 or not 2000 <= ano <= 2100:
        return "Mês ou ano inválido."

    inicio = date(ano, mes, 1)
    fim = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)

    pedidos = db.session.query(Pedido).filter(
        Pedido.status == 'Concluído',
        Pedido.data >= inicio,
        Pedido.data < fim,
    ).all()

    total = sum(p.soma_total for p in pedidos)
    return (f"Em {MESES[mes - 1]} de {ano}, o faturamento foi de {_brl(total)} "
            f"em {len(pedidos)} pedido(s) concluído(s).")


def buscar_pedido_por_numero(numero_pedido: str) -> str:
    """Consulta um pedido pelo número do pedido e retorna empresa, datas, nota fiscal, status, itens e valor total."""
    numero = str(numero_pedido).strip()
    if not numero:
        return "Informe o número do pedido."

    pedidos = db.session.query(Pedido).filter(Pedido.numero_pedido == numero).limit(5).all()
    if not pedidos:
        return f"Nenhum pedido com o número {numero} foi encontrado."

    respostas = []
    for p in pedidos:
        itens = "; ".join(
            f"{i.produto} ({i.quantidade:g} milheiros x {_brl(i.valor_milheiro)})"
            for i in p.itens
        ) or "sem itens"
        respostas.append(
            f"Pedido {p.numero_pedido} - empresa: {p.empresa.razao_social if p.empresa else 'não informada'}; "
            f"status: {p.status or 'não informado'}; data: {_fmt_data(p.data)}; "
            f"entrega: {_fmt_data(p.data_entrega)}; vencimento: {_fmt_data(p.vencimento)}; "
            f"NF: {p.nf or 'não informada'}; total dos itens: {_brl(p.soma_total)}; itens: {itens}."
        )
    return "\n".join(respostas)


SYSTEM = (
    "Você é o copiloto de IA do ERP Privilege Lacres. Responda em português, de forma curta e "
    "profissional. Use as ferramentas para consultar o banco de dados. Se nenhuma ferramenta "
    "cobrir a pergunta, diga que não tem essa informação. Nunca invente dados."
)

FERRAMENTAS = [
    buscar_resumo_pedidos,
    buscar_faturamento_empresa,
    buscar_faturamento_mes,
    buscar_pedido_por_numero,
]


@chat_bp.route('/', methods=['POST'])
@jwt_required()
def enviar_mensagem():
    data = request.get_json(silent=True) or {}
    mensagem = (data.get('message') or '').strip()

    if not mensagem:
        return jsonify({'error': 'Mensagem vazia!'}), 400
    if len(mensagem) > 1000:
        return jsonify({'error': 'Mensagem muito longa.'}), 400

    config = types.GenerateContentConfig(system_instruction=SYSTEM, tools=FERRAMENTAS)
    modelos = [MODEL_NAME] + [m for m in FALLBACK_MODELS if m != MODEL_NAME]
    ultimo_erro = None

    try:
        for modelo in modelos:
            for tentativa in range(2):
                try:
                    response = get_client().models.generate_content(
                        model=modelo, contents=mensagem, config=config)
                    return jsonify({'response': response.text or 'Sem resposta.'}), 200
                except errors.APIError as e:
                    ultimo_erro = e
                    current_app.logger.warning(
                        "Gemini %s falhou (tentativa %d): %s", modelo, tentativa + 1, e)
                    if e.code in (500, 503):
                        time.sleep(1.5)      # instabilidade: tenta de novo e depois o próximo modelo
                        continue
                    if e.code in (404, 429):
                        break                # modelo inexistente ou sem cota: vai para o próximo
                    raise                    # 400/403 etc.: não adianta insistir

        # Nenhum modelo respondeu
        if ultimo_erro is not None and ultimo_erro.code == 429:
            return jsonify({'error': 'Limite gratuito da IA atingido. Tente mais tarde.'}), 429
        return jsonify({'error': 'A IA está sobrecarregada no momento. Tente novamente em instantes.'}), 503

    except errors.APIError as e:
        current_app.logger.error("Gemini API error: %s", e)
        return jsonify({'error': 'A IA está indisponível no momento.'}), 502
    except Exception:
        current_app.logger.exception("Erro no chat")
        return jsonify({'error': 'Erro interno no chat.'}), 500