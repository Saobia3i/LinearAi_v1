# Complete Automation Mastery Notes
### By Claude — Tailored for Your Journey to Professional Automation Seller

> **কিভাবে পড়বে**: প্রতিটা section এ আগে theory পড়, তারপর code examples দেখ, তারপর practice exercises নিজে করো। Notes পড়া আর practice একসাথে চললেই professional হওয়া সম্ভব।

---

# PHASE 1 — PYTHON SCRIPTING AUTOMATION

## 1.1 কেন Python Scripting?

Python দিয়ে তুমি এমন কাজ automate করতে পারবে যেগুলো মানুষ manually করতে ঘণ্টার পর ঘণ্টা নষ্ট করে। যেমন:
- ১০০০ টা file rename করা → Python এ ৫ লাইন কোড
- প্রতিদিন সকালে report email করা → Python এ একবার লিখলে চিরকাল চলবে
- Excel এ ১০০ sheet থেকে data merge করা → Python এ ২ মিনিট

**এটা sell করা যায় কারণ**: ছোট business owners এই কাজগুলো জানে না, কিন্তু এগুলো তাদের প্রতিদিন দরকার।

---

## 1.2 File System Automation

### Concept: OS Module
Python এর `os` এবং `pathlib` module দিয়ে computer এর file system control করা যায়।

```python
import os
import pathlib
from pathlib import Path

# Current directory দেখো
print(os.getcwd())

# একটা folder এর সব file দেখো
folder = Path("C:/Users/YourName/Downloads")
for file in folder.iterdir():
    print(file.name, file.suffix)  # file name এবং extension
```

### Real Project 1: File Organizer Script
```python
import os
import shutil
from pathlib import Path

def organize_downloads(folder_path):
    """
    Downloads folder কে automatically organize করে।
    Images → Images/ folder
    PDFs → Documents/ folder
    Videos → Videos/ folder
    """

    # কোন extension কোন folder এ যাবে
    categories = {
        "Images": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
        "Documents": [".pdf", ".docx", ".doc", ".txt", ".xlsx", ".pptx"],
        "Videos": [".mp4", ".mkv", ".avi", ".mov"],
        "Audio": [".mp3", ".wav", ".flac"],
        "Archives": [".zip", ".rar", ".7z"],
        "Code": [".py", ".js", ".html", ".css", ".json"],
    }

    folder = Path(folder_path)

    for file in folder.iterdir():
        if file.is_file():  # শুধু file, folder নয়
            extension = file.suffix.lower()
            moved = False

            for category, extensions in categories.items():
                if extension in extensions:
                    # Category folder বানাও যদি না থাকে
                    dest_folder = folder / category
                    dest_folder.mkdir(exist_ok=True)

                    # File move করো
                    shutil.move(str(file), str(dest_folder / file.name))
                    print(f"Moved: {file.name} → {category}/")
                    moved = True
                    break

            if not moved:
                # Unknown files → Others folder
                others = folder / "Others"
                others.mkdir(exist_ok=True)
                shutil.move(str(file), str(others / file.name))

# Run করো
organize_downloads("C:/Users/YourName/Downloads")
```

### Real Project 2: Bulk File Renamer
```python
import os
from pathlib import Path
from datetime import datetime

def bulk_rename(folder_path, prefix="file", start_number=1):
    """
    একটা folder এর সব image file rename করে।
    যেমন: photo001.jpg, photo002.jpg, photo003.jpg

    Use case: Product photos, client deliverables
    """
    folder = Path(folder_path)
    image_extensions = [".jpg", ".jpeg", ".png", ".gif"]

    images = [f for f in folder.iterdir()
              if f.is_file() and f.suffix.lower() in image_extensions]

    # Name by modification date অনুযায়ী sort করো
    images.sort(key=lambda x: x.stat().st_mtime)

    for i, image in enumerate(images, start=start_number):
        new_name = f"{prefix}{i:03d}{image.suffix}"  # 001, 002, 003...
        new_path = image.parent / new_name
        image.rename(new_path)
        print(f"Renamed: {image.name} → {new_name}")

bulk_rename("C:/Products/Photos", prefix="product", start_number=1)
```

### Real Project 3: Duplicate File Finder
```python
import hashlib
from pathlib import Path
from collections import defaultdict

def find_duplicates(folder_path):
    """
    Folder এ duplicate files খোঁজে।
    File এর content compare করে, শুধু name নয়।
    """

    def get_file_hash(file_path):
        """File এর unique fingerprint বের করো"""
        hasher = hashlib.md5()
        with open(file_path, "rb") as f:
            # Large file এর জন্য chunk করে পড়ো
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    folder = Path(folder_path)
    hash_map = defaultdict(list)

    # সব file এর hash বের করো
    for file in folder.rglob("*"):  # rglob = recursive (sub-folders ও)
        if file.is_file():
            file_hash = get_file_hash(file)
            hash_map[file_hash].append(file)

    # Duplicates print করো
    duplicates_found = False
    for file_hash, files in hash_map.items():
        if len(files) > 1:
            duplicates_found = True
            print(f"\nDuplicate group (same content):")
            for f in files:
                print(f"  {f}")

    if not duplicates_found:
        print("No duplicates found!")

find_duplicates("C:/Documents")
```

**Practice করো:**
1. একটা script লিখো যেটা ৩০ দিনের পুরানো সব `.log` file delete করবে
2. একটা script লিখো যেটা folder এর সব file এর size দেখাবে, বড় থেকে ছোট order এ

---

## 1.3 PDF Automation

### Concept: pypdf এবং reportlab
```
pypdf    → existing PDF পড়া, merge, split, extract text
reportlab → নতুন PDF তৈরি করা (invoice, report)
```

Install করো:
```bash
pip install pypdf reportlab
```

### Real Project 4: PDF Merger
```python
from pypdf import PdfReader, PdfWriter
from pathlib import Path

def merge_pdfs(pdf_folder, output_name="merged.pdf"):
    """
    একটা folder এর সব PDF merge করে একটা file এ।
    Use case: Client reports, monthly invoices merge করা
    """
    writer = PdfWriter()
    folder = Path(pdf_folder)

    pdf_files = sorted(folder.glob("*.pdf"))  # alphabetical order

    for pdf_path in pdf_files:
        reader = PdfReader(str(pdf_path))
        for page in reader.pages:
            writer.add_page(page)
        print(f"Added: {pdf_path.name} ({len(reader.pages)} pages)")

    output_path = folder / output_name
    with open(output_path, "wb") as output_file:
        writer.write(output_file)

    print(f"\nMerged PDF saved: {output_path}")

merge_pdfs("C:/Reports/Monthly", "all_reports_2024.pdf")
```

### Real Project 5: Invoice Generator
```python
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime

def generate_invoice(client_name, items, invoice_number):
    """
    Automatically invoice PDF তৈরি করো।
    items = [{"description": "n8n Workflow", "qty": 1, "price": 500}]
    """

    filename = f"invoice_{invoice_number}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title = Paragraph(f"INVOICE #{invoice_number}", styles["Title"])
    elements.append(title)

    # Client info
    date_str = datetime.now().strftime("%B %d, %Y")
    client_info = Paragraph(f"Bill To: {client_name}<br/>Date: {date_str}", styles["Normal"])
    elements.append(client_info)

    # Items table
    table_data = [["Description", "Qty", "Unit Price", "Total"]]
    total_amount = 0

    for item in items:
        row_total = item["qty"] * item["price"]
        total_amount += row_total
        table_data.append([
            item["description"],
            str(item["qty"]),
            f"${item['price']:.2f}",
            f"${row_total:.2f}"
        ])

    # Total row
    table_data.append(["", "", "TOTAL:", f"${total_amount:.2f}"])

    table = Table(table_data, colWidths=[250, 50, 100, 100])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("BACKGROUND", (0, -1), (-1, -1), colors.lightgrey),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))

    elements.append(table)
    doc.build(elements)
    print(f"Invoice generated: {filename}")

# Use করো
generate_invoice(
    client_name="Acme Corp",
    items=[
        {"description": "n8n Workflow Setup", "qty": 1, "price": 500},
        {"description": "Monthly Maintenance", "qty": 3, "price": 100},
    ],
    invoice_number="INV-2024-001"
)
```

### Real Project 6: PDF Text Extractor
```python
from pypdf import PdfReader
import re

def extract_pdf_data(pdf_path):
    """
    PDF থেকে text extract করো।
    Use case: Invoice processing, contract analysis এর আগের step
    """
    reader = PdfReader(pdf_path)
    full_text = ""

    for page_num, page in enumerate(reader.pages, 1):
        text = page.extract_text()
        full_text += f"\n--- Page {page_num} ---\n{text}"

    return full_text

def extract_emails_from_pdf(pdf_path):
    """PDF থেকে সব email address বের করো"""
    text = extract_pdf_data(pdf_path)
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return list(set(emails))  # duplicates remove

# Usage
text = extract_pdf_data("contract.pdf")
print(text[:500])  # প্রথম 500 character দেখো
```

**Practice করো:**
1. একটা PDF splitter বানাও — input: PDF file, output: প্রতিটা page আলাদা PDF
2. একটা invoice generator বানাও যেটা CSV থেকে data নিয়ে multiple invoices বানাবে

---

## 1.4 Excel/CSV Automation with Pandas

### Concept: কেন Pandas?
Pandas হলো Python এর সবচেয়ে powerful data manipulation library। Excel এ যা করতে ঘণ্টা লাগে, Pandas এ সেকেন্ডে হয়।

```bash
pip install pandas openpyxl xlrd
```

### Pandas Fundamentals — সব কিছু শেখো এখানে

