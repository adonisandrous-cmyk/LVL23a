/**
 * Adobe XFDF (XML Forms Data Format) Generator
 * Conforms to Adobe Acrobat standard for direct form-filling without modifying template layout.
 */

import { UniversalLegalData } from './universalSchema';
import { CourtFormDefinition } from './formsCatalog';
import { isolateAtomicFieldItem } from '../../services/phoenixEngine/Agent3Extraction';

export interface GeneratedXfdfResult {
  formCode: string;
  templatePdfName: string;
  xmlString: string;
  blob: Blob;
  downloadUrl: string;
  fieldCount: number;
  mappedFields: Array<{ universalKey: string; pdfFieldName: string; value: string }>;
}

export function generateXfdf(
  formDef: CourtFormDefinition,
  universalData: UniversalLegalData
): GeneratedXfdfResult {
  const mappedFields: Array<{ universalKey: string; pdfFieldName: string; value: string }> = [];

  const escapeXml = (unsafe: string): string => {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  let fieldsXml = '';

  for (const [universalKey, pdfFieldName] of Object.entries(formDef.fieldMap)) {
    const rawVal = universalData[universalKey];
    // Enforce atomic single-item placement (e.g., first name: Aurora; last name: Ramos)
    const atomicAudit = isolateAtomicFieldItem(rawVal, universalKey, pdfFieldName);
    const valString = atomicAudit.isolatedValue !== undefined && atomicAudit.isolatedValue !== null ? String(atomicAudit.isolatedValue) : '';
    mappedFields.push({
      universalKey,
      pdfFieldName,
      value: valString
    });

    fieldsXml += `    <field name="${escapeXml(pdfFieldName)}">\n`;
    fieldsXml += `      <value>${escapeXml(valString)}</value>\n`;
    fieldsXml += `    </field>\n`;
  }

  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">
  <fields>
${fieldsXml}  </fields>
  <f href="${escapeXml(formDef.templatePdfName)}"/>
</xfdf>
`;

  const blob = new Blob([xmlString], { type: 'application/vnd.adobe.xfdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    formCode: formDef.code,
    templatePdfName: formDef.templatePdfName,
    xmlString,
    blob,
    downloadUrl,
    fieldCount: mappedFields.length,
    mappedFields
  };
}
