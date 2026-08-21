from datetime import datetime
from werkzeug.security import generate_password_hash
from db import db
from app import app
from model.usuario import Usuario
import pytz
import os


def seed_user():
    email = os.getenv("EMAIL")
    password = os.getenv("PASSWORD")

    if not email or not password:
        raise RuntimeError("EMAIL e PASSWORD precisam estar definidos no .env")

    with app.app_context():
        existing_user = Usuario.query.filter_by(email=email).first()
        if existing_user:
            print("Usuário admin já existe!")
            return

        user = Usuario(
            name="Admin",
            email=email,
            password=generate_password_hash(password),
            role="admin",
            data_cadastro=datetime.now(pytz.timezone('America/Sao_Paulo'))
        )

        db.session.add(user)
        db.session.commit()

        print("Usuário admin criado com sucesso!")


if __name__ == "__main__":
    seed_user()
