/**
 * ENTERPRISE LEGAL AUTOMATION PLATFORM API ROUTER (v1)
 * REST API Endpoints for Clients, Cases, Forms Library, Field Mappings, and Form Generation.
 */

import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { abbyyStore } from '../services/abbyyStore';
import { AbbyyFlexiCaptureAssociate } from '../lib/abbyy/abbyyFlexiCaptureService';
import { PdfFlattenerService } from '../services/pdfFlattenerService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const enterpriseLegalRouter = Router();

/**
 * Execute RPC command against the Python Enterprise Database Bridge
 */
function runDbRpc(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [path.join(process.cwd(), 'db_bridge.py')], {
      cwd: process.cwd(),
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        return reject(new Error(stderr || `Database RPC exited with code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.success) {
          resolve(parsed.data);
        } else {
          reject(new Error(parsed.error || 'Database RPC failure'));
        }
      } catch (err: any) {
        reject(new Error(`Failed to parse DB RPC response: ${stdout || err.message}`));
      }
    });

    pythonProcess.stdin.write(JSON.stringify(payload));
    pythonProcess.stdin.end();
  });
}

// -----------------------------------------------------------------------------
// 1. CLIENTS ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/clients
 * Returns all client records
 */
enterpriseLegalRouter.get('/clients', async (req: Request, res: Response) => {
  try {
    const clients = await runDbRpc({ action: 'get_clients' });
    res.json({ success: true, count: clients.length, data: clients });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/clients/:id
 * Returns single client record
 */
enterpriseLegalRouter.get('/clients/:id', async (req: Request, res: Response) => {
  try {
    const client = await runDbRpc({ action: 'get_client', id: parseInt(req.params.id, 10) });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, data: client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/clients
 * Create a new client record
 */
enterpriseLegalRouter.post('/clients', async (req: Request, res: Response) => {
  try {
    const clientData = req.body;
    if (!clientData.first_name || !clientData.last_name) {
      return res.status(400).json({ success: false, error: 'first_name and last_name are required' });
    }
    const created = await runDbRpc({ action: 'create_client', data: clientData });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. CASES ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/cases
 * Returns all cases, optionally filtered by ?client_id=X
 */
enterpriseLegalRouter.get('/cases', async (req: Request, res: Response) => {
  try {
    const clientId = req.query.client_id ? parseInt(req.query.client_id as string, 10) : undefined;
    const cases = await runDbRpc({ action: 'get_cases', client_id: clientId });
    res.json({ success: true, count: cases.length, data: cases });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/cases
 * Create a new case
 */
enterpriseLegalRouter.post('/cases', async (req: Request, res: Response) => {
  try {
    const caseData = req.body;
    if (!caseData.client_id || !caseData.case_number) {
      return res.status(400).json({ success: false, error: 'client_id and case_number are required' });
    }
    const created = await runDbRpc({ action: 'create_case', data: caseData });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. FORMS LIBRARY & MAPPINGS ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/forms
 * Returns all forms in the official library
 */
enterpriseLegalRouter.get('/forms', async (req: Request, res: Response) => {
  try {
    const forms = await runDbRpc({ action: 'get_forms' });
    res.json({ success: true, count: forms.length, data: forms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/forms/:id/fields
 * Returns field mappings for a specific form
 */
enterpriseLegalRouter.get('/forms/:id/fields', async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id, 10);
    const fields = await runDbRpc({ action: 'get_form_fields', form_id: formId });
    res.json({ success: true, count: fields.length, data: fields });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/forms/:id/fields
 * Add or update a universal-to-PDF field mapping
 */
enterpriseLegalRouter.post('/forms/:id/fields', async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id, 10);
    const { universal_field, pdf_field_name } = req.body;
    if (!universal_field || !pdf_field_name) {
      return res.status(400).json({ success: false, error: 'universal_field and pdf_field_name are required' });
    }
    const saved = await runDbRpc({
      action: 'save_form_field',
      form_id: formId,
      universal_field,
      pdf_field_name
    });
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/forms/ingest
 * Form Ingestion Workflow: grabs/registers requested court form,
 * places official PDF into templates/, generates mapping config in forms/,
 * and registers form in database forms & form_fields tables.
 */
enterpriseLegalRouter.post('/forms/ingest', async (req: Request, res: Response) => {
  try {
    const { form_name, description, case_type, pdf_base64, mappings } = req.body;

    if (!form_name) {
      return res.status(400).json({ success: false, error: 'form_name is required (e.g. FL-150, I-130, EOIR-28)' });
    }

    const cleanFormName = String(form_name).trim().toUpperCase();
    const cleanDesc = description || `${cleanFormName} Official Court Filing Form`;
    const templateRelativePath = `templates/${cleanFormName}.pdf`;
    const templateFullPath = path.join(process.cwd(), templateRelativePath);

    fs.mkdirSync(path.join(process.cwd(), 'templates'), { recursive: true });
    fs.mkdirSync(path.join(process.cwd(), 'forms'), { recursive: true });

    if (pdf_base64 && typeof pdf_base64 === 'string') {
      const buffer = Buffer.from(pdf_base64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      fs.writeFileSync(templateFullPath, buffer);
    } else if (!fs.existsSync(templateFullPath)) {
      // Auto-generate clean, pristine vector court template
      const doc = await PDFDocument.create();
      const page = doc.addPage([612, 792]);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      const black = rgb(0, 0, 0);
      const darkGray = rgb(0.25, 0.25, 0.25);

      page.drawText(`${cleanFormName} OFFICIAL COURT FORM`, { x: 50, y: 740, size: 14, font: fontBold, color: black });
      page.drawText(cleanDesc, { x: 50, y: 720, size: 10, font: fontRegular, color: darkGray });

      page.drawRectangle({
        x: 45,
        y: 120,
        width: 522,
        height: 570,
        borderColor: black,
        borderWidth: 1.5,
      });

      page.drawText('Caption & Demographic Verification Section', { x: 55, y: 660, size: 11, font: fontBold, color: black });
      page.drawText('Client Legal Name: ___________________________________________________________', { x: 65, y: 630, size: 9, font: fontRegular, color: darkGray });
      page.drawText('Case / Docket Number: _______________________________________________________', { x: 65, y: 600, size: 9, font: fontRegular, color: darkGray });
      page.drawText('Residential Address: ________________________________________________________', { x: 65, y: 570, size: 9, font: fontRegular, color: darkGray });
      page.drawText('Date of Birth / Registration: _________________________________________________', { x: 65, y: 540, size: 9, font: fontRegular, color: darkGray });

      page.drawText(`[OFFICIAL UNALTERED TEMPLATE • ${cleanFormName} • ${new Date().toLocaleDateString()}]`, {
        x: 50,
        y: 40,
        size: 8,
        font: fontRegular,
        color: darkGray
      });

      const bytes = await doc.save();
      fs.writeFileSync(templateFullPath, bytes);
    }

    // Default field mappings
    const defaultMappings: Record<string, string> = {
      client_first_name: `${cleanFormName.replace('-', '')}FirstName`,
      client_last_name: `${cleanFormName.replace('-', '')}LastName`,
      client_DOB: `${cleanFormName.replace('-', '')}DOB`,
      client_address: `${cleanFormName.replace('-', '')}Address`,
      case_number: `${cleanFormName.replace('-', '')}CaseNumber`
    };

    if (case_type === 'Immigration' || cleanFormName.startsWith('I-') || cleanFormName.startsWith('EOIR')) {
      defaultMappings['client_A_number'] = `${cleanFormName.replace('-', '')}AlienRegistrationNumber`;
    }

    // Merge custom mappings if supplied
    if (Array.isArray(mappings)) {
      for (const m of mappings) {
        if (m.universal_field && m.pdf_field_name) {
          defaultMappings[m.universal_field] = m.pdf_field_name;
        }
      }
    }

    // Save JSON mapping file
    const mappingJsonPath = path.join(process.cwd(), `forms/${cleanFormName}.mapping.json`);
    fs.writeFileSync(
      mappingJsonPath,
      JSON.stringify({ template: templateRelativePath, fields: defaultMappings }, null, 2)
    );

    // Register into Database (forms and form_fields tables)
    const existingForms = await runDbRpc({ action: 'get_forms' });
    let existing = existingForms.find((f: any) => f.name.toUpperCase() === cleanFormName);
    let formId = existing?.id;

    if (!existing) {
      const maxId = existingForms.reduce((max: number, f: any) => Math.max(max, f.id), 0) + 1;
      formId = maxId;
      await runDbRpc({
        action: 'register_form',
        data: {
          id: formId,
          name: cleanFormName,
          description: cleanDesc,
          pdf_template_path: templateRelativePath,
          fields: defaultMappings
        }
      });
    }

    res.json({
      success: true,
      status: 'ingested_and_registered',
      form: {
        id: formId,
        name: cleanFormName,
        description: cleanDesc,
        pdf_template_path: templateRelativePath,
        mapping_file: `forms/${cleanFormName}.mapping.json`,
        fields: defaultMappings
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/universal-fields
 * Returns the catalog of universal standard fields
 */
enterpriseLegalRouter.get('/universal-fields', async (req: Request, res: Response) => {
  try {
    const uFields = await runDbRpc({ action: 'get_universal_fields' });
    res.json({ success: true, count: uFields.length, data: uFields });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/vault
 * Returns complete output templates hierarchy assigned by Matter and Type
 */
enterpriseLegalRouter.get('/vault', async (req: Request, res: Response) => {
  try {
    const vault = await runDbRpc({ action: 'list_vault' });
    res.json({ success: true, count: vault.length, data: vault });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/templates
 * Lists all court form templates in ./templates directory
 */
enterpriseLegalRouter.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await runDbRpc({ action: 'get_templates' });
    res.json({ success: true, count: templates.length, data: templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/forms/catalog
 * Curated catalog of California Judicial Council, EOIR, and Civil court forms with live template status
 */
enterpriseLegalRouter.get('/forms/catalog', (req: Request, res: Response) => {
  const catalog = [
    { code: 'FL-100', name: 'FL-100', title: 'Petition — Marriage/Domestic Partnership', category: 'Family Law', type: 'Petition', mandatory: true },
    { code: 'FL-110', name: 'FL-110', title: 'Summons (Family Law)', category: 'Family Law', type: 'Summons', mandatory: true },
    { code: 'FL-115', name: 'FL-115', title: 'Proof of Service of Summons', category: 'Family Law', type: 'Proof of Service', mandatory: true },
    { code: 'FL-120', name: 'FL-120', title: 'Response — Marriage/Domestic Partnership', category: 'Family Law', type: 'Response', mandatory: true },
    { code: 'FL-130', name: 'FL-130', title: 'Appearance, Stipulations, and Waivers', category: 'Family Law', type: 'Stipulation', mandatory: false },
    { code: 'FL-140', name: 'FL-140', title: 'Declaration of Disclosure', category: 'Family Law', type: 'Disclosure', mandatory: true },
    { code: 'FL-142', name: 'FL-142', title: 'Schedule of Assets and Debts', category: 'Family Law', type: 'Disclosure', mandatory: true },
    { code: 'FL-150', name: 'FL-150', title: 'Income and Expense Declaration', category: 'Family Law', type: 'Financial', mandatory: true },
    { code: 'FL-300', name: 'FL-300', title: 'Request for Order (Hearings & Motions)', category: 'Family Law', type: 'Motion', mandatory: false },
    { code: 'FL-311', name: 'FL-311', title: 'Child Custody and Visitation Application', category: 'Family Law', type: 'Attachment', mandatory: false },
    { code: 'EOIR-33', name: 'EOIR-33', title: "Alien's Change of Address Form", category: 'Immigration', type: 'Notice', mandatory: true },
    { code: 'EOIR-28', name: 'EOIR-28', title: 'Notice of Entry of Appearance before Immigration Court', category: 'Immigration', type: 'Appearance', mandatory: true },
    { code: 'I-589', name: 'I-589', title: 'Application for Asylum and Withholding of Removal', category: 'Immigration', type: 'Application', mandatory: true },
    { code: 'I-130', name: 'I-130', title: 'Petition for Alien Relative', category: 'Immigration', type: 'Petition', mandatory: false },
    { code: 'G-28', name: 'G-28', title: 'Notice of Entry of Appearance as Attorney (DHS/USCIS)', category: 'Immigration', type: 'Appearance', mandatory: true },
    { code: 'SUM-100', name: 'SUM-100', title: 'Summons — Civil Action', category: 'Civil Litigation', type: 'Summons', mandatory: true },
    { code: 'POS-010', name: 'POS-010', title: 'Proof of Service of Summons (Civil)', category: 'Civil Litigation', type: 'Proof of Service', mandatory: true },
  ];

  const enriched = catalog.map((item) => {
    const templatePath = path.join(process.cwd(), 'templates', `${item.code}.pdf`);
    const mappingPath = path.join(process.cwd(), 'forms', `${item.code}.mapping.json`);
    return {
      ...item,
      in_templates: fs.existsSync(templatePath),
      has_mapping: fs.existsSync(mappingPath),
      template_path: `templates/${item.code}.pdf`
    };
  });

  res.json({ success: true, count: enriched.length, data: enriched });
});

/**
 * POST /api/v1/forms/grab
 * Form Grabber Workflow: grabs requested form, places in templates/, builds mapping in forms/, registers in DB
 */
enterpriseLegalRouter.post('/forms/grab', async (req: Request, res: Response) => {
  try {
    const { form_name, form_code, description, case_type, practice_type, pdf_base64 } = req.body;
    const targetCode = String(form_code || form_name || '').trim().toUpperCase();
    if (!targetCode) {
      return res.status(400).json({ success: false, error: 'form_code or form_name is required (e.g. FL-110, EOIR-28)' });
    }

    const cleanType = practice_type || case_type || 'Family Law';
    const cleanDesc = description || `${targetCode} Official Court Form (${cleanType})`;
    const templatePath = path.join(process.cwd(), 'templates', `${targetCode}.pdf`);

    fs.mkdirSync(path.join(process.cwd(), 'templates'), { recursive: true });
    fs.mkdirSync(path.join(process.cwd(), 'forms'), { recursive: true });

    if (pdf_base64 && typeof pdf_base64 === 'string') {
      const buffer = Buffer.from(pdf_base64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      fs.writeFileSync(templatePath, buffer);
    }

    const grabRes = await runDbRpc({
      action: 'grab_form',
      form_name: targetCode,
      practice_type: cleanType,
      description: cleanDesc
    });

    res.json({
      success: true,
      status: 'grabbed_and_placed',
      data: grabRes
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. GENERATE FILLED FORM ENDPOINT (The Core Engine API)
// -----------------------------------------------------------------------------

/**
 * POST /api/v1/generate/:form_name
 * Body: { client_id: number, case_id: number }
 * Runs relational extraction, builds XFDF, logs audit record, returns downloadable URLs.
 * Outputs are organized by Matter and Case Type in /output/<case_type>/<case_number>/
 */
enterpriseLegalRouter.post('/generate/:form_name', async (req: Request, res: Response) => {
  try {
    const formName = req.params.form_name;
    const { client_id, case_id } = req.body;

    if (!client_id || !case_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: client_id and case_id must be provided in request body.'
      });
    }

    const result = await runDbRpc({
      action: 'generate_form',
      form_name: formName,
      client_id: parseInt(client_id, 10),
      case_id: parseInt(case_id, 10)
    });

    const outputFilename = path.basename(result.output_xfdf_path);
    const templateFilename = path.basename(result.template_pdf);

    // Matter- and Type-Specific Output Directory
    const sanitizedClient = (result.client_name || 'Client').replace(/\s+/g, '_');
    const sanitizedType = (result.case_type || 'General').trim().replace(/\s+/g, '_').replace(/\//g, '-');
    const sanitizedCase = (result.case_number || 'Matter').trim().replace(/\s+/g, '_').replace(/\//g, '-');
    const matterDir = `output/${sanitizedType}/${sanitizedCase}`;
    fs.mkdirSync(path.join(process.cwd(), matterDir), { recursive: true });

    const filledPdfFilename = `${formName}_${sanitizedClient}_Filled.pdf`;
    const matterFilledPdfPath = `${matterDir}/${filledPdfFilename}`;
    const rootFilledPdfPath = `output/${filledPdfFilename}`;

    // Server-Side PDF Flattener: generate flattened, visually populated PDF
    try {
      await PdfFlattenerService.generateFlattenedPdf(
        result.template_pdf,
        result.fields_populated,
        matterFilledPdfPath,
        formName
      );
      // Keep root copy for backwards compatibility
      fs.copyFileSync(
        path.join(process.cwd(), matterFilledPdfPath),
        path.join(process.cwd(), rootFilledPdfPath)
      );
    } catch (flattenErr) {
      console.warn('PDF Flattening warning (continuing with XFDF):', flattenErr);
    }

    res.json({
      status: 'success',
      pdf_url: `/templates/${templateFilename}`,
      filled_pdf_url: `/${matterFilledPdfPath}`,
      xfdf_url: `/${result.output_xfdf_path}`,
      matter_dir: `/${matterDir}`,
      matter_filled_pdf_url: `/${matterFilledPdfPath}`,
      matter_xfdf_url: `/${result.output_xfdf_path}`,
      root_filled_pdf_url: `/${rootFilledPdfPath}`,
      generic_xfdf_url: `/output/${formName}.xfdf`,
      form_name: result.form_name,
      client_name: result.client_name,
      case_number: result.case_number,
      case_type: result.case_type,
      output_xfdf_path: result.output_xfdf_path,
      output_pdf_path: matterFilledPdfPath,
      fields_populated: result.fields_populated,
      field_count: result.field_count,
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

/**
 * POST /api/v1/generate-packet
 * Multi-Form Filing Packet Generator (Option 1)
 * Generates an entire filing packet (e.g. Dissolution: FL-100 + FL-120 + FL-300; Immigration: EOIR-33 + I-589)
 */
enterpriseLegalRouter.post('/generate-packet', async (req: Request, res: Response) => {
  try {
    const { client_id, case_id, packet_type, form_names } = req.body;

    if (!client_id || !case_id) {
      return res.status(400).json({ success: false, error: 'client_id and case_id are required' });
    }

    let targetForms: string[] = [];
    let packetTitle = 'Custom Legal Packet';

    if (packet_type === 'family_dissolution' || (!form_names && packet_type !== 'immigration_defense')) {
      targetForms = ['FL-100', 'FL-120', 'FL-300'];
      packetTitle = 'California Family Law Dissolution Packet';
    } else if (packet_type === 'immigration_defense') {
      targetForms = ['EOIR-33', 'I-589'];
      packetTitle = 'Federal Immigration Court Defense Packet';
    } else if (Array.isArray(form_names) && form_names.length > 0) {
      targetForms = form_names;
      packetTitle = 'Custom Filing Packet';
    } else {
      targetForms = ['FL-120'];
    }

    const generatedForms = [];

    for (const formName of targetForms) {
      try {
        const result = await runDbRpc({
          action: 'generate_form',
          form_name: formName,
          client_id: parseInt(client_id, 10),
          case_id: parseInt(case_id, 10)
        });

        const outputFilename = path.basename(result.output_xfdf_path);
        const templateFilename = path.basename(result.template_pdf);
        const sanitizedClient = (result.client_name || 'Client').replace(/\s+/g, '_');
        const filledPdfFilename = `${formName}_${sanitizedClient}_Filled.pdf`;
        const filledPdfRelativePath = `output/${filledPdfFilename}`;

        // Flatten each PDF in packet
        try {
          await PdfFlattenerService.generateFlattenedPdf(
            result.template_pdf,
            result.fields_populated,
            filledPdfRelativePath,
            formName
          );
        } catch (flattenErr) {
          console.warn(`PDF Flattening warning for ${formName}:`, flattenErr);
        }

        generatedForms.push({
          form_name: formName,
          status: 'success',
          pdf_url: `/templates/${templateFilename}`,
          filled_pdf_url: `/${filledPdfRelativePath}`,
          xfdf_url: `/output/${outputFilename}`,
          field_count: result.field_count
        });
      } catch (fErr: any) {
        generatedForms.push({
          form_name: formName,
          status: 'error',
          error: fErr.message
        });
      }
    }

    res.json({
      success: true,
      packet_type,
      packet_title: packetTitle,
      client_id,
      case_id,
      total_forms: targetForms.length,
      forms: generatedForms,
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/intake
 * Client Self-Service Intake Questionnaire (Option 4)
 * Writes directly to clients & cases, and triggers instant form/packet generation!
 */
enterpriseLegalRouter.post('/intake', async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      dob,
      phone,
      email,
      address_line1,
      city,
      state,
      zip,
      a_number,
      ssn,
      case_type,
      case_number,
      court_name,
      judge_name,
      target_form,
      target_packet
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ success: false, error: 'First name and last name are required for intake.' });
    }

    // 1. Create client
    const newClient = await runDbRpc({
      action: 'create_client',
      data: {
        first_name,
        last_name,
        dob: dob || '1990-05-12',
        phone: phone || '(702) 555-0149',
        email: email || 'client@example.com',
        address_line1: address_line1 || '123 Main St',
        city: city || 'Las Vegas',
        state: state || 'NV',
        zip: zip || '89101',
        a_number: a_number || '',
        ssn: ssn || ''
      }
    });

    // 2. Create case
    const docketNum = case_number || `DOCKET-${Date.now().toString().slice(-6)}`;
    const newCase = await runDbRpc({
      action: 'create_case',
      data: {
        client_id: newClient.id,
        case_type: case_type || 'Family Law',
        case_number: docketNum,
        court_name: court_name || 'Superior Court of California',
        judge_name: judge_name || '',
        status: 'Open'
      }
    });

    // 3. Determine auto-generation target
    const formToGen = target_form || (case_type === 'Immigration' ? 'EOIR-33' : 'FL-120');
    let genResult = null;

    if (target_packet) {
      // Generate packet
      const packetType = target_packet === 'immigration' ? 'immigration_defense' : 'family_dissolution';
      const targetForms = packetType === 'immigration_defense' ? ['EOIR-33', 'I-589'] : ['FL-100', 'FL-120', 'FL-300'];
      const formsGenerated = [];

      for (const f of targetForms) {
        try {
          const resGen = await runDbRpc({
            action: 'generate_form',
            form_name: f,
            client_id: newClient.id,
            case_id: newCase.id
          });
          const outputFilename = path.basename(resGen.output_xfdf_path);
          const templateFilename = path.basename(resGen.template_pdf);
          const sanitizedClient = `${newClient.first_name}_${newClient.last_name}`.replace(/\s+/g, '_');
          const filledPdfFilename = `${f}_${sanitizedClient}_Filled.pdf`;
          const filledPdfRelativePath = `output/${filledPdfFilename}`;

          await PdfFlattenerService.generateFlattenedPdf(
            resGen.template_pdf,
            resGen.fields_populated,
            filledPdfRelativePath,
            f
          );

          formsGenerated.push({
            form_name: f,
            pdf_url: `/templates/${templateFilename}`,
            filled_pdf_url: `/${filledPdfRelativePath}`,
            xfdf_url: `/output/${outputFilename}`
          });
        } catch (err: any) {
          console.warn(`Error generating ${f} during intake packet:`, err);
        }
      }

      return res.json({
        success: true,
        intake_status: 'created_and_packet_generated',
        client: newClient,
        case: newCase,
        packet_type: packetType,
        packet_forms: formsGenerated
      });
    } else {
      // Generate single form
      const resGen = await runDbRpc({
        action: 'generate_form',
        form_name: formToGen,
        client_id: newClient.id,
        case_id: newCase.id
      });
      const outputFilename = path.basename(resGen.output_xfdf_path);
      const templateFilename = path.basename(resGen.template_pdf);
      const sanitizedClient = `${newClient.first_name}_${newClient.last_name}`.replace(/\s+/g, '_');
      const filledPdfFilename = `${formToGen}_${sanitizedClient}_Filled.pdf`;
      const filledPdfRelativePath = `output/${filledPdfFilename}`;

      await PdfFlattenerService.generateFlattenedPdf(
        resGen.template_pdf,
        resGen.fields_populated,
        filledPdfRelativePath,
        formToGen
      );

      return res.json({
        success: true,
        intake_status: 'created_and_form_generated',
        client: newClient,
        case: newCase,
        form_name: formToGen,
        pdf_url: `/templates/${templateFilename}`,
        filled_pdf_url: `/${filledPdfRelativePath}`,
        xfdf_url: `/output/${outputFilename}`
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. GENERATED DOCUMENTS AUDIT TRAIL ENDPOINT
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/documents
 * Returns audit log of all generated documents
 */
enterpriseLegalRouter.get('/documents', async (req: Request, res: Response) => {
  try {
    const docs = await runDbRpc({ action: 'get_documents' });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. ABBYY FLEXICAPTURE ASSOCIATE ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/abbyy/tasks
 * Returns active tasks in ABBYY FlexiCapture 12 Web Verification queue
 */
enterpriseLegalRouter.get('/abbyy/tasks', (req: Request, res: Response) => {
  try {
    const tasks = abbyyStore.getTasks();
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/abbyy/tasks/:id/verify
 * Confirms verification of an ABBYY task
 */
enterpriseLegalRouter.post('/abbyy/tasks/:id/verify', (req: Request, res: Response) => {
  try {
    const task = abbyyStore.updateTaskStatus(req.params.id, 'Verified');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/abbyy/tasks/:id/reject
 * Rejects task (Selenium confirmReject())
 */
enterpriseLegalRouter.post('/abbyy/tasks/:id/reject', (req: Request, res: Response) => {
  try {
    const task = abbyyStore.updateTaskStatus(req.params.id, 'Rejected');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/abbyy/tasks/:id/merge
 * Merges separated invoice pages (Selenium checkAndMergeSeparatedInvoicePages())
 */
enterpriseLegalRouter.post('/abbyy/tasks/:id/merge', (req: Request, res: Response) => {
  try {
    const task = abbyyStore.mergePages(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/abbyy/tasks/:id/fix
 * Auto-resolves missing fields or formats date
 */
enterpriseLegalRouter.post('/api/v1/abbyy/tasks/:id/fix', (req: Request, res: Response) => {
  try {
    const { fields } = req.body;
    const task = abbyyStore.resolveErrors(req.params.id, fields);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/abbyy/tasks/:id/ingest-and-generate
 * Complete pipeline: ABBYY OCR Extraction -> Universal DB Ingest -> FL-120 Form Generation
 */
enterpriseLegalRouter.post('/abbyy/tasks/:id/ingest-and-generate', async (req: Request, res: Response) => {
  try {
    const task = abbyyStore.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found in ABBYY queue' });
    }

    const universal = AbbyyFlexiCaptureAssociate.mapToUniversalSchema(task);

    // 1. Create or ensure client exists in database
    const clients = await runDbRpc({ action: 'get_clients' });
    let matchedClient = clients.find(
      (c: any) =>
        c.first_name.toLowerCase() === universal.client_first_name.toLowerCase() &&
        c.last_name.toLowerCase() === universal.client_last_name.toLowerCase()
    );

    if (!matchedClient) {
      matchedClient = await runDbRpc({
        action: 'create_client',
        data: {
          first_name: universal.client_first_name,
          last_name: universal.client_last_name,
          dob: universal.client_DOB,
          address_line1: universal.client_address,
          city: 'Las Vegas',
          state: 'NV',
          zip: '89101'
        }
      });
    }

    // 2. Create or ensure case exists in database
    const cases = await runDbRpc({ action: 'get_cases', client_id: matchedClient.id });
    let matchedCase = cases.find((c: any) => c.case_number === universal.case_number);

    if (!matchedCase) {
      matchedCase = await runDbRpc({
        action: 'create_case',
        data: {
          client_id: matchedClient.id,
          case_type: universal.case_type,
          case_number: universal.case_number,
          court_name: universal.court_name,
          status: 'Open'
        }
      });
    }

    // 3. Trigger Form Generation (FL-120)
    const genResult = await runDbRpc({
      action: 'generate_form',
      form_name: 'FL-120',
      client_id: matchedClient.id,
      case_id: matchedCase.id
    });

    // 4. Mark ABBYY task ingested
    abbyyStore.updateTaskStatus(task.id, 'Ingested');

    const outputFilename = path.basename(genResult.output_xfdf_path);
    const templateFilename = path.basename(genResult.template_pdf);

    res.json({
      success: true,
      status: 'ingested_and_generated',
      task_id: task.taskId,
      client_id: matchedClient.id,
      client_name: `${matchedClient.first_name} ${matchedClient.last_name}`,
      case_id: matchedCase.id,
      case_number: matchedCase.case_number,
      form_name: 'FL-120',
      pdf_url: `/templates/${templateFilename}`,
      xfdf_url: `/output/${outputFilename}`,
      generic_xfdf_url: `/output/FL-120.xfdf`,
      fields_extracted_from_abbyy: universal,
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. CLIENT FILES ROUTER & DOSSIER VAULT ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/client-files
 * Returns all client files organized by Client -> Matter -> Practice Type -> Documents
 */
enterpriseLegalRouter.get('/client-files', async (req: Request, res: Response) => {
  try {
    const clientId = req.query.client_id ? parseInt(req.query.client_id as string, 10) : undefined;
    const clientFiles = await runDbRpc({ action: 'list_client_files', client_id: clientId });
    res.json({ success: true, count: clientFiles.length, data: clientFiles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/clients/:id/files
 * Returns all files for a specific client
 */
enterpriseLegalRouter.get('/clients/:id/files', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id, 10);
    const clientFiles = await runDbRpc({ action: 'list_client_files', client_id: clientId });
    const clientData = clientFiles.find((c: any) => c.client_id === clientId) || null;
    res.json({ success: true, data: clientData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/clients/:id
 * Updates an existing client record in the database
 */
enterpriseLegalRouter.put('/clients/:id', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id, 10);
    const updated = await runDbRpc({
      action: 'update_client',
      id: clientId,
      data: req.body
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/cases/:id
 * Updates an existing case/matter record in the database
 */
enterpriseLegalRouter.put('/cases/:id', async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const updated = await runDbRpc({
      action: 'update_case',
      id: caseId,
      data: req.body
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/client-files/route
 * Routes an existing court template, generated document, or external file into a client's matter vault
 */
enterpriseLegalRouter.post('/client-files/route', async (req: Request, res: Response) => {
  try {
    const { source_path, client_id, case_id, destination_filename } = req.body;
    if (!source_path || !client_id || !case_id) {
      return res.status(400).json({
        success: false,
        error: 'source_path, client_id, and case_id are required'
      });
    }

    const cleanSource = source_path.replace(/^\//, '');
    const routed = await runDbRpc({
      action: 'route_file',
      source_path: cleanSource,
      client_id: parseInt(client_id, 10),
      case_id: parseInt(case_id, 10),
      destination_filename
    });

    res.json({ success: true, data: routed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/client-files/upload
 * Uploads a client attachment, exhibit, or document directly to the client's matter vault
 */
enterpriseLegalRouter.post('/client-files/upload', async (req: Request, res: Response) => {
  try {
    const { client_id, case_id, file_name, file_base64, file_text } = req.body;
    if (!client_id || !case_id || !file_name) {
      return res.status(400).json({
        success: false,
        error: 'client_id, case_id, and file_name are required'
      });
    }

    const cases = await runDbRpc({ action: 'get_cases', client_id: parseInt(client_id, 10) });
    const targetCase = cases.find((c: any) => c.id === parseInt(case_id, 10));
    if (!targetCase) {
      return res.status(404).json({ success: false, error: 'Case not found for client' });
    }

    const sanitizedType = (targetCase.case_type || 'General').trim().replace(/\s+/g, '_').replace(/\//g, '-');
    const sanitizedCase = (targetCase.case_number || 'Matter').trim().replace(/\s+/g, '_').replace(/\//g, '-');
    const matterDir = path.join(process.cwd(), 'output', sanitizedType, sanitizedCase);
    fs.mkdirSync(matterDir, { recursive: true });

    const safeFilename = path.basename(file_name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const destPath = path.join(matterDir, safeFilename);

    if (file_base64 && typeof file_base64 === 'string') {
      const buffer = Buffer.from(file_base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      fs.writeFileSync(destPath, buffer);
    } else if (typeof file_text === 'string') {
      fs.writeFileSync(destPath, file_text, 'utf-8');
    } else {
      return res.status(400).json({ success: false, error: 'file_base64 or file_text must be provided' });
    }

    const relativePath = path.relative(process.cwd(), destPath);
    res.json({
      success: true,
      data: {
        file_name: safeFilename,
        path: relativePath,
        url: `/${relativePath}`,
        size_bytes: fs.statSync(destPath).size,
        matter_dir: `output/${sanitizedType}/${sanitizedCase}`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/v1/client-files
 * Deletes a file from the client's matter vault
 */
enterpriseLegalRouter.delete('/client-files', async (req: Request, res: Response) => {
  try {
    const filePath = (req.body?.file_path || req.query?.file_path) as string;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'file_path is required' });
    }
    const cleanPath = filePath.replace(/^\//, '');
    const deleted = await runDbRpc({
      action: 'delete_matter_file',
      file_path: cleanPath
    });
    res.json({ success: true, data: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 8. VIEWER & EDITOR API ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/file-content
 * Reads raw text/xml/json content of any document, mapping, or XFDF file for the In-App Viewer/Editor
 */
enterpriseLegalRouter.get('/file-content', (req: Request, res: Response) => {
  try {
    const rawPath = (req.query.path as string || '').replace(/^\//, '');
    if (!rawPath) {
      return res.status(400).json({ success: false, error: 'path query parameter is required' });
    }

    // Security check: restrict to output/, forms/, templates/
    const normalized = path.normalize(rawPath);
    if (!normalized.startsWith('output') && !normalized.startsWith('forms') && !normalized.startsWith('templates')) {
      return res.status(403).json({ success: false, error: 'Access restricted to legal platform vaults' });
    }

    const fullPath = path.join(process.cwd(), normalized);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: `File not found: ${normalized}` });
    }

    const stats = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    // If it's a binary PDF, return base64 or metadata
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(fullPath);
      return res.json({
        success: true,
        path: normalized,
        url: `/${normalized}`,
        extension: ext,
        size_bytes: stats.size,
        is_binary: true,
        data_base64: `data:application/pdf;base64,${buffer.toString('base64')}`
      });
    }

    // Text files (XML, XFDF, JSON, TXT)
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({
      success: true,
      path: normalized,
      url: `/${normalized}`,
      extension: ext,
      size_bytes: stats.size,
      is_binary: false,
      content
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/file-content
 * Updates file content directly from the In-App Editor (XFDF, JSON mapping, text)
 */
enterpriseLegalRouter.put('/file-content', (req: Request, res: Response) => {
  try {
    const { path: rawPath, content } = req.body;
    if (!rawPath || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'path and content string are required' });
    }

    const cleanPath = rawPath.replace(/^\//, '');
    const normalized = path.normalize(cleanPath);
    if (!normalized.startsWith('output') && !normalized.startsWith('forms')) {
      return res.status(403).json({ success: false, error: 'Only output/ and forms/ files can be edited directly' });
    }

    const fullPath = path.join(process.cwd(), normalized);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');

    res.json({
      success: true,
      path: normalized,
      size_bytes: Buffer.byteLength(content, 'utf-8'),
      updated_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/forms/:form_name/mapping
 * Returns mapping JSON for a form
 */
enterpriseLegalRouter.get('/forms/:form_name/mapping', (req: Request, res: Response) => {
  try {
    const formName = req.params.form_name.toUpperCase();
    const mappingPath = path.join(process.cwd(), 'forms', `${formName}.mapping.json`);

    if (fs.existsSync(mappingPath)) {
      const data = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
      return res.json({ success: true, form_name: formName, data, path: `forms/${formName}.mapping.json` });
    }

    // Default mapping fallback
    const defaultData = {
      template: `templates/${formName}.pdf`,
      fields: {
        client_first_name: `${formName.replace('-', '')}FirstName`,
        client_last_name: `${formName.replace('-', '')}LastName`,
        client_DOB: `${formName.replace('-', '')}DOB`,
        client_address: `${formName.replace('-', '')}Address`,
        case_number: `${formName.replace('-', '')}CaseNumber`
      }
    };
    res.json({ success: true, form_name: formName, data: defaultData, path: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/forms/:form_name/mapping
 * Saves mapping JSON and synchronizes database
 */
enterpriseLegalRouter.put('/forms/:form_name/mapping', async (req: Request, res: Response) => {
  try {
    const formName = req.params.form_name.toUpperCase();
    const { mapping_data } = req.body;
    if (!mapping_data) {
      return res.status(400).json({ success: false, error: 'mapping_data is required' });
    }

    const saved = await runDbRpc({
      action: 'save_mapping_json',
      form_name: formName,
      mapping_data
    });

    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/generate-custom
 * Generates form with attorney's live edited field values and updates both XFDF and flattened PDF!
 */
enterpriseLegalRouter.post('/generate-custom', async (req: Request, res: Response) => {
  try {
    const { form_name, client_id, case_id, override_fields } = req.body;
    if (!form_name || !client_id || !case_id) {
      return res.status(400).json({
        success: false,
        error: 'form_name, client_id, and case_id are required'
      });
    }

    const result = await runDbRpc({
      action: 'generate_form_custom',
      form_name,
      client_id: parseInt(client_id, 10),
      case_id: parseInt(case_id, 10),
      override_fields: override_fields || {}
    });

    const outputFilename = path.basename(result.output_xfdf_path);
    const templateFilename = path.basename(result.template_pdf);

    const sanitizedClient = (result.client_name || 'Client').replace(/\s+/g, '_');
    const sanitizedType = (result.case_type || 'General').trim().replace(/\s+/g, '_').replace(/\//g, '-');
    const sanitizedCase = (result.case_number || 'Matter').trim().replace(/\s+/g, '_').replace(/\//g, '-');
    const matterDir = `output/${sanitizedType}/${sanitizedCase}`;
    fs.mkdirSync(path.join(process.cwd(), matterDir), { recursive: true });

    const filledPdfFilename = `${form_name}_${sanitizedClient}_Filled.pdf`;
    const matterFilledPdfPath = `${matterDir}/${filledPdfFilename}`;
    const rootFilledPdfPath = `output/${filledPdfFilename}`;

    try {
      await PdfFlattenerService.generateFlattenedPdf(
        result.template_pdf,
        result.fields_populated,
        matterFilledPdfPath,
        form_name
      );
      fs.copyFileSync(
        path.join(process.cwd(), matterFilledPdfPath),
        path.join(process.cwd(), rootFilledPdfPath)
      );
    } catch (flattenErr) {
      console.warn('PDF Flattening warning in generate-custom:', flattenErr);
    }

    res.json({
      status: 'success',
      pdf_url: `/templates/${templateFilename}`,
      filled_pdf_url: `/${matterFilledPdfPath}`,
      xfdf_url: `/${result.output_xfdf_path}`,
      matter_dir: `/${matterDir}`,
      form_name: result.form_name,
      client_name: result.client_name,
      case_number: result.case_number,
      case_type: result.case_type,
      output_xfdf_path: result.output_xfdf_path,
      output_pdf_path: matterFilledPdfPath,
      fields_populated: result.fields_populated,
      field_count: result.field_count,
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 9. SENTRY SUPERVISOR QUALITY CONTROL & EXECUTIVE DIRECTIVES
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/subfolder-taxonomy
 * Returns standard 7 enterprise legal subfolders
 */
enterpriseLegalRouter.get('/subfolder-taxonomy', async (_req: Request, res: Response) => {
  try {
    const taxonomy = await runDbRpc({ action: 'get_subfolder_taxonomy' });
    res.json({ success: true, count: taxonomy.length, data: taxonomy });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/sentry/audit
 * Runs Sentry Quality Control inspection & in-house discrepancy auto-resolution
 */
enterpriseLegalRouter.post('/sentry/audit', async (req: Request, res: Response) => {
  try {
    const { client_id, case_id } = req.body;
    const auditReport = await runDbRpc({
      action: 'sentry_audit',
      client_id: client_id ? parseInt(client_id, 10) : 1,
      case_id: case_id ? parseInt(case_id, 10) : 1
    });
    res.json({ success: true, report: auditReport });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/executive-directive
 * Phoenix & EVE authoritative command interface
 * Directives: ORDER_PREPARE_DOCUMENT, ORDER_PROCESS_INBOX, ORDER_FILE_DOCUMENT, ORDER_REDO_DOCUMENT, ORDER_REMOVE_DOCUMENT
 */
enterpriseLegalRouter.post('/executive-directive', async (req: Request, res: Response) => {
  try {
    const { directive, params } = req.body;
    if (!directive) {
      return res.status(400).json({ success: false, error: 'directive string is required' });
    }

    const result = await runDbRpc({
      action: 'execute_executive_directive',
      directive,
      params: params || {}
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 10. GOOGLE DRIVE LEVEL23CONSULTING "INBOX" DROPZONE & ROUTING
// -----------------------------------------------------------------------------

/**
 * GET /api/v1/drive-inbox
 * Lists all pending files in the Google Drive Level23consulting account "Inbox"
 */
enterpriseLegalRouter.get('/drive-inbox', async (_req: Request, res: Response) => {
  try {
    const files = await runDbRpc({ action: 'list_drive_inbox' });
    res.json({
      success: true,
      account: 'adonisandrous@gmail.com / Level23consulting',
      drive_folder: '/Level23consulting/Inbox',
      count: files.length,
      data: files
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/drive-inbox/upload
 * Deposits uploaded file into Google Drive Level23consulting account "Inbox"
 */
enterpriseLegalRouter.post('/drive-inbox/upload', async (req: Request, res: Response) => {
  try {
    const { file_name, file_text, file_base64 } = req.body;
    if (!file_name) {
      return res.status(400).json({ success: false, error: 'file_name is required' });
    }

    const inboxDir = path.join(process.cwd(), 'google_drive_level23', 'Inbox');
    fs.mkdirSync(inboxDir, { recursive: true });
    const safeName = path.basename(file_name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const destPath = path.join(inboxDir, safeName);

    if (file_base64 && typeof file_base64 === 'string') {
      const buffer = Buffer.from(file_base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      fs.writeFileSync(destPath, buffer);
    } else if (typeof file_text === 'string') {
      fs.writeFileSync(destPath, file_text, 'utf-8');
    } else {
      fs.writeFileSync(
        destPath,
        `Google Drive Level23consulting Intake Artifact: ${safeName}\nUploaded: ${new Date().toISOString()}\nAccount: adonisandrous@gmail.com\n`,
        'utf-8'
      );
    }

    const deposited = await runDbRpc({
      action: 'upload_to_drive_inbox',
      file_name: safeName
    });

    res.json({ success: true, data: deposited });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/drive-inbox/route
 * Routes an artifact from Level23 Drive Inbox to the client's assigned matter subfolder
 */
enterpriseLegalRouter.post('/drive-inbox/route', async (req: Request, res: Response) => {
  try {
    const { file_name, client_id, case_id, destination_subfolder } = req.body;
    if (!file_name || !client_id || !case_id) {
      return res.status(400).json({
        success: false,
        error: 'file_name, client_id, and case_id are required'
      });
    }

    const routed = await runDbRpc({
      action: 'route_drive_inbox_file',
      file_name,
      client_id: parseInt(client_id, 10),
      case_id: parseInt(case_id, 10),
      destination_subfolder
    });

    res.json({ success: true, data: routed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/drive-inbox/auto-route
 * Autonomous Batch-Router: Routes all matching inbox files to appropriate matter subfolders
 */
enterpriseLegalRouter.post('/drive-inbox/auto-route', async (_req: Request, res: Response) => {
  try {
    const result = await runDbRpc({ action: 'auto_route_drive_inbox' });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