```python
import pandas as pd

# === DATA LOADING ===
df = pd.read_csv("sales.csv")           # CSV load
df = pd.read_excel("sales.xlsx")        # Excel load
df = pd.read_json("data.json")          # JSON load

# === FIRST LOOK ===
print(df.head())        # প্রথম ৫ row
print(df.tail())        # শেষ ৫ row
print(df.shape)         # (rows, columns)
print(df.info())        # column types, null values
print(df.describe())    # statistics (mean, min, max...)
print(df.columns)       # column names

# === SELECTING DATA ===
df["name"]                      # একটা column
df[["name", "age", "salary"]]   # multiple columns
df.iloc[0]                      # প্রথম row (by position)
df.iloc[0:5]                    # প্রথম ৫ row
df.loc[df["age"] > 30]          # condition দিয়ে filter

# === FILTERING ===
young = df[df["age"] < 30]                          # age < 30
senior_devs = df[(df["age"] > 30) & (df["role"] == "Developer")]  # AND condition
bangladesh = df[df["country"].isin(["BD", "Bangladesh"])]  # multiple values

# === MODIFYING DATA ===
df["full_name"] = df["first_name"] + " " + df["last_name"]  # নতুন column
df["salary_bdt"] = df["salary_usd"] * 110                   # calculation
df.drop(columns=["unnecessary_col"], inplace=True)           # column delete
df.rename(columns={"old_name": "new_name"}, inplace=True)   # rename

# === HANDLING MISSING DATA ===
df.isnull().sum()                    # কোন column এ কতটা null আছে
df.dropna()                          # null row গুলো delete করো
df.fillna(0)                         # null এর জায়গায় 0 দাও
df["age"].fillna(df["age"].mean())   # null এর জায়গায় average দাও

# === GROUPING & AGGREGATION ===
df.groupby("department")["salary"].mean()   # department অনুযায়ী average salary
df.groupby("country").agg({
    "sales": "sum",      # total sales
    "orders": "count",   # order count
    "profit": "mean"     # average profit
})

# === SORTING ===
df.sort_values("salary", ascending=False)              # বেশি salary আগে
df.sort_values(["department", "salary"], ascending=[True, False])  # multiple columns

# === SAVING ===
df.to_csv("output.csv", index=False)
df.to_excel("output.xlsx", index=False)
```

### Real Project 7: Sales Report Automation
```python
import pandas as pd
from datetime import datetime

def generate_monthly_report(csv_path):
    """
    Sales CSV থেকে monthly report automatically তৈরি করো।
    যেটা manually করতে ঘণ্টা লাগত।
    """
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])  # date column কে proper date করো
    df["month"] = df["date"].dt.to_period("M")  # month extract করো

    # Monthly summary
    monthly = df.groupby("month").agg({
        "revenue": "sum",
        "orders": "count",
        "profit": "sum"
    }).reset_index()

    monthly["profit_margin"] = (monthly["profit"] / monthly["revenue"] * 100).round(2)

    # Top products
    top_products = df.groupby("product")["revenue"].sum().sort_values(ascending=False).head(10)

    # Save to Excel with multiple sheets
    with pd.ExcelWriter("monthly_report.xlsx", engine="openpyxl") as writer:
        monthly.to_excel(writer, sheet_name="Monthly Summary", index=False)
        top_products.to_excel(writer, sheet_name="Top Products")
        df.to_excel(writer, sheet_name="Raw Data", index=False)

    print("Report generated: monthly_report.xlsx")
    print(f"\nTotal Revenue: ${df['revenue'].sum():,.2f}")
    print(f"Total Orders: {len(df)}")
    print(f"\nTop 3 Products:\n{top_products.head(3)}")

generate_monthly_report("sales_2024.csv")
```

### Real Project 8: Multi-Excel Merger
```python
import pandas as pd
from pathlib import Path

def merge_excel_files(folder_path):
    """
    একটা folder এর সব Excel file merge করো।
    Use case: Different region এর sales data combine করা
    """
    folder = Path(folder_path)
    all_data = []

    for excel_file in folder.glob("*.xlsx"):
        df = pd.read_excel(excel_file)
        df["source_file"] = excel_file.name  # কোন file থেকে এলো সেটা track করো
        all_data.append(df)
        print(f"Loaded: {excel_file.name} ({len(df)} rows)")

    merged = pd.concat(all_data, ignore_index=True)
    merged.to_excel("merged_all.xlsx", index=False)
    print(f"\nTotal rows merged: {len(merged)}")

merge_excel_files("C:/Sales/RegionData")
```

**Practice করো:**
1. একটা CSV নাও (যেকোনো), সেখান থেকে duplicate rows বের করো এবং remove করো
2. একটা script বানাও যেটা প্রতিদিনের sales CSV নিয়ে weekly summary Excel বানাবে

---

## 1.5 Email Automation

### Concept: smtplib
Python দিয়ে automatically email পাঠানো যায়। Report, alert, notification — সব automate করা যায়।

```bash
pip install secure-smtplib
```

Gmail এর জন্য: Google Account → Security → App Passwords → একটা password বানাও

### Real Project 9: Automated Email Report Sender
```python
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path

class EmailAutomation:
    def __init__(self, sender_email, app_password):
        self.sender = sender_email
        self.password = app_password

    def send_email(self, to, subject, body, attachments=None):
        """
        Email পাঠাও, optionally attachment সহ।
        """
        msg = MIMEMultipart()
        msg["From"] = self.sender
        msg["To"] = to if isinstance(to, str) else ", ".join(to)
        msg["Subject"] = subject

        # Email body (HTML support করে)
        msg.attach(MIMEText(body, "html"))

        # Attachments
        if attachments:
            for file_path in attachments:
                path = Path(file_path)
                with open(path, "rb") as f:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename={path.name}")
                msg.attach(part)

        # Send
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(self.sender, self.password)
            recipients = [to] if isinstance(to, str) else to
            server.sendmail(self.sender, recipients, msg.as_string())

        print(f"Email sent to: {msg['To']}")

    def send_daily_report(self, report_path, team_emails):
        """Daily report সব team member কে পাঠাও"""
        from datetime import datetime
        today = datetime.now().strftime("%B %d, %Y")

        body = f"""
        <html>
        <body>
            <h2>Daily Sales Report — {today}</h2>
            <p>Hi Team,</p>
            <p>Please find today's sales report attached.</p>
            <p>Key highlights will be added here automatically...</p>
            <br>
            <p>This is an automated report. Do not reply.</p>
        </body>
        </html>
        """

        self.send_email(
            to=team_emails,
            subject=f"Daily Report — {today}",
            body=body,
            attachments=[report_path]
        )

# Use করো
emailer = EmailAutomation("your@gmail.com", "your_app_password")
emailer.send_daily_report(
    report_path="daily_report.xlsx",
    team_emails=["boss@company.com", "manager@company.com"]
)
```

### Real Project 10: Email Alert System
```python
import pandas as pd
from email_automation import EmailAutomation  # উপরের class

def check_and_alert(data_csv, threshold_column, threshold_value, alert_email):
    """
    Data monitor করো এবং threshold পার হলে alert পাঠাও।
    Use case: Stock level কম হলে alert, sales drop হলে alert
    """
    df = pd.read_csv(data_csv)

    # Threshold এর নিচে যা আছে খোঁজো
    alerts = df[df[threshold_column] < threshold_value]

    if len(alerts) > 0:
        # Alert message বানাও
        items_list = "\n".join([
            f"• {row['product']}: {row[threshold_column]} units remaining"
            for _, row in alerts.iterrows()
        ])

        body = f"""
        <html><body>
        <h2>⚠️ Low Stock Alert</h2>
        <p>The following items need immediate attention:</p>
        <pre>{items_list}</pre>
        <p>Please restock immediately.</p>
        </body></html>
        """

        emailer = EmailAutomation("your@gmail.com", "app_password")
        emailer.send_email(alert_email, "URGENT: Low Stock Alert", body)
    else:
        print("All stock levels normal. No alert needed.")

check_and_alert("inventory.csv", "stock_level", 10, "manager@store.com")
```

---

## 1.6 Scheduling — Automation কে চালু রাখো

### Concept: schedule library
```bash
pip install schedule
```

```python
import schedule
import time
from datetime import datetime

def morning_report():
    print(f"Running morning report at {datetime.now()}")
    # এখানে report generate এবং email করার code

def hourly_backup():
    print("Backing up database...")
    # database backup code

def weekly_cleanup():
    print("Cleaning old files...")
    # file cleanup code

# Schedule করো
schedule.every().day.at("08:00").do(morning_report)      # প্রতিদিন সকাল ৮টায়
schedule.every().hour.do(hourly_backup)                   # প্রতি ঘণ্টায়
schedule.every().monday.at("09:00").do(weekly_cleanup)    # প্রতি সোমবার

# চালু রাখো
print("Scheduler running... Press Ctrl+C to stop")
while True:
    schedule.run_pending()
    time.sleep(60)  # প্রতি মিনিটে check করো
```

**Practice করো:**
1. একটা complete system বানাও: প্রতিদিন সকালে একটা CSV check করবে, stock কম থাকলে email alert পাঠাবে
2. একটা script বানাও যেটা weekly automatic email report পাঠাবে Excel attachment সহ

---

# PHASE 2 — WEB SCRAPING

## 2.1 কেন Web Scraping?

Web scraping মানে internet থেকে automatically data collect করা। এটা automation এর সবচেয়ে lucrative নিশের একটা।

**কি কি sell করা যায়:**
- Lead generation scraper (Google Maps business data) → $300–$2000
- Price monitoring tool → $200–$1000
- Job listing aggregator → $150–$500
- Real estate data scraper → $400–$2000

---

