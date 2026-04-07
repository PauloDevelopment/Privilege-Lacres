from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from db import db
from model.usuario import Usuario
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import pytz

usuario_bp = Blueprint('usuario_bp', __name__)

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()

        if claims.get("role") != "admin":
            return jsonify({'error': 'Acesso negado: apenas admin'}), 403

        return fn(*args, **kwargs)

    return wrapper

# ADMIN
@usuario_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def listar_usuarios_admin():
    pass

@usuario_bp.route('/<int:id_usuario>', methods=['GET'])
@jwt_required()
@admin_required
def listar_usuario_admin(id_usuario):
    pass

@usuario_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def criar_usuarios():
    pass

@usuario_bp.route('/<int:id_usuario>', methods=['PUT'])
@jwt_required()
@admin_required
def atualizar_usuarios_admin(id_usuario):
    pass

@usuario_bp.route('/<int:id_usuario>', methods=['DELETE'])
@jwt_required()
@admin_required
def deletar_usuarios(id_usuario):
    pass


# USUÁRIO
@usuario_bp.route('/me', methods=['GET'])
@jwt_required()
def listar_usuario():
    pass

@usuario_bp.route('/me', methods=['PUT'])
@jwt_required()
def atualizar_usuario():
    pass


# AUTH
@usuario_bp.route('/login', methods=['POST'])
def login():
    data = request.json

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"erro": "E-mail e senha são obrigatórios"}), 400
    
    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario:
        return jsonify({'error': 'Usuário não encontrado'}), 404
        
    if not check_password_hash(usuario.password, password):
        return jsonify({'error': 'Senha inválida'}), 401      
    
    access_token = create_access_token(
        identity=str(usuario.id_usuario),
        additional_claims={"role": usuario.role}
    ) 
    
    return jsonify({
        "message": "Usuário logado com sucesso",
        "access_token": access_token
    }), 200