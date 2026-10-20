import JSZip from 'jszip';
import { isolateAtomicFieldItem } from './phoenixEngine/Agent3Extraction';

/**
 * XFDF and FDF Form Data Generators for Official Court PDF Population
 * Canonical Adobe Acrobat XML Forms Data Format (XFDF) and Forms Data Format (FDF) specs.
 * Used to populate Judicial Council and legal court PDF forms directly for:
 *  - ABBYY FineReader PDF (Visual Inspection, AcroForm verification, and Data Import)
 *  - ONLYOFFICE Desktop & Web Form Editor (Interactive Form Fill & Signing)
 *  - Adobe Acrobat Standard / Pro
 */

export class XFDF {
  private fields: Record<string, string> = {};
  private _checkbox_yes: string;
  private targetPdfHref: string;

  /**
   * Initialize with a positive value for checkboxes (e.g. "Yes", "1", "On")
   * and target PDF reference which MUST match the companion PDF filename
   * so ABBYY FineReader and ONLYOFFICE can resolve and open it instantly.
   */
  constructor(checkbox_yes = "Yes", targetPdfHref = "court_form.pdf") {
    this._checkbox_yes = checkbox_yes;
    this.targetPdfHref = targetPdfHref;
  }

  private _header(): string {
    const cleanHref = this.targetPdfHref.replace(/"/g, '&quot;');
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">\n' +
      `  <f href="${cleanHref}"/>\n` +
      '  <fields>\n';
  }

  private _fields(): string {
    const fieldLines = Object.entries(this.fields).map(([key, val]) => {
      // Escape XML characters
      const escapedKey = key.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const escapedVal = String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `    <field name="${escapedKey}">\n      <value>${escapedVal}</value>\n    </field>`;
    });
    return fieldLines.join('\n');
  }

  private _footer(): string {
    return '\n  </fields>\n' +
      '</xfdf>';
  }

  public add_field(key: string, value: string | number | boolean): void {
    // Enforce Strict Atomic Field Isolation: ONLY place the called for item in the field (e.g. first name: Aurora; last name: Ramos)
    const atomicAudit = isolateAtomicFieldItem(value, key);
    this.fields[key] = String(atomicAudit.isolatedValue ?? '');
  }

  public check(field: string): void {
    this.fields[field] = this._checkbox_yes;
  }

  public uncheck(field: string): void {
    this.fields[field] = "Off";
  }

  public generate(): string {
    return this._header() + this._fields() + this._footer();
  }
}

export class FDF {
  private fields: Record<string, string> = {};
  private _checkbox_yes: string;

  constructor(checkbox_yes = "Yes") {
    this._checkbox_yes = checkbox_yes;
  }

  private _header(): string {
    return "%FDF-1.2\n" +
      "1 0 obj<</FDF<< /Fields[\n";
  }

  private _fields(): string {
    const fieldLines = Object.entries(this.fields).map(([name, val]) => {
      const sanitizedName = String(name).replace(/\)/g, '\\)').replace(/\(/g, '\\(');
      const sanitizedVal = String(val ?? '').replace(/\)/g, '\\)').replace(/\(/g, '\\(');
      return `<< /T(${sanitizedName}) /V(${sanitizedVal}) >>`;
    });
    return fieldLines.join('\n');
  }

  private _footer(): string {
    return "\n] >> >>\n" +
      "endobj\n" +
      "trailer\n" +
      "<</Root 1 0 R>>\n" +
      "%%EOF";
  }

  public add_field(name: string, value: string | number | boolean): void {
    const atomicAudit = isolateAtomicFieldItem(value, name);
    this.fields[name] = String(atomicAudit.isolatedValue ?? '');
  }

  public check(field: string): void {
    this.fields[field] = this._checkbox_yes;
  }

  public uncheck(field: string): void {
    this.fields[field] = "Off";
  }

