from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    users = auth_bp.db.users
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

    hashed_pw = auth_bp.bcrypt.generate_password_hash(password).decode('utf-8')
    users.insert_one({'username': username, 'password': hashed_pw})
    data = {
        'status': 'success',
        'message': 'Registration successful. You can now log in.'
    }
    return jsonify(data), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    users = auth_bp.db.users
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Check if the username and password match
    user = users.find_one({'username': username})
    if user and auth_bp.bcrypt.check_password_hash(user['password'], password):
        session['user_id'] = str(user['_id'])
        session['username'] = username
        return jsonify({'message': 'Logged in successfully', 'status': 'success'}), 200

    return jsonify({'message': 'Invalid credentials', 'status': 'error'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    if 'user_id' in session:
        return jsonify({'username': session['username']}), 200
    return jsonify({'message': 'Unauthorized'}), 401
