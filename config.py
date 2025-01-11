import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") + "?sslmode=require"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