  public generate(): string {
    return this._header() + this._fields() + this._footer();
  }
}

/**
 * Generate XFDF package for official California Judicial Council forms or legal pleadings.
 */
export function generateCourtFormXFDF(
  fieldMap: Record<string, string | number | boolean>,
  targetPdfHref = "form.pdf"
): string {
  const xfdf = new XFDF("Yes", targetPdfHref);
  Object.entries(fieldMap).forEach(([k, v]) => {
    xfdf.add_field(k, v);
  });
  return xfdf.generate();
}

/**
 * Generate FDF package for PDF form filling.
 */
export function generateCourtFormFDF(
  fieldMap: Record<string, string | number | boolean>
): string {
  const fdf = new FDF("Yes");
  Object.entries(fieldMap).forEach(([k, v]) => {
    fdf.add_field(k, v);
  });
  return fdf.generate();
}

/**
 * Trigger direct client browser download of .xfdf file
 */
export function downloadXfdfFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/vnd.adobe.xfdf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xfdf') ? filename : `${filename}.xfdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger direct client browser download of .fdf file
 */
export function downloadFdfFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/vnd.fdf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.fdf') ? filename : `${filename}.fdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger direct client browser download of .pdf file
 */
export function downloadPdfFile(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Creates and downloads a complete ZIP package configured specifically for
 * ABBYY FineReader and ONLYOFFICE Desktop Editors.
 * 
 * Why this is necessary:
 * - ABBYY FineReader requires the companion PDF named in the XFDF's `<f href="..." />`
 *   to reside in the EXACT same folder, otherwise ABBYY reports "File not found".
 * - ONLYOFFICE opens interactive forms natively via the pre-filled PDF.
 * This ZIP bundles both with matching names, plus FDF and quick instructions.
 */
export async function downloadAbbyyOnlyOfficeBundle(
  pdfBytes: Uint8Array,
  fieldMap: Record<string, string | number | boolean>,
  baseName: string
): Promise<void> {
  const zip = new JSZip();

  const sanitizedBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetPdfName = `${sanitizedBase}.pdf`;
  const targetXfdfName = `${sanitizedBase}.xfdf`;
  const targetFdfName = `${sanitizedBase}.fdf`;

  // 1. Generate XFDF where <f href="..."> points directly to the matching companion PDF
  const xfdfContent = generateCourtFormXFDF(fieldMap, targetPdfName);
  const fdfContent = generateCourtFormFDF(fieldMap);

  // 2. Add files to ZIP
  zip.file(targetPdfName, pdfBytes);
  zip.file(targetXfdfName, xfdfContent);
  zip.file(targetFdfName, fdfContent);

  // 3. Add instructions for ABBYY FineReader & ONLYOFFICE
  const instructions = `========================================================================
ABBYY FINEREADER & ONLYOFFICE COURT FORM PACKAGE
Form Base: ${sanitizedBase}
Generated: ${new Date().toISOString()}
========================================================================

HOW TO OPEN IN ABBYY FINEREADER:
------------------------------------------------------------------------
Method A (Direct Interactive Form):
  1. Double-click '${targetPdfName}' to open in ABBYY FineReader PDF.
  2. All court fields are already filled out with your data.
  3. Edit any field, review OCR annotations, and save.

Method B (Import XFDF Data):
  1. Open '${targetPdfName}' in ABBYY FineReader.
  2. Go to 'Form' (or 'Tools') menu > 'Import Form Data...'.
  3. Select '${targetXfdfName}'.
  4. Note: '${targetXfdfName}' already has '<f href="${targetPdfName}"/>'
     bound to this exact document.

HOW TO OPEN IN ONLYOFFICE:
------------------------------------------------------------------------
Method A (ONLYOFFICE PDF Form Editor):
  1. Open ONLYOFFICE Desktop Editors or ONLYOFFICE Web.
  2. Open '${targetPdfName}'.
  3. ONLYOFFICE will open the interactive PDF Form Editor with all
     fields filled in and ready for editing, signing, or e-filing.

Method B (ONLYOFFICE DocSpace / Workspace):
  1. Upload '${targetPdfName}' to your ONLYOFFICE room.
  2. Collaborate in real time on the court form.
========================================================================
`;
  zip.file('HOW_TO_OPEN_IN_ABBYY_AND_ONLYOFFICE.txt', instructions);

  // 4. Generate and trigger ZIP download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizedBase}_ABBYY_OnlyOffice_Package.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Export a complete ABBYY FineReader / ONLYOFFICE compatibility package:
 * In ONLYOFFICE and ABBYY FineReader, users open the pre-populated PDF directly
 * to see all form fields filled in, or import the companion .xfdf via File > Import Data.
 */
export function triggerAbbyyOnlyOfficeLaunch(
  pdfBytes: Uint8Array,
  xfdfContent: string,
  baseName: string
): void {
  const sanitizedBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetPdfName = `${sanitizedBase}.pdf`;
  const targetXfdfName = `${sanitizedBase}.xfdf`;

  // 1. Download the populated PDF (directly editable in ABBYY FineReader & ONLYOFFICE)
  downloadPdfFile(pdfBytes, targetPdfName);

  // 2. Download the companion ISO/Adobe-compliant XFDF with exact matching filename
  downloadXfdfFile(xfdfContent, targetXfdfName);
}
