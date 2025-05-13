
from flask import request, session, jsonify
from flask import Blueprint
from datetime import datetime
from bson import ObjectId
from collections import defaultdict
import transaction

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('/transactions', methods=['POST'])
def add_transaction():
    if not 'user_id' in session:
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
    amount = data.get('amount')
    description = data.get('description')
    category = data.get('category')
    date_str = data.get('date')

    if not isinstance(amount, (int, float)) or not description or amount <= 0 or not category:
        return jsonify({'message': 'Invalid data'}), 400
    
    if category not in transaction.CATEGORIES.keys():
        return jsonify({'message': f'Invalid category. Must be one of: {transaction.CATEGORIES}'}), 400

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d") if date_str else datetime.now()
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

    transaction_obj = {
        'user_id': ObjectId(session['user_id']),
        'amount': amount,
        'description': description,
        'category': category,
        'date': date,
        'created_at': datetime.now()
    }

    transaction_bp.db.transactions.insert_one(transaction_obj)
    return jsonify({'message': 'Transaction added'}), 201
    
@transaction_bp.route('/transactions', methods=['GET'])
def get_transactions():
    if not 'user_id' in session:
        return jsonify({'message': 'Unauthorized'}), 401
    user_id = ObjectId(session['user_id'])
    from_date_str = request.args.get('from')
    to_date_str = request.args.get('to')
    category = request.args.get('category')

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
    if category:
        query['category'] = category
    if date_filter:
        query['created_at'] = date_filter

    results = []

    transactions = list(transaction_bp.db.transactions.find(query))
    for trans in transactions:
        results.append(transaction.create_transaction_api(trans))

    results.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(results), 200

@transaction_bp.route('/summary', methods=['GET'])
def get_summary():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    user_id = ObjectId(session['user_id'])
    selected_month = request.args.get('month')  # np. '2025-05'
    selected_category = request.args.get('category')

    # Pipeline z dodatkowym filtrem po miesiącu jeśli podano
    match_stage = {"user_id": user_id}
    if selected_month:
        try:
            # Sparsuj miesiąc i zbuduj zakres dat
            start_date = datetime.strptime(selected_month, "%Y-%m")
            if start_date.month == 12:
                end_date = datetime(start_date.year + 1, 1, 1)
            else:
                end_date = datetime(start_date.year, start_date.month + 1, 1)
            match_stage["date"] = {"$gte": start_date, "$lt": end_date}
        except ValueError:
            return jsonify({"message": "Invalid month format. Use YYYY-MM"}), 400
        
    # Filtrowanie po kategorii
    if selected_category:
        match_stage["category"] = selected_category

    pipeline = [
        {"$match": match_stage},
        {"$project": {
            "month": {"$dateToString": {"format": "%Y-%m", "date": "$date"}},
            "amount": 1,
            "category": 1
        }},
        {"$group": {
            "_id": {"month": "$month", "category": "$category"},
            "total": {"$sum": "$amount"}
        }}
    ]

    grouped_data = transaction_bp.db.transactions.aggregate(pipeline)

    summary_map = defaultdict(lambda: {"income": 0, "expense": 0})
    for doc in grouped_data:
        month = doc['_id']['month']
        category = doc['_id']['category']
        total = doc['total']

        if category == "income":
            summary_map[month]["income"] += total
        else:
            summary_map[month]["expense"] += total

    # Wynik jako lista
    summary = []
    for month in sorted(summary_map.keys()):
        summary.append({
            "month": month,
            "income": summary_map[month]["income"],
            "expense": summary_map[month]["expense"]
        })

    return jsonify(summary), 200