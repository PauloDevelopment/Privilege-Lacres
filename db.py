from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import OperationalError
from urllib.parse import quote_plus
import os
import time


db = SQLAlchemy()


def init_db(app):
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD') or os.getenv('MYSQL_ROOT_PASSWORD', 'root')
    db_host = os.getenv('DB_HOST', 'mysql57')
    db_port = os.getenv('DB_PORT', '3306')
    db_name = os.getenv('DB_NAME') or os.getenv('MYSQL_DATABASE', 'privilege_management')

    default_uri = (
        f"mysql+mysqlconnector://{quote_plus(db_user)}:{quote_plus(db_password)}"
        f"@{db_host}:{db_port}/{db_name}"
    )

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL') or default_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        conectado = False
        for i in range(15):  # tenta por ~45 segundos
            try:
                db.create_all()
                print("✅ Banco conectado e tabelas criadas!")
                conectado = True
                break
            except OperationalError as e:
                print(f"⏳ [{i+1}/15] MySQL ainda não está pronto, aguardando... ({e})")
                time.sleep(3)

        if not conectado:
            print("❌ Não foi possível conectar ao banco após várias tentativas.")
            raise RuntimeError("Falha ao conectar ao banco de dados.")
