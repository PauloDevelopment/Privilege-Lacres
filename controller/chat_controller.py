import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import google.generativeai as genai
from sqlalchemy.exc import SQLAlchemyError
from db import db
from model.pedidos import Pedido
from model.empresa import Empresa

chat_bp = Blueprint('chat_bp', __name__)

# Configura a IA
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ==========================================
# 1. FERRAMENTAS PARA A IA (FUNCTION CALLING)
# ==========================================
def buscar_resumo_pedidos():
    """Retorna a quantidade total de pedidos e o status geral."""
    total = db.session.query(Pedido).count()
    pendentes = db.session.query(Pedido).filter_by(status='Pendente').count()
    return f"Temos {total} pedidos no total, sendo {pendentes} pendentes."

def buscar_faturamento_empresa(nome_empresa: str):
    """Busca o faturamento total de pedidos concluídos de uma empresa específica."""
    empresa = db.session.query(Empresa).filter(Empresa.razao_social.ilike(f'%{nome_empresa}%')).first()
    if not empresa:
        return f"A empresa {nome_empresa} não foi encontrada no banco de dados."
    
    total = sum(p.soma_total for p in empresa.pedidos if p.status == 'Concluído')
    return f"A empresa {empresa.razao_social} tem um faturamento de R$ {total:.2f} em pedidos concluídos."

# ==========================================
# 2. CONFIGURAÇÃO DO MODELO
# ==========================================
model = genai.GenerativeModel(
    model_name='gemini-1.5-flash',
    tools=[buscar_resumo_pedidos, buscar_faturamento_empresa],
    system_instruction="Você é o copiloto de IA do ERP Privilege Lacres. Responda de forma curta e profissional. Use as ferramentas disponíveis para consultar o banco de dados."
)

# Rota para receber mensagens do Frontend
@chat_bp.route('/', methods=['POST'])
@jwt_required()
def enviar_mensagem():
    data = request.json
    mensagem_usuario = data.get('message', '')

    if not mensagem_usuario:
        return jsonify({'error': 'Mensagem vazia!'}), 400

    try:
        # Inicia o chat permitindo que a IA execute as funções SQLAlchemy sozinhas
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(mensagem_usuario)
        
        return jsonify({'response': response.text}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500