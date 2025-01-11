import os
import signal
import sys
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

db = SQLAlchemy()

migrate = Migrate()

def handle_exit_signal(signum, frame):
    print("Shutting down gracefully...")
    sys.exit(0)

def create_app():
        
    app = Flask(__name__)
    app.config.from_object(Config)
    
    logging.basicConfig(level=logging.INFO)
    logging.info(f"SQLALCHEMY_DATABASE_URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        from . import routes, models
        try:
            db.create_all()
            logging.info("Database tables created successfully.")
        except Exception as e:
            logging.error(f"Error creating database tables: {e}")
            raise
    
    signal.signal(signal.SIGTERM, handle_exit_signal)
    signal.signal(signal.SIGINT, handle_exit_signal)

    return app
