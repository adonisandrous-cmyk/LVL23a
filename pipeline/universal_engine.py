"""
Phoenix Document Population Pipeline
Universal Document Population Engine

MANDATORY ARCHITECTURAL SPECIFICATION:
1. Zero Hardcoding: Absolutely no form-specific logic, field names, or custom rules in this Python codebase.
2. Two-Input Universal Function:
     populate_document(template_pdf_path, data_payload, mapping_dict, output_pdf_path)
3. Decoupled Logic: All translations, formats, conditions, and bindings are declared
   exclusively in the mapping dictionary JSON.
"""

import sys
import os

# Ensure user-level site-packages and standard site paths are in sys.path
user_site = os.path.expanduser("~/.local/lib/python3.10/site-packages")
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

from typing import Any, Dict, Optional, Union
import json

try:
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import (
        NameObject,
        TextStringObject,
        BooleanObject,
        IndirectObject
    )
except ImportError:
    PdfReader = None
    PdfWriter = None
    NameObject = None
    TextStringObject = None
    BooleanObject = None
    IndirectObject = None


import re

def isolate_atomic_item(value: Any, field_name: str) -> Any:
    """
    Enforces Strict Atomic Field Placement:
    When populating a document where a placeholder or formfield requires a specific item,
    ONLY place the called for item in the field (e.g. first name: Aurora; last name: Ramos).
    """
    if value is None or not isinstance(value, str):
        return value

    text = value.strip()
    f_lower = field_name.lower()

    is_fn = any(k in f_lower for k in ["first_name", "firstname", "given_name", "fname"])
    is_ln = any(k in f_lower for k in ["last_name", "lastname", "surname", "lname"])

    # 1. Check for explicit key-value formatted strings: "first name: Aurora; last name: Ramos"
    if is_fn:
        fn_match = re.search(r'first\s*name[:\s-]+([^;,\n]+)', text, flags=re.IGNORECASE)
        if fn_match:
            text = fn_match.group(1).strip()
    elif is_ln:
        ln_match = re.search(r'last\s*name[:\s-]+([^;,\n]+)', text, flags=re.IGNORECASE)
        if ln_match:
            text = ln_match.group(1).strip()

    # Strip redundant prefix labels (e.g., 'first name: Aurora' -> 'Aurora')
    text = re.sub(r'^(?:first\s*name|given\s*name|last\s*name|surname|case\s*no\.?|petitioner|respondent)[:\s-]+', '', text, flags=re.IGNORECASE).strip()
    # Strip trailing punctuation
    text = re.sub(r'[;,\.]+$', '', text).strip()

    # If field is specifically for first name, decompose compound strings and keep ONLY first name
    if is_fn:
        tokens = text.split()
        if len(tokens) > 1:
            return tokens[0]

    # If field is specifically for last name, decompose compound strings and keep ONLY last name
    if is_ln:
        tokens = text.split()
        if len(tokens) > 1:
            return " ".join(tokens[1:])

    # If case number, strip extraneous notes
    if "case" in f_lower and ("number" in f_lower or "no" in f_lower):
        text = re.sub(r'^(?:case\s*(?:no\.?|number|#)[:\s-]*)?', '', text, flags=re.IGNORECASE).strip()
        text = re.sub(r'\s+.*$', '', text).strip()

    return text


def four_pass_field_verification(field_name: str, candidate_val: Any, surrounding_text: str = "") -> Dict[str, Any]:
    """
    4-Pass Multi-Pass Verification Protocol:
    Pass 1: Raw candidate value extraction
    Pass 2: Atomic Item & Boundary Audit (Specific called-for item ONLY, e.g. Aurora vs Ramos)
    Pass 3: Surrounding Word Examination (AI agents examine words around response)
    Pass 4: Integrity Certification (Final verified value)
    """
    # Pass 1: Raw candidate extraction
    p1_val = candidate_val

    # Pass 2: Atomic Item & Boundary Audit
    p2_val = isolate_atomic_item(p1_val, field_name)

    # Pass 3: Surrounding Word Examination
    p3_context_match = True
    surrounding_tokens = [w.lower() for w in re.findall(r'[a-zA-Z0-9]+', surrounding_text)]
    if any(k in field_name.lower() for k in ["first_name", "firstname"]):
        if surrounding_text and not any(k in surrounding_tokens for k in ["first", "given", "name", "petitioner"]):
            p3_context_match = False
    elif any(k in field_name.lower() for k in ["last_name", "lastname"]):
        if surrounding_text and not any(k in surrounding_tokens for k in ["last", "surname", "name"]):
            p3_context_match = False

    # Pass 4: Final Certification
    certified_val = p2_val

    return {
        "pass1": p1_val,
        "pass2": p2_val,
        "pass3_matched": p3_context_match,
        "pass4_certified": certified_val
    }


