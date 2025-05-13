from pymongo import MongoClient
from flask import Flask

def init_db(app: Flask):
    client = MongoClient(app.config['MONGO_URI'])
    db = client.get_default_database()
    return db