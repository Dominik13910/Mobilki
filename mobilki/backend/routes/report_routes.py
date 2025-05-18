from flask import Blueprint, request, send_file, jsonify, session
from io import BytesIO
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from bson import ObjectId
from utils.pdf import generate_pie_chart
from transaction import CATEGORIES

report_bp = Blueprint("report", __name__)


@report_bp.route("/report", methods=["GET"])
def generate_report():
    if not 'user_id' in session:
        return jsonify({'message': 'Unauthorized'}), 401
    user_id = ObjectId(session['user_id'])
    month = request.args.get("month")  # format: YYYY-MM
    if not month:
        return {"error": "Missing month parameter"}, 400

    try:
        start_date = datetime.strptime(month, "%Y-%m")
        end_month = start_date.month % 12 + 1
        end_year = start_date.year + (start_date.month // 12)
        end_date = datetime(end_year, end_month, 1)
    except ValueError:
        return {"error": "Invalid month format"}, 400

    transactions = list(report_bp.db.transactions.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lt": end_date}
    }))

    expenses = [t for t in transactions if t["category"] != "income"]
    total_expenses = sum(t["amount"] for t in expenses)

    budget_entry = report_bp.db.budgets.find_one({
        "user_id": user_id,
        "month": start_date.strftime("%Y-%m")
    })
    budget = budget_entry["amount"] if budget_entry else 0

    categories = {}
    for t in expenses:
        categories[t["category"]] = categories.get(t["category"], 0) + t["amount"]

    for cat in categories:
        categories[cat] = {
            "amount": categories[cat],
            "percentage": round(categories[cat] / total_expenses * 100, 2)
        }

    # PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    pdfmetrics.registerFont(TTFont("Courgette", "./templates/Courgette-Regular.ttf"))
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Normal-Courgette", fontName="Courgette", fontSize=10, leading=12))
    styles.add(ParagraphStyle(name="Title-Courgette", fontName="Courgette", fontSize=18, leading=22))
    styles.add(ParagraphStyle(name="Heading2-Courgette", fontName="Courgette", fontSize=14, leading=18))
    elements = []

    # Tytuł i budżet
    elements.append(Paragraph(f"Raport finansowy – {month}", styles['Title-Courgette']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Budżet: {budget} PLN", styles['Normal-Courgette']))
    elements.append(Paragraph(f"Wydatki: {total_expenses} PLN", styles['Normal-Courgette']))
    elements.append(Paragraph(f"Wykorzystanie budżetu: {round(total_expenses / budget * 100, 2) if budget else 0}% ", styles['Normal-Courgette']))
    elements.append(Spacer(1, 12))

    # Tabela transakcji
    elements.append(Paragraph("Transakcje:", styles['Heading2-Courgette']))
    table_data = [["Data", "Opis", "Kategoria", "Kwota", "Typ"]]
    for t in transactions:
        table_data.append([
            t["date"].strftime("%Y-%m-%d"),
            t["description"],
            CATEGORIES[t["category"]],
            f'{t["amount"]:.2f} PLN',
            "Przychód" if t["category"] == "income" else "Wydatek"
        ])
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Courgette')
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))

    # Kategorie
    elements.append(Paragraph("Kategorie wydatków:", styles['Heading2-Courgette']))
    cat_data = [["Kategoria", "Kwota", "Udział %"]]
    for cat, data in categories.items():
        cat_data.append([CATEGORIES[cat], f'{data["amount"]:.2f} PLN', f'{data["percentage"]:.2f}%'])
    cat_table = Table(cat_data, repeatRows=1)
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Courgette')
    ]))
    elements.append(cat_table)
    elements.append(Spacer(1, 24))

    # Wykres
    if categories:
        chart_img = generate_pie_chart(categories)
        img = Image(chart_img, width=300, height=300)
        elements.append(Paragraph("Wykres udziału kategorii:", styles['Heading2-Courgette']))
        elements.append(img)

    doc.build(elements)
    buffer.seek(0)

    return send_file(buffer, download_name=f"report_{month}.pdf", as_attachment=True)
