/**
 * ABBYY FlexiCapture 12 Associate Engine & Field Parser
 * Connects ABBYY FlexiCapture Web Verification / Export pipelines to the
 * Universal Relational Database and Document Automation Generator.
 */

export interface AbbyyCapturedField {
  name: string;
  value: string;
  confidence: number;
  isValid: boolean;
  validationError?: string;
  sourceRect?: { left: number; top: number; width: number; height: number };
}

export interface AbbyyTaskItem {
  id: string;
  taskId: string;
  batchName: string;
  workId: string;
  documentType: 'Invoice' | 'LegalFiling' | 'CourtNotice' | 'FL120Intake';
  status: 'Pending' | 'Verified' | 'Rejected' | 'Ingested';
  fields: {
    workId: string;
    invoiceNo: string;
    invoiceDate: string;
    description: string;
    jobNumber: string;
    location: string;
    invoiceAmount: string;
    gstAmount: string;
    receivedDate: string;
    clientName?: string;
    courtName?: string;
  };
  redErrors: string[];
  pagesMerged: boolean;
  receivedAt: string;
}

export class AbbyyFlexiCaptureAssociate {
  private static DATE_FORMATS = [
    /^\d{2}\/\d{2}\/\d{2}$/,           // dd/MM/yy
    /^\d{2}\/\d{2}\/\d{4}$/,           // dd/MM/yyyy
    /^\d{4}-\d{2}-\d{2}$/,           // yyyy-MM-dd
    /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/  // d MMM yyyy
  ];

  /**
   * Validates date strings against accepted ABBYY FlexiCapture standards
   */
  public static validateDateFormat(dateStr: string): boolean {
    if (!dateStr || !dateStr.trim()) return false;
    const clean = dateStr.trim();
    return this.DATE_FORMATS.some((regex) => regex.test(clean));
  }

  /**
   * Maps extracted ABBYY fields directly into Universal Legal Schema
   */
  public static mapToUniversalSchema(task: AbbyyTaskItem) {
    // Determine client name dynamically without hardcoding
    const rawClient = task.fields.clientName || (task.fields.description?.replace(/^(Payment|Invoice|Matter for|Legal Representation -)\s+/i, '').trim()) || '';
    const nameParts = rawClient ? rawClient.trim().split(/\s+/) : [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Format address from location
    const address = task.fields.description?.includes('Street')
      ? task.fields.description
      : (task.fields.location || '');

    // Normalize date (YYYY-MM-DD)
    let dob = '';
    if (task.fields.receivedDate && /^\d{2}\/\d{2}\/\d{2}$/.test(task.fields.receivedDate)) {
      const [d, m, y] = task.fields.receivedDate.split('/');
      dob = `20${y}-${m}-${d}`;
    }

    return {
      client_first_name: firstName,
      client_last_name: lastName,
      client_DOB: dob,
      client_address: address,
      case_number: task.fields.invoiceNo || task.fields.jobNumber || '',
      court_name: task.fields.courtName || '',
      case_type: 'Family Law / Dissolution of Marriage',
      amount_total: task.fields.invoiceAmount || '',
      tax_amount: task.fields.gstAmount || '',
      batch_id: task.batchName,
      work_id: task.fields.workId
    };
  }

  /**
   * Analyzes Red Error flags matching Web Verification Station DOM
   */
  public static auditRedErrors(fields: AbbyyTaskItem['fields']): string[] {
    const errors: string[] = [];

    if (!fields.workId || !fields.workId.trim()) {
      errors.push('WorkId is Required');
    }
    if (!fields.invoiceNo || !fields.invoiceNo.trim()) {
      errors.push('Invoice Number is Required');
    }
    if (!fields.invoiceDate || !fields.invoiceDate.trim()) {
      errors.push('Invoice Date is Required');
    } else if (!this.validateDateFormat(fields.invoiceDate)) {
      errors.push('Invoice Date Format Incorrect (Expected dd/MM/yy)');
    }
    if (!fields.invoiceAmount || !fields.invoiceAmount.trim()) {
      errors.push('Invoice Amount is Required');
    } else if (isNaN(Number(fields.invoiceAmount.replace(/,/g, '')))) {
      errors.push('Invoice Amount contains INVALID characters');
    }

    return errors;
  }
}
