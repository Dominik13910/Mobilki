CATEGORIES = {
    "transport":        "Motoryzacja i transport",
    "bills":            "Dom i rachunki",
    "groceries":        "Wydatki podstawowe",
    "entertainment":    "Rozrywka i podróże",
    "finance":          "Finanse",
    "income":           "Przychody",
    "other":            "Inne"
}

def create_transaction_api(transaction):
    return {
                'created_at': transaction['created_at'].isoformat(),
                'amount': transaction['amount'],
                'description': transaction['description'],
                'category': CATEGORIES[transaction['category']],
                'date': transaction['date'].isoformat()
            }
    