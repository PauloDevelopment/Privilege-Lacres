from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db import db
from model.empresa import Empresa
from model.itens_pedido import ItemPedido
from datetime import *

class Pedido(db.Model):
    __tablename__ = 'pedidos'

    pedido_id = db.Column(db.Integer, primary_key=True)

    data = db.Column(db.Date, default=datetime.utcnow)  # DATA DO PEDIDO
    numero_pedido = db.Column(db.String(50), nullable=False) 

    nf = db.Column(db.String(50))  # NOTA FISCAL
    total_nf = db.Column(db.Float)  # TOTAL DA NF (opcional salvar)

    vencimento = db.Column(db.Date)
    data_entrega = db.Column(db.Date)

    status = db.Column(db.String(20))

    #CHAVE ESTRANGEIRA PARA EMPRESA RELACIONAMENTO DE 1 PEDIDO PARA 1 EMPRESA
    id_empresa = db.Column(
        db.Integer,
        db.ForeignKey('empresas.id_empresa'),
        nullable=False
    )

    itens = db.relationship('ItemPedido', backref='pedido', lazy=True)

    ## RETORNA A SOMA DE QUANTIDADE X MILEIRO DE CADA ITEM
    @property
    def soma_total(self):
        return sum(item.soma for item in self.itens)
    
    def to_dict(self):
        return {
            'pedido_id': self.pedido_id,
            'data': self.data.strftime("%d/%m/%Y") if self.data else None,
            'numero_pedido': self.numero_pedido,
            'nf': self.nf,
            'total_nf': self.total_nf,
            'vencimento': self.vencimento.strftime("%d/%m/%Y") if self.vencimento else None,
            'data_entrega': self.data_entrega.strftime("%d/%m/%Y") if self.data_entrega else None,
            'status': self.status,
            'id_empresa': self.id_empresa,
            'itens': [item.to_dict() for item in self.itens]
        }
    
    
    
