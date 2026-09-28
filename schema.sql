-- ==============================================================================
-- ENTERPRISE DATABASE SCHEMA (LEGAL AUTOMATION PLATFORM)
-- Production-Ready PostgreSQL DDL
-- Compatible with PostgreSQL 12+ and SQLite3
-- ==============================================================================

-- 1. CLIENTS (People)
-- Stores all client personal, identification, and demographic data
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE,
    a_number VARCHAR(20),
    ssn VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(150),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients(last_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_a_number ON clients(a_number);

-- 2. CASES (Matters)
-- Each client can have multiple cases / matters
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    case_type VARCHAR(100) NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    court_name VARCHAR(200),
    judge_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- 3. FORMS LIBRARY (Official PDFs + Metadata)
-- Central catalog of court and agency forms (FL-120, EOIR-33, I-589, etc.)
CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    pdf_template_path VARCHAR(300) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forms_name ON forms(name);

-- 4. FORM FIELD MAPPINGS (Universal Field -> PDF AcroForm Field)
-- Declarative mapping dictionary linking universal client/case data to official PDF form targets
CREATE TABLE IF NOT EXISTS form_fields (
    id SERIAL PRIMARY KEY,
    form_id INT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    universal_field VARCHAR(100) NOT NULL,
    pdf_field_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, universal_field)
);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);

-- 5. UNIVERSAL DATA MODEL (Master Field Catalog)
-- Defines standard universal attributes across all legal practice areas
CREATE TABLE IF NOT EXISTS universal_fields (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL UNIQUE,
    field_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. GENERATED DOCUMENTS (History & Enterprise Audit Trail)
-- Immutable audit record of every generated form and XFDF output
CREATE TABLE IF NOT EXISTS generated_documents (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    case_id INT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    form_id INT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    output_pdf_path VARCHAR(300),
    xfdf_path VARCHAR(300) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gen_docs_client ON generated_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_case ON generated_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_form ON generated_documents(form_id);

-- 7. USERS (Multi-Attorney & Staff Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(300) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. USER PERMISSIONS (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    UNIQUE(user_id, permission)
);

-- ==============================================================================
-- INITIAL SEED DATA (California Judicial Council FL-120 & Sample Client)
-- ==============================================================================

-- Seed Sample Client
INSERT INTO clients (first_name, last_name, dob, phone, email, address_line1, city, state, zip)
VALUES ('Maria', 'Lopez', '1990-05-12', '(702) 555-0149', 'maria.lopez@example.com', '123 Main St', 'Las Vegas', 'NV', '89101')
ON CONFLICT DO NOTHING;

-- Seed Sample Case
INSERT INTO cases (client_id, case_type, case_number, court_name, judge_name, status)
VALUES (1, 'Family Law', '23-12345', 'Superior Court of California, County of Los Angeles', 'Hon. Patricia Delgado', 'Open')
ON CONFLICT DO NOTHING;

-- Seed Form FL-120
INSERT INTO forms (name, description, pdf_template_path)
VALUES ('FL-120', 'Response—Marriage/Domestic Partnership (Family Law)', 'templates/FL-120.pdf')
ON CONFLICT (name) DO UPDATE SET pdf_template_path = EXCLUDED.pdf_template_path;

-- Seed Universal Fields
INSERT INTO universal_fields (field_name, field_type, description) VALUES
('client_first_name', 'text', 'Client legal given name'),
('client_last_name', 'text', 'Client legal surname'),
('client_DOB', 'date', 'Client date of birth (YYYY-MM-DD)'),
('client_address', 'text', 'Full formatted client residential address'),
('case_number', 'text', 'Official court filing case docket number')
ON CONFLICT DO NOTHING;

-- Seed FL-120 Form Fields Mapping
INSERT INTO form_fields (form_id, universal_field, pdf_field_name) VALUES
(1, 'client_first_name', 'ClientFirstName'),
(1, 'client_last_name', 'ClientLastName'),
(1, 'client_DOB', 'ClientDOB'),
(1, 'client_address', 'ClientAddress'),
(1, 'case_number', 'CaseNumber')
ON CONFLICT (form_id, universal_field) DO UPDATE SET pdf_field_name = EXCLUDED.pdf_field_name;
