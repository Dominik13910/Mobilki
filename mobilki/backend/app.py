from flask import Flask
from flask_bcrypt import Bcrypt
from config import DevelopmentConfig  # lub ProductionConfig
from db import init_db
from routes.auth_routes import auth_bp
from routes.transaction_routes import transaction_bp
from routes.budget_routes import budget_bp
from routes.report_routes import report_bp

app = Flask(__name__)
app.config.from_object(DevelopmentConfig)  # <- wybierz konfigurację

# Inicjalizacja DB
db = init_db(app)

bcrypt = Bcrypt(app)

# Rejestracja blueprintów
app.register_blueprint(auth_bp)
app.register_blueprint(transaction_bp)
app.register_blueprint(budget_bp)
app.register_blueprint(report_bp)

# Przypisanie db do blueprintów
transaction_bp.db = db
budget_bp.db = db
auth_bp.db = db  # jeśli potrzebujesz dostępu do DB w autoryzacji
report_bp.db = db

budget_bp.bcrypt = bcrypt
auth_bp.bcrypt = bcrypt 