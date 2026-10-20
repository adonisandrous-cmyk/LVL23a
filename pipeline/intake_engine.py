"""
Phoenix Legal Technology Engine - 4-Part Intake Detection & Automated Mapping Pipeline
Architecture: Universal DB -> Mapping JSON -> XFDF Generator -> Official Unaltered PDF

CANONICAL APP-READY FIELD STRUCTURE (STRICT CONTRACT):
Part 1: Client_FirstName, Client_LastName, Client_DOB, Client_Address_Street, Client_Address_CityStateZip, Client_Phone, Client_Email
Part 2: Other_FirstName, Other_LastName, Other_Address_Street, Other_Address_CityStateZip, Other_Phone, Other_Email
Part 3: Court_Name, Court_County, Court_CaseNumber, Court_OpposingParty_FullName, Court_HearingDates, Court_JudgeName
Part 4: Case_AssistanceType, Case_IncidentDescription, Case_FileUpload
"""

import os
import json
import re
from typing import Dict, Any, List, Optional
from xml.etree.ElementTree import Element, SubElement, tostring
from universal_engine import isolate_atomic_item


def sanitize_court_case_number(raw_case_num: Any) -> str:
    """
    Standardizes court docket / case numbers to clean alphanumeric characters and hyphens only.
    Prevents parsing and SQL injection errors across county clerk docket systems.
    Example: ' 24-FL--009412# ' -> '24-FL-009412'
    """
    if not raw_case_num:
        return ""
    cleaned = re.sub(r"[^A-Za-z0-9\-]", "", str(raw_case_num)).strip()
    # Normalize double hyphens
    cleaned = re.sub(r"-+", "-", cleaned)
    return cleaned.upper()


def split_city_state_zip(address_str: str) -> Dict[str, str]:
    """
    Splits joined 'City, State, Zip' string into constituent components.
    Example: 'San Francisco, CA 94107' -> {'city': 'San Francisco', 'state': 'CA', 'zip': '94107'}
    """
    if not address_str:
        return {"city": "", "state": "CA", "zip": ""}
    
    match = re.search(r"^(.*?)(?:,\s*|\s+)([A-Za-z]{2})(?:,\s*|\s+)(\d{5}(?:-\d{4})?)$", address_str.strip())
    if match:
        return {
            "city": match.group(1).strip(),
            "state": match.group(2).strip().upper(),
            "zip": match.group(3).strip()
        }
    parts = [p.strip() for p in address_str.split(",") if p.strip()]
    city = parts[0] if len(parts) > 0 else ""
    state_zip = parts[1] if len(parts) > 1 else ""
    sz_match = re.search(r"([A-Za-z]{2})\s*(\d{5})?", state_zip)
    state = sz_match.group(1).upper() if sz_match else "CA"
    zip_code = sz_match.group(2) if sz_match and sz_match.group(2) else ""
    return {"city": city, "state": state, "zip": zip_code}


