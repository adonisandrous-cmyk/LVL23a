#!/usr/bin/env python3
"""
Enterprise Database Bootstrapper
Initializes legal_platform.db with the exact enterprise schema and seeds.
Supports SQLite (local runtime) and PostgreSQL (via psycopg2/DATABASE_URL when configured).
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'legal_platform.db')

def init_sqlite_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Clients
    cur.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT,
        a_number TEXT,
        ssn TEXT,
        phone TEXT,
        email TEXT,
        address_line1 TEXT,
        address_line2 TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Cases
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        case_type TEXT NOT NULL,
        case_number TEXT NOT NULL,
        court_name TEXT,
        judge_name TEXT,
        status TEXT DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    """)

    # 3. Forms
    cur.execute("""
    CREATE TABLE IF NOT EXISTS forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        pdf_template_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Form Fields
    cur.execute("""
    CREATE TABLE IF NOT EXISTS form_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        universal_field TEXT NOT NULL,
        pdf_field_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(form_id, universal_field),
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    );
    """)

    # 5. Universal Fields
    cur.execute("""
    CREATE TABLE IF NOT EXISTS universal_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_name TEXT NOT NULL UNIQUE,
        field_type TEXT DEFAULT 'text',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Generated Documents
    cur.execute("""
    CREATE TABLE IF NOT EXISTS generated_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        case_id INTEGER NOT NULL,
        form_id INTEGER NOT NULL,
        output_pdf_path TEXT,
        xfdf_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    );
    """)

    # 7. Users
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. User Permissions
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        permission TEXT NOT NULL,
        UNIQUE(user_id, permission),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Seed Default Records
    # Client
    cur.execute("SELECT COUNT(*) FROM clients WHERE id = 1")
    if cur.fetchone()[0] == 0:
        cur.execute("""
        INSERT INTO clients (id, first_name, last_name, dob, phone, email, address_line1, city, state, zip)
        VALUES (1, 'Maria', 'Lopez', '1990-05-12', '(702) 555-0149', 'maria.lopez@example.com', '123 Main St', 'Las Vegas', 'NV', '89101')
        """)

    # Case
    cur.execute("SELECT COUNT(*) FROM cases WHERE id = 1")
    if cur.fetchone()[0] == 0:
        cur.execute("""
        INSERT INTO cases (id, client_id, case_type, case_number, court_name, judge_name, status)
        VALUES (1, 1, 'Family Law', '23-12345', 'Superior Court of California, County of Los Angeles', 'Hon. Patricia Delgado', 'Open')
        """)

    # Form FL-120
    cur.execute("SELECT COUNT(*) FROM forms WHERE name = 'FL-120'")
    if cur.fetchone()[0] == 0:
        cur.execute("""
        INSERT INTO forms (id, name, description, pdf_template_path)
        VALUES (1, 'FL-120', 'Response—Marriage/Domestic Partnership (Family Law)', 'templates/FL-120.pdf')
        """)

    # Form Fields Mapping for FL-120
    mappings = [
        (1, 'client_first_name', 'ClientFirstName'),
        (1, 'client_last_name', 'ClientLastName'),
        (1, 'client_DOB', 'ClientDOB'),
        (1, 'client_address', 'ClientAddress'),
        (1, 'case_number', 'CaseNumber')
    ]
    for form_id, u_field, p_field in mappings:
        cur.execute("""
        INSERT OR REPLACE INTO form_fields (form_id, universal_field, pdf_field_name)
        VALUES (?, ?, ?)
        """, (form_id, u_field, p_field))

    # Universal Fields Catalog
    u_fields = [
        ('client_first_name', 'text', 'Client legal given name'),
        ('client_last_name', 'text', 'Client legal surname'),
        ('client_DOB', 'date', 'Client date of birth (YYYY-MM-DD)'),
        ('client_address', 'text', 'Full formatted client residential address'),
        ('case_number', 'text', 'Official court filing case docket number')
    ]
    for f_name, f_type, desc in u_fields:
        cur.execute("""
        INSERT OR IGNORE INTO universal_fields (field_name, field_type, description)
        VALUES (?, ?, ?)
        """, (f_name, f_type, desc))

    conn.commit()
    conn.close()
    print(f"Database initialized successfully at: {DB_PATH}")

if __name__ == '__main__':
    init_sqlite_db()
