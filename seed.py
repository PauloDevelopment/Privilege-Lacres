from datetime import datetime
import pytz
from werkzeug.security import generate_password_hash
from db import db
from app import create_app
from model.usuario import Usuario


def seed_user():
    app = create_app()

    with app.app_context():

        existing_user = Usuario.query.filter_by(email="admin@email.com").first()
        if existing_user:
            print("Usuário já existe!")
            return

        user = Usuario(
            name="Admin",
            email="admin@email.com",
            password=generate_password_hash("123456"),
            role="admin",
            data_cadastro=datetime.now(pytz.timezone('America/Sao_Paulo'))
        )

        db.session.add(user)
        db.session.commit()

        print("Usuário admin criado com sucesso!")


if __name__ == "__main__":
    seed_user()