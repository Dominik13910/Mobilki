from bson import ObjectId
from flask import Blueprint, jsonify, request, session


budget_bp = Blueprint('budget', __name__)

@budget_bp.route('/budget', methods=['POST'])
def set_budget():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.get_json()
    month = data.get("month")
    amount = data.get("amount")

    if not month or not amount:
        return jsonify({"message": "Month and amount required"}), 400

    user_id = ObjectId(session['user_id'])

    budget_bp.db.budgets.update_one(
        {"user_id": user_id, "month": month},
        {"$set": {"amount": amount}},
        upsert=True
    )

    return jsonify({"message": "Budget saved"}), 200


@budget_bp.route('/budget', methods=['GET'])
def get_budget():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    month = request.args.get("month")
    if not month:
        return jsonify({"message": "Month required"}), 400

    user_id = ObjectId(session['user_id'])
    budget = budget_bp.db.budgets.find_one({"user_id": user_id, "month": month})

    if not budget:
        return jsonify({"message": "No budget found for this month"}), 404

    return jsonify({"amount": budget["amount"]}), 200