#!/usr/bin/env python3
"""
Enterprise Database Bridge & CLI RPC Provider
Provides high-performance, sanitized JSON-RPC queries between Node.js Express server
and the SQLite/PostgreSQL relational database.
"""

import os
import sys
import json
import sqlite3
from generate_form import (
    generate_from_db,
    grab_form,
    route_file_to_matter,
    list_client_matter_files,
    delete_matter_file,
    sentry_audit_matter,
    execute_executive_directive,
    list_drive_inbox_files,
    upload_to_drive_inbox,
    route_drive_inbox_file,
    auto_route_drive_inbox,
    STANDARD_SUBFOLDERS,
    DB_PATH,
    get_db_connection
)

def query_all(query, params=()):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def query_one(query, params=()):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, params)
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def execute_write(query, params=()):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, params)
    conn.commit()
    last_id = cur.lastrowid
    conn.close()
    return last_id

def handle_rpc(payload):
    action = payload.get("action")

    if action == "get_clients":
        return query_all("SELECT * FROM clients ORDER BY id ASC")

    elif action == "get_client":
        client_id = payload.get("id")
        return query_one("SELECT * FROM clients WHERE id = ?", (client_id,))

    elif action == "create_client":
        d = payload.get("data", {})
        c_id = execute_write("""
            INSERT INTO clients (first_name, last_name, dob, phone, email, address_line1, city, state, zip, a_number, ssn)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            d.get("first_name", ""),
            d.get("last_name", ""),
            d.get("dob", ""),
            d.get("phone", ""),
            d.get("email", ""),
            d.get("address_line1", ""),
            d.get("city", ""),
            d.get("state", ""),
            d.get("zip", ""),
            d.get("a_number", ""),
            d.get("ssn", "")
        ))
        return query_one("SELECT * FROM clients WHERE id = ?", (c_id,))

    elif action == "update_client":
        c_id = payload.get("id")
        d = payload.get("data", {})
        execute_write("""
            UPDATE clients 
            SET first_name = ?, last_name = ?, dob = ?, phone = ?, email = ?, 
                address_line1 = ?, city = ?, state = ?, zip = ?, a_number = ?, ssn = ?
            WHERE id = ?
        """, (
            d.get("first_name", ""),
            d.get("last_name", ""),
            d.get("dob", ""),
            d.get("phone", ""),
            d.get("email", ""),
            d.get("address_line1", ""),
            d.get("city", ""),
            d.get("state", ""),
            d.get("zip", ""),
            d.get("a_number", ""),
            d.get("ssn", ""),
            c_id
        ))
        return query_one("SELECT * FROM clients WHERE id = ?", (c_id,))

    elif action == "get_cases":
        client_id = payload.get("client_id")
        if client_id:
            return query_all("SELECT * FROM cases WHERE client_id = ? ORDER BY id ASC", (client_id,))
        return query_all("""
            SELECT c.*, cl.first_name, cl.last_name 
            FROM cases c 
            JOIN clients cl ON c.client_id = cl.id 
            ORDER BY c.id ASC
        """)

    elif action == "create_case":
        d = payload.get("data", {})
        case_id = execute_write("""
            INSERT INTO cases (client_id, case_type, case_number, court_name, judge_name, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            d.get("client_id", 1),
            d.get("case_type", "General Legal"),
            d.get("case_number", "CASE-001"),
            d.get("court_name", "Superior Court"),
            d.get("judge_name", ""),
            d.get("status", "Open")
        ))
        return query_one("SELECT * FROM cases WHERE id = ?", (case_id,))

    elif action == "update_case":
        case_id = payload.get("id")
        d = payload.get("data", {})
        execute_write("""
            UPDATE cases 
            SET case_type = ?, case_number = ?, court_name = ?, judge_name = ?, status = ?
            WHERE id = ?
        """, (
            d.get("case_type", "General Legal"),
            d.get("case_number", "CASE-001"),
            d.get("court_name", "Superior Court"),
            d.get("judge_name", ""),
            d.get("status", "Open"),
            case_id
        ))
        return query_one("SELECT * FROM cases WHERE id = ?", (case_id,))

    elif action == "get_forms":
        forms = query_all("SELECT * FROM forms ORDER BY id ASC")
        for f in forms:
            mappings = query_all("SELECT universal_field, pdf_field_name FROM form_fields WHERE form_id = ?", (f["id"],))
            f["fields"] = {m["universal_field"]: m["pdf_field_name"] for m in mappings}
        return forms

    elif action == "get_form_fields":
        form_id = payload.get("form_id")
        return query_all("SELECT * FROM form_fields WHERE form_id = ? ORDER BY id ASC", (form_id,))

    elif action == "save_form_field":
        form_id = payload.get("form_id")
        u_field = payload.get("universal_field")
        p_field = payload.get("pdf_field_name")
        execute_write("""
            INSERT OR REPLACE INTO form_fields (form_id, universal_field, pdf_field_name)
            VALUES (?, ?, ?)
        """, (form_id, u_field, p_field))
        return {"status": "success", "form_id": form_id, "universal_field": u_field, "pdf_field_name": p_field}

    elif action == "get_documents":
        return query_all("""
            SELECT g.*, c.first_name, c.last_name, cs.case_number, cs.case_type, f.name as form_name
            FROM generated_documents g
            JOIN clients c ON g.client_id = c.id
            JOIN cases cs ON g.case_id = cs.id
            JOIN forms f ON g.form_id = f.id
            ORDER BY g.id DESC
        """)

    elif action == "generate_form":
        form_name = payload.get("form_name", "FL-120")
        client_id = payload.get("client_id", 1)
        case_id = payload.get("case_id", 1)
        override_fields = payload.get("override_fields")
        res = generate_from_db(form_name, client_id, case_id, override_fields=override_fields)
        return res

    elif action == "generate_form_custom":
        form_name = payload.get("form_name", "FL-120")
        client_id = payload.get("client_id", 1)
        case_id = payload.get("case_id", 1)
        override_fields = payload.get("override_fields", {})
        res = generate_from_db(form_name, client_id, case_id, override_fields=override_fields)
        return res

    elif action == "list_client_files":
        client_id = payload.get("client_id")
        return list_client_matter_files(client_id)

    elif action == "route_file":
        source_path = payload.get("source_path")
        client_id = payload.get("client_id")
        case_id = payload.get("case_id")
        dest_filename = payload.get("destination_filename")
        return route_file_to_matter(source_path, client_id, case_id, dest_filename)

    elif action == "delete_matter_file":
        file_path = payload.get("file_path")
        return delete_matter_file(file_path)

    elif action == "sentry_audit":
        client_id = payload.get("client_id", 1)
        case_id = payload.get("case_id", 1)
        return sentry_audit_matter(client_id, case_id)

    elif action == "execute_executive_directive":
        directive = payload.get("directive", "")
        params = payload.get("params", {})
        return execute_executive_directive(directive, params)

    elif action == "list_drive_inbox":
        return list_drive_inbox_files()

    elif action == "upload_to_drive_inbox":
        file_name = payload.get("file_name", "unnamed_artifact.pdf")
        file_text = payload.get("file_text")
        return upload_to_drive_inbox(file_name, file_text=file_text)

    elif action == "route_drive_inbox_file":
        file_name = payload.get("file_name")
        client_id = payload.get("client_id", 1)
        case_id = payload.get("case_id", 1)
        dest_subfolder = payload.get("destination_subfolder")
        return route_drive_inbox_file(file_name, client_id, case_id, dest_subfolder)

    elif action == "auto_route_drive_inbox":
        return auto_route_drive_inbox()

    elif action == "get_subfolder_taxonomy":
        return STANDARD_SUBFOLDERS

    elif action == "save_mapping_json":
        form_name = payload.get("form_name", "").upper()
        mapping_data = payload.get("mapping_data", {})
        mapping_path = f"forms/{form_name}.mapping.json"
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(mapping_data, f, indent=2)

        # Update DB form_fields
        form_rec = query_one("SELECT id FROM forms WHERE name = ?", (form_name,))
        if form_rec:
            form_id = form_rec["id"]
            fields = mapping_data.get("fields", {})
            for u, p in fields.items():
                execute_write("""
                    INSERT OR REPLACE INTO form_fields (form_id, universal_field, pdf_field_name)
                    VALUES (?, ?, ?)
                """, (form_id, u, p))

        return {"status": "saved", "form_name": form_name, "path": mapping_path}

    elif action == "grab_form":
        form_name = payload.get("form_name")
        practice_type = payload.get("practice_type", "Family Law")
        description = payload.get("description")
        template_source = payload.get("template_source")
        return grab_form(form_name, practice_type, description, template_source)

    elif action == "get_templates":
        templates_dir = "templates"
        results = []
        if os.path.exists(templates_dir):
            db_forms = {f["name"].upper(): f for f in query_all("SELECT * FROM forms")}
            for f in sorted(os.listdir(templates_dir)):
                if f.endswith('.pdf'):
                    fpath = os.path.join(templates_dir, f)
                    code = f[:-4].upper()
                    fsize = os.path.getsize(fpath)
                    mapping_path = f"forms/{code}.mapping.json"
                    has_mapping = os.path.exists(mapping_path)
                    db_rec = db_forms.get(code)
                    results.append({
                        "file_name": f,
                        "form_code": code,
                        "path": fpath,
                        "size_bytes": fsize,
                        "has_mapping": has_mapping,
                        "mapping_file": mapping_path if has_mapping else None,
                        "registered_in_db": db_rec is not None,
                        "description": db_rec["description"] if db_rec else f"{code} Official Court Template"
                    })
        return results

    elif action == "list_vault":
        vault = {}
        if os.path.exists("output"):
            cases_lookup = {c["case_number"]: c for c in query_all("""
                SELECT cs.*, cl.first_name, cl.last_name 
                FROM cases cs JOIN clients cl ON cs.client_id = cl.id
            """)}
            for root, dirs, files in os.walk("output"):
                rel = os.path.relpath(root, ".")
                parts = rel.split(os.sep)
                if len(parts) >= 3 and parts[0] == "output":
                    p_type = parts[1]
                    docket = parts[2]
                    key = f"{p_type}/{docket}"
                    if key not in vault:
                        c_info = cases_lookup.get(docket, {})
                        vault[key] = {
                            "practice_type": p_type.replace('_', ' '),
                            "case_number": docket,
                            "vault_dir": rel,
                            "client_name": f"{c_info.get('first_name', '')} {c_info.get('last_name', '')}".strip() or "Client",
                            "files": []
                        }
                    for f in files:
                        if f.endswith(('.xfdf', '.pdf')) and not f.startswith('.'):
                            fpath = os.path.join(root, f)
                            vault[key]["files"].append({
                                "file_name": f,
                                "path": fpath,
                                "url": f"/{fpath}",
                                "type": "xfdf" if f.endswith('.xfdf') else "pdf",
                                "size_bytes": os.path.getsize(fpath)
                            })
        return list(vault.values())

    elif action == "get_universal_fields":
        return query_all("SELECT * FROM universal_fields ORDER BY id ASC")

    elif action == "register_form":
        data = payload.get("data", {})
        form_id = data.get("id")
        name = data.get("name")
        description = data.get("description", "")
        pdf_template_path = data.get("pdf_template_path")
        fields = data.get("fields", {})

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT OR REPLACE INTO forms (id, name, description, pdf_template_path)
            VALUES (?, ?, ?, ?)
        """, (form_id, name, description, pdf_template_path))

        for u, p in fields.items():
            cur.execute("""
                INSERT OR REPLACE INTO form_fields (form_id, universal_field, pdf_field_name)
                VALUES (?, ?, ?)
            """, (form_id, u, p))

        conn.commit()
        conn.close()
        return {"id": form_id, "name": name, "fields_registered": len(fields)}

    else:
        raise ValueError(f"Unknown RPC action: {action}")

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            sys.exit(0)
        req = json.loads(raw_input)
        data = handle_rpc(req)
        print(json.dumps({"success": True, "data": data}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == '__main__':
    main()
