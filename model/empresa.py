from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db import db
from datetime import *

class Empresa(db.Model):
    __tablename__ = 'empresas'

    id_empresa = Column(Integer, primary_key=True, autoincrement=True)
    nome_comprador = Column(String(50), nullable=False)
    telefone = Column(String(11), nullable=False)
    email = Column(String(50), nullable=False)
    cnpj = Column(String(14), nullable=False)
    ie = Column(String(100), nullable=False)
    data_cadastro = Column(DateTime)

    def to_dict(self):
        return{
            'id_empresa': self.id_empresa,
            'nome_comprador': self.nome_comprador,
            'telefone': self.telefone,
            'email': self.email,
            'cnpj': self.cnpj,
            'ie': self.ie,
            'data_cadastro': self.data_cadastro.strftime("%d/%m/%Y %H:%M:%S") if self.data_cadastro else None
        }