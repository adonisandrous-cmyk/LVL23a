/**
 * XFDF and FDF Form Data Generators for Official Court PDF Population
 * Based on canonical Adobe Acrobat XML Forms Data Format (XFDF) and Forms Data Format (FDF) specs.
 * Used to populate Judicial Council and legal court PDF forms directly.
 */

export class XFDF {
  private fields: Record<string, string> = {};
  private _checkbox_yes: string;
  private targetPdfHref: string;

  /**
   * Initialize with a positive value for checkboxes (as it may vary, e.g. "Yes", "1", "On")
   * and optional target PDF reference.
   */
  constructor(checkbox_yes = "Yes", targetPdfHref = "judicial_form.pdf") {
    this._checkbox_yes = checkbox_yes;
    this.targetPdfHref = targetPdfHref;
  }

  private _header(): string {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">\n' +
      '<fields>\n';
  }

  private _fields(): string {
    const fieldLines = Object.entries(this.fields).map(([key, val]) => {
      // Escape XML characters
      const escapedKey = key.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const escapedVal = String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `  <field name="${escapedKey}">\n    <value>${escapedVal}</value>\n  </field>`;
    });
    return fieldLines.join('\n');
  }

  private _footer(): string {
    const cleanHref = this.targetPdfHref.replace(/"/g, '&quot;');
    return '\n</fields>\n' +
      `<f href="${cleanHref}"/>\n` +
      '</xfdf>';
  }

  public add_field(key: string, value: string | number | boolean): void {
    this.fields[key] = String(value ?? '');
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

  /**
   * Initialize with a positive value for checkboxes (default: "Yes")
   */
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
    this.fields[name] = String(value ?? '');
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
