from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import OperationalError
import time

db = SQLAlchemy()

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:root@mysql57:3306/privilege_management'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)

    with app.app_context():
        for i in range(10):
            try:
                db.create_all()
                print("✅ Banco conectado!")
                break
            except OperationalError:
                print("⏳ Aguardando MySQL iniciar...")
                time.sleep(3)