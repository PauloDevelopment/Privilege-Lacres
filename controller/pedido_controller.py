from flask import Blueprint, jsonify, render_template, request
from sqlalchemy.exc import SQLAlchemyError
from model.pedidos import Pedido
from model.itens_pedido import ItemPedido
from db import db
from datetime import datetime

pedido_bp = Blueprint('pedido_bp', __name__)

@pedido_bp.route('/view') # Mude para /view
def pedidos_page():
    # Isso vai buscar o arquivo na pasta 'view' que você configurou no app.py
    return render_template('pedidos.html')


@pedido_bp.route('/', methods=['POST'])
def criar_pedido():
    data = request.json

    itens = data.get('itens')

    if not itens or len(itens) == 0:
        return jsonify({'error': 'Pedido deve conter ao menos 1 item!'}), 400

    try:
        novo_pedido = Pedido(
            numero_pedido=data.get('numero_pedido'),
            nf=data.get('nf'),
            vencimento=data.get('vencimento'),
            data_entrega=data.get('data_entrega'),
            status=data.get('status'),
            empresa_id=data.get('empresa_id'),
            data=datetime.utcnow()
        )

        db.session.add(novo_pedido)
        db.session.flush()

        for item in itens:
            if not item.get('produto') or not item.get('quantidade') or not item.get('valor_milheiro'):
                return jsonify({'error': 'Item incompleto!'}), 400

            novo_item = ItemPedido(
                pedido_id=novo_pedido.id,
                produto=item.get('produto'),
                quantidade=int(item.get('quantidade')),
                valor_milheiro=float(item.get('valor_milheiro'))
            )

            db.session.add(novo_item)

        db.session.commit()

        return jsonify({
            'message': 'Pedido criado com sucesso!',
            'id_pedido': novo_pedido.id
        }), 201

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar pedido.'}), 500

    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500


@pedido_bp.route('/<int:id_pedido>', methods=['GET'])
def buscar_pedido(id_pedido):
    try:
        pedido = db.session.query(Pedido).filter_by(id=id_pedido).first()

        if not pedido:
            return jsonify({'error': 'Pedido não encontrado!'}), 404

        return jsonify({
            'id': pedido.id,
            'numero_pedido': pedido.numero_pedido,
            'nf': pedido.nf,
            'empresa_id': pedido.empresa_id,
            'data': pedido.data.strftime("%d/%m/%Y") if pedido.data else None,
            'vencimento': pedido.vencimento.strftime("%d/%m/%Y") if pedido.vencimento else None,
            'data_entrega': pedido.data_entrega.strftime("%d/%m/%Y") if pedido.data_entrega else None,
            'status': pedido.status,
            'total_pedido': pedido.soma_total,
            'itens': [
                {
                    'id': item.id,
                    'produto': item.produto,
                    'quantidade': item.quantidade,
                    'valor_milheiro': item.valor_milheiro,
                    'total_item': item.soma
                }
                for item in pedido.itens
            ]
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
            'id': pedido.id,
            'numero_pedido': pedido.numero_pedido,
            'empresa_id': pedido.empresa_id,
            'data': pedido.data.strftime("%d/%m/%Y") if pedido.data else None,
            'status': pedido.status,
            'total_pedido': pedido.soma_total
        })

    return jsonify(resultado), 200


@pedido_bp.route('/<int:id_pedido>', methods=['DELETE'])
def deletar_pedido(id_pedido):
    try:
        pedido = db.session.query(Pedido).filter_by(id=id_pedido).first()

        if not pedido:
            return jsonify({'error': 'Pedido não encontrado!'}), 404

        db.session.delete(pedido)
        db.session.commit()

        return jsonify({'message': 'Pedido deletado com sucesso!'}), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao deletar pedido.'}), 500