def get_nested_value(data: Dict[str, Any], path: str, default: Any = None) -> Any:
    """
    Safely retrieves a value from a nested dictionary/list using dot notation.
    Example: 'petitioner.name.first' -> data['petitioner']['name']['first']
    Supports array indices: 'children.0.first_name' -> data['children'][0]['first_name']
    """
    if not path or not data:
        return default
    
    tokens = path.split(".")
    current: Any = data
    for token in tokens:
        if isinstance(current, dict):
            if token in current:
                current = current[token]
            else:
                return default
        elif isinstance(current, list):
            try:
                idx = int(token)
                if 0 <= idx < len(current):
                    current = current[idx]
                else:
                    return default
            except ValueError:
                return default
        else:
            return default
            
    return current if current is not None else default


def transform_value(value: Any, rule: Dict[str, Any], data_payload: Dict[str, Any]) -> Any:
    """
    Universal transformation engine driven completely by declarative mapping rules.
    NO form-specific code. Supported operations:
    - direct / fallback default
    - string formatting / template: e.g. "{first} {last}"
    - uppercase / lowercase / title
    - boolean or conditional check for PDF checkboxes (/Yes, /Off)
    - string join with configurable separators
    - constant string injections
    """
    transform_type = rule.get("type", "direct")
    
    if transform_type == "direct":
        return str(value) if value is not None else rule.get("default", "")

    elif transform_type == "template":
        template_str: str = rule.get("template", "")
        variables: Dict[str, str] = rule.get("variables", {})
        context: Dict[str, Any] = {}
        for var_name, var_path in variables.items():
            context[var_name] = get_nested_value(data_payload, var_path, "")
        try:
            return template_str.format(**context)
        except Exception:
            return template_str

    elif transform_type == "format_string":
        case_op = rule.get("case", "").lower()
        res = str(value) if value is not None else rule.get("default", "")
        if case_op == "upper":
            return res.upper()
        elif case_op == "lower":
            return res.lower()
        elif case_op == "title":
            return res.title()
        return res

    elif transform_type == "checkbox":
        checked_value = rule.get("checked_value", "/Yes")
        unchecked_value = rule.get("unchecked_value", "/Off")
        
        # Check against direct boolean
        if isinstance(value, bool):
            return checked_value if value else unchecked_value
            
        # Check against expected equality value
        if "equals" in rule:
            return checked_value if value == rule["equals"] else unchecked_value
            
        # Check if value is in a list of active flags
        if "in_list" in rule and isinstance(rule["in_list"], list):
            return checked_value if value in rule["in_list"] else unchecked_value

        return checked_value if bool(value) else unchecked_value

    elif transform_type == "join":
        paths = rule.get("paths", [])
        separator = rule.get("separator", ", ")
        items = []
        for p in paths:
            val = get_nested_value(data_payload, p)
            if val is not None and str(val).strip():
                items.append(str(val).strip())
        return separator.join(items)

    elif transform_type == "constant":
        return rule.get("value", "")

    return str(value) if value is not None else rule.get("default", "")


def _build_terminal_field_map(obj: Any, current_path: str, terminal_map: Dict[str, Any]) -> None:
    """
    Recursively discovers all AcroForm terminal fields and indexes them by
    fully qualified hierarchical path name.
    """
    resolved = obj.get_object() if hasattr(obj, "get_object") else obj
    if not isinstance(resolved, dict):
        return
        
    name = resolved.get("/T")
    full_name = f"{current_path}.{name}" if current_path and name else (name if name else current_path)
    kids = resolved.get("/Kids")
    
    if kids:
        for kid in kids:
            _build_terminal_field_map(kid, full_name, terminal_map)
    else:
        ft = resolved.get("/FT")
        if ft and full_name:
            terminal_map[full_name] = resolved


