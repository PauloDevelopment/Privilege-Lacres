from flask import Flask
from db import init_db

def create_app():
    app = Flask(__name__)
    init_db(app)

    @app.route("/")
    def hello():
        return {"message": "Hello, World!"}
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)