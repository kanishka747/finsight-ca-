import os
import csv
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    # Try macOS system fonts
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Geneva.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_header_box(draw, x, y, w, h, bg="#f8fafc", border="#cbd5e1"):
    draw.rectangle([x, y, x + w, y + h], fill=bg, outline=border, width=2)

def create_sample_1_invoice(out_path):
    w, h = 1200, 1550
    img = Image.new("RGB", (w, h), "#ffffff")
    draw = ImageDraw.Draw(img)

    f_title = get_font(32, bold=True)
    f_header = get_font(24, bold=True)
    f_sub = get_font(18, bold=True)
    f_body = get_font(16)
    f_mono = get_font(16)
    f_small = get_font(13)

    # Outer border
    draw.rectangle([40, 40, w - 40, h - 40], outline="#1e293b", width=3)

    # Top Banner
    draw.rectangle([42, 42, w - 42, 110], fill="#0f172a")
    draw.text((w // 2, 75), "TAX INVOICE (RULE 46 OF CGST RULES, 2017)", fill="#ffffff", font=f_header, anchor="mm")

    # Supplier Box (Left) & Invoice Meta (Right)
    draw.line([(40, 290), (w - 40, 290)], fill="#1e293b", width=2)
    draw.line([(w // 2, 110), (w // 2, 290)], fill="#1e293b", width=2)

    # Left: Supplier
    draw.text((60, 125), "JAIPUR PRECISION STEELS PRIVATE LIMITED", fill="#0f172a", font=f_sub)
    draw.text((60, 155), "Plot G-14, Phase II, Sitapura Industrial Area, Jaipur, Rajasthan 302022", fill="#334155", font=f_body)
    draw.text((60, 180), "Phone: +91 141 277 4091 | Email: sales@jaipurprecisionsteel.in", fill="#334155", font=f_body)
    draw.text((60, 215), "GSTIN: 08AAECJ0041M1Z2", fill="#0369a1", font=f_header)
    draw.text((60, 250), "PAN: AAECJ0041M  |  State: 08 - Rajasthan", fill="#0f172a", font=f_body)

    # Right: Invoice Details
    rx = w // 2 + 30
    draw.text((rx, 125), "Invoice No:  JPS/26-27/0842", fill="#0f172a", font=f_sub)
    draw.text((rx, 155), "Invoice Date: 12-Nov-2026", fill="#0f172a", font=f_body)
    draw.text((rx, 180), "State of Supply: 08 - Rajasthan (Intra-State)", fill="#334155", font=f_body)
    draw.text((rx, 215), "Reverse Charge (RCM): NO", fill="#334155", font=f_body)
    draw.text((rx, 245), "Vehicle / Challan No: RJ-14-GA-9182", fill="#334155", font=f_body)

    # Buyer Box
    draw_header_box(draw, 50, 305, w - 100, 130, bg="#f1f5f9", border="#94a3b8")
    draw.text((70, 318), "BILLED & SHIPPED TO (BUYER DETAILS):", fill="#475569", font=f_small)
    draw.text((70, 340), "ABC PRIVATE LIMITED", fill="#0f172a", font=f_header)
    draw.text((70, 372), "Plot 42, Sitapura Industrial Area, Tonk Road, Jaipur, Rajasthan 302022", fill="#334155", font=f_body)
    draw.text((70, 400), "Buyer GSTIN: 08AABCA0001D1Z5   |   PAN: AABCA0001D   |   State Code: 08", fill="#0369a1", font=f_sub)

    # Line Items Table
    ty = 455
    draw.rectangle([50, ty, w - 50, ty + 40], fill="#0f172a")
    headers = [("Sr", 70), ("Description of Goods", 120), ("HSN", 520), ("Qty / Unit", 620), ("Rate (₹)", 760), ("Taxable Value (₹)", 940)]
    for title, hx in headers:
        draw.text((hx, ty + 10), title, fill="#ffffff", font=f_sub)

    draw.line([(50, ty + 40), (w - 50, ty + 40)], fill="#0f172a", width=2)

    items = [
        ("1", "Hot Rolled Carbon Steel Plates 12mm (Batch B-12)", "7208", "2.50 MT", "46,000.00", "1,15,000.00"),
        ("2", "Cold Rolled Precision Steel Strips (Batch S-4)", "7209", "1.40 MT", "50,000.00", "70,000.00")
    ]
    iy = ty + 45
    for sr, desc, hsn, qty, rate, taxable in items:
        draw.text((70, iy), sr, fill="#0f172a", font=f_body)
        draw.text((120, iy), desc, fill="#0f172a", font=f_body)
        draw.text((520, iy), hsn, fill="#0f172a", font=f_mono)
        draw.text((620, iy), qty, fill="#0f172a", font=f_mono)
        draw.text((760, iy), rate, fill="#0f172a", font=f_mono)
        draw.text((940, iy), taxable, fill="#0f172a", font=f_sub)
        iy += 45
        draw.line([(50, iy), (w - 50, iy)], fill="#e2e8f0", width=1)
        iy += 10

    # Vertical grid lines
    draw.line([(100, ty), (100, iy)], fill="#cbd5e1", width=1)
    draw.line([(500, ty), (500, iy)], fill="#cbd5e1", width=1)
    draw.line([(600, ty), (600, iy)], fill="#cbd5e1", width=1)
    draw.line([(730, ty), (730, iy)], fill="#cbd5e1", width=1)
    draw.line([(910, ty), (910, iy)], fill="#cbd5e1", width=1)

    # Tax Summary Box
    sy = 650
    draw_header_box(draw, 50, sy, w - 100, 310, bg="#ffffff", border="#1e293b")

    draw.text((70, sy + 20), "Total Taxable Value:", fill="#334155", font=f_sub)
    draw.text((940, sy + 20), "₹ 1,85,000.00", fill="#0f172a", font=f_sub)

    draw.text((70, sy + 60), "Central GST (CGST @ 9%):", fill="#334155", font=f_sub)
    draw.text((940, sy + 60), "₹ 16,650.00", fill="#0f172a", font=f_sub)

    draw.text((70, sy + 100), "State GST (SGST @ 9%):", fill="#334155", font=f_sub)
    draw.text((940, sy + 100), "₹ 16,650.00", fill="#0f172a", font=f_sub)

    draw.text((70, sy + 140), "Integrated GST (IGST @ 0%):", fill="#64748b", font=f_sub)
    draw.text((940, sy + 140), "₹ 0.00", fill="#64748b", font=f_sub)

    draw.line([(50, sy + 180), (w - 50, sy + 180)], fill="#0f172a", width=2)

    draw.rectangle([52, sy + 182, w - 52, sy + 245], fill="#0f172a")
    draw.text((70, sy + 200), "GRAND TOTAL (INVOICE VALUE):", fill="#ffffff", font=f_header)
    draw.text((910, sy + 200), "₹ 2,18,300.00", fill="#38bdf8", font=f_title)

    draw.text((70, sy + 265), "Amount in Words: INR Two Lakh Eighteen Thousand Three Hundred Only", fill="#0f172a", font=f_body)

    # Bank Details & Declaration
    by = sy + 330
    draw_header_box(draw, 50, by, w // 2 - 20, 160, bg="#f8fafc", border="#cbd5e1")
    draw.text((70, by + 15), "Bank Details for RTGS / NEFT Settlement:", fill="#0f172a", font=f_sub)
    draw.text((70, by + 45), "Bank: State Bank of India — Sitapura Industrial", fill="#334155", font=f_body)
    draw.text((70, by + 75), "A/C No: 38491824019  (Current A/C)", fill="#0369a1", font=f_body)
    draw.text((70, by + 105), "IFSC: SBIN0031842  |  Branch Code: 31842", fill="#334155", font=f_body)

    # Signature Area
    sig_x = w // 2 + 50
    draw.text((sig_x, by + 15), "For JAIPUR PRECISION STEELS PVT LTD", fill="#0f172a", font=f_sub)
    draw.rectangle([sig_x, by + 50, sig_x + 220, by + 110], outline="#cbd5e1", fill="#fafafa")
    draw.text((sig_x + 30, by + 75), "[Authorized Signatory]", fill="#94a3b8", font=f_small)
    draw.text((sig_x, by + 125), "Chartered Accountant Audit Copy / Customer Original", fill="#64748b", font=f_small)

    img.save(out_path, quality=95)

def create_sample_2_interstate_invoice(out_path):
    w, h = 1200, 1450
    img = Image.new("RGB", (w, h), "#ffffff")
    draw = ImageDraw.Draw(img)

    f_title = get_font(30, bold=True)
    f_header = get_font(23, bold=True)
    f_sub = get_font(18, bold=True)
    f_body = get_font(16)
    f_mono = get_font(16)
    f_small = get_font(13)

    # Outer border
    draw.rectangle([40, 40, w - 40, h - 40], outline="#0284c7", width=3)

    # Banner
    draw.rectangle([42, 42, w - 42, 110], fill="#0369a1")
    draw.text((w // 2, 75), "TAX INVOICE — INTER-STATE SUPPLY (IGST)", fill="#ffffff", font=f_header, anchor="mm")

    # Header Divider
    draw.line([(40, 280), (w - 40, 280)], fill="#0284c7", width=2)
    draw.line([(w // 2, 110), (w // 2, 280)], fill="#0284c7", width=2)

    # Supplier (Maharashtra)
    draw.text((60, 125), "MUMBAI CLOUD INFRA TECH PRIVATE LIMITED", fill="#0f172a", font=f_sub)
    draw.text((60, 155), "Unit 704, Nesco IT Park, Western Express Highway, Goregaon East, Mumbai 400063", fill="#334155", font=f_body)
    draw.text((60, 185), "Supplier GSTIN: 27AABCM8821K1Z9", fill="#0284c7", font=f_header)
    draw.text((60, 220), "PAN: AABCM8821K  |  State: 27 - Maharashtra", fill="#0f172a", font=f_body)
    draw.text((60, 248), "Contact: billing@mumbaicloudinfra.in", fill="#64748b", font=f_body)

    # Invoice Details (Right)
    rx = w // 2 + 30
    draw.text((rx, 125), "Invoice No:  MCI/NOV26/4109", fill="#0f172a", font=f_sub)
    draw.text((rx, 155), "Invoice Date: 05-Nov-2026", fill="#0f172a", font=f_body)
    draw.text((rx, 185), "Place of Supply: 08 - Rajasthan", fill="#b45309", font=f_sub)
    draw.text((rx, 220), "Supply Type: Inter-State Services (IGST 18%)", fill="#0369a1", font=f_body)
    draw.text((rx, 248), "Payment Terms: Net 15 Days", fill="#64748b", font=f_body)

    # Billed To
    draw_header_box(draw, 50, 295, w - 100, 115, bg="#f0f9ff", border="#38bdf8")
    draw.text((70, 308), "RECIPIENT / BILLED TO:", fill="#0369a1", font=f_small)
    draw.text((70, 328), "ABC PRIVATE LIMITED", fill="#0f172a", font=f_header)
    draw.text((70, 358), "Sitapura Industrial Area, Jaipur, Rajasthan 302022  |  POS State: 08-Rajasthan", fill="#334155", font=f_body)
    draw.text((70, 382), "Buyer GSTIN: 08AABCA0001D1Z5   |   PAN: AABCA0001D", fill="#0f172a", font=f_sub)

    # Line Items
    ty = 430
    draw.rectangle([50, ty, w - 50, ty + 40], fill="#0369a1")
    draw.text((70, ty + 10), "Sr", fill="#ffffff", font=f_sub)
    draw.text((120, ty + 10), "Service Description & SAC Code", fill="#ffffff", font=f_sub)
    draw.text((620, ty + 10), "SAC Code", fill="#ffffff", font=f_sub)
    draw.text((750, ty + 10), "Billing Period", fill="#ffffff", font=f_sub)
    draw.text((940, ty + 10), "Taxable (₹)", fill="#ffffff", font=f_sub)

    draw.text((70, ty + 55), "1", fill="#0f172a", font=f_body)
    draw.text((120, ty + 55), "Dedicated Cloud Compute & 1 Gbps Bandwidth (Prod)", fill="#0f172a", font=f_body)
    draw.text((620, ty + 55), "998315", fill="#0f172a", font=f_mono)
    draw.text((750, ty + 55), "Nov 2026", fill="#0f172a", font=f_body)
    draw.text((940, ty + 55), "1,20,000.00", fill="#0f172a", font=f_sub)

    # Tax Box
    sy = 580
    draw_header_box(draw, 50, sy, w - 100, 270, bg="#ffffff", border="#0284c7")
    draw.text((70, sy + 25), "Total Service Value (Taxable):", fill="#334155", font=f_sub)
    draw.text((940, sy + 25), "₹ 1,20,000.00", fill="#0f172a", font=f_sub)

    draw.text((70, sy + 65), "Central Tax (CGST):", fill="#94a3b8", font=f_sub)
    draw.text((940, sy + 65), "₹ 0.00 (N/A Inter-State)", fill="#94a3b8", font=f_sub)

    draw.text((70, sy + 105), "State Tax (SGST):", fill="#94a3b8", font=f_sub)
    draw.text((940, sy + 105), "₹ 0.00 (N/A Inter-State)", fill="#94a3b8", font=f_sub)

    draw.text((70, sy + 145), "Integrated Tax (IGST @ 18%):", fill="#0284c7", font=f_sub)
    draw.text((940, sy + 145), "₹ 21,600.00", fill="#0284c7", font=f_sub)

    draw.rectangle([52, sy + 190, w - 52, sy + 255], fill="#0369a1")
    draw.text((70, sy + 210), "NET PAYABLE INVOICE VALUE:", fill="#ffffff", font=f_header)
    draw.text((910, sy + 210), "₹ 1,41,600.00", fill="#ffffff", font=f_title)

    img.save(out_path, quality=95)

def create_sample_3_bank_csv(out_path):
    rows = [
        ["Txn Date", "Value Date", "Description / Narration", "Chq / Ref No", "Debit (Dr)", "Credit (Cr)", "Balance (INR)"],
        ["01-Oct-2026", "01-Oct-2026", "OPENING BALANCE B/F", "-", "", "", "1245600.00"],
        ["03-Oct-2026", "03-Oct-2026", "INWARD NEFT / RAJASTHAN INFRA PROJECTS / INV-8821", "NEFT-RAJ-91820", "", "420000.00", "1665600.00"],
        ["08-Oct-2026", "08-Oct-2026", "CHQ 004128 SITAPURA POWER CORP LTD / ELEC FACTORY", "CHQ-004128", "38450.00", "", "1627150.00"],
        ["11-Oct-2026", "11-Oct-2026", "RTGS DEBIT JAIPUR PRECISION STEELS VENDOR PYMT", "RTGS-JPS-4410", "185400.00", "", "1441750.00"],
        ["15-Oct-2026", "15-Oct-2026", "GST PMT-06 CHALLAN DEBIT CIN 082610014298 GSTN", "CIN082610014298", "112800.00", "", "1328950.00"],
        ["24-Oct-2026", "24-Oct-2026", "NEFT INWARD MARWAR CERAMICS / SALES ADVANCE", "NEFT-MC-8812", "", "358000.00", "1686950.00"],
        ["31-Oct-2026", "31-Oct-2026", "MONTHLY COMM & SMS ALERT CHARGES + GST", "CHG-OCT26", "4500.00", "", "1682450.00"],
    ]
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

def create_sample_4_reg06_txt(out_path):
    text = """======================================================================
               GOVERNMENT OF INDIA
   GOODS AND SERVICES TAX REGISTRATION CERTIFICATE
               FORM GST REG-06 [See Rule 10(1)]
======================================================================
Registration Number (GSTIN) : 08AABCG9104M1Z7
Legal Name of Business      : Greenfield Industries Private Limited
Trade Name, if any          : Greenfield Packaging Solutions
Constitution of Business    : Private Limited Company
Address of Principal Place  : Plot 88, RIICO Industrial Area, Sitapura,
                              Jaipur, Rajasthan, 302022
Date of Liability           : 01-Jul-2017
Period of Validity          : From 01-Jul-2017  To: Regular
Type of Registration        : Regular Taxpayer
Particulars of Approving    : Ward 4, Circle Sitapura, Commercial Taxes
Authority                   : Department, Rajasthan

Audit Notes for CA Review:
- State Code 08 corresponds to Rajasthan.
- PAN AABCG9104M decoded as 'C' (Company).
- Luhn Modulo 36 checksum verified against GST portal specifications.
======================================================================
"""
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)

def create_sample_5_tds_txt(out_path):
    text = """======================================================================
                DIRECTORATE OF INCOME TAX (SYSTEMS)
                FORM NO. 16A [See Rule 31(1)(b)]
   Certificate under section 203 of the Income-tax Act, 1961 for
          Tax Deducted at Source on Payments other than Salary
======================================================================
Certificate No.             : TRACES-16A-2026-981240
Last Updated Date           : 28-Oct-2026
Financial Year              : 2026-27 (Assessment Year: 2027-28)
Quarter                     : Q2 (July 2026 – September 2026)

DEDUCTOR DETAILS:
Name                        : Pinnacle Technology Solutions Limited
Address                     : 5th Floor, Cyber Park, Sitapura, Jaipur 302022
TAN of Deductor             : JPRP01824F
PAN of Deductor             : AABCP9012J

DEDUCTEE DETAILS:
Name of Deductee            : A Y & COMPANY (Chartered Accountants)
Address                     : Sitapura Industrial Area, Jaipur 302022
PAN of Deductee             : AAAFA4829K

SUMMARY OF TAX DEDUCTION AT SOURCE:
----------------------------------------------------------------------
Section Code                : 194J (Fees for Professional / Technical Services)
Nature of Payment           : Audit & Direct Tax Advisory Retainer
Amount Paid / Credited (INR): Rs. 2,50,000.00
Rate of TDS                 : 10.00 %
Total TDS Deducted (INR)    : Rs. 25,000.00
Challan BSR Code            : 0210042
Date of Deposit to Govt     : 06-Oct-2026
Challan Serial No           : 00192
Status in 26AS / AIS        : Matched & Deposited to Central Government
======================================================================
"""
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)

def create_sample_6_anomaly_invoice(out_path):
    w, h = 1200, 1350
    img = Image.new("RGB", (w, h), "#ffffff")
    draw = ImageDraw.Draw(img)

    f_header = get_font(24, bold=True)
    f_sub = get_font(18, bold=True)
    f_body = get_font(16)
    f_warn = get_font(18, bold=True)

    draw.rectangle([40, 40, w - 40, h - 40], outline="#dc2626", width=3)
    draw.rectangle([42, 42, w - 42, 110], fill="#991b1b")
    draw.text((w // 2, 75), "TAX INVOICE — AUDIT TEST SAMPLE (DISCREPANCY SIMULATOR)", fill="#ffffff", font=f_header, anchor="mm")

    draw.text((60, 130), "VENDOR: MARWAR METAL FABRICATORS", fill="#0f172a", font=f_sub)
    draw.text((60, 160), "GSTIN: 08AABCM9999M1Z9 (Demo Testing Invalid Checksum)", fill="#dc2626", font=f_body)
    draw.text((60, 190), "Invoice No: MMF/TEST/099", fill="#0f172a", font=f_body)
    draw.text((60, 220), "Date: 18-Nov-2026", fill="#0f172a", font=f_body)

    # Discrepant numbers
    draw.rectangle([60, 280, w - 60, 520], fill="#fef2f2", outline="#f87171", width=2)
    draw.text((80, 300), "Deliberate Audit Discrepancies for FinSight Testing:", fill="#991b1b", font=f_warn)
    draw.text((80, 340), "1. Stated Taxable Value: ₹ 1,00,000.00", fill="#0f172a", font=f_body)
    draw.text((80, 375), "2. Stated CGST (9%):     ₹   9,000.00", fill="#0f172a", font=f_body)
    draw.text((80, 410), "3. Stated SGST (9%):     ₹   9,000.00", fill="#0f172a", font=f_body)
    draw.text((80, 450), "4. Computed Correct Total: ₹ 1,18,000.00", fill="#047857", font=f_warn)
    draw.text((80, 485), "5. Invoice Printed Grand Total: ₹ 1,50,000.00 (₹ 32,000 Mismatch!)", fill="#dc2626", font=f_warn)

    img.save(out_path, quality=95)

def main():
    dirs = ["demo-documents", "public/demo-documents"]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        create_sample_1_invoice(os.path.join(d, "Sample_1_B2B_Tax_Invoice_Jaipur_Steel.png"))
        create_sample_2_interstate_invoice(os.path.join(d, "Sample_2_Interstate_Cloud_Tech_Invoice.png"))
        create_sample_3_bank_csv(os.path.join(d, "Sample_3_HDFC_Bank_Current_Account_Oct2026.csv"))
        create_sample_4_reg06_txt(os.path.join(d, "Sample_4_GST_REG06_Registration_Certificate.txt"))
        create_sample_5_tds_txt(os.path.join(d, "Sample_5_Form16A_TDS_Certificate.txt"))
        create_sample_6_anomaly_invoice(os.path.join(d, "Sample_6_Audit_Warning_Tax_Invoice.png"))
    print("All demo test documents generated successfully!")

if __name__ == "__main__":
    main()
