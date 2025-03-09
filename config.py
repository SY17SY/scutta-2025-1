import os
from urllib.parse import urlparse

class Config:
    db_url = os.getenv("DATABASE_URL")
    
    parsed_url = urlparse(db_url)
    
    if parsed_url.hostname and "singapore-postgres.render.com" in parsed_url.hostname:
        db_url += "?sslmode=require"
    else:
        db_url += "?sslmode=disable"
        
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False