## 2.2 robots.txt — সবার আগে এটা বুঝতে হবে

### robots.txt কি?

প্রায় সব website এর root এ একটা `robots.txt` file থাকে। যেমন: `example.com/robots.txt`

```
# robots.txt এর example
User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /public/
Crawl-delay: 5
```

**এর মানে কি?**
- এটা একটা **request/guideline** — technical block না
- Bot দের বলছে "এই paths এ যেও না"
- তুমি technically গেলে কেউ আটকাতে পারবে না
- কিন্তু ignore করলে Terms of Service ভাঙতে পারো

### robots.txt check করা
```python
import requests

def check_robots(base_url, path_to_scrape):
    """
    Scrape করার আগে robots.txt চেক করো।
    Professional habit — client কাজে এটা অবশ্যই করো।
    """
    try:
        robots_url = f"{base_url.rstrip('/')}/robots.txt"
        response = requests.get(robots_url, timeout=5)

        if response.status_code == 200:
            print(f"robots.txt found:\n{response.text}\n")

            # Path টা disallowed কিনা check করো
            lines = response.text.lower().split("\n")
            for line in lines:
                if line.startswith("disallow:"):
                    disallowed = line.split(":", 1)[1].strip()
                    if path_to_scrape.startswith(disallowed) and disallowed != "/":
                        print(f"WARNING: '{path_to_scrape}' is disallowed in robots.txt")
                        return False
        else:
            print("No robots.txt found — proceeding")

    except Exception as e:
        print(f"Could not fetch robots.txt: {e}")

    return True

# Use করো
is_allowed = check_robots("https://books.toscrape.com", "/catalogue/")
if is_allowed:
    print("OK to scrape this path")
```

### কোন Site Scrape করা যায় — Decision Guide

```
PUBLIC DATA (OK to scrape)
├── Product prices, names, descriptions
├── Business listings (public info)
├── News articles, blog posts
├── Job postings
└── Real estate listings

AVOID করো
├── Personal user data (emails, phones without consent)
├── Paywalled/subscription content
├── Sites that explicitly ban scraping in ToS
└── Data you'll resell in bulk without permission

ALWAYS OK (designed for it)
├── Sites with public API → use API instead
├── Practice sites: quotes.toscrape.com, books.toscrape.com
└── Your own sites
```

---

## 2.3 কি কি আসলে Block করে — এবং Solution

```
robots.txt          → শুধু guideline, technical block না
                      Respectful scraping করো

Rate limiting       → অনেক বেশি fast request → IP block
                      Solution: time.sleep(random.uniform(2,5))

IP blocking         → একই IP থেকে বেশি requests
                      Solution: Proxy rotation (পরে দেখাবো)

Login wall          → login ছাড়া data নেই
                      Solution: Playwright দিয়ে login করো

JavaScript render   → BeautifulSoup এ data দেখায় না (blank page)
                      Solution: Playwright ব্যবহার করো

CAPTCHA             → bot detect হলে captcha আসে
                      Solution: Slow down করো, বা avoid করো

Cloudflare          → sophisticated bot detection
                      Solution: Playwright stealth mode
```

---

## 2.4 সঠিক Tool কোনটা — Decision Tree

```
Website টা দেখো Browser এ → "View Page Source" করো

Source এ data আছে?
    ↓ YES                        ↓ NO (data JavaScript load করে)
BeautifulSoup ব্যবহার করো      Playwright ব্যবহার করো
(fast, lightweight)             (real browser, slower)

API আছে site এর?
    ↓ YES
API ব্যবহার করো (সবচেয়ে ভালো)
```

```bash
pip install requests beautifulsoup4 playwright
playwright install chromium
```

---

## 2.5 BeautifulSoup — Static Websites

### Concept: HTML কিভাবে কাজ করে
```html
<!-- Website এর HTML structure এরকম দেখায় -->
<div class="product-card">
    <h2 class="product-title">Laptop Pro X</h2>
    <span class="price">$999</span>
    <p class="description">High performance laptop</p>
</div>
```

BeautifulSoup এই HTML parse করে data বের করে।

### BeautifulSoup Fundamentals — সব commands এক জায়গায়
```python
import requests
from bs4 import BeautifulSoup

# Website এর HTML নামাও
url = "https://books.toscrape.com"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
response = requests.get(url, headers=headers)

# Status code check করো
if response.status_code != 200:
    print(f"Failed: {response.status_code}")
    # 200 = OK, 403 = Forbidden, 404 = Not Found, 429 = Too Many Requests

soup = BeautifulSoup(response.content, "html.parser")

# === FINDING ELEMENTS ===
title = soup.find("h1")                            # প্রথম h1 tag
title = soup.find("div", class_="product-title")  # class দিয়ে
title = soup.find("div", id="main-content")        # id দিয়ে

# সব element খোঁজো (list পাবে)
all_products = soup.find_all("div", class_="product-card")
all_links = soup.find_all("a")

# CSS selector দিয়ে (most powerful)
price = soup.select_one(".price")           # class
header = soup.select_one("#header")         # id
links = soup.select("ul.nav li a")         # nested selector
first_price = soup.select(".price")[0]     # list থেকে first

# === DATA বের করো ===
element = soup.find("h2")
print(element.text)              # text content (raw)
print(element.get_text(strip=True))  # text (whitespace clean)
print(element["href"])           # attribute value
print(element.get("href", ""))   # attribute (না থাকলে default value)
print(element.get("class", []))  # class list

# === NAVIGATION ===
parent = element.parent              # parent element
children = list(element.children)   # direct children
siblings = element.find_next_siblings("li")  # next siblings
```

### Real Project 11: Books Scraper (Best Practice Site)
```python
import requests
from bs4 import BeautifulSoup
import csv
import time
import random

def scrape_books(max_pages=5):
    """
    books.toscrape.com থেকে books scrape করো।
    এই site টা practice এর জন্য officially তৈরি — 100% legal।
    """
    all_books = []

    for page_num in range(1, max_pages + 1):
        url = f"http://books.toscrape.com/catalogue/page-{page_num}.html"

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            print(f"Page {page_num} failed: {response.status_code}")
            break

        soup = BeautifulSoup(response.content, "html.parser")
        books = soup.find_all("article", class_="product_pod")

        for book in books:
            # Title
            title = book.find("h3").find("a")["title"]

            # Price
            price_text = book.find("p", class_="price_color").get_text(strip=True)
            price = price_text.replace("£", "").replace("Â", "").strip()

            # Rating (word → number)
            rating_map = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
            rating_word = book.find("p", class_="star-rating")["class"][1]
            rating = rating_map.get(rating_word, 0)

            # Availability
            availability = book.find("p", class_="availability").get_text(strip=True)

            all_books.append({
                "title": title,
                "price_gbp": price,
                "rating": rating,
                "availability": availability
            })

        print(f"Page {page_num} done — {len(books)} books scraped")

        # Respectful delay — server কে চাপ দিও না
        time.sleep(random.uniform(1, 3))

    # CSV save করো
    with open("books.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["title", "price_gbp", "rating", "availability"])
        writer.writeheader()
        writer.writerows(all_books)

    print(f"\nDone! Saved {len(all_books)} books to books.csv")
    return all_books

books = scrape_books(max_pages=10)
```

### Real Project 12: Respectful Multi-Page Scraper with Error Handling
```python
import requests
from bs4 import BeautifulSoup
import time
import random
import csv
from datetime import datetime

def scrape_with_error_handling(base_url, max_pages=10):
    """
    Production-ready scraper — সব ধরনের error handle করে।
    এই pattern সব scraping project এ ব্যবহার করো।
    """
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    })

    all_data = []
    failed_pages = []

    for page in range(1, max_pages + 1):
        url = f"{base_url}/page/{page}"

        try:
            response = session.get(url, timeout=10)

            # Status code অনুযায়ী আলাদা behavior
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, "html.parser")
                items = soup.find_all("div", class_="item")  # তোমার site এর class

                if not items:
                    print(f"No items on page {page} — probably last page")
                    break

                for item in items:
                    title = item.find("h2")
                    price = item.find(".price")
                    all_data.append({
                        "title": title.get_text(strip=True) if title else "",
                        "price": price.get_text(strip=True) if price else "",
                        "page": page,
                        "scraped_at": datetime.now().isoformat()
                    })

                print(f"Page {page}: {len(items)} items scraped")

            elif response.status_code == 429:
                # Rate limited — আরো বেশি wait করো
                wait_time = 60
                print(f"Rate limited on page {page}. Waiting {wait_time}s...")
                time.sleep(wait_time)
                page -= 1  # এই page আবার try করো
                continue

            elif response.status_code == 403:
                print(f"Page {page} blocked (403). Skipping...")
                failed_pages.append(page)

            elif response.status_code == 404:
                print(f"Page {page} not found — end of pages")
                break

            else:
                print(f"Unexpected status {response.status_code} on page {page}")
                failed_pages.append(page)

        except requests.exceptions.Timeout:
            print(f"Page {page} timed out. Retrying once...")
            time.sleep(5)
            try:
                response = session.get(url, timeout=15)
                # ... process again
            except:
                failed_pages.append(page)

        except requests.exceptions.ConnectionError:
            print(f"Connection error on page {page}. Internet problem?")
            time.sleep(10)

        # Human-like delay — ALWAYS করো
        delay = random.uniform(2, 5)
        time.sleep(delay)

    # Results save করো
    if all_data:
        with open("scraped_data.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=all_data[0].keys())
            writer.writeheader()
            writer.writerows(all_data)

    if failed_pages:
        print(f"Failed pages: {failed_pages}")

    print(f"Total scraped: {len(all_data)} items")
    return all_data
```

