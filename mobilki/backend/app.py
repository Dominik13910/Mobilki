from flask import Flask, request, session, jsonify
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import config

app = Flask(__name__)
app.config.from_object(config)

bcrypt = Bcrypt(app)

client = MongoClient(app.config['MONGO_URI'])
db = client.get_default_database()
users = db.users


app.secret_key = app.config['SECRET_KEY']

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        data = {
            'status': 'error',
            'message': 'Username and password are required.'
        }    
        return jsonify(data), 409
    
    if users.find_one({'username': username}):
        data = {
            'status': 'error',
            'message': 'Username already exists. Choose a different one.'
        }
        return jsonify(data), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    users.insert_one({'username': username, 'password': hashed_pw})
    data = {
        'status': 'success',
        'message': 'Registration successful. You can now log in.'
    }
    return jsonify(data), 409

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Check if the username and password match
    user = users.find_one({'username': username})
    if user and bcrypt.check_password_hash(user['password'], password):
        session['user_id'] = str(user['_id'])
        session['username'] = username
        return jsonify({'message': 'Logged in successfully', 'status': 'success'}), 200

    return jsonify({'message': 'Invalid credentials', 'status': 'error'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/me', methods=['GET'])
def get_current_user():
    if 'user_id' in session:
        return jsonify({'username': session['username']}), 200
    return jsonify({'message': 'Unauthorized'}), 401

@app.route('/transactions', methods=['POST'])
def add_transaction():
    if not 'user_id' in session:
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
    is_income = data.get('is_income')
    amount = data.get('amount')
    description = data.get('description')

    if not isinstance(amount, (int, float)) or not description or amount <= 0:
        return jsonify({'message': 'Invalid data'}), 400

    transaction = {
        'user_id': ObjectId(session['user_id']),
        'amount': amount,
        'description': description,
        'created_at': datetime.now()
    }

    if is_income:
        db.incomes.insert_one(transaction)
        return jsonify({'message': 'Income added'}), 201
    else:
        db.expenses.insert_one(transaction)
        return jsonify({'message': 'Expense added'}), 201
    
@app.route('/transactions', methods=['GET'])
def get_transactions():
    if not 'user_id' in session:
        return jsonify({'message': 'Unauthorized'}), 401
    user_id = ObjectId(session['user_id'])
    trans_type = request.args.get('type')  # 'income' lub 'expense'
    from_date_str = request.args.get('from')
    to_date_str = request.args.get('to')

    date_filter = {}
    try:
        if from_date_str:
            from_date = datetime.strptime(from_date_str, "%Y-%m-%d")
            date_filter['$gte'] = from_date
        if to_date_str:
            to_date = datetime.strptime(to_date_str, "%Y-%m-%d")
            date_filter['$lte'] = to_date
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

    query = {'user_id': user_id}
    if date_filter:
        query['created_at'] = date_filter

    transactions = []

    if trans_type == 'income':
        incomes = list(db.incomes.find(query))
        for inc in incomes:
            transactions.append({
                'type': 'income',
                'created_at': inc['created_at'].isoformat(),
                'amount': inc['amount'],
                'description': inc['description']
            })

    elif trans_type == 'expense':
        expenses = list(db.expenses.find(query))
        for exp in expenses:
            transactions.append({
                'type': 'expense',
                'created_at': exp['created_at'].isoformat(),
                'amount': exp['amount'],
                'description': exp['description']
            })

    else:
        incomes = list(db.incomes.find(query))
        expenses = list(db.expenses.find(query))

        for inc in incomes:
            transactions.append({
                'type': 'income',
                'created_at': inc['created_at'].isoformat(),
                'amount': inc['amount'],
                'description': inc['description']
            })

        for exp in expenses:
            transactions.append({
                'type': 'expense',
                'created_at': exp['created_at'].isoformat(),
                'amount': exp['amount'],
                'description': exp['description']
            })

    transactions.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(transactions), 200

