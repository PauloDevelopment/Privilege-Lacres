from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from db import db
from model.usuario import Usuario
from functools import wraps
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
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
    usuarios = db.session.query(Usuario).all()
    return jsonify([usuario.to_dict() for usuario in usuarios]), 200
    
@usuario_bp.route('/<int:id_usuario>', methods=['GET'])
@jwt_required()
@admin_required
def listar_usuario_admin(id_usuario):
    try:
        usuario = db.session.query(Usuario).filter_by(id_usuario=id_usuario).first()
        if not usuario:
            return jsonify({'error': 'Usuário não encontrado!'}), 404
        return jsonify({'usuario': usuario.to_dict()}), 200
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao buscar usuário no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

@usuario_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def criar_usuarios():
    data = request.json
    obrigatorio = ['name', 'email', 'password']

    email = data.get('email')
    password = data.get('password')

    for campo in obrigatorio:
        if not data.get(campo):
            return jsonify({'error': f'{campo} é obrigatório!'}), 400
        
    hashed_password = generate_password_hash(password)

    try:
        email_existente = db.session.query(Usuario).filter_by(email=email).first()
        if email_existente:
            return jsonify({'error': 'E-mail já cadastrado!'}), 400

        novoUsuario = Usuario(
            name=data.get('name'),
            email=email,
            password=hashed_password,
            data_cadastro=datetime.now(pytz.timezone('America/Sao_Paulo')),
        )

        db.session.add(novoUsuario)
        db.session.commit()
        return jsonify({'message': 'Usuário criado com sucesso!', 'usuario': novoUsuario.to_dict()}), 201

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar usuário no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

@usuario_bp.route('/<int:id_usuario>', methods=['PUT'])
@jwt_required()
@admin_required
def atualizar_usuarios_admin(id_usuario):
    data = request.json

    email = data.get('email')
    password = data.get('password')

    try:
        usuario = db.session.query(Usuario).filter_by(id_usuario=id_usuario).first()
        if not usuario:
            return jsonify({'error': 'Usuário não encontrado!'}), 404

        if email and email != usuario.email:
            email_existente = db.session.query(Usuario).filter_by(email=email).first()
            if email_existente and email_existente.id_usuario != id_usuario:
                return jsonify({'error': 'E-mail já cadastrado!'}), 400

        usuario.name = data.get('name', usuario.name)
        usuario.email = data.get('email', usuario.email)
        usuario.role = data.get('role', usuario.role)

        if password:
            usuario.password = generate_password_hash(password)
        
        db.session.commit()
        return jsonify({
            'message': 'Usuário atualizado com sucesso!', 
            'usuario': usuario.to_dict()
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao editar usuário no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

@usuario_bp.route('/<int:id_usuario>', methods=['DELETE'])
@jwt_required()
@admin_required
def deletar_usuarios(id_usuario):
    try:
        usuario = db.session.query(Usuario).filter_by(id_usuario=id_usuario).first()
        
        if not usuario:
            return jsonify({'error': 'Usuário não encontrado!'}), 404
        
        db.session.delete(usuario)
        db.session.commit()
        return jsonify({'message': 'Usuário deletado com sucesso!'}), 200
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao deletar usuário no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

# USUÁRIO
@usuario_bp.route('/me', methods=['GET'])
@jwt_required()
def listar_usuario():
    try:
        user_id = get_jwt_identity()

        usuario = db.session.query(Usuario).filter_by(id_usuario=user_id).first()

        if not usuario:
            return jsonify({'error': 'Usuário não encontrado!'}), 404

        return jsonify(usuario.to_dict()), 200

    except SQLAlchemyError:
        return jsonify({'error': 'Erro ao buscar usuário no banco.'}), 500


@usuario_bp.route('/me', methods=['PUT'])
@jwt_required()
def atualizar_usuario():
    data = request.json

    try:
        user_id = get_jwt_identity()

        usuario = db.session.query(Usuario).filter_by(id_usuario=user_id).first()

        if not usuario:
            return jsonify({'error': 'Usuário não encontrado!'}), 404

        email = data.get('email')
        password = data.get('password')

        if email and email != usuario.email:
            email_existente = db.session.query(Usuario).filter_by(email=email).first()
            if email_existente:
                return jsonify({'error': 'E-mail já cadastrado!'}), 400

        usuario.name = data.get('name', usuario.name)
        usuario.email = data.get('email', usuario.email)

        if password:
            usuario.password = generate_password_hash(password)

        db.session.commit()

        return jsonify({
            'message': 'Dados atualizados com sucesso!',
            'usuario': usuario.to_dict()
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao atualizar usuário no banco.'}), 500
    
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