### Real Project 13: Product Price Tracker
```python
import requests
from bs4 import BeautifulSoup
import json
import time
import random
import re
from datetime import datetime
from pathlib import Path

def track_price(url, product_name, price_selector):
    """
    যেকোনো e-commerce site এর product price track করো।
    price_selector = CSS selector for the price element

    প্রতিদিন schedule করে run করো — price drop হলে alert পাবে।
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch price: {e}")
        return None

    soup = BeautifulSoup(response.content, "html.parser")
    price_element = soup.select_one(price_selector)

    if not price_element:
        print(f"Price element not found for {product_name}")
        print("Hint: Open browser DevTools → inspect price element → copy selector")
        return None

    # Price text থেকে number বের করো (যেকোনো currency handle করে)
    price_text = price_element.get_text(strip=True)
    price_number = float(re.sub(r"[^\d.]", "", price_text))

    # History file এ save করো
    history_file = Path(f"price_history_{product_name}.json")
    history = json.loads(history_file.read_text()) if history_file.exists() else []

    history.append({
        "date": datetime.now().isoformat(),
        "price": price_number,
    })
    history_file.write_text(json.dumps(history, indent=2))

    # Price change দেখাও
    if len(history) > 1:
        prev = history[-2]["price"]
        change_pct = ((price_number - prev) / prev) * 100
        direction = "DOWN" if price_number < prev else "UP"
        print(f"[{product_name}] ${prev} → ${price_number} ({direction} {abs(change_pct):.1f}%)")

        # বড় drop হলে alert
        if price_number < prev * 0.9:  # 10%+ drop
            print(f"*** PRICE DROP ALERT: {product_name} dropped {abs(change_pct):.1f}%! ***")
            return {"alert": True, "product": product_name, "price": price_number, "drop_pct": change_pct}
    else:
        print(f"[{product_name}] First price recorded: ${price_number}")

    return {"alert": False, "price": price_number}

# Schedule দিয়ে প্রতিদিন চালাও
def daily_price_check():
    products_to_track = [
        {
            "url": "http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
            "name": "book_light_attic",
            "selector": ".price_color"
        },
        # আরো products add করো
    ]

    for product in products_to_track:
        track_price(product["url"], product["name"], product["selector"])
        time.sleep(random.uniform(3, 7))  # Products এর মধ্যে delay

daily_price_check()
```

---

## 2.6 Playwright — JavaScript Sites (Dynamic Content)

### Concept: কেন BeautifulSoup কাজ করে না কিছু site এ?

```
Static Site:
Browser request → Server sends complete HTML → BeautifulSoup পড়তে পারে ✓

Dynamic Site (React/Vue/Angular):
Browser request → Server sends empty HTML → JavaScript runs → Content loads
BeautifulSoup শুধু empty HTML দেখে — data নেই ✗
Playwright real browser run করে, JavaScript execute হয়, তারপর data নেয় ✓
```

**কিভাবে বুঝবে?** Browser এ website open করো → Right click → "View Page Source"। যদি source এ তোমার data না থাকে কিন্তু browser এ দেখা যাচ্ছে → Playwright দরকার।

### Playwright Fundamentals — সব commands
```python
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    # Browser options
    browser = p.chromium.launch(
        headless=True,   # True = invisible (faster), False = visible (debug করতে)
        slow_mo=500,     # প্রতিটা action এর আগে 500ms wait (debug করতে helpful)
    )
    page = browser.new_page()

    # === NAVIGATION ===
    page.goto("https://example.com")
    page.goto("https://example.com", wait_until="networkidle")  # সব network request শেষ হওয়া পর্যন্ত

    # === WAITING (IMPORTANT — এটা ছাড়া scraping fail করবে) ===
    page.wait_for_selector(".product-list")           # element আসা পর্যন্ত
    page.wait_for_selector(".product-list", timeout=10000)  # max 10 seconds
    page.wait_for_timeout(2000)                       # fixed 2 second wait
    page.wait_for_load_state("networkidle")           # network quiet হওয়া পর্যন্ত

    # === FINDING ELEMENTS ===
    title = page.query_selector("h1")                 # একটা element
    products = page.query_selector_all(".product")    # সব elements (list)
    title = page.locator("h1").first                  # newer API (preferred)

    # === DATA বের করো ===
    text = page.locator("h1").inner_text()
    html = page.locator("div").inner_html()
    attr = page.locator("a").get_attribute("href")
    all_texts = page.locator(".price").all_inner_texts()  # সব price এর list

    # === INTERACTIONS ===
    page.click("button.submit")
    page.fill('input[name="email"]', "test@example.com")
    page.select_option("select#country", "Bangladesh")
    page.press('input[name="search"]', "Enter")
    page.keyboard.type("Hello World")

    # === SCROLLING ===
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")  # bottom এ scroll
    page.mouse.wheel(0, 500)  # 500px scroll down

    # === SCREENSHOT / PDF ===
    page.screenshot(path="page.png")
    page.screenshot(path="fullpage.png", full_page=True)
    page.pdf(path="page.pdf")

    # === WAIT FOR NEW PAGE/POPUP ===
    with page.expect_navigation():
        page.click("a.next-page")  # click এর পরে navigation wait করো

    browser.close()
```

### Real Project 14: Dynamic Site Scraper
```python
from playwright.sync_api import sync_playwright
import csv
import time
import random

def scrape_dynamic_site(url, item_selector, data_fields):
    """
    JavaScript-rendered site থেকে data নাও।

    data_fields = {
        "title": "h2.product-title",
        "price": ".price",
        "rating": ".stars"
    }
    """
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            viewport={"width": 1280, "height": 720}
        )
        page = context.new_page()

        page.goto(url, wait_until="networkidle")

        # "Load More" button থাকলে সব data load করো
        while True:
            try:
                load_more = page.query_selector("button.load-more")
                if load_more and load_more.is_visible():
                    load_more.click()
                    page.wait_for_timeout(2000)
                else:
                    break
            except:
                break

        # সব items খোঁজো
        items = page.query_selector_all(item_selector)
        print(f"Found {len(items)} items")

        for item in items:
            row = {}
            for field_name, selector in data_fields.items():
                try:
                    element = item.query_selector(selector)
                    row[field_name] = element.inner_text().strip() if element else ""
                except:
                    row[field_name] = ""
            results.append(row)

        browser.close()

    return results

# Use করো
data = scrape_dynamic_site(
    url="https://example-dynamic-store.com/products",
    item_selector=".product-card",
    data_fields={
        "title": "h2.title",
        "price": ".price",
        "category": ".badge"
    }
)
```

### Real Project 15: Login + Scrape (নিজের account দিয়ে)
```python
from playwright.sync_api import sync_playwright
import json
from pathlib import Path

def login_and_scrape(login_url, username, password, target_url, data_selector):
    """
    Login করে protected page থেকে data নাও।
    Use case: নিজের account এর data export করা।

    IMPORTANT: নিজের account এবং নিজের permission এর data নেওয়ার জন্য।
    """
    cookie_file = Path("session_cookies.json")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        # আগে থেকে saved cookies আছে কিনা check করো
        if cookie_file.exists():
            cookies = json.loads(cookie_file.read_text())
            context.add_cookies(cookies)
            print("Loaded saved session")

        page = context.new_page()

        # Target page এ try করো প্রথমে
        page.goto(target_url)
        page.wait_for_timeout(2000)

        # যদি login page এ redirect হয়
        if "login" in page.url or "signin" in page.url:
            print("Not logged in — logging in now...")

            page.goto(login_url)
            page.fill('input[name="email"]', username)
            page.fill('input[name="password"]', password)
            page.click('button[type="submit"]')

            # Login হওয়া পর্যন্ত wait
            page.wait_for_url(f"{target_url}**", timeout=15000)
            print("Logged in successfully!")

            # Session save করো পরের জন্য
            cookies = context.cookies()
            cookie_file.write_text(json.dumps(cookies))
            print("Session saved for next time")

        # Data extract করো
        page.wait_for_selector(data_selector, timeout=10000)
        items = page.query_selector_all(data_selector)

        data = [item.inner_text().strip() for item in items]

        browser.close()
        return data

# Use করো (নিজের site এর জন্য)
results = login_and_scrape(
    login_url="https://mysite.com/login",
    username="myemail@gmail.com",
    password="mypassword",
    target_url="https://mysite.com/dashboard/data",
    data_selector=".data-row"
)
```

---

## 2.7 Anti-Detection — Bot হিসেবে Detect না হওয়া

### কেন Detect হয়?
```
Bot এর behavior:          Human এর behavior:
- Instant requests        - Random delays
- Same user agent         - Varies
- No mouse movement       - Mouse moves
- Exact pixel clicks      - Slightly random clicks
- No scroll patterns      - Natural scrolling
- navigator.webdriver=true → false রাখো
```

### Complete Anti-Detection Setup
```python
import random
import time
from playwright.sync_api import sync_playwright

user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/118.0.0.0 Safari/537.36",
]

def get_stealth_context(browser):
    """Stealth browser context তৈরি করো"""
    context = browser.new_context(
        user_agent=random.choice(user_agents),
        viewport={
            "width": random.choice([1280, 1366, 1440, 1920]),
            "height": random.choice([720, 768, 800, 1080])
        },
        locale="en-US",
        timezone_id="America/New_York",
        # Real browser এর মতো headers
        extra_http_headers={
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1",
        }
    )

    # Bot detection এর common checks bypass করো
    context.add_init_script("""
        // navigator.webdriver hide করো
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

        // Chrome object simulate করো
        window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };

        // Plugins array fake করো (real browser এ plugins থাকে)
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });

        // Language simulate করো
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });
    """)

    return context

def human_like_scroll(page, scrolls=3):
    """Human এর মতো scroll করো"""
    for _ in range(scrolls):
        scroll_amount = random.randint(200, 600)
        page.evaluate(f"window.scrollBy(0, {scroll_amount})")
        time.sleep(random.uniform(0.5, 1.5))

def human_like_mouse(page):
    """Random mouse movement"""
    x = random.randint(100, 1000)
    y = random.randint(100, 600)
    page.mouse.move(x, y)
    time.sleep(random.uniform(0.1, 0.5))

# Use করো
with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage",
        ]
    )
    context = get_stealth_context(browser)
    page = context.new_page()

    page.goto("https://example.com")
    human_like_mouse(page)
    time.sleep(random.uniform(1, 3))
    human_like_scroll(page)

    # ... scraping logic

    browser.close()
```

