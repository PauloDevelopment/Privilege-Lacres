from sqlalchemy import Column, Integer, String, DateTime 
from db import db
from datetime import *

class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='user')
    data_cadastro = Column(DateTime)

    def to_dict(self):
        return {
            'id_usuario': self.id_usuario,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'data_cadastro': self.data_cadastro.strftime("%d/%m/%Y %H:%M:%S") if self.data_cadastro else None
        }