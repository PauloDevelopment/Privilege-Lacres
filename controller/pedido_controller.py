from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from model.pedido import Pedido
from model.item_pedido import ItemPedido
from datetime import datetime
from db import db

pedido_bp = Blueprint('pedido_bp', __name__)



@pedido_bp.route('/', methods=['POST'])
def criar_pedido():
    data = request.json
    itens = data.get('itens')

    if not itens or len(itens) == 0:
        return jsonify({'error': 'Pedido deve conter ao menos 1 item!'}), 400

    try:
        novo_pedido = Pedido(
            data=datetime.now(),
            valor_total=0
        )

        db.session.add(novo_pedido)
        db.session.flush()

        valor_total_pedido = 0

        for item in itens:
            if not item.get('descricao') or not item.get('quantidade') or not item.get('valor_mil'):
                return jsonify({'error': 'Item incompleto!'}), 400

            quantidade = float(item.get('quantidade'))
            valor_mil = float(item.get('valor_mil'))

            
            valor_unitario = valor_mil / 1000
            valor_total_item = quantidade * valor_unitario

            novo_item = ItemPedido(
                pedido_id=novo_pedido.id_pedido,
                descricao=item.get('descricao'),
                quantidade=quantidade,
                valor_mil=valor_mil,
                valor_unitario=round(valor_unitario, 6),
                valor_total=round(valor_total_item, 2)
            )

            valor_total_pedido += valor_total_item
            db.session.add(novo_item)

        
        novo_pedido.valor_total = round(valor_total_pedido, 2)

        db.session.commit()

        return jsonify({
            'message': 'Pedido criado com sucesso!',
            'id_pedido': novo_pedido.id_pedido,
            'valor_total': novo_pedido.valor_total
        }), 201

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar pedido.'}), 500

    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500



@pedido_bp.route('/<int:id_pedido>', methods=['GET'])
def buscar_pedido(id_pedido):
    try:
        pedido = db.session.query(Pedido).filter_by(id_pedido=id_pedido).first()

        if not pedido:
            return jsonify({'error': 'Pedido não encontrado!'}), 404

        return jsonify({
            'id_pedido': pedido.id_pedido,
            'data': pedido.data.strftime("%d/%m/%Y %H:%M:%S"),
            'valor_total': pedido.valor_total,
            'itens': [item.to_dict() for item in pedido.itens]
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao buscar pedido.'}), 500



@pedido_bp.route('/', methods=['GET'])
def listar_pedidos():
    pedidos = db.session.query(Pedido).all()

    resultado = []
    for pedido in pedidos:
        resultado.append({
            'id_pedido': pedido.id_pedido,
            'data': pedido.data.strftime("%d/%m/%Y %H:%M:%S"),
            'valor_total': pedido.valor_total,
            'itens': [item.to_dict() for item in pedido.itens]
        })

    return jsonify(resultado), 200


#DELETAR (APAGA ITENS JUNTO)
@pedido_bp.route('/<int:id_pedido>', methods=['DELETE'])
def deletar_pedido(id_pedido):
    try:
        pedido = db.session.query(Pedido).filter_by(id_pedido=id_pedido).first()

        if not pedido:
            return jsonify({'error': 'Pedido não encontrado!'}), 404

        db.session.delete(pedido)
        db.session.commit()

        return jsonify({'message': 'Pedido deletado com sucesso!'}), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao deletar pedido.'}), 500