---

## 2.8 API-First Approach — সবচেয়ে Smart Solution

অনেক website এর **public API** আছে। Scraping এর বদলে API use করা সবসময় ভালো কারণ:
- Legal এবং reliable
- Faster এবং structured data
- Block হওয়ার ভয় নেই
- Rate limit clearly documented

### কিভাবে বুঝবে API আছে কিনা?
```
1. site.com/api — এই URL try করো
2. Browser DevTools → Network tab → XHR/Fetch requests দেখো
   (JavaScript দিয়ে site যে API call করে সেটা তুমিও করতে পারো)
3. Google: "site:example.com api documentation"
4. RapidAPI.com — অনেক site এর API এখানে আছে
```

### Real Project 16: Hidden API Discovery
```python
# অনেক site নিজেদের API use করে internally।
# Browser DevTools এ সেটা দেখে directly call করা যায়।

# Step 1: Browser এ website open করো
# Step 2: F12 → Network tab → XHR filter করো
# Step 3: Page load করো/scroll করো — API calls দেখাবে
# Step 4: সেই URL copy করো

import requests

# Example: একটা site এর internal API call
def use_hidden_api():
    """
    Browser এ Network tab এ যে API URL দেখা যায়,
    সেটা directly Python দিয়ে call করো।
    """
    # Browser এ দেখা API URL
    api_url = "https://api.example.com/v2/products"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "Accept": "application/json",
        "Referer": "https://example.com/products",  # important — referrer set করো
        "X-Requested-With": "XMLHttpRequest",
    }

    params = {
        "page": 1,
        "limit": 100,
        "category": "electronics"
    }

    response = requests.get(api_url, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json()
        print(f"Got {len(data.get('products', []))} products")
        return data
    else:
        print(f"API call failed: {response.status_code}")
        return None
```

### Real Project 17: Google Places API (Official Lead Scraper)
```python
import requests
import csv

def find_business_leads(search_query, location, api_key, max_results=60):
    """
    Google Places API দিয়ে business leads collect করো।
    Google Maps scrape করার চেয়ে এটা reliable এবং legal।

    API Key: console.cloud.google.com → Places API enable করো
    Free tier: $200/month credit → ~2000 requests বিনামূল্যে
    """
    base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    results = []
    next_page_token = None

    while len(results) < max_results:
        params = {
            "query": f"{search_query} in {location}",
            "key": api_key,
        }
        if next_page_token:
            params["pagetoken"] = next_page_token

        response = requests.get(base_url, params=params)
        data = response.json()

        if data.get("status") not in ["OK", "ZERO_RESULTS"]:
            print(f"API Error: {data.get('status')}")
            break

        places = data.get("results", [])
        for place in places:
            results.append({
                "name": place.get("name", ""),
                "address": place.get("formatted_address", ""),
                "rating": place.get("rating", ""),
                "total_reviews": place.get("user_ratings_total", ""),
                "business_status": place.get("business_status", ""),
                "place_id": place.get("place_id", ""),
                "types": ", ".join(place.get("types", []))
            })

        print(f"Collected {len(results)} leads so far...")

        next_page_token = data.get("next_page_token")
        if not next_page_token:
            break

        import time
        time.sleep(2)  # Google API next_page_token এর জন্য 2s wait দরকার

    # CSV save করো
    if results:
        with open("business_leads.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)
        print(f"Saved {len(results)} leads to business_leads.csv")

    return results

# Use করো
leads = find_business_leads(
    search_query="restaurants",
    location="Dhaka Bangladesh",
    api_key="YOUR_GOOGLE_API_KEY",
    max_results=60
)
```

---

## 2.9 কোন Site এর জন্য কোন Tool — Summary

| Website Type | Tool | Example |
|---|---|---|
| Static HTML | BeautifulSoup | Wikipedia, news sites |
| JavaScript rendered | Playwright | React/Vue/Angular apps |
| Has public API | requests + API | Google, Twitter, GitHub |
| Has hidden API | requests (DevTools দেখে) | Most modern e-commerce |
| Login required | Playwright + cookies | নিজের accounts |
| Cloudflare protected | Playwright Stealth | Heavy protection sites |

**Rule of thumb**: সবসময় API খোঁজো → না থাকলে BeautifulSoup try করো → কাজ না হলে Playwright।

**Practice করো:**
1. `books.toscrape.com` থেকে সব book এর title, price, rating scrape করো → CSV save করো
2. একটা price tracker বানাও — প্রতিদিন `schedule` দিয়ে চলবে, price কমলে email পাঠাবে
3. Browser DevTools দিয়ে যেকোনো একটা site এর hidden API find করো এবং সেই API directly call করো

---

# PHASE 3 — DATA SCIENCE APPLIED TO AUTOMATION

## 3.1 Pandas Advanced — Data Cleaning Master

Real world data সবসময় messy। Data cleaning হলো সবচেয়ে important skill।

```python
import pandas as pd
import numpy as np

df = pd.read_csv("messy_data.csv")

# === COMMON DATA PROBLEMS AND SOLUTIONS ===

# 1. Inconsistent text values
df["country"] = df["country"].str.strip()        # whitespace remove
df["country"] = df["country"].str.upper()        # সব uppercase
df["name"] = df["name"].str.title()             # Title Case

# 2. Wrong data types
df["price"] = pd.to_numeric(df["price"], errors="coerce")    # numeric করো, error → NaN
df["date"] = pd.to_datetime(df["date"], errors="coerce")     # date করো

# 3. Duplicate handling
df.drop_duplicates(inplace=True)                # সব duplicate remove
df.drop_duplicates(subset=["email"], inplace=True)  # email column based

# 4. Outlier detection
Q1 = df["price"].quantile(0.25)
Q3 = df["price"].quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR
df_clean = df[(df["price"] >= lower_bound) & (df["price"] <= upper_bound)]

# 5. Text cleaning with regex
import re
df["phone"] = df["phone"].str.replace(r"[^\d]", "", regex=True)  # শুধু digits রাখো
df["email"] = df["email"].str.lower().str.strip()

# 6. Splitting columns
# "John Smith" → "John" এবং "Smith"
df[["first_name", "last_name"]] = df["full_name"].str.split(" ", n=1, expand=True)

# "2024-01-15" → year, month, day
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day_of_week"] = df["date"].dt.day_name()
```

### Real Project 15: Automated Data Cleaning Pipeline
```python
import pandas as pd
import numpy as np

def clean_customer_data(input_csv, output_csv):
    """
    Customer data automatically clean করো।
    Common issues fix করো: duplicates, wrong types, missing values, etc.
    """
    df = pd.read_csv(input_csv)

    print(f"Original data: {df.shape}")
    print(f"Missing values:\n{df.isnull().sum()}\n")

    # Step 1: Column names clean করো
    df.columns = df.columns.str.lower().str.replace(" ", "_")

    # Step 2: Text columns clean করো
    text_cols = df.select_dtypes(include="object").columns
    for col in text_cols:
        df[col] = df[col].str.strip()

    # Step 3: Email clean করো
    if "email" in df.columns:
        df["email"] = df["email"].str.lower()
        # Invalid emails remove করো
        email_mask = df["email"].str.match(r'^[\w.-]+@[\w.-]+\.\w+$', na=False)
        df = df[email_mask | df["email"].isna()]

    # Step 4: Phone numbers standardize করো
    if "phone" in df.columns:
        df["phone"] = df["phone"].str.replace(r"[^\d+]", "", regex=True)

    # Step 5: Duplicates remove করো
    before = len(df)
    df.drop_duplicates(subset=["email"], keep="first", inplace=True)
    print(f"Removed {before - len(df)} duplicates")

    # Step 6: Missing values handle করো
    df["name"].fillna("Unknown", inplace=True)
    df.dropna(subset=["email"], inplace=True)  # email ছাড়া row remove

    df.to_csv(output_csv, index=False)
    print(f"Clean data saved: {output_csv}")
    print(f"Final data: {df.shape}")

clean_customer_data("customers_raw.csv", "customers_clean.csv")
```

---

## 3.2 Data Visualization — Automated Charts

### Concept: plotly দিয়ে interactive charts
```bash
pip install plotly kaleido
```

```python
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

df = pd.read_csv("sales.csv")

# Bar chart
fig = px.bar(df, x="month", y="revenue", title="Monthly Revenue",
             color="revenue", color_continuous_scale="Blues")
fig.write_image("revenue_chart.png")    # Image save
fig.write_html("revenue_chart.html")   # Interactive HTML save

# Line chart — trend দেখার জন্য
fig = px.line(df, x="date", y="sales", title="Sales Trend",
              markers=True)
fig.update_layout(template="plotly_dark")  # Dark theme
fig.write_image("sales_trend.png")

# Pie chart
fig = px.pie(df, values="revenue", names="product",
             title="Revenue by Product")
fig.write_image("product_share.png")

# Scatter plot — correlation দেখার জন্য
fig = px.scatter(df, x="marketing_spend", y="revenue",
                 trendline="ols",  # regression line
                 title="Marketing vs Revenue")
fig.write_image("correlation.png")
```

