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
        db.ForeignKey('pedidos.id'),
        nullable=False
    )

    produto = db.Column(db.String(100), nullable=False)

    quantidade = db.Column(db.Integer, nullable=False)
    valor_milheiro = db.Column(db.Float, nullable=False)

    #SOMA DO ITEM NÃO SALVA NO BANCO SO APARECE NA HORA DE EXIBIR O PEDIDO
    @property
    def soma(self):
        return self.quantidade * self.valor_milheiro