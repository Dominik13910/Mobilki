import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "bardzo_tajny_klucz")
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/PWA")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 24 * 7  # 7 dni

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True
    MONGO_URI = "mongodb://localhost:27017/PWA"
