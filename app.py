from flask import Flask, render_template
from db import init_db
from controller.pedido_controller import pedido_bp

def create_app():
    from controller.empresa_controller import empresa_bp

    app = Flask(__name__, template_folder="view", static_folder="view/static")

    init_db(app)

    app.register_blueprint(empresa_bp, url_prefix="/empresas")
    app.register_blueprint(pedido_bp, url_prefix='/pedidos')

    @app.route("/")
    def index():
        return render_template("empresa.html")
    
    @app.route("/pedidos-view")
    def pedidos_view():
        return render_template("pedidos.html")

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)