### Real Project 16: Automated Business Dashboard PDF
```python
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from datetime import datetime

def create_business_dashboard(data_csv, output_path="dashboard.html"):
    """
    Sales data থেকে complete business dashboard তৈরি করো।
    Client এ পাঠানো যাবে — এটাই sell করবে।
    """
    df = pd.read_csv(data_csv)
    df["date"] = pd.to_datetime(df["date"])

    # Dashboard layout — 4টা chart
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=("Monthly Revenue", "Top Products",
                       "Daily Orders Trend", "Revenue by Category"),
        specs=[[{"type": "bar"}, {"type": "pie"}],
               [{"type": "scatter"}, {"type": "bar"}]]
    )

    # Chart 1: Monthly Revenue
    monthly = df.groupby(df["date"].dt.month)["revenue"].sum().reset_index()
    fig.add_trace(
        go.Bar(x=monthly["date"], y=monthly["revenue"], name="Revenue", marker_color="steelblue"),
        row=1, col=1
    )

    # Chart 2: Top Products pie
    top_products = df.groupby("product")["revenue"].sum().nlargest(5)
    fig.add_trace(
        go.Pie(labels=top_products.index, values=top_products.values, name="Products"),
        row=1, col=2
    )

    # Chart 3: Daily trend
    daily = df.groupby("date")["orders"].sum().reset_index()
    fig.add_trace(
        go.Scatter(x=daily["date"], y=daily["orders"], mode="lines+markers", name="Orders"),
        row=2, col=1
    )

    # Chart 4: Category revenue
    cat_rev = df.groupby("category")["revenue"].sum().reset_index()
    fig.add_trace(
        go.Bar(x=cat_rev["category"], y=cat_rev["revenue"], name="Category", marker_color="coral"),
        row=2, col=2
    )

    fig.update_layout(
        title_text=f"Business Dashboard — Generated {datetime.now().strftime('%B %Y')}",
        height=800,
        template="plotly_white",
        showlegend=False
    )

    fig.write_html(output_path)
    print(f"Dashboard saved: {output_path}")

create_business_dashboard("sales_data.csv")
```

---

## 3.3 Streamlit — Python Scripts কে Web App এ রূপান্তর

### Concept: কেন Streamlit?
Streamlit দিয়ে তুমি Python script কে ৩০ মিনিটে একটা professional web app বানাতে পারবে। Client কে একটা URL দিবে, সে browser এ গিয়ে নিজের data upload করবে, আর automation চলবে।

```bash
pip install streamlit
```

### Real Project 17: Data Analysis Web App
```python
# app.py — streamlit run app.py দিয়ে চালাও

import streamlit as st
import pandas as pd
import plotly.express as px
from io import BytesIO

st.set_page_config(page_title="Sales Analyzer", layout="wide")

st.title("Sales Data Analyzer")
st.write("Upload your sales CSV and get instant insights")

# File upload
uploaded_file = st.file_uploader("Upload CSV file", type=["csv"])

if uploaded_file:
    df = pd.read_csv(uploaded_file)

    st.success(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    # Sidebar filters
    st.sidebar.header("Filters")
    if "category" in df.columns:
        categories = st.sidebar.multiselect(
            "Select Categories",
            options=df["category"].unique(),
            default=df["category"].unique()
        )
        df = df[df["category"].isin(categories)]

    # Metrics row
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Revenue", f"${df['revenue'].sum():,.0f}")
    col2.metric("Total Orders", f"{len(df):,}")
    col3.metric("Avg Order Value", f"${df['revenue'].mean():,.0f}")
    col4.metric("Top Product", df.groupby("product")["revenue"].sum().idxmax())

    # Charts
    col1, col2 = st.columns(2)

    with col1:
        fig = px.bar(df.groupby("product")["revenue"].sum().reset_index(),
                     x="product", y="revenue", title="Revenue by Product")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        fig = px.pie(df, values="revenue", names="category",
                     title="Revenue by Category")
        st.plotly_chart(fig, use_container_width=True)

    # Download processed data
    output = BytesIO()
    df.to_excel(output, index=False)
    st.download_button(
        label="Download Processed Excel",
        data=output.getvalue(),
        file_name="processed_sales.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    # Raw data
    if st.checkbox("Show Raw Data"):
        st.dataframe(df)
```

---

## 3.4 Basic Machine Learning for Automation

### Concept: ML কে Automation এ লাগানো
ML model মানে এমন একটা program যেটা data দেখে pattern শেখে এবং prediction করে। Automation এ এটা দিয়ে intelligent decisions নেওয়া যায়।

```bash
pip install scikit-learn
```

### Real Project 18: Customer Churn Predictor
```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib

def build_churn_model(data_csv):
    """
    Customer churn predictor বানাও।
    Input: Customer data (usage, payments, support tickets)
    Output: Will they churn? (Yes/No) + probability

    এটা $500–$2000 তে sell করা যায়।
    """
    df = pd.read_csv(data_csv)

    # Features (input variables)
    feature_cols = ["months_active", "monthly_spend", "support_tickets",
                    "login_frequency", "missed_payments"]
    target_col = "churned"  # 1 = left, 0 = stayed

    X = df[feature_cols]
    y = df[target_col]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Model train করো
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate করো
    y_pred = model.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.2%}")
    print(classification_report(y_test, y_pred))

    # Model save করো
    joblib.dump(model, "churn_model.pkl")
    print("Model saved!")

    return model

def predict_churn(customer_data):
    """
    নতুন customer এর churn probability বের করো।
    customer_data = {"months_active": 6, "monthly_spend": 50, ...}
    """
    model = joblib.load("churn_model.pkl")
    df = pd.DataFrame([customer_data])

    probability = model.predict_proba(df)[0][1]  # Churn probability
    prediction = "HIGH RISK" if probability > 0.6 else "LOW RISK"

    return {
        "churn_risk": prediction,
        "probability": f"{probability:.1%}",
        "action": "Send retention offer" if probability > 0.6 else "No action needed"
    }

# Use করো
model = build_churn_model("customer_data.csv")
result = predict_churn({
    "months_active": 3,
    "monthly_spend": 20,
    "support_tickets": 8,
    "login_frequency": 2,
    "missed_payments": 2
})
print(result)
# Output: {"churn_risk": "HIGH RISK", "probability": "78.3%", "action": "Send retention offer"}
```

**Practice করো:**
1. Streamlit দিয়ে একটা CSV cleaner app বানাও — user CSV upload করবে, app clean করে download দেবে
2. একটা simple price prediction model বানাও sklearn দিয়ে

---

# PHASE 4 — AI-POWERED AUTOMATION

## 4.1 OpenAI / Claude API — LLM Integration

### Concept: LLM কে Automation Engine হিসেবে ব্যবহার
LLM (Large Language Model) মানে ChatGPT বা Claude এর মতো AI। এদের API দিয়ে তুমি automation workflow এ AI intelligence যোগ করতে পারবে।

```bash
pip install openai anthropic
```

### OpenAI API Fundamentals
```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key")

# Basic completion
response = client.chat.completions.create(
    model="gpt-4o-mini",  # সস্তা এবং fast
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize this email in 2 sentences."}
    ]
)
print(response.choices[0].message.content)

# Structured output (JSON response)
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "Extract information and return as JSON only."},
        {"role": "user", "content": "John Smith, 35 years old, works at Google as Engineer."}
    ],
    response_format={"type": "json_object"}
)
import json
data = json.loads(response.choices[0].message.content)
# {"name": "John Smith", "age": 35, "company": "Google", "role": "Engineer"}
```

### Real Project 19: AI Email Processor
```python
from openai import OpenAI
import json

client = OpenAI(api_key="your-api-key")

def process_email_with_ai(email_text):
    """
    Email automatically process করো AI দিয়ে।
    1. Classify করো (complaint, inquiry, order, etc.)
    2. Priority দাও (high, medium, low)
    3. Draft reply বানাও
    4. Action items extract করো

    এটা customer support automation হিসেবে $500-$2000 তে sell করা যায়।
    """

    prompt = f"""
    Analyze this customer email and return a JSON with:
    - category: (complaint/inquiry/order/refund/other)
    - priority: (high/medium/low)
    - sentiment: (positive/neutral/negative)
    - key_points: list of main points
    - suggested_reply: a professional reply draft
    - action_items: list of things to do

    Email:
    {email_text}

    Return ONLY valid JSON.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert email analyzer for customer support."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    return result

# Use করো
email = """
Hi, I ordered the Pro subscription last week (Order #12345) but
I still haven't received my login credentials. This is very frustrating
as I need this for my business. Please help immediately.
- Sarah Johnson
"""

result = process_email_with_ai(email)
print(f"Category: {result['category']}")
print(f"Priority: {result['priority']}")
print(f"Suggested Reply:\n{result['suggested_reply']}")
```

### Real Project 20: Document Intelligence Pipeline
```python
from openai import OpenAI
from pypdf import PdfReader
import json

client = OpenAI(api_key="your-api-key")

def extract_invoice_data(pdf_path):
    """
    Invoice PDF থেকে automatically structured data extract করো।
    Input: Invoice PDF
    Output: JSON with all invoice fields

    এই product accounting firms কে $300-$1000/month এ sell করা যায়।
    """

    # PDF থেকে text extract করো
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()

    prompt = f"""
    Extract all information from this invoice and return as JSON:
    - invoice_number
    - invoice_date
    - due_date
    - vendor_name
    - vendor_address
    - client_name
    - client_address
    - line_items: list of {{description, quantity, unit_price, total}}
    - subtotal
    - tax_amount
    - total_amount
    - payment_terms

    Invoice text:
    {text}

    Return ONLY valid JSON. Use null for missing fields.
    """

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert at extracting structured data from invoices."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)

# Use করো
invoice_data = extract_invoice_data("invoice_001.pdf")
print(json.dumps(invoice_data, indent=2))
```

