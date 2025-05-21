from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    MONGO_URI = os.environ.get("MONGO_URI")
    FRONT_END_URL = os.environ.get("FRONT_END_URL")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 24 * 7  # 7 dni
    DEBUG = os.environ.get("FLASK_ENV") == "development"
    TESTING = os.environ.get("FLASK_ENV") == "testing" 
