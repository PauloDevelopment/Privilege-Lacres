from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from model.empresa import Empresa
from model.pedidos import Pedido
from datetime import datetime
from db import db

empresa_bp = Blueprint('empresa_bp', __name__)

@empresa_bp.route('/', methods=['GET'])
def listar_empresas():
    empresas = db.session.query(Empresa).all()
    return jsonify([empresa.to_dict() for empresa in empresas])

@empresa_bp.route('/<int:id_empresa>', methods=['GET'])
def listar_empresa(id_empresa):
    try:
        empresa = db.session.query(Empresa).filter_by(id_empresa=id_empresa).first()
        if not empresa:
            return jsonify({'error': 'Empresa não encontrada!'}), 404
        return jsonify({'empresa': empresa.to_dict()}), 200
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao buscar empresa no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

@empresa_bp.route('/', methods=['POST'])
def criar_empresa():
    data = request.json
    obrigatorio = ['razao_social', 'nome_comprador', 'telefone', 'email', 'cnpj', 'ie']

    for campo in obrigatorio:
        if not data.get(campo):
            return jsonify({'error': f'{campo} é obrigatório!'}), 400

    try:
        telefone = data.get('telefone')
        if not telefone.isdigit() or len(telefone) not in (10, 11):
            return jsonify({'error': 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).'}), 400

        cnpj = data.get('cnpj')
        if not cnpj.isdigit() or len(cnpj) != 14:
            return jsonify({'error': 'CNPJ inválido. Utilize 14 números.'}), 400

        cep = data.get('cep', '')
        if cep and (not cep.isdigit() or len(cep) != 8):
            return jsonify({'error': 'CEP inválido. Utilize 8 números.'}), 400

        cnpj_existente = db.session.query(Empresa).filter_by(cnpj=cnpj).first()
        if cnpj_existente:
            return jsonify({'error': 'CNPJ já cadastrado!'}), 400

        novaEmpresa = Empresa(
            razao_social=data.get('razao_social'),
            nome_comprador=data.get('nome_comprador'),
            telefone=telefone,
            email=data.get('email'),
            cnpj=cnpj,
            ie=data.get('ie'),
            data_cadastro=datetime.today(),
            rua=data.get('rua', ''),
            cidade=data.get('cidade', ''),
            estado=data.get('estado', ''),
            cep=cep,
            observacao=data.get('observacao', ''),
        )

        db.session.add(novaEmpresa)
        db.session.commit()
        return jsonify({'message': 'Empresa criada com sucesso!', 'empresa': novaEmpresa.to_dict()}), 201

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar empresa no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

@empresa_bp.route('/<int:id_empresa>', methods=['PUT'])
def atualizar_empresa(id_empresa):
    data = request.json
    try:
        empresa = db.session.query(Empresa).filter_by(id_empresa=id_empresa).first()
        if not empresa:
            return jsonify({'error': 'Empresa não encontrada!'}), 404

        telefone = data.get('telefone', empresa.telefone)
        if not telefone.isdigit() or len(telefone) not in (10, 11):
            return jsonify({'error': 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).'}), 400

        cnpj = data.get('cnpj', empresa.cnpj)
        if not cnpj.isdigit() or len(cnpj) != 14:
            return jsonify({'error': 'CNPJ inválido. Utilize 14 números.'}), 400

        cep = data.get('cep', empresa.cep or '')
        if cep and (not cep.isdigit() or len(cep) != 8):
            return jsonify({'error': 'CEP inválido. Utilize 8 números.'}), 400

        cnpj_existente = db.session.query(Empresa).filter_by(cnpj=cnpj).first()
        if cnpj_existente and cnpj_existente.id_empresa != id_empresa:
            return jsonify({'error': 'CNPJ já cadastrado!'}), 400

        empresa.razao_social = data.get('razao_social', empresa.razao_social)
        empresa.telefone = telefone
        empresa.cnpj = cnpj
        empresa.nome_comprador = data.get('nome_comprador', empresa.nome_comprador)
        empresa.email = data.get('email', empresa.email)
        empresa.ie = data.get('ie', empresa.ie)
        empresa.rua = data.get('rua', empresa.rua)
        empresa.cidade = data.get('cidade', empresa.cidade)
        empresa.estado = data.get('estado', empresa.estado)
        empresa.cep = cep
        empresa.observacao = data.get('observacao', empresa.observacao)

        db.session.commit()
        return jsonify({'message': 'Empresa atualizada com sucesso!', 'empresa': empresa.to_dict()}), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao editar empresa no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

@empresa_bp.route('/<int:id_empresa>', methods=['DELETE'])
def deletar_empresa(id_empresa):
    try:
        empresa = db.session.query(Empresa).filter_by(id_empresa=id_empresa).first()

        pedido = db.session.query(Pedido).filter_by(id_empresa=id_empresa).first()
        
        if not empresa:
            return jsonify({'error': 'Empresa não encontrada!'}), 404
        
        if pedido:
            return jsonify({'error': 'Não é possível deletar essa empresa porque tem pedidos vinculados!'}), 409
        
        db.session.delete(empresa)
        db.session.commit()
        return jsonify({'message': 'Empresa deletada com sucesso!'}), 200
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao deletar empresa no banco de dados.'}), 500
    except Exception:
        return jsonify({'error': 'Erro inesperado no servidor.'}), 500

@empresa_bp.route('/<int:id_empresa>/pedidos', methods=['GET'])
def listar_pedidos_empresa(id_empresa):
    try:
        empresa = db.session.query(Empresa).filter_by(id_empresa=id_empresa).first()
        if not empresa:
            return jsonify({'error': 'Empresa não encontrada!'}), 404

        pedidos = [{
            'pedido_id': p.pedido_id,
            'numero_pedido': p.numero_pedido,
            'data': p.data.strftime("%d/%m/%Y") if p.data else None,
            'status': p.status,
            'total_pedido': p.soma_total,
            'nf': p.nf,
            'vencimento': p.vencimento.strftime("%d/%m/%Y") if p.vencimento else None,
            'data_entrega': p.data_entrega.strftime("%d/%m/%Y") if p.data_entrega else None,
        } for p in empresa.pedidos]

        return jsonify({'empresa': empresa.razao_social, 'total': len(pedidos), 'pedidos': pedidos}), 200

    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao buscar pedidos.'}), 500