### Real Project 21: AI Content Pipeline
```python
from openai import OpenAI
import json

client = OpenAI(api_key="your-api-key")

class ContentAutomationPipeline:
    """
    Blog post/social media content automatically generate করো।
    Input: Topic + brand voice
    Output: Blog post + 5 social media posts + email newsletter

    এটা marketing agencies কে $500-$2000/month এ sell করা যায়।
    """

    def __init__(self, brand_name, tone="professional", industry="technology"):
        self.brand_name = brand_name
        self.tone = tone
        self.industry = industry
        self.system_prompt = f"""
        You are a content writer for {brand_name}, a {industry} company.
        Writing tone: {tone}
        Always write engaging, SEO-friendly content.
        """

    def generate_blog_post(self, topic, word_count=800):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Write a {word_count}-word blog post about: {topic}. Include H2 headings, a conclusion, and a CTA."}
            ]
        )
        return response.choices[0].message.content

    def generate_social_posts(self, topic, platforms=["Twitter", "LinkedIn", "Facebook"]):
        posts = {}
        for platform in platforms:
            char_limits = {"Twitter": 280, "LinkedIn": 3000, "Facebook": 500}
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Write a {platform} post about '{topic}'. Max {char_limits.get(platform, 500)} characters. Include relevant hashtags."}
                ]
            )
            posts[platform] = response.choices[0].message.content
        return posts

    def run_full_pipeline(self, topic):
        print(f"Generating content for: {topic}")

        blog = self.generate_blog_post(topic)
        social = self.generate_social_posts(topic)

        # Save করো
        with open(f"content_{topic[:30].replace(' ', '_')}.json", "w") as f:
            json.dump({
                "topic": topic,
                "blog_post": blog,
                "social_posts": social
            }, f, indent=2)

        print("Content pipeline complete! Files saved.")

# Use করো
pipeline = ContentAutomationPipeline("LinearAI", tone="friendly", industry="automation")
pipeline.run_full_pipeline("How AI Automation Saves 20 Hours Per Week")
```

---

## 4.2 RAG — AI on Your Own Data

### Concept: Retrieval Augmented Generation
RAG মানে AI কে তোমার নিজের documents এর উপরে কথা বলাতে পারা। Client এর product manual, FAQ, policy document upload করলে AI সেটার উপরে ভিত্তি করে answer দেবে।

```bash
pip install langchain langchain-openai chromadb
```

### Real Project 22: Business Knowledge Base Chatbot
```python
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader

def build_knowledge_base(docs_folder):
    """
    Company documents থেকে AI chatbot বানাও।
    Input: PDFs, Word docs, text files
    Output: Chatbot যেটা documents এর উপরে ভিত্তি করে answer দেয়

    এটা $1000-$5000 তে sell করা যায় businesses কে।
    """

    # Documents load করো
    loader = DirectoryLoader(docs_folder, glob="**/*.pdf", loader_cls=PyPDFLoader)
    documents = loader.load()
    print(f"Loaded {len(documents)} documents")

    # Documents কে chunks এ ভাগ করো (AI এর context window এর জন্য)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,    # প্রতিটা chunk max 1000 characters
        chunk_overlap=200,  # chunks overlap করবে যাতে context না হারায়
    )
    chunks = splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks")

    # Vector database তৈরি করো (semantic search এর জন্য)
    embeddings = OpenAIEmbeddings(api_key="your-key")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="./knowledge_base"
    )

    print("Knowledge base created!")
    return vectorstore

def chat_with_knowledge_base(question, vectorstore=None):
    """
    Knowledge base এর উপরে প্রশ্ন করো।
    """
    if vectorstore is None:
        embeddings = OpenAIEmbeddings(api_key="your-key")
        vectorstore = Chroma(
            persist_directory="./knowledge_base",
            embedding_function=embeddings
        )

    llm = ChatOpenAI(model="gpt-4o-mini", api_key="your-key")

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
        return_source_documents=True
    )

    result = qa_chain.invoke({"query": question})

    print(f"Q: {question}")
    print(f"A: {result['result']}")
    print(f"\nSources used:")
    for doc in result["source_documents"]:
        print(f"  - {doc.metadata.get('source', 'Unknown')}")

# Use করো
vectorstore = build_knowledge_base("company_docs/")
chat_with_knowledge_base("What is the return policy?", vectorstore)
chat_with_knowledge_base("How do I upgrade my subscription?", vectorstore)
```

---

# PHASE 5 — n8n MASTERY

## 5.1 n8n কি এবং কেন?

n8n হলো একটা open-source workflow automation tool। এটা Zapier এর মতো কিন্তু:
- Self-hosted করা যায় (client এর data secure থাকে)
- Custom code লেখা যায়
- Unlimited workflows (Zapier এ expensive)
- একবার setup করলে চিরকাল চলে

**Business model**: তুমি n8n workflows design করো এবং client এর server এ setup করে দাও। Ongoing maintenance retainer।

## 5.2 n8n Core Concepts

### Nodes (Building blocks)
```
Trigger Nodes    → workflow কখন চলবে
  - Webhook      → কেউ API call করলে
  - Schedule     → নির্দিষ্ট time এ
  - Email        → email আসলে
  - Form         → form submit হলে

Action Nodes     → কি করবে
  - HTTP Request → যেকোনো API call করো
  - Gmail        → email পড়ো/পাঠাও
  - Google Sheets → data read/write
  - Notion       → Notion database manage
  - Slack        → message পাঠাও
  - Code         → custom JavaScript/Python code

Logic Nodes      → decision making
  - IF           → condition check
  - Switch       → multiple conditions
  - Merge        → multiple branches join করো
  - Loop         → list এর প্রতিটা item process
```

## 5.3 Real n8n Workflows

### Workflow 1: Lead Capture → CRM → Slack Notification
```
Trigger: Webhook (website form submit)
    ↓
Validate email format (Code node)
    ↓
IF email valid?
    ↓ YES                    ↓ NO
Add to Google Sheets    Send error response
    ↓
Send welcome email (Gmail)
    ↓
Post to Slack: "New lead: {name} from {company}"
    ↓
Respond to webhook: "Success"
```

**JSON Structure (n8n এ import করো):**
```json
{
  "name": "Lead Capture Workflow",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "lead-capture",
        "responseMode": "lastNode"
      }
    },
    {
      "name": "Validate Email",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const email = $input.first().json.email;\nconst isValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\nreturn [{ json: { ...$input.first().json, email_valid: isValid } }];"
      }
    }
  ]
}
```

### Workflow 2: Daily Report Automation
```
Trigger: Schedule (every day 8:00 AM)
    ↓
HTTP Request: Get yesterday's sales data from your API
    ↓
Code Node: Calculate totals, find top product, calculate growth %
    ↓
Google Sheets: Append row with daily summary
    ↓
Gmail: Send report email with summary
    ↓
Slack: Post daily standup message
```

### Workflow 3: AI-Powered Customer Support
```
Trigger: Gmail (new email in support inbox)
    ↓
OpenAI Node: Classify email (complaint/inquiry/order)
    ↓
Switch Node:
    ↓ complaint          ↓ inquiry         ↓ order
High priority tag    AI draft reply    Check order status
    ↓                    ↓                  ↓
Notify manager      Send to customer   Update CRM
```

### Workflow 4: Social Media Automation
```
Trigger: Schedule (every Monday 9 AM)
    ↓
Google Sheets: Get this week's content calendar
    ↓
Loop through each post:
    ↓
OpenAI: Generate post variations for each platform
    ↓
IF platform = Twitter → Twitter API post
IF platform = LinkedIn → LinkedIn API post
IF platform = Instagram → Buffer/Later API
    ↓
Google Sheets: Mark post as "Published"
    ↓
Slack: "Weekly posts published!"
```

## 5.4 n8n Code Node — Custom JavaScript
```javascript
// Code Node এ JavaScript লেখো

// Input data নাও
const items = $input.all();

// Process করো
const processed = items.map(item => {
    const data = item.json;

    return {
        json: {
            name: data.first_name + " " + data.last_name,
            email: data.email.toLowerCase().trim(),
            revenue: parseFloat(data.revenue) * 1.1,  // 10% mark up
            date: new Date(data.date).toISOString(),
            priority: data.revenue > 1000 ? "high" : "normal"
        }
    };
});

return processed;
```

## 5.5 n8n Webhook — API বানানো
```javascript
// n8n দিয়ে তুমি instantly API endpoint বানাতে পারো

// Webhook URL পাবে: https://your-n8n.com/webhook/my-api
// POST request এ data পাঠাও, workflow চলবে, response পাবে

// Response Node এ:
return {
    json: {
        success: true,
        message: "Lead captured successfully",
        lead_id: $node["Create in CRM"].json.id
    }
};
```

---

# PHASE 6 — API INTEGRATION MASTERY

## 6.1 OAuth 2.0 — Enterprise APIs এর চাবিকাঠি

### Concept: OAuth 2.0 কিভাবে কাজ করে
```
User → "Login with Google" click করে
    ↓
তোমার app → Google এ redirect করে permission চাইতে
    ↓
User → Google এ permission দেয়
    ↓
Google → তোমার app এ "authorization code" পাঠায়
    ↓
তোমার app → সেই code দিয়ে "access token" চায়
    ↓
Google → access token দেয়
    ↓
তোমার app → সেই token দিয়ে Google API call করে
```

