import matplotlib.pyplot as plt
from io import BytesIO
from transaction import CATEGORIES

def generate_pie_chart(categories):
    categories_list = []
    for key in categories.keys():
        categories_list.append(CATEGORIES[key])

    labels = categories_list
    values = [v["amount"] for v in categories.values()]

    fig, ax = plt.subplots()
    ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=140)
    ax.axis('equal')

    img_buffer = BytesIO()
    plt.savefig(img_buffer, format='png', bbox_inches='tight')
    plt.close(fig)
    img_buffer.seek(0)
    return img_buffer