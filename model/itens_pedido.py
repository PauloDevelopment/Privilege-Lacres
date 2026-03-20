from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db import db
from model.pedidos import Pedido
from datetime import *

class ItemPedido(db.Model):
    __tablename__ = 'itens_pedido'

    id = db.Column(db.Integer, primary_key=True)

    pedido_id = db.Column(
        db.Integer,
        db.ForeignKey('pedidos.pedido_id'),
        nullable=False
    )

    produto = db.Column(db.String(100), nullable=False)

    quantidade = db.Column(db.Integer, nullable=False)
    valor_milheiro = db.Column(db.Float, nullable=False)

    #SOMA DO ITEM NÃO SALVA NO BANCO SO APARECE NA HORA DE EXIBIR O PEDIDO
    @property
    def soma(self):
        return self.quantidade * self.valor_milheiro
    
    def to_dict(self):
        return {
            'id': self.id,
            'pedido_id': self.pedido_id,
            'produto': self.produto,
            'quantidade': self.quantidade,
            'valor_milheiro': self.valor_milheiro,
            'soma': self.soma
        }