from flask import Flask, render_template
from db import init_db
from datetime import datetime

def create_app():
    from controller.empresa_controller import empresa_bp

    app = Flask(__name__, template_folder="view", static_folder="view")

    init_db(app)

    app.register_blueprint(empresa_bp, url_prefix="/empresas")

    @app.route("/")
    def index():
        return render_template("empresa.html")

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)