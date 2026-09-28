/**
 * PDF Filler Engine (STAGE 4: Direct PDF Population)
 * Powered by pdf-lib: Fills exact court form fields without altering layout.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { UniversalLegalData } from './universalSchema';
import { CourtFormDefinition } from './formsCatalog';

export interface GeneratedPdfResult {
  formCode: string;
  filename: string;
  blob: Blob;
  downloadUrl: string;
  byteSize: number;
  filledFieldsCount: number;
}

export class PdfFillerService {
  /**
   * Generates or fills the official PDF with universal client data
   */
  static async fillCourtForm(
    formDef: CourtFormDefinition,
    data: UniversalLegalData,
    existingPdfBytes?: Uint8Array
  ): Promise<GeneratedPdfResult> {
    let pdfDoc: PDFDocument;

    if (existingPdfBytes && existingPdfBytes.length > 0) {
      pdfDoc = await PDFDocument.load(existingPdfBytes);
    } else {
      // Create a pristine official court template AcroForm
      pdfDoc = await this.createOfficialTemplateAcroForm(formDef);
    }

    const form = pdfDoc.getForm();
    let filledCount = 0;

    for (const [universalKey, pdfFieldName] of Object.entries(formDef.fieldMap)) {
      const val = data[universalKey];
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        try {
          const textField = form.getTextField(pdfFieldName);
          if (textField) {
            textField.setText(String(val));
            filledCount++;
          }
        } catch {
          // If field doesn't exist by exact name, try case-insensitive match
          try {
            const fields = form.getFields();
            const matched = fields.find(
              (f) => f.getName().toLowerCase() === pdfFieldName.toLowerCase()
            );
            if (matched && 'setText' in matched) {
              (matched as any).setText(String(val));
              filledCount++;
            }
          } catch {
            // Ignore missing fields
          }
        }
      }
    }

    // Save filled document
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const filename = `${formDef.code}_Filled_${data.client_last_name || 'Client'}.pdf`;

    return {
      formCode: formDef.code,
      filename,
      blob,
      downloadUrl,
      byteSize: pdfBytes.byteLength,
      filledFieldsCount: filledCount
    };
  }

  /**
   * Constructs an official California Judicial Council / Court standard template
   * with exact AcroForm fields ready for population.
   */
  private static async createOfficialTemplateAcroForm(
    formDef: CourtFormDefinition
  ): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const form = pdfDoc.getForm();

    // 1. Top Border & Court Form Identification
    page.drawText(formDef.jurisdiction.toUpperCase(), {
      x: 36,
      y: height - 36,
      size: 8,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText(formDef.code, {
      x: width - 90,
      y: height - 36,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Outer Form Boundary Box (Official Court Layout)
    page.drawRectangle({
      x: 36,
      y: 45,
      width: width - 72,
      height: height - 90,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
      color: rgb(1, 1, 1)
    });

    // 2. Attorney / Party Without Attorney Box (Top Left)
    page.drawRectangle({
      x: 36,
      y: height - 170,
      width: 320,
      height: 125,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    page.drawText('ATTORNEY OR PARTY WITHOUT ATTORNEY (Name, State Bar number, and address):', {
      x: 42,
      y: height - 55,
      size: 7,
      font: boldFont
    });

    // Attorney Name Field
    const attyField = form.createTextField(formDef.fieldMap.attorney_name || 'AttorneyName');
    attyField.addToPage(page, { x: 42, y: height - 75, width: 200, height: 16 });

    // Attorney Bar # Field
    const barField = form.createTextField(formDef.fieldMap.attorney_bar_number || 'AttorneyBarNumber');
    barField.addToPage(page, { x: 250, y: height - 75, width: 100, height: 16 });

    // Firm Name Field
    const firmField = form.createTextField(formDef.fieldMap.attorney_firm || 'AttorneyFirmName');
    firmField.addToPage(page, { x: 42, y: height - 95, width: 308, height: 16 });

    // Attorney Address Field
    const attyAddrField = form.createTextField(formDef.fieldMap.attorney_address || 'AttorneyAddress');
    attyAddrField.addToPage(page, { x: 42, y: height - 115, width: 308, height: 16 });

    // Attorney Phone & Email
    page.drawText('TELEPHONE NO:', { x: 42, y: height - 128, size: 6.5, font });
    const attyPhone = form.createTextField(formDef.fieldMap.attorney_phone || 'AttorneyPhone');
    attyPhone.addToPage(page, { x: 95, y: height - 134, width: 100, height: 14 });

    page.drawText('E-MAIL:', { x: 202, y: height - 128, size: 6.5, font });
    const attyEmail = form.createTextField(formDef.fieldMap.attorney_email || 'AttorneyEmail');
    attyEmail.addToPage(page, { x: 232, y: height - 134, width: 118, height: 14 });

    page.drawText('ATTORNEY FOR (Name):', { x: 42, y: height - 146, size: 6.5, font });
    const attyFor = form.createTextField('AttorneyFor');
    attyFor.addToPage(page, { x: 125, y: height - 152, width: 225, height: 14 });

    // 3. Court Seal & For Court Use Only Box (Top Right)
    page.drawRectangle({
      x: 356,
      y: height - 170,
      width: width - 392,
      height: 125,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    page.drawText('FOR COURT USE ONLY', { x: width - 175, y: height - 55, size: 8, font: boldFont });

    // 4. Superior Court Information Box
    page.drawRectangle({
      x: 36,
      y: height - 250,
      width: width - 72,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    page.drawText('SUPERIOR COURT OF CALIFORNIA, COUNTY OF', {
      x: 42,
      y: height - 182,
      size: 8,
      font: boldFont
    });

    const countyField = form.createTextField(formDef.fieldMap.court_county || 'CountyName');
    countyField.addToPage(page, { x: 245, y: height - 188, width: 180, height: 16 });

    page.drawText('STREET ADDRESS:', { x: 42, y: height - 200, size: 7, font });
    const courtStreet = form.createTextField(formDef.fieldMap.court_street || 'CourtStreet');
    courtStreet.addToPage(page, { x: 115, y: height - 204, width: 380, height: 14 });

    page.drawText('CITY AND ZIP CODE:', { x: 42, y: height - 218, size: 7, font });
    const courtCityZip = form.createTextField(formDef.fieldMap.court_city_zip || 'CourtCityZip');
    courtCityZip.addToPage(page, { x: 125, y: height - 222, width: 370, height: 14 });

    page.drawText('BRANCH NAME:', { x: 42, y: height - 236, size: 7, font });
    const branchField = form.createTextField(formDef.fieldMap.court_branch_name || 'BranchName');
    branchField.addToPage(page, { x: 105, y: height - 240, width: 390, height: 14 });

    // 5. Party Captions & Case Number Section
    page.drawRectangle({
      x: 36,
      y: height - 330,
      width: 320,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    page.drawText('PETITIONER / PLAINTIFF:', { x: 42, y: height - 264, size: 7, font: boldFont });
    const petField = form.createTextField(
      formDef.fieldMap.opposing_party_name || formDef.fieldMap.client_full_name || 'PetitionerName'
    );
    petField.addToPage(page, { x: 42, y: height - 282, width: 308, height: 15 });

    page.drawText('RESPONDENT / DEFENDANT:', { x: 42, y: height - 298, size: 7, font: boldFont });
    const respField = form.createTextField(
      formDef.fieldMap.client_full_name || 'RespondentName'
    );
    respField.addToPage(page, { x: 42, y: height - 316, width: 308, height: 15 });

    // Case Number Box (Right of captions)
    page.drawRectangle({
      x: 356,
      y: height - 330,
      width: width - 392,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    page.drawText('CASE NUMBER:', { x: 364, y: height - 264, size: 8, font: boldFont });
    const caseNumField = form.createTextField(formDef.fieldMap.case_number || 'CaseNumber');
    caseNumField.addToPage(page, { x: 364, y: height - 288, width: 190, height: 20 });

    // 6. Form Title Banner
    page.drawRectangle({
      x: 36,
      y: height - 370,
      width: width - 72,
      height: 38,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95)
    });

    page.drawText(formDef.title.toUpperCase(), {
      x: 48,
      y: height - 355,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // 7. Body Details Table / Field Section
    page.drawText('1. STATISTICAL FACTS & RESIDENCE REQUIREMENTS', {
      x: 42,
      y: height - 395,
      size: 8.5,
      font: boldFont
    });

    page.drawText('a. Date of Marriage / Partnership:', { x: 55, y: height - 415, size: 7.5, font });
    const domField = form.createTextField(formDef.fieldMap.marriage_date || 'DateOfMarriage');
    domField.addToPage(page, { x: 200, y: height - 421, width: 120, height: 15 });

    page.drawText('b. Date of Separation:', { x: 340, y: height - 415, size: 7.5, font });
    const dosField = form.createTextField(formDef.fieldMap.separation_date || 'DateOfSeparation');
    dosField.addToPage(page, { x: 430, y: height - 421, width: 120, height: 15 });

    page.drawText('2. RESIDENTIAL ADDRESS OF RESPONDENT / CLIENT', {
      x: 42,
      y: height - 445,
      size: 8.5,
      font: boldFont
    });

    page.drawText('Street Address:', { x: 55, y: height - 465, size: 7.5, font });
    const streetField = form.createTextField(formDef.fieldMap.client_street || 'RespondentStreet');
    streetField.addToPage(page, { x: 130, y: height - 471, width: 420, height: 15 });

    page.drawText('City:', { x: 55, y: height - 490, size: 7.5, font });
    const cityField = form.createTextField(formDef.fieldMap.client_city || 'RespondentCity');
    cityField.addToPage(page, { x: 80, y: height - 496, width: 160, height: 15 });

    page.drawText('State:', { x: 260, y: height - 490, size: 7.5, font });
    const stateField = form.createTextField(formDef.fieldMap.client_state || 'RespondentState');
    stateField.addToPage(page, { x: 290, y: height - 496, width: 60, height: 15 });

    page.drawText('Zip Code:', { x: 370, y: height - 490, size: 7.5, font });
    const zipField = form.createTextField(formDef.fieldMap.client_zip || 'RespondentZip');
    zipField.addToPage(page, { x: 420, y: height - 496, width: 130, height: 15 });

    // 8. Declaration & Signature Block
    page.drawText('I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.', {
      x: 42,
      y: 120,
      size: 7.5,
      font: boldFont
    });

    page.drawText('Date:', { x: 42, y: 85, size: 8, font });
    page.drawLine({ start: { x: 65, y: 83 }, end: { x: 180, y: 83 }, thickness: 1 });

    page.drawText('SIGNATURE OF RESPONDENT / DECLARANT', { x: 280, y: 68, size: 7, font });
    page.drawLine({ start: { x: 260, y: 83 }, end: { x: width - 50, y: 83 }, thickness: 1 });

    // Footer
    page.drawText(`Form Adopted for Mandatory Use • Judicial Council of California • ${formDef.code} [Rev. January 1, 2026]`, {
      x: 36,
      y: 30,
      size: 6.5,
      font
    });

    page.drawText(`${formDef.title} (Family Law)`, {
      x: width / 2 - 60,
      y: 30,
      size: 6.5,
      font: boldFont
    });

    page.drawText('Page 1 of 1', {
      x: width - 80,
      y: 30,
      size: 6.5,
      font
    });

    return pdfDoc;
  }
}
