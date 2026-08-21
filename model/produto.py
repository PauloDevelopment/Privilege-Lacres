
from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from db import db


class Produto(db.Model):
    __tablename__ = 'produtos'

    id_produto = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), nullable=False, unique=True)
    valor_milheiro = Column(Float, nullable=False)
    descricao = Column(Text)
    data_cadastro = Column(DateTime)

    def to_dict(self):
        return {
            'id_produto': self.id_produto,
            'nome': self.nome,
            'valor_milheiro': self.valor_milheiro,
            'descricao': self.descricao,
            'data_cadastro': self.data_cadastro.strftime("%d/%m/%Y %H:%M:%S") if self.data_cadastro else None
        }