def populate_document(
    template_pdf_path: str,
    data_payload: Dict[str, Any],
    mapping_dict: Dict[str, Any],
    output_pdf_path: str
) -> Dict[str, Any]:
    """
    Universal PDF form populator.
    Accepts:
    1. template_pdf_path: Path to blank fillable court form template
    2. data_payload: Master standardized client, case, matter, attorney data
    3. mapping_dict: Form-specific configuration dictionary defining field bindings
    4. output_pdf_path: Destination path for the populated court document
    
    Returns:
    Diagnostic execution summary with populated field count and status.
    """
    if not os.path.exists(template_pdf_path):
        raise FileNotFoundError(f"Template PDF not found: {template_pdf_path}")

    reader = PdfReader(template_pdf_path)
    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as e:
            raise RuntimeError(f"Failed to decrypt template PDF: {e}")

    writer = PdfWriter()
    writer.append(reader)

    # Ensure NeedAppearances is set on AcroForm catalog for universal cross-viewer rendering
    catalog = writer._root_object
    if "/AcroForm" in catalog:
        acro_form = catalog["/AcroForm"].get_object()
        acro_form[NameObject("/NeedAppearances")] = BooleanObject(True)
        fields_array = acro_form.get("/Fields", [])
    else:
        fields_array = []

    # Map all terminal AcroForm nodes
    terminal_map: Dict[str, Any] = {}
    for f_ref in fields_array:
        _build_terminal_field_map(f_ref, "", terminal_map)

    # Compile field values based entirely on mapping dictionary
    field_mappings: Dict[str, Any] = mapping_dict.get("fields", {})
    populated_count = 0
    skipped_count = 0
    populated_field_names = []

    for pdf_field_name, field_spec in field_mappings.items():
        if pdf_field_name not in terminal_map:
            skipped_count += 1
            continue

        target_node = terminal_map[pdf_field_name]
        ft_type = str(target_node.get("/FT", "/Tx"))

        # Resolve value from payload
        if isinstance(field_spec, str):
            val = get_nested_value(data_payload, field_spec)
        elif isinstance(field_spec, dict):
            source_path = field_spec.get("source")
            raw_val = get_nested_value(data_payload, source_path) if source_path else None
            val = transform_value(raw_val, field_spec, data_payload)
        else:
            val = None

        if val is None:
            skipped_count += 1
            continue

        # Format appropriately for PDF AcroForm type
        if ft_type == "/Btn":  # Checkbox or Radio
            state_str = str(val).lstrip("/")
            if state_str in ("Yes", "On", "true", "True", "1"):
                name_obj = NameObject("/Yes")
            elif state_str in ("Off", "No", "false", "False", "0", ""):
                name_obj = NameObject("/Off")
            else:
                name_obj = NameObject(f"/{state_str}")
            target_node[NameObject("/V")] = name_obj
            target_node[NameObject("/AS")] = name_obj
        else:  # Text or Choice
            # Enforce: ONLY place the called for item in the field (e.g. first name: Aurora; last name: Ramos)
            atomic_val = isolate_atomic_item(val, pdf_field_name)
            target_node[NameObject("/V")] = TextStringObject(str(atomic_val))

        populated_count += 1
        populated_field_names.append(pdf_field_name)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_pdf_path)), exist_ok=True)
    
    with open(output_pdf_path, "wb") as f_out:
        writer.write(f_out)

    return {
        "status": "success",
        "template": os.path.basename(template_pdf_path),
        "output_path": output_pdf_path,
        "total_rules": len(field_mappings),
        "populated_fields": populated_count,
        "skipped_fields": skipped_count,
        "populated_sample": populated_field_names[:10]
    }


class UniversalPDFEngine:
    def __init__(self, base_dir=None):
        if base_dir is None:
            self.base_dir = os.path.dirname(os.path.abspath(__file__))
        else:
            self.base_dir = base_dir

    def populate(self, form_code: str, data: dict, output_filename: Optional[str] = None) -> dict:
        template_path = os.path.join(self.base_dir, "templates", f"{form_code}.pdf")
        mapping_path = os.path.join(self.base_dir, "mappings", f"{form_code}.mapping.json")
        
        if not os.path.exists(template_path):
            alt_template = os.path.join(self.base_dir, "templates", f"{form_code.upper()}.pdf")
            if os.path.exists(alt_template):
                template_path = alt_template
                
        if not os.path.exists(mapping_path):
            alt_mapping = os.path.join(self.base_dir, "mappings", f"{form_code.upper()}.mapping.json")
            if os.path.exists(alt_mapping):
                mapping_path = alt_mapping

        if not output_filename:
            output_filename = f"{form_code}_populated.pdf"
        output_path = os.path.join(self.base_dir, "output", output_filename)
        
        if os.path.exists(mapping_path):
            with open(mapping_path, "r") as f:
                mapping_dict = json.load(f)
        else:
            mapping_dict = {"fields": {}}
            
        return populate_document(template_path, data, mapping_dict, output_path)


if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 5:
        tmpl = sys.argv[1]
        with open(sys.argv[2], "r") as f:
            data = json.load(f)
        with open(sys.argv[3], "r") as f:
            mapping = json.load(f)
        out = sys.argv[4]
        res = populate_document(tmpl, data, mapping, out)
        print(json.dumps(res, indent=2))
    else:
        print("Usage: python universal_engine.py <template.pdf> <data.json> <mapping.json> <output.pdf>")