class IntakeDetectionEngine:
    """
    Parses and normalizes raw 4-part legal intake submissions into the Universal Data Model.
    Supports both nested structures and the exact App-Ready PascalCase field contract:
      Part 1: Client_FirstName, Client_LastName, Client_DOB, Client_Address_Street, Client_Address_CityStateZip, Client_Phone, Client_Email
      Part 2: Other_FirstName, Other_LastName, Other_Address_Street, Other_Address_CityStateZip, Other_Phone, Other_Email
      Part 3: Court_Name, Court_County, Court_CaseNumber, Court_OpposingParty_FullName, Court_HearingDates, Court_JudgeName
      Part 4: Case_AssistanceType, Case_IncidentDescription, Case_FileUpload
    """

    @staticmethod
    def export_canonical_app_fields(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Exports clean, standardized dictionary adhering strictly to the App-Ready Field Contract.
        Guarantees zero-loss transmission to frontend modals, database adapters, and XFDF mappers.
        """
        norm = IntakeDetectionEngine.detect_and_normalize(data)
        client = norm.get("client", {})
        other = norm.get("opposing_party", {})
        case = norm.get("case", {})
        narr = norm.get("intake_narrative", {})

        city_state_zip = f"{client.get('city', '')}, {client.get('state', 'CA')} {client.get('zip', '')}".strip()
        other_csz = f"{other.get('city', '')}, {other.get('state', 'CA')} {other.get('zip', '')}".strip()
        if other_csz == ", CA":
            other_csz = ""

        return {
            # Part 1: Personal (Self Information)
            "Client_FirstName": client.get("first_name", ""),
            "Client_LastName": client.get("last_name", ""),
            "Client_DOB": client.get("dob", ""),
            "Client_Address_Street": client.get("street", ""),
            "Client_Address_CityStateZip": city_state_zip,
            "Client_Phone": client.get("phone", ""),
            "Client_Email": client.get("email", ""),

            # Part 2: Information About Other (Opposing Party / Co-parent)
            "Other_FirstName": other.get("first_name", ""),
            "Other_LastName": other.get("last_name", ""),
            "Other_Address_Street": other.get("street", ""),
            "Other_Address_CityStateZip": other_csz,
            "Other_Phone": other.get("phone", ""),
            "Other_Email": other.get("email", ""),

            # Part 3: Court Info
            "Court_Name": case.get("court_name", "Superior Court of California"),
            "Court_County": case.get("county", ""),
            "Court_CaseNumber": sanitize_court_case_number(case.get("case_number", "")),
            "Court_OpposingParty_FullName": case.get("title_respondent", other.get("full_name", "")),
            "Court_HearingDates": case.get("hearing_dates", ""),
            "Court_JudgeName": case.get("judge_name", ""),

            # Part 4: Assistance Seeking & Incident Details
            "Case_AssistanceType": narr.get("assistance_type", "Family Law"),
            "Case_IncidentDescription": narr.get("what_happened", ""),
            "Case_FileUpload": narr.get("file_upload", "")
        }

    @staticmethod
    def detect_and_normalize(intake_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes varying input key aliases from web forms, client portals, and OCR
        into canonical dot-notation keys for the Phoenix pipeline.
        """
        # --- Part 1: Client / Self ---
        p1 = intake_data.get("part_1", {}) or intake_data.get("client", {}) or intake_data
        raw_client_first = intake_data.get("Client_FirstName") or p1.get("first_name") or p1.get("client_first_name") or ""
        raw_client_last = intake_data.get("Client_LastName") or p1.get("last_name") or p1.get("client_last_name") or ""
        raw_client_full = p1.get("full_name") or p1.get("client_name") or ""

        # Enforce atomic extraction (e.g. first name: Aurora; last name: Ramos)
        if (not raw_client_first or not raw_client_last) and raw_client_full:
            client_first = isolate_atomic_item(raw_client_full, "first_name")
            client_last = isolate_atomic_item(raw_client_full, "last_name")
        else:
            client_first = isolate_atomic_item(raw_client_first, "first_name")
            client_last = isolate_atomic_item(raw_client_last, "last_name")

        client_dob = intake_data.get("Client_DOB") or p1.get("dob") or p1.get("client_DOB") or ""
        street = intake_data.get("Client_Address_Street") or p1.get("street") or p1.get("address_line1") or p1.get("address") or ""
        csz_str = intake_data.get("Client_Address_CityStateZip") or p1.get("city_state_zip") or ""

        parsed_csz = split_city_state_zip(csz_str) if csz_str else {}
        city = p1.get("city") or parsed_csz.get("city") or ""
        state = p1.get("state") or parsed_csz.get("state") or "CA"
        zip_code = p1.get("zip") or p1.get("zip_code") or parsed_csz.get("zip") or ""
        county = p1.get("county") or intake_data.get("Court_County") or ""
        phone = intake_data.get("Client_Phone") or p1.get("phone") or p1.get("client_phone") or ""
        email = intake_data.get("Client_Email") or p1.get("email") or p1.get("client_email") or ""

        client_full = f"{client_first} {client_last}".strip() or raw_client_full or "Client"

        # --- Part 2: Opposing / Other Party ---
        p2 = intake_data.get("part_2", {}) or intake_data.get("opposing_party", {}) or intake_data
        raw_other_first = intake_data.get("Other_FirstName") or p2.get("opposing_first_name") or p2.get("other_first_name") or ""
        raw_other_last = intake_data.get("Other_LastName") or p2.get("opposing_last_name") or p2.get("other_last_name") or ""
        raw_other_full = p2.get("opposing_party_name") or p2.get("other_party_name") or ""

        if (not raw_other_first or not raw_other_last) and raw_other_full:
            other_first = isolate_atomic_item(raw_other_full, "first_name")
            other_last = isolate_atomic_item(raw_other_full, "last_name")
        else:
            other_first = isolate_atomic_item(raw_other_first, "first_name")
            other_last = isolate_atomic_item(raw_other_last, "last_name")

        other_street = intake_data.get("Other_Address_Street") or p2.get("opposing_party_address") or p2.get("other_address") or ""
        other_csz_str = intake_data.get("Other_Address_CityStateZip") or p2.get("city_state_zip") or ""
        parsed_other_csz = split_city_state_zip(other_csz_str) if other_csz_str else {}
        other_phone = intake_data.get("Other_Phone") or p2.get("opposing_party_phone") or p2.get("other_phone") or ""
        other_email = intake_data.get("Other_Email") or p2.get("opposing_party_email") or p2.get("other_email") or ""

        other_full = (
            intake_data.get("Court_OpposingParty_FullName")
            or f"{other_first} {other_last}".strip()
            or raw_other_full
            or "Other Party"
        )

        # --- Part 3: Court Info ---
        p3 = intake_data.get("part_3", {}) or intake_data.get("court_info") or intake_data.get("case", {}) or intake_data
        court_name = intake_data.get("Court_Name") or p3.get("court_name") or "Superior Court of California"
        court_county = intake_data.get("Court_County") or p3.get("county") or p3.get("court_county") or county or "Orange"
        raw_case_num = intake_data.get("Court_CaseNumber") or p3.get("case_number") or p3.get("docket_number") or ""
        case_number = sanitize_court_case_number(raw_case_num)
        judge_name = intake_data.get("Court_JudgeName") or p3.get("judge_name") or p3.get("assigned_judge") or ""
        hearing_dates = intake_data.get("Court_HearingDates") or p3.get("hearing_date") or p3.get("hearing_dates") or ""
        da_info = p3.get("da_info") or p3.get("dcss_number") or p3.get("prosecutor") or ""
        department = p3.get("court_department") or p3.get("dept") or ""

        # --- Part 4: Assistance Seeking & Narrative ---
        p4 = intake_data.get("part_4", {}) or intake_data.get("assistance", {}) or intake_data
        assist_type = (
            intake_data.get("Case_AssistanceType")
            or p4.get("assistance_type")
            or p4.get("type_of_assistance")
            or "Family Law"
        )
        what_happened = (
            intake_data.get("Case_IncidentDescription")
            or p4.get("what_happened")
            or p4.get("narrative")
            or p4.get("dispute_summary")
            or ""
        )
        file_upload = intake_data.get("Case_FileUpload") or p4.get("file_upload") or ""
        incident_date = p4.get("incident_date") or p4.get("date_of_separation") or ""
        specific_relief = p4.get("requested_relief") or p4.get("specific_relief_sought") or ""

        # Heuristic detection of children
        children = p4.get("children") or intake_data.get("children") or []
        if not children and what_happened:
            child_matches = re.findall(
                r"(?:child|minor|son|daughter)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:\(?DOB:?\s*(\d{1,2}/\d{1,2}/\d{2,4})\)?)?",
                what_happened,
                re.IGNORECASE
            )
            for m in child_matches:
                c_name, c_dob = m
                children.append({"full_name": c_name.strip(), "birthdate": c_dob or "", "age": 0})

        # Assemble master normalized payload
        payload: Dict[str, Any] = {
            "client": {
                "first_name": client_first,
                "last_name": client_last,
                "full_name": client_full,
                "dob": client_dob,
                "phone": phone,
                "email": email,
                "street": street,
                "city": city,
                "state": state,
                "zip": zip_code,
                "county": court_county,
                "role": "Petitioner"
            },
            "opposing_party": {
                "first_name": other_first,
                "last_name": other_last,
                "full_name": other_full,
                "phone": other_phone,
                "email": other_email,
                "street": other_street,
                "city": parsed_other_csz.get("city", ""),
                "state": parsed_other_csz.get("state", "CA"),
                "zip": parsed_other_csz.get("zip", ""),
                "role": "Respondent"
            },
            "attorney": {
                "name": intake_data.get("attorney_name", ""),
                "bar_number": intake_data.get("attorney_bar", ""),
                "firm_name": intake_data.get("attorney_firm", ""),
                "street": street,
                "city": city,
                "state": state,
                "zip": zip_code,
                "phone": phone,
                "email": email,
                "representing": f"Attorney for {client_full}" if intake_data.get("attorney_name") else f"{client_full} in Pro Per"
            },
            "case": {
                "number": case_number,
                "case_number": case_number,
                "county": court_county,
                "court_name": court_name,
                "branch_name": p3.get("branch_name") or f"{court_county} Justice Center",
                "court_street": p3.get("court_street") or "",
                "court_city_zip": p3.get("court_city_zip") or f"{city}, {state} {zip_code}",
                "judge_name": judge_name,
                "department": department,
                "hearing_dates": hearing_dates,
                "da_info": da_info,
                "title_petitioner": client_full.upper(),
                "title_respondent": other_full.upper()
            },
            "proceeding": {
                "type": "Dissolution" if "dissolution" in assist_type.lower() or "divorce" in assist_type.lower() else "Family Law",
                "date_of_separation": incident_date,
                "has_minor_children": len(children) > 0,
                "custody_legal": "Joint",
                "custody_physical": "Joint",
                "child_support_requested": len(children) > 0,
                "spousal_support_to_petitioner": "spousal" in specific_relief.lower() or "support" in specific_relief.lower()
            },
            "children": children,
            "intake_narrative": {
                "assistance_type": assist_type,
                "what_happened": what_happened,
                "incident_date": incident_date,
                "specific_relief": specific_relief,
                "file_upload": file_upload
            }
        }
        return payload


# Canonical declarative cross-form AcroForm mapping table
# Directly linking App-Ready field names to official California Judicial Council PDF nodes
CANONICAL_APP_MAPPINGS = {
    "FL-100": {
        "Client_FirstName": "FL-100[0].Page1[0].TitlePartyName[0].Petitioner_1_ft[0]",
        "Client_Address_Street": "FL-100[0].Page1[0].AttyInfo[0].AttyStreet_ft[0]",
        "Client_Address_CityStateZip": "FL-100[0].Page1[0].AttyInfo[0].AttyCity_ft[0]",
        "Client_Phone": "FL-100[0].Page1[0].AttyInfo[0].Phone_ft[0]",
        "Client_Email": "FL-100[0].Page1[0].AttyInfo[0].Email_ft[0]",
        "Court_County": "FL-100[0].Page1[0].CourtInfo[0].CrtCounty_ft[0]",
        "Court_CaseNumber": "FL-100[0].Page1[0].CaseNumber[0].CaseNumber_ft[0]",
        "Court_OpposingParty_FullName": "FL-100[0].Page1[0].TitlePartyName[0].Respondent_ft[0]"
    },
    "FL-120": {
        "Client_FirstName": "FL-120[0].Page1[0].Caption_sf[0].TitlePartyName[0].Respondent_ft[0]",
        "Client_Address_Street": "FL-120[0].Page1[0].Caption_sf[0].AttyInfo[0].AttyStreet_ft[0]",
        "Client_Address_CityStateZip": "FL-120[0].Page1[0].Caption_sf[0].AttyInfo[0].AttyCity_ft[0]",
        "Client_Phone": "FL-120[0].Page1[0].Caption_sf[0].AttyInfo[0].Phone_ft[0]",
        "Client_Email": "FL-120[0].Page1[0].Caption_sf[0].AttyInfo[0].Email_ft[0]",
        "Court_County": "FL-120[0].Page1[0].Caption_sf[0].CourtInfo[0].CrtCounty_ft[0]",
        "Court_CaseNumber": "FL-120[0].Page1[0].Caption_sf[0].CaseNumber[0].CaseNumber_ft[0]",
        "Court_OpposingParty_FullName": "FL-120[0].Page1[0].Caption_sf[0].TitlePartyName[0].Petitioner_1_ft[0]"
    },
    "FL-141": {
        "Client_FirstName": "FL-141[0].Page1[0].TitlePartyName[0].Respondent_ft[0]",
        "Client_Address_Street": "FL-141[0].Page1[0].AttyInfo[0].AttyStreet_ft[0]",
        "Client_Address_CityStateZip": "FL-141[0].Page1[0].AttyInfo[0].AttyCity_ft[0]",
        "Client_Phone": "FL-141[0].Page1[0].AttyInfo[0].Phone_ft[0]",
        "Client_Email": "FL-141[0].Page1[0].AttyInfo[0].Email_ft[0]",
        "Court_County": "FL-141[0].Page1[0].CourtInfo[0].CrtCounty_ft[0]",
        "Court_CaseNumber": "FL-141[0].Page1[0].CaseNumber[0].CaseNumber_ft[0]",
        "Court_OpposingParty_FullName": "FL-141[0].Page1[0].TitlePartyName[0].Petitioner_1_ft[0]",
        "Other_Address_Street": "FL-141[0].Page1[0].Service[0].ServedAddress_ft[0]"
    },
    "FL-300": {
        "Client_FirstName": "FL-300[0].Page1[0].TitlePartyName[0].Petitioner_1_ft[0]",
        "Court_County": "FL-300[0].Page1[0].CourtInfo[0].CrtCounty_ft[0]",
        "Court_CaseNumber": "FL-300[0].Page1[0].CaseNumber[0].CaseNumber_ft[0]",
        "Court_OpposingParty_FullName": "FL-300[0].Page1[0].List1[0].Li1[0].NameOfParty_ft[0]",
        "Court_HearingDates": "FL-300[0].Page1[0].List2[0].Li1[0].DateofHearing_dt[0]",
        "Court_JudgeName": "FL-300[0].Page1[0].List2[0].Li1[0].DepartmentNo_tf[0]",
        "Case_IncidentDescription": "FL-300[0].Page4[0].Item10Facts_ft[0]"
    },
    "FW-001": {
        "Client_FirstName": "FW-001[0].Page1[0].PersonAsking[0].Name_ft[0]",
        "Client_DOB": "FW-001[0].Page1[0].PersonAsking[0].DOB_dt[0]",
        "Client_Address_Street": "FW-001[0].Page1[0].PersonAsking[0].Street_ft[0]",
        "Client_Address_CityStateZip": "FW-001[0].Page1[0].PersonAsking[0].City_ft[0]",
        "Client_Phone": "FW-001[0].Page1[0].PersonAsking[0].Phone_ft[0]",
        "Court_County": "FW-001[0].Page1[0].CourtInfo[0].CrtCounty_ft[0]",
        "Court_CaseNumber": "FW-001[0].Page1[0].CaseInfo[0].CaseNumber_ft[0]"
    }
}


class XFDFGenerator:
    """
    W3C & Adobe Acrobat compliant XFDF serialization engine.
    Produces zero-loss XML form data files referencing unaltered official court PDFs.
    """

    @staticmethod
    def generate(template_pdf_path: str, field_mapping: Dict[str, str], payload: Dict[str, Any]) -> str:
        xfdf = Element("xfdf", {
            "xmlns": "http://ns.adobe.com/xfdf/",
            "xml:space": "preserve"
        })
        fields_el = SubElement(xfdf, "fields")

        for pdf_field_target, source_path in field_mapping.items():
            if isinstance(source_path, str):
                tokens = source_path.split(".")
                curr = payload
                for tok in tokens:
                    if isinstance(curr, dict) and tok in curr:
                        curr = curr[tok]
                    else:
                        curr = ""
                        break
                val_str = str(curr) if curr is not None else ""
            elif isinstance(source_path, dict):
                val_str = str(source_path.get("value", ""))
            else:
                val_str = ""

            field_el = SubElement(fields_el, "field", {"name": pdf_field_target})
            val_el = SubElement(field_el, "value")
            val_el.text = val_str

        SubElement(xfdf, "f", {"href": template_pdf_path})
        return tostring(xfdf, encoding="utf-8", xml_declaration=True).decode("utf-8")
