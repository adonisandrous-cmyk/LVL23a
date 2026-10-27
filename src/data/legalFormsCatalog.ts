import { DocumentTemplate } from '../types';

export interface CourtFormSchema {
  id: string;
  formNumber: string;
  formTitle: string;
  courtSystem: string;
  mappings: { fieldName: string; token: string; value: string; isRequired: boolean }[];
}

export interface ResearchCourtForm {
  code: string;
  title: string;
  category: string;
  pdfUrl?: string;
  description: string;
  guidelines: string[];
}

// All form templates and automated court schemas deleted per user decommission directive
export const ALL_DOCUMENT_TEMPLATES: DocumentTemplate[] = [];
export const ALL_COURT_FORM_SCHEMAS: CourtFormSchema[] = [];
export const ALL_RESEARCH_COURT_FORMS: ResearchCourtForm[] = [];
