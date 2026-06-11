import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def generate_report_pdf(file_path, context):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 22)
    c.drawString(40, height - 60, "DOC AI - Diagnosis Report")

    c.setFont("Helvetica", 10)
    c.drawString(40, height - 80, f"Generated: {datetime.utcnow().isoformat()} UTC")

    y = height - 110

    def draw_line(label, value):
        nonlocal y
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, f"{label}")
        c.setFont("Helvetica", 11)
        c.drawString(160, y, str(value))
        y -= 18

    draw_line("Patient:", context.get("patient_name", "N/A"))
    draw_line("Email:", context.get("patient_email", "N/A"))
    draw_line("Date:", context.get("date", "N/A"))
    y -= 8

    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, y, "Symptoms")
    y -= 18
    c.setFont("Helvetica", 11)
    for line in context.get("symptoms_summary", "").split("\n"):
        c.drawString(45, y, line)
        y -= 14
        if y < 72:
            c.showPage(); y = height - 50

    y -= 10
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, y, "Diagnosis")
    y -= 18
    c.setFont("Helvetica", 11)
    c.drawString(45, y, f"Text prediction: {context.get('text_prediction', 'N/A')}")
    y -= 14
    c.drawString(45, y, f"Image prediction: {context.get('image_prediction', 'N/A')}")
    y -= 14
    c.drawString(45, y, f"Final prediction: {context.get('final_prediction', 'N/A')}")
    y -= 14
    c.drawString(45, y, f"Confidence: {context.get('confidence_score', 'N/A')}")
    y -= 20

    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, y, "Recommendations")
    y -= 18
    c.setFont("Helvetica", 11)
    for line in context.get("advice", "").split("\n"):
        c.drawString(45, y, line)
        y -= 14
        if y < 72:
            c.showPage(); y = height - 50

    y -= 20
    c.setFont("Helvetica", 9)
    c.drawString(
        40,
        y,
        "Disclaimer: This system is for educational and preliminary assistance purposes only. It does not replace professional medical advice. In emergencies, contact a licensed doctor immediately.",
    )

    c.showPage()
    c.save()

    return file_path
