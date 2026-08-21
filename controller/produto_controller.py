from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from model.produto import Produto
from datetime import datetime
from db import db
from flask_jwt_extended import jwt_required
import pytz


produto_bp = Blueprint('produto_bp', __name__)


def _valor_milheiro(valor):
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        return None
    return numero if numero >= 0 else None


@produto_bp.route('/', methods=['GET'])
@jwt_required()
def listar_produtos():
    produtos = db.session.query(Produto).order_by(Produto.nome.asc()).all()
    return jsonify([produto.to_dict() for produto in produtos]), 200


@produto_bp.route('/<int:id_produto>', methods=['GET'])
@jwt_required()
def listar_produto(id_produto):
    try:
        produto = db.session.query(Produto).filter_by(id_produto=id_produto).first()
        if not produto:
            return jsonify({'error': 'Produto não encontrado!'}), 404
        return jsonify({'produto': produto.to_dict()}), 200
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao buscar produto no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500


@produto_bp.route('/', methods=['POST'])
@jwt_required()
def criar_produto():
    data = request.json or {}
    nome = (data.get('nome') or '').strip()
    valor = _valor_milheiro(data.get('valor_milheiro'))

    if not nome:
        return jsonify({'error': 'nome é obrigatório!'}), 400

    if valor is None:
        return jsonify({'error': 'valor_milheiro deve ser um número maior ou igual a zero!'}), 400

    try:
        produto_existente = db.session.query(Produto).filter(Produto.nome == nome).first()
        if produto_existente:
            return jsonify({'error': 'Produto já cadastrado!'}), 400

        novo_produto = Produto(
            nome=nome,
            valor_milheiro=valor,
            descricao=(data.get('descricao') or '').strip(),
            data_cadastro=datetime.now(pytz.timezone('America/Sao_Paulo'))
        )

        db.session.add(novo_produto)
        db.session.commit()

        return jsonify({
            'message': 'Produto criado com sucesso!',
            'produto': novo_produto.to_dict()
        }), 201

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar produto no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500


@produto_bp.route('/<int:id_produto>', methods=['PUT'])
@jwt_required()
def atualizar_produto(id_produto):
    data = request.json or {}

    try:
        produto = db.session.query(Produto).filter_by(id_produto=id_produto).first()
        if not produto:
            return jsonify({'error': 'Produto não encontrado!'}), 404

        nome = (data.get('nome', produto.nome) or '').strip()
        valor = _valor_milheiro(data.get('valor_milheiro', produto.valor_milheiro))

        if not nome:
            return jsonify({'error': 'nome é obrigatório!'}), 400

        if valor is None:
            return jsonify({'error': 'valor_milheiro deve ser um número maior ou igual a zero!'}), 400

        produto_existente = db.session.query(Produto).filter(Produto.nome == nome).first()
        if produto_existente and produto_existente.id_produto != id_produto:
            return jsonify({'error': 'Produto já cadastrado!'}), 400

        produto.nome = nome
        produto.valor_milheiro = valor
        produto.descricao = (data.get('descricao', produto.descricao) or '').strip()

        db.session.commit()

        return jsonify({
            'message': 'Produto atualizado com sucesso!',
            'produto': produto.to_dict()
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao editar produto no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500


@produto_bp.route('/<int:id_produto>', methods=['DELETE'])
@jwt_required()
def deletar_produto(id_produto):
    try:
        produto = db.session.query(Produto).filter_by(id_produto=id_produto).first()
        if not produto:
            return jsonify({'error': 'Produto não encontrado!'}), 404

        db.session.delete(produto)
        db.session.commit()
        return jsonify({'message': 'Produto deletado com sucesso!'}), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao deletar produto no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500


@produto_bp.route('/buscar', methods=['GET'])
@jwt_required()
def buscar_produtos():
    termo = request.args.get('q', '').strip()

    try:
        query = db.session.query(Produto)
        if termo:
            query = query.filter(Produto.nome.ilike(f'%{termo}%'))

        produtos = query.order_by(Produto.nome.asc()).all()
        return jsonify([produto.to_dict() for produto in produtos]), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao buscar produtos.'}), 500
