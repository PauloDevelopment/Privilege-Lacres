from flask import Flask
from db import init_db

def create_app():

    from controller.empresa_controller import empresa_bp

    app = Flask(__name__)
    init_db(app)
    
    app.register_blueprint(empresa_bp, url_prefix="/empresas")
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)