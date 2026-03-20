from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db import db
from model.empresa import Empresa
from model.items_pedido import ItemPedido
from datetime import *

class Pedido(db.Model):
    __tablename__ = 'pedidos'

    id = db.Column(db.Integer, primary_key=True)

    data = db.Column(db.Date, default=datetime.utcnow)  # DATA DO PEDIDO
    numero_pedido = db.Column(db.String(50), nullable=False)

    nf = db.Column(db.String(50))  # NOTA FISCAL
    total_nf = db.Column(db.Float)  # TOTAL DA NF (opcional salvar)

    vencimento = db.Column(db.Date)
    data_entrega = db.Column(db.Date)

    status = db.Column(db.String(20))

    #CHAVE ESTRANGEIRA PARA EMPRESA RELACIONAMENTO DE 1 PEDIDO PARA 1 EMPRESA
    empresa_id = db.Column(
        db.Integer,
        db.ForeignKey('empresas.id'),
        nullable=False
    )

    itens = db.relationship('ItemPedido', backref='pedido', lazy=True)

    ## RETORNA A SOMA DE QUANTIDADE X MILEIRO DE CADA ITEM
    @property
    def soma_total(self):
        return sum(item.soma for item in self.itens)
    
