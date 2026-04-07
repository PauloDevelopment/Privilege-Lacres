from flask import Blueprint, jsonify, render_template, request
from sqlalchemy.exc import SQLAlchemyError
from model.pedidos import Pedido
from model.itens_pedido import ItemPedido
from db import db
from datetime import datetime
from flask_jwt_extended import jwt_required

pedido_bp = Blueprint('pedido_bp', __name__)

def parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date() if value else None
    except ValueError:
        return None
    
@pedido_bp.route('/', methods=['POST'])
@jwt_required()
def criar_pedido():
    data = request.json

    itens = data.get('itens')

    if not itens or len(itens) == 0:
        return jsonify({'error': 'Pedido deve conter ao menos 1 item!'}), 400

    try:
        novo_pedido = Pedido(
            numero_pedido=data.get('numero_pedido'),
            nf=data.get('nf'),
            total_nf=float(data.get('total_nf')) if data.get('total_nf') else None,
            vencimento=parse_date(data.get('vencimento')),
            data_entrega=parse_date(data.get('data_entrega')),
            status=data.get('status'),
            id_empresa=int(data.get('id_empresa')),
            data=parse_date(data.get('data'))  
        )

        db.session.add(novo_pedido)
        db.session.flush()

        for item in itens:
            if item.get('produto') is None or item.get('quantidade') is None or item.get('valor_milheiro') is None:
                return jsonify({'error': 'Item incompleto!'}), 400

            novo_item = ItemPedido(
                pedido_id=novo_pedido.pedido_id,
                produto=item.get('produto'),
                quantidade=float(item.get('quantidade')),
                valor_milheiro=float(item.get('valor_milheiro'))
            )

            db.session.add(novo_item)

        db.session.commit()

        return jsonify({
            'message': 'Pedido criado com sucesso!',
            'pedido': novo_pedido.to_dict()  
        }), 201

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar pedido.'}), 500

    except Exception as e:
        return jsonify({'error': f'Erro inesperado: {str(e)}'}), 500
    
@pedido_bp.route('/<int:pedido_id>', methods=['PUT'])
@jwt_required()
def atualizar_pedido(pedido_id):
    data = request.json

    try:
        pedido = db.session.query(Pedido).filter_by(pedido_id=pedido_id).first()

        if not pedido:
            return jsonify({'error': 'Pedido não encontrado!'}), 404

      
        pedido.numero_pedido = data.get('numero_pedido')
        pedido.nf = data.get('nf')
        pedido.total_nf = float(data.get('total_nf')) if data.get('total_nf') else None
        pedido.vencimento = parse_date(data.get('vencimento'))
        pedido.data_entrega = parse_date(data.get('data_entrega'))
        pedido.status = data.get('status')
        pedido.id_empresa = int(data.get('id_empresa'))
        pedido.data = parse_date(data.get('data'))

    
        pedido.itens.clear()

     
        itens = data.get('itens', [])

        if not itens or len(itens) == 0:
            return jsonify({'error': 'Pedido deve conter ao menos 1 item!'}), 400

        for item in itens:
            if item.get('produto') is None or item.get('quantidade') is None or item.get('valor_milheiro') is None:
                return jsonify({'error': 'Item incompleto!'}), 400

            novo_item = ItemPedido(
                produto=item.get('produto'),
                quantidade=float(item.get('quantidade')),
                valor_milheiro=float(item.get('valor_milheiro'))
            )

            pedido.itens.append(novo_item)

        db.session.commit()

        return jsonify({
            'message': 'Pedido atualizado com sucesso!',
            'pedido': pedido.to_dict()
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao atualizar pedido.'}), 500

    except Exception as e:
        return jsonify({'error': f'Erro inesperado: {str(e)}'}), 500


@pedido_bp.route('/<int:pedido_id>', methods=['GET'])
@jwt_required()
def buscar_pedido(pedido_id):
    try:
        pedido = db.session.query(Pedido).filter_by(pedido_id=pedido_id).first()

        if not pedido:
            return jsonify({'error': 'Pedido não encontrado!'}), 404

        return jsonify(pedido.to_dict()), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao buscar pedido.'}), 500


@pedido_bp.route('/', methods=['GET'])
@jwt_required()
def listar_pedidos():
    pedidos = db.session.query(Pedido).all()

    return jsonify([
        {
            'pedido_id': p.pedido_id,
            'numero_pedido': p.numero_pedido,
            'id_empresa': p.id_empresa,
            'data': p.data.strftime("%d/%m/%Y") if p.data else None,
            'status': p.status,
            'total': p.soma_total
        }
        for p in pedidos
    ]), 200


@pedido_bp.route('/<int:id_pedido>', methods=['DELETE'])
@jwt_required()
def deletar_pedido(id_pedido):
    try:
        pedido = db.session.query(Pedido).filter_by(pedido_id=id_pedido).first()

        if not pedido:
            return jsonify({'error': 'Pedido não encontrado!'}), 404

        db.session.delete(pedido)
        db.session.commit()

        return jsonify({'message': 'Pedido deletado com sucesso!'}), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao deletar pedido.'}), 500