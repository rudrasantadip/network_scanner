from flask import Flask

from controllers.main_controller import main_bp
from controllers.scan_controller import scanner_bp

def create_app():
    app= Flask(__name__)

    app.register_blueprint(main_bp)
    app.register_blueprint(scanner_bp)
    
    return app


if __name__=="__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=True)