```python
import requests
from urllib.parse import urlencode

class OAuth2Client:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

    def get_authorization_url(self, auth_endpoint, scopes):
        """Step 1: User কে authorization page এ পাঠাও"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "response_type": "code",
            "access_type": "offline"  # Refresh token এর জন্য
        }
        return f"{auth_endpoint}?{urlencode(params)}"

    def exchange_code_for_token(self, token_endpoint, code):
        """Step 2: Code কে token এ convert করো"""
        response = requests.post(token_endpoint, data={
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        })
        return response.json()  # {"access_token": "...", "refresh_token": "...", "expires_in": 3600}

    def refresh_access_token(self, token_endpoint, refresh_token):
        """Token expire হলে refresh করো"""
        response = requests.post(token_endpoint, data={
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        })
        return response.json()
```

## 6.2 Rate Limiting & Retry Logic

### Concept: Production-ready API calls
```python
import requests
import time
from functools import wraps

def with_retry(max_retries=3, delay=1, backoff=2):
    """
    Decorator: API call fail হলে automatically retry করো।
    Exponential backoff: 1s, 2s, 4s delay
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except requests.exceptions.RequestException as e:
                    if attempt == max_retries - 1:
                        raise  # সব retry শেষ, error raise করো
                    wait = delay * (backoff ** attempt)
                    print(f"Attempt {attempt + 1} failed. Retrying in {wait}s...")
                    time.sleep(wait)
        return wrapper
    return decorator

class APIClient:
    def __init__(self, base_url, api_key, rate_limit=60):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.rate_limit = rate_limit  # requests per minute
        self._request_times = []

    def _check_rate_limit(self):
        """Rate limit enforce করো"""
        now = time.time()
        # পুরানো requests সরাও (1 minute এর বেশি পুরানো)
        self._request_times = [t for t in self._request_times if now - t < 60]

        if len(self._request_times) >= self.rate_limit:
            sleep_time = 60 - (now - self._request_times[0])
            print(f"Rate limit reached. Waiting {sleep_time:.1f}s...")
            time.sleep(sleep_time)

        self._request_times.append(now)

    @with_retry(max_retries=3)
    def get(self, endpoint, params=None):
        self._check_rate_limit()
        response = requests.get(
            f"{self.base_url}/{endpoint}",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()  # 4xx/5xx হলে exception raise করো
        return response.json()

    @with_retry(max_retries=3)
    def post(self, endpoint, data):
        self._check_rate_limit()
        response = requests.post(
            f"{self.base_url}/{endpoint}",
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

# Use করো
api = APIClient("https://api.example.com", "your-api-key", rate_limit=60)
users = api.get("users", params={"page": 1, "limit": 100})
```

## 6.3 Webhook Handler

### Concept: Webhook কি?
Webhook মানে কোনো event হলে একটা URL এ automatically data পাঠানো। যেমন: Stripe payment হলে তোমার server এ data আসবে।

```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

@app.route("/webhook/stripe", methods=["POST"])
def stripe_webhook():
    """
    Stripe payment webhook handle করো।
    Payment হলে automatically order fulfill করো।
    """
    # Webhook signature verify করো (security)
    stripe_signature = request.headers.get("Stripe-Signature")
    webhook_secret = "your_stripe_webhook_secret"

    try:
        # Signature verify করো
        payload = request.get_data()
        expected_sig = hmac.new(
            webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        # Signature match না করলে reject করো
        if not hmac.compare_digest(f"sha256={expected_sig}", stripe_signature):
            return jsonify({"error": "Invalid signature"}), 400
    except Exception:
        return jsonify({"error": "Signature verification failed"}), 400

    # Event handle করো
    event_data = request.json
    event_type = event_data["type"]

    if event_type == "payment_intent.succeeded":
        payment = event_data["data"]["object"]
        customer_email = payment["receipt_email"]
        amount = payment["amount"] / 100  # cents → dollars

        # Order fulfill করো
        fulfill_order(customer_email, amount)
        print(f"Payment received: ${amount} from {customer_email}")

    elif event_type == "payment_intent.payment_failed":
        # Failed payment handle করো
        print("Payment failed!")

    return jsonify({"received": True}), 200

def fulfill_order(email, amount):
    """Payment হলে product deliver করো"""
    # 1. Database এ order mark করো
    # 2. Product download link generate করো
    # 3. Email পাঠাও
    pass

if __name__ == "__main__":
    app.run(port=5000)
```

---

# PHASE 7 — PRODUCTIZE & SELL

## 7.1 তোমার Automation Store কি কি দরকার

### Must-Have Features
```
1. Public Portfolio (no login required)
   → তোমার best 5-10 automations showcase করো
   → Problem → Solution format
   → Tech stack badges
   → Video demo (Loom embed)

2. Real Payment Integration
   → Stripe বা LemonSqueezy
   → Instant product delivery after payment
   → Subscription management

3. Product Delivery System
   → Payment হলে auto email: download link
   → License key generation
   → n8n workflow JSON files, Python scripts, docs

4. Trust Signals
   → Case studies (before/after)
   → Testimonials
   → "X hours saved" counter
   → Your photo + bio (people buy from people)

5. Contact/Discovery Call
   → Calendly embed করো
   → "Book a free 30-min call" CTA
```

## 7.2 Pricing Strategy

```
TEMPLATE TIER ($29-$199)
├── n8n workflow JSON (ready to import)
├── Setup documentation
└── Email support 7 days

SOLUTION TIER ($299-$1,499)
├── Everything in Template
├── Customized for their business
├── 1 hour setup call
└── 30-day support

DONE-FOR-YOU ($1,500-$10,000+)
├── Custom built from scratch
├── Fully integrated into their systems
├── Training session
└── 3-month maintenance
```

## 7.3 এখন কোথায় Sell করবে

| Platform | কিভাবে | Best For |
|---|---|---|
| Gumroad | Upload file, set price, share link | Templates, scripts |
| LemonSqueezy | Digital products, subscriptions | SaaS products |
| Upwork/Fiverr | Profile বানাও, proposals পাঠাও | Service work |
| LinkedIn | Content post করো → DMs আসবে | B2B clients |
| Reddit | r/entrepreneur, r/automation, r/SaaS | Community |
| Your Store (LinearAI) | Direct sales, branding | Long-term |

## 7.4 Content Marketing (Free Client এর উপায়)

```
সপ্তাহে ২টা LinkedIn post:
Post 1: "I automated X for a client, here's how" (case study)
Post 2: "Free template: n8n workflow for Y" (lead magnet)

প্রতিটা post শেষে:
"Want this set up for your business? DM me or book a call."

এভাবে ৩ মাসে first 5 clients আসবে।
```

## 7.5 এই Week থেকেই শুরু করো

```
Day 1-2: Python scripts practice (file organizer, PDF tool)
Day 3-4: একটা complete project build করো যেটা sellable
Day 5: Video record করো Loom দিয়ে (demo)
Day 6: Gumroad এ list করো ($49 দিয়ে শুরু করো)
Day 7: LinkedIn এ post করো এটা নিয়ে
```

---

# QUICK REFERENCE — সব Library একজায়গায়

## Install Commands
```bash
# File & PDF
pip install pathlib pypdf reportlab openpyxl

# Data Science
pip install pandas numpy matplotlib plotly scikit-learn streamlit

# Web Scraping
pip install requests beautifulsoup4 playwright httpx
playwright install chromium

# Scheduling & Email
pip install schedule APScheduler

# AI/LLM
pip install openai anthropic langchain langchain-openai chromadb

# Web Framework (APIs, Webhooks)
pip install flask fastapi uvicorn

# Utilities
pip install python-dotenv joblib tqdm rich
```

## .env File — Secrets Manage করো
```bash
# .env file এ রাখো (GitHub এ push করো না!)
OPENAI_API_KEY=sk-...
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx
STRIPE_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://...
```

```python
# Python এ load করো
from dotenv import load_dotenv
import os

load_dotenv()
openai_key = os.getenv("OPENAI_API_KEY")
```

---

# LEARNING RESOURCES

## বিনামূল্যে সেরা Resources
```
Python Scripting:
- docs.python.org/3/tutorial (official)
- realpython.com (best tutorials)
- automatetheboringstuff.com (free book!)

Web Scraping:
- playwright.dev/python/docs
- beautiful-soup-4.readthedocs.io

Data Science:
- pandas.pydata.org/docs
- kaggle.com (free courses + datasets)
- streamlit.io/gallery (examples)

AI/LLM:
- platform.openai.com/docs
- docs.langchain.com
- python.langchain.com/docs

n8n:
- docs.n8n.io
- n8n.io/workflows (template library)

Sell করার জন্য:
- gumroad.com/university
- lemonsqueezy.com/help
```

## Practice Datasets (বিনামূল্যে)
```
kaggle.com/datasets → হাজারো free dataset
data.world → business datasets
github.com/datasets → curated datasets
```

---

# FINAL ADVICE

> "শেখো → বানাও → বিক্রি করো → আবার শেখো"

এই loop টাই তোমাকে professional করবে। প্রতিটা নতুন skill শিখলে সাথে সাথে একটা sellable product বানাও। Notes পড়া শেষ হলে practice না করলে কিছুই কাজে আসবে না।

**তোমার strongest advantage**: তুমি already fullstack web app বানাতে পারো। এই skill এর সাথে Python automation + AI add করলে তুমি এমন কিছু offer করতে পারবে যেটা most automation sellers পারে না — end-to-end solution।

শুভকামনা।

---
*Generated by Claude | LinearAI Automation Notes | 2024*
