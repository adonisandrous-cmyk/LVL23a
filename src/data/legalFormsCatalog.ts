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

// ========================================================================================
// 1. ALL DOCUMENT TEMPLATES (CALIFORNIA & NEVADA)
// ========================================================================================
export const ALL_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // --------------------------------------------------------------------------------------
  // CALIFORNIA FAMILY LAW
  // --------------------------------------------------------------------------------------
  {
    id: 'ca-fl-100',
    name: 'CA FL-100: Petition — Marriage/Domestic Partnership',
    category: 'Family Law (CA)',
    description: 'California Judicial Council FL-100. Initiates dissolution, legal separation, or nullity proceedings.',
    defaultQuestions: ['Date of Marriage', 'Separation Date', 'Filing County', 'Spousal Support goals', 'Child Custody details', 'Separate vs Community Property description'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

In re the Marriage of:
Petitioner: {{Client Name}}
and
Respondent: {{Spouse Defendant Name}}

CASE NO: FL-100-DISSOLUTION

PETITION FOR DISSOLUTION OF MARRIAGE / DOMESTIC PARTNERSHIP

1. RESIDENCE REQUIREMENTS:
   Petitioner has been a resident of California for at least 6 months and of the County of {{Filing County}} for at least 3 months immediately prior to filing.

2. STATISTICAL FACTS:
   (a) Date of Marriage: {{Date of Marriage}}
   (b) Date of Separation: {{Separation Date}}

3. MINOR CHILDREN:
   Child custody and visitation arrangements requested: {{Child Custody details}}

4. SPOUSAL SUPPORT:
   Spousal support request details: {{Spousal Support goals}}

5. PROPERTY DIVISION:
   Separate vs Community property schedule summary: {{Separate vs Community Property description}}

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.

Dated: {{Current Date}}
_________________________________________
Attorney for Petitioner / Declarant`
  },
  {
    id: 'ca-fl-110',
    name: 'CA FL-110: Summons (Family Law)',
    category: 'Family Law (CA)',
    description: 'California Judicial Council FL-110. Official statutory notice and temporary restraining orders served on Respondent.',
    defaultQuestions: ['Petitioner Name', 'Respondent Name', 'Filing County', 'Court Address', 'Attorney Name and Bar Number'],
    templateBody: `CITACION (Derecho Familiar) - SUMMONS (FAMILY LAW)

SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}
Street Address: {{Court Address}}

NOTICE TO RESPONDENT: {{Respondent Name}}
You are being sued by PETITIONER: {{Petitioner Name}}

You have 30 CALENDAR DAYS after this Summons and Petition are served on you to file a Response.

STANDARD FAMILY LAW RESTRAINING ORDERS:
Starting immediately, you and your spouse are restrained from removing minor children from California, transferring or concealing property, or altering insurance policies.

Dated: {{Current Date}}
Clerk, by Deputy / Attorney: {{Attorney Name and Bar Number}}`
  },
  {
    id: 'ca-fl-120',
    name: 'CA FL-120: Response — Marriage/Domestic Partnership',
    category: 'Family Law (CA)',
    description: 'California Judicial Council FL-120. Respondent’s formal answer contesting or agreeing to petition terms.',
    defaultQuestions: ['Date of Marriage', 'Separation Date', 'Filing County', 'Respondent Custody Position', 'Respondent Property Counterclaim'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

Petitioner: {{Client Name}}
Respondent: {{Spouse Defendant Name}}

CASE NO: FL-120-RESP

RESPONSE TO PETITION FOR DISSOLUTION OF MARRIAGE

1. STATISTICAL CONFIRMATION:
   Date of Marriage: {{Date of Marriage}} | Date of Separation: {{Separation Date}}

2. CUSTODY & VISITATION RESPONSE:
   Respondent requests the following custody orders: {{Respondent Custody Position}}

3. PROPERTY DISPOSITION:
   Respondent lists additional separate/community property claims: {{Respondent Property Counterclaim}}

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.

Dated: {{Current Date}}
_________________________________________
Respondent / Attorney for Respondent`
  },
  {
    id: 'ca-fl-105',
    name: 'CA FL-105 / GC-120: UCCJEA Declaration',
    category: 'Family Law (CA)',
    description: 'Mandatory statutory declaration under Uniform Child Custody Jurisdiction and Enforcement Act.',
    defaultQuestions: ['Minor Children Names and DOBs', 'Children Residence Addresses Last 5 Years', 'Other Pending Custody Cases'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

DECLARATION UNDER UNIFORM CHILD CUSTODY JURISDICTION AND ENFORCEMENT ACT (UCCJEA)

1. MINOR CHILDREN LISTING:
   Names and Dates of Birth: {{Minor Children Names and DOBs}}

2. RESIDENCE HISTORY (LAST 5 YEARS):
   Addresses and cohabitants: {{Children Residence Addresses Last 5 Years}}

3. PRIOR / PENDING CUSTODY LITIGATION:
   Court case proceedings: {{Other Pending Custody Cases}}

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.

Dated: {{Current Date}}
_________________________________________
Declarant`
  },
  {
    id: 'ca-fl-200',
    name: 'CA FL-200: Petition to Establish Parental Relationship',
    category: 'Family Law (CA)',
    description: 'California FL-200. Used by unmarried parents to establish legal paternity, custody, and child support.',
    defaultQuestions: ['Child Full Name and DOB', 'Mother Name', 'Father Name', 'Requested Custody Orders', 'Genetic Testing Request'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

PETITION TO ESTABLISH PARENTAL RELATIONSHIP (FL-200)

Petitioner: {{Client Name}}
Respondent: {{Spouse Defendant Name}}

1. CHILD IDENTIFICATION:
   Child: {{Child Full Name and DOB}}
   Mother: {{Mother Name}} | Alleged Father: {{Father Name}}

2. PARENTAGE & CUSTODY REQUESTS:
   (a) Petitioner requests court establish legal parentage.
   (b) Genetic Testing: {{Genetic Testing Request}}
   (c) Proposed Custody/Support: {{Requested Custody Orders}}

I declare under penalty of perjury that the foregoing is true and correct.

Dated: {{Current Date}}
_________________________________________
Petitioner / Attorney`
  },
  {
    id: 'ca-fl-260',
    name: 'CA FL-260: Petition for Custody and Support of Minor Children',
    category: 'Family Law (CA)',
    description: 'California FL-260. For married or unmarried parents where parentage is established and custody/support is sought.',
    defaultQuestions: ['Children Names', 'Requested Legal Custody', 'Requested Physical Custody', 'Child Support Details'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

PETITION FOR CUSTODY AND SUPPORT OF MINOR CHILDREN (FL-260)

1. CHILDREN: {{Children Names}}
2. LEGAL CUSTODY REQUEST: {{Requested Legal Custody}}
3. PHYSICAL CUSTODY REQUEST: {{Requested Physical Custody}}
4. CHILD SUPPORT GUIDELINE: {{Child Support Details}}

Dated: {{Current Date}}
_________________________________________
Petitioner`
  },
  {
    id: 'ca-fl-300',
    name: 'CA FL-300: Request for Order (RFO)',
    category: 'Family Law (CA)',
    description: 'California FL-300. Motion for hearing requesting immediate or temporary custody, support, or attorney fee orders.',
    defaultQuestions: ['Requested Orders (Custody/Support/Fees)', 'Factual Basis and Emergency Need', 'Attached Declarations'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

REQUEST FOR ORDER (RFO - FL-300)

1. REQUESTED ORDERS:
   Petitioner requests orders regarding: {{Requested Orders (Custody/Support/Fees)}}

2. FACTUAL DECLARATION IN SUPPORT:
   {{Factual Basis and Emergency Need}}

3. ATTACHMENTS: {{Attached Declarations}}

Dated: {{Current Date}}
_________________________________________
Moving Party / Attorney`
  },
  {
    id: 'ca-fl-320',
    name: 'CA FL-320: Responsive Declaration to Request for Order',
    category: 'Family Law (CA)',
    description: 'California FL-320. Formal response consenting to, opposing, or proposing counter-orders for an RFO.',
    defaultQuestions: ['Agreed Orders', 'Opposed Orders', 'Counter-Proposal Details', 'Supporting Facts'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

RESPONSIVE DECLARATION TO REQUEST FOR ORDER (FL-320)

1. ORDERS AGREED TO: {{Agreed Orders}}
2. ORDERS OPPOSED: {{Opposed Orders}}
3. RESPONDENT PROPOSAL: {{Counter-Proposal Details}}
4. FACTS IN SUPPORT: {{Supporting Facts}}

Dated: {{Current Date}}
_________________________________________
Responding Party / Attorney`
  },
  {
    id: 'ca-fl-311',
    name: 'CA FL-311: Child Custody and Visitation Attachment',
    category: 'Family Law (CA)',
    description: 'California FL-311. Attachment detailing specific parenting schedules, drop-off locations, and transportation.',
    defaultQuestions: ['Weekly Parenting Schedule', 'Holiday Exchange Protocol', 'Transportation and Drop-off Location', 'Supervised Visitation Needs'],
    templateBody: `CHILD CUSTODY AND VISITATION (PARENTING TIME) APPLICATION ATTACHMENT (FL-311)

1. REGULAR PARENTING TIME SCHEDULE:
   {{Weekly Parenting Schedule}}

2. TRANSPORTATION & EXCHANGE LOCATIONS:
   {{Transportation and Drop-off Location}}

3. SPECIAL CONDITIONS / SUPERVISION:
   {{Supervised Visitation Needs}}

Attached to Judicial Council Form RFO / Petition.`
  },
  {
    id: 'ca-fl-341c',
    name: 'CA FL-341(C): Children’s Holiday Schedule Attachment',
    category: 'Family Law (CA)',
    description: 'California FL-341(C). Detailed holiday, summer vacation, and school break schedule attachment.',
    defaultQuestions: ['Thanksgiving Rotation', 'Winter / Christmas Break Division', 'Summer Vacation Allowance', 'Birthdays Exchange'],
    templateBody: `CHILDREN'S HOLIDAY SCHEDULE ATTACHMENT (FL-341(C))

1. THANKSGIVING HOLIDAY: {{Thanksgiving Rotation}}
2. WINTER / CHRISTMAS BREAK: {{Winter / Christmas Break Division}}
3. SUMMER VACATION PERIODS: {{Summer Vacation Allowance}}
4. BIRTHDAYS & SPECIAL DAYS: {{Birthdays Exchange}}

Incorporated into Custody Order.`
  },
  {
    id: 'ca-fl-180',
    name: 'CA FL-180: Judgment (Family Law)',
    category: 'Family Law (CA)',
    description: 'California FL-180. Final judicial decree establishing dissolution status, custody, child/spousal support, and property division.',
    defaultQuestions: ['Effective Date of Termination', 'Custody Order Incorporation', 'Support Order Terms', 'Property Distribution Summary'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

JUDGMENT (FAMILY LAW - FL-180)

1. MARITAL STATUS TERMINATED EFFECTIVE: {{Effective Date of Termination}}
2. CHILD CUSTODY & SUPPORT: Incorporated per attached agreement/order: {{Custody Order Incorporation}}
3. SPOUSAL SUPPORT: {{Support Order Terms}}
4. PROPERTY DIVISION: {{Property Distribution Summary}}

IT IS SO ORDERED.

Dated: {{Current Date}}
_________________________________________
JUDGE OF THE SUPERIOR COURT`
  },
  {
    id: 'ca-fl-190',
    name: 'CA FL-190: Notice of Entry of Judgment',
    category: 'Family Law (CA)',
    description: 'California FL-190. Formal clerk notice verifying that judgment has been entered into court records.',
    defaultQuestions: ['Entry Date of Judgment', 'Petitioner Address', 'Respondent Address'],
    templateBody: `NOTICE OF ENTRY OF JUDGMENT (FL-190)

You are notified that the Judgment in this matter was entered on: {{Entry Date of Judgment}}

Mailed to:
Petitioner: {{Petitioner Address}}
Respondent: {{Respondent Address}}`
  },

  // --------------------------------------------------------------------------------------
  // CALIFORNIA FINANCIAL STATEMENTS & DISCLOSURES
  // --------------------------------------------------------------------------------------
  {
    id: 'ca-fl-140',
    name: 'CA FL-140: Declaration of Disclosure Cover Sheet',
    category: 'Financial & Disclosures (CA)',
    description: 'California FL-140. Mandatory preliminary and final disclosure cover sheet required in all dissolution cases.',
    defaultQuestions: ['Disclosure Type (Preliminary/Final)', 'Service Date of FL-150', 'Service Date of FL-142 / Schedule'],
    templateBody: `DECLARATION OF DISCLOSURE (FL-140)

1. TYPE: {{Disclosure Type (Preliminary/Final)}} Declaration of Disclosure.
2. ATTACHED DOCUMENTS:
   (a) Income and Expense Declaration (FL-150) served on: {{Service Date of FL-150}}
   (b) Schedule of Assets and Debts (FL-142) served on: {{Service Date of FL-142 / Schedule}}
   (c) Tax returns for past 2 years attached.

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.`
  },
  {
    id: 'ca-fl-141',
    name: 'CA FL-141: Declaration Regarding Service of Disclosure',
    category: 'Financial & Disclosures (CA)',
    description: 'California FL-141. Proof filed with the court confirming service of financial disclosures on opposing party.',
    defaultQuestions: ['Served Party Name', 'Service Method and Date', 'Disclosure Phase'],
    templateBody: `DECLARATION REGARDING SERVICE OF DECLARATION OF DISCLOSURE (FL-141)

1. Declarant served {{Disclosure Phase}} Declaration of Disclosure on {{Served Party Name}}.
2. Service Method and Date: {{Service Method and Date}}
3. Filed with Superior Court of California, County of {{Filing County}}.`
  },
  {
    id: 'ca-fl-142',
    name: 'CA FL-142: Schedule of Assets and Debts',
    category: 'Financial & Disclosures (CA)',
    description: 'California FL-142. Comprehensive itemized listing of real estate, bank accounts, stocks, vehicles, and liabilities.',
    defaultQuestions: ['Real Estate Assets Value', 'Bank and Financial Accounts', 'Vehicles and Personal Property', 'Total Credit Card and Mortgages Debts'],
    templateBody: `SCHEDULE OF ASSETS AND DEBTS (FL-142)

1. REAL ESTATE: {{Real Estate Assets Value}}
2. BANK & INVESTMENT ACCOUNTS: {{Bank and Financial Accounts}}
3. VEHICLES & PERSONAL PROPERTY: {{Vehicles and Personal Property}}
4. LIABILITIES & DEBTS: {{Total Credit Card and Mortgages Debts}}

Declarant declares under penalty of perjury that all assets and debts are fully disclosed.`
  },
  {
    id: 'ca-fl-150',
    name: 'CA FL-150: Income and Expense Declaration',
    category: 'Financial & Disclosures (CA)',
    description: 'California FL-150. Mandatory statement of gross monthly earnings, tax withholdings, household expenses, and assets.',
    defaultQuestions: ['Gross Monthly Income', 'Employer Name and Occupation', 'Monthly Housing Expense', 'Total Household Monthly Expenses', 'Attached Paystubs Dates'],
    templateBody: `INCOME AND EXPENSE DECLARATION (FL-150)

1. EMPLOYMENT & INCOME:
   Employer: {{Employer Name and Occupation}}
   Gross Monthly Income: {{Gross Monthly Income}}

2. MONTHLY EXPENSES:
   Housing: {{Monthly Housing Expense}}
   Total Monthly Expenses: {{Total Household Monthly Expenses}}

3. ATTACHED PROOF: Last 2 months paystubs attached dated: {{Attached Paystubs Dates}}

Signed under penalty of perjury.`
  },
  {
    id: 'ca-fl-155',
    name: 'CA FL-155: Financial Statement (Simplified)',
    category: 'Financial & Disclosures (CA)',
    description: 'California FL-155. Simplified financial statement for child support-only proceedings where welfare or low income applies.',
    defaultQuestions: ['Monthly Wages', 'Number of Dependents', 'AFDC / CalWORKS Benefits Status'],
    templateBody: `FINANCIAL STATEMENT (SIMPLIFIED - FL-155)

1. MONTHLY WAGES: {{Monthly Wages}}
2. DEPENDENTS: {{Number of Dependents}}
3. PUBLIC ASSISTANCE STATUS: {{AFDC / CalWORKS Benefits Status}}`
  },
  {
    id: 'ca-fl-160',
    name: 'CA FL-160: Property Declaration',
    category: 'Financial & Disclosures (CA)',
    description: 'California FL-160. Form listing community or separate property items and proposed values for division.',
    defaultQuestions: ['Property Category (Community or Separate)', 'Item Descriptions & FMV', 'Proposed Division Allocation'],
    templateBody: `PROPERTY DECLARATION (FL-160)

PROPERTY CATEGORY: {{Property Category (Community or Separate)}}

ITEMIZED ASSETS & FAIR MARKET VALUE:
{{Item Descriptions & FMV}}

PROPOSED JUDICIAL ALLOCATION:
{{Proposed Division Allocation}}`
  },

  // --------------------------------------------------------------------------------------
  // CALIFORNIA NAME CHANGE & GUARDIANSHIP
  // --------------------------------------------------------------------------------------
  {
    id: 'ca-nc-100',
    name: 'CA NC-100: Petition for Change of Name',
    category: 'Name Change & Guardianship (CA)',
    description: 'California Judicial Council NC-100. Initial adult or minor name change petition.',
    defaultQuestions: ['Current Legal Name', 'Proposed New Name', 'Reason for Name Change', 'Filing County'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

PETITION FOR CHANGE OF NAME (NC-100)

1. PETITIONER: {{Client Name}}
2. CURRENT NAME: {{Current Legal Name}}
3. PROPOSED NEW NAME: {{Proposed New Name}}
4. REASON FOR REQUEST: {{Reason for Name Change}}

Petitioner requests court order a hearing and grant Decree Changing Name.`
  },
  {
    id: 'ca-nc-120',
    name: 'CA NC-120: Order to Show Cause for Change of Name',
    category: 'Name Change & Guardianship (CA)',
    description: 'California NC-120. Court order directing publication of notice in designated county newspaper.',
    defaultQuestions: ['Court Hearing Date and Time', 'Designated Newspaper for Publication', 'Filing County'],
    templateBody: `ORDER TO SHOW CAUSE FOR CHANGE OF NAME (NC-120)

SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

TO ALL INTERESTED PERSONS:
Petitioner {{Client Name}} filed a petition for name change.
HEARING DATE: {{Court Hearing Date and Time}}

IT IS ORDERED that this order be published once a week for 4 consecutive weeks in: {{Designated Newspaper for Publication}}.`
  },
  {
    id: 'ca-nc-130',
    name: 'CA NC-130: Decree Changing Name',
    category: 'Name Change & Guardianship (CA)',
    description: 'California NC-130. Judicial decree officially changing legal name.',
    defaultQuestions: ['Old Legal Name', 'New Legal Name', 'Judge Signature Date'],
    templateBody: `DECREE CHANGING NAME (NC-130)

THE COURT FINDS that all notices have been published according to law.

IT IS ORDERED THAT:
The name of {{Old Legal Name}} IS CHANGED TO {{New Legal Name}}.

Dated: {{Judge Signature Date}}
_________________________________________
JUDGE OF THE SUPERIOR COURT`
  },
  {
    id: 'ca-gc-210',
    name: 'CA GC-210: Petition for Appointment of Guardian of Minor',
    category: 'Name Change & Guardianship (CA)',
    description: 'California GC-210. Petition requesting appointment of guardian over minor person and/or estate.',
    defaultQuestions: ['Minor Name and Age', 'Proposed Guardian Name and Relationship', 'Reason Guardianship Necessary', 'Parents Consent Status'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

PETITION FOR APPOINTMENT OF GUARDIAN OF MINOR (GC-210)

1. MINOR: {{Minor Name and Age}}
2. PROPOSED GUARDIAN: {{Proposed Guardian Name and Relationship}}
3. NECESSITY STATEMENT: {{Reason Guardianship Necessary}}
4. PARENTAL CONSENT: {{Parents Consent Status}}`
  },
  {
    id: 'ca-gc-250',
    name: 'CA GC-250: Letters of Guardianship',
    category: 'Name Change & Guardianship (CA)',
    description: 'California GC-250. Official court certificate empowering appointed guardian.',
    defaultQuestions: ['Guardian Full Name', 'Minor Name', 'Powers Granted'],
    templateBody: `LETTERS OF GUARDIANSHIP (GC-250)

SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

{{Guardian Full Name}} is appointed Guardian of the Person/Estate of {{Minor Name}}.
Powers granted: {{Powers Granted}}

Witness my hand and seal of the court.`
  },

  // --------------------------------------------------------------------------------------
  // CALIFORNIA CIVIL COVER SHEET, SUMMONS & CAUSES OF ACTION (TORT/CONTRACT)
  // --------------------------------------------------------------------------------------
  {
    id: 'ca-cm-010',
    name: 'CA CM-010: Civil Case Cover Sheet',
    category: 'Civil & Torts (CA)',
    description: 'California CM-010. Mandatory cover sheet classifying lawsuit complexity and cause of action.',
    defaultQuestions: ['Case Type (Unlimited/Limited)', 'Primary Cause of Action (Auto/Tort/Contract)', 'Demanded Monetary Amount', 'Jury Trial Demanded (Yes/No)'],
    templateBody: `CIVIL CASE COVER SHEET (CM-010)

SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

CASE TYPE: {{Case Type (Unlimited/Limited)}}
ACTION CATEGORY: {{Primary Cause of Action (Auto/Tort/Contract)}}
AMOUNT DEMANDED: {{Demanded Monetary Amount}}
JURY TRIAL DEMANDED: {{Jury Trial Demanded (Yes/No)}}`
  },
  {
    id: 'ca-sum-100',
    name: 'CA SUM-100: Summons (Civil Action)',
    category: 'Civil & Torts (CA)',
    description: 'California SUM-100. Official summons giving defendant 30 days to respond to civil complaint.',
    defaultQuestions: ['Defendant Name', 'Plaintiff Name', 'Filing County', 'Plaintiff Attorney Contact'],
    templateBody: `SUMMONS (CITACION JUDICIAL) - SUM-100

NOTICE TO DEFENDANT: {{Defendant Name}}
YOU ARE BEING SUED BY PLAINTIFF: {{Plaintiff Name}}

You have 30 CALENDAR DAYS after this Summons and legal papers are served on you to file a written response at this court.

Attorney for Plaintiff: {{Plaintiff Attorney Contact}}`
  },
  {
    id: 'ca-pld-pi-001',
    name: 'CA PLD-PI-001: Complaint — Personal Injury / Tort',
    category: 'Civil & Torts (CA)',
    description: 'California Judicial Council PLD-PI-001. Master complaint form for motor vehicle, negligence, or intentional tort claims.',
    defaultQuestions: ['Incident Date and Location', 'Defendants Named', 'Injuries and Damages Alleged', 'Causes of Action Included'],
    templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}

COMPLAINT — PERSONAL INJURY, PROPERTY DAMAGE, WRONGFUL DEATH (PLD-PI-001)

Plaintiff: {{Client Name}}
v.
Defendant: {{Spouse Defendant Name}}

1. INCIDENT DETAILS: Date: {{Incident Date and Location}}
2. DEFENDANTS: {{Defendants Named}}
3. INJURIES & DAMAGES: {{Injuries and Damages Alleged}}
4. CAUSES OF ACTION ATTACHED: {{Causes of Action Included}}

PRAYER FOR RELIEF: Compensatory and general damages according to proof.`
  },
  {
    id: 'ca-pld-pi-001-1',
    name: 'CA PLD-PI-001(1): Cause of Action — Motor Vehicle',
    category: 'Civil & Torts (CA)',
    description: 'Cause of Action attachment for motor vehicle collisions and negligent driving.',
    defaultQuestions: ['Plaintiff Vehicle Description', 'Defendant Vehicle Description', 'Acts of Negligent Driving'],
    templateBody: `CAUSE OF ACTION — MOTOR VEHICLE (Attachment to Complaint)

Plaintiff alleges Defendant operated a motor vehicle negligently on public roadways resulting in collision:
- Plaintiff vehicle: {{Plaintiff Vehicle Description}}
- Defendant vehicle: {{Defendant Vehicle Description}}
- Negligent conduct: {{Acts of Negligent Driving}}`
  },
  {
    id: 'ca-pld-pi-001-2',
    name: 'CA PLD-PI-001(2): Cause of Action — General Negligence',
    category: 'Civil & Torts (CA)',
    description: 'Cause of Action attachment alleging breach of duty of care and resulting injury.',
    defaultQuestions: ['Duty Owed by Defendant', 'Breach of Duty Actions', 'Causation and Harm Description'],
    templateBody: `CAUSE OF ACTION — GENERAL NEGLIGENCE

Defendant owed a statutory and common law duty of reasonable care to Plaintiff.
- Duty: {{Duty Owed by Defendant}}
- Breach: {{Breach of Duty Actions}}
- Resulting Harm: {{Causation and Harm Description}}`
  },
  {
    id: 'ca-pld-pi-001-3',
    name: 'CA PLD-PI-001(3): Cause of Action — Intentional Tort',
    category: 'Civil & Torts (CA)',
    description: 'Cause of Action attachment for intentional acts such as assault, battery, fraud, or duress.',
    defaultQuestions: ['Intentional Conduct (Assault/Battery/Fraud)', 'Malice or Oppression Allegations', 'Punitive Damages Claim'],
    templateBody: `CAUSE OF ACTION — INTENTIONAL TORT

Defendant committed intentional, willful, and malicious acts against Plaintiff:
- Conduct Alleged: {{Intentional Conduct (Assault/Battery/Fraud)}}
- Malice / Intent: {{Malice or Oppression Allegations}}
- Request for Punitive Damages: {{Punitive Damages Claim}}`
  },
  {
    id: 'ca-pld-c-001',
    name: 'CA PLD-C-001: Complaint — Breach of Contract',
    category: 'Civil & Torts (CA)',
    description: 'California Judicial Council PLD-C-001. Complaint asserting breach of written or oral contract.',
    defaultQuestions: ['Contract Date and Terms', 'Breach Actions by Defendant', 'Monetary Loss Amount'],
    templateBody: `COMPLAINT — CONTRACT (PLD-C-001)

1. CONTRACT TERMS: Executed on {{Contract Date and Terms}}
2. BREACH ALLEGATIONS: Defendant failed to perform obligations: {{Breach Actions by Defendant}}
3. DAMAGES DEMANDED: Outstanding balance of {{Monetary Loss Amount}} plus statutory interest.`
  },

  // --------------------------------------------------------------------------------------
  // CALIFORNIA SMALL CLAIMS, PROOF OF SERVICE & FEE WAIVERS
  // --------------------------------------------------------------------------------------
  {
    id: 'ca-sc-100',
    name: 'CA SC-100: Plaintiff’s Claim (Small Claims)',
    category: 'Small Claims & Service (CA)',
    description: 'California SC-100. Initiates small claims lawsuit for disputes up to $12,500.',
    defaultQuestions: ['Claim Amount Demanded', 'Reason Defendant Owes Money', 'Demand Date Made'],
    templateBody: `PLAINTIFF'S CLAIM AND ORDER TO GO TO SMALL CLAIMS COURT (SC-100)

Plaintiff: {{Client Name}} v. Defendant: {{Spouse Defendant Name}}

1. AMOUNT CLAIMED: {{Claim Amount Demanded}}
2. REASON FOR CLAIM: {{Reason Defendant Owes Money}}
3. DEMAND MADE ON: {{Demand Date Made}}`
  },
  {
    id: 'ca-pos-010',
    name: 'CA POS-010: Proof of Service of Summons (Civil)',
    category: 'Small Claims & Service (CA)',
    description: 'California POS-010. Sworn affidavit proving personal service of civil summons and complaint.',
    defaultQuestions: ['Server Name and Address', 'Date and Time Served', 'Location Served', 'Documents Served List'],
    templateBody: `PROOF OF SERVICE OF SUMMONS (POS-010)

1. SERVER: {{Server Name and Address}}
2. PERSON SERVED: {{Spouse Defendant Name}}
3. DATE & TIME: {{Date and Time Served}} AT {{Location Served}}
4. DOCUMENTS: {{Documents Served List}}

I declare under penalty of perjury under the laws of the State of California that the foregoing is true.`
  },
  {
    id: 'ca-fl-115',
    name: 'CA FL-115: Proof of Service of Summons (Family Law)',
    category: 'Small Claims & Service (CA)',
    description: 'California FL-115. Confirms personal service of Family Law Summons and Petition.',
    defaultQuestions: ['Server Name', 'Served Party Name', 'Service Address and Date', 'Attached Documents'],
    templateBody: `PROOF OF SERVICE OF SUMMONS (FL-115)

1. SERVER NAME: {{Server Name}}
2. SERVED ON: {{Served Party Name}} ON {{Service Address and Date}}
3. DOCUMENTS SERVED: FL-100 Petition, FL-110 Summons, FL-105 UCCJEA, and Blank Response Form.`
  },
  {
    id: 'ca-fl-335',
    name: 'CA FL-335: Proof of Service by Mail (Family Law)',
    category: 'Small Claims & Service (CA)',
    description: 'California FL-335. Proof confirming service of motion papers or RFO by first-class mail.',
    defaultQuestions: ['Mail Server Name', 'Date Mailed', 'Address Mailed To', 'Mailed Documents List'],
    templateBody: `PROOF OF SERVICE BY MAIL (FL-335)

1. SERVER: {{Mail Server Name}}
2. MAILED ON: {{Date Mailed}} TO ADDRESS: {{Address Mailed To}}
3. DOCUMENTS: {{Mailed Documents List}}`
  },
  {
    id: 'ca-fw-001',
    name: 'CA FW-001: Request to Waive Court Fees',
    category: 'Financial & Waivers (CA)',
    description: 'California FW-001. Application requesting waiver of court filing fees based on public benefits or low income.',
    defaultQuestions: ['Public Benefits Received (SSI/Medi-Cal/CalFresh)', 'Monthly Gross Household Income', 'Number of Household Family Members'],
    templateBody: `REQUEST TO WAIVE COURT FEES (FW-001)

APPLICANT: {{Client Name}}

1. QUALIFYING BASIS:
   (a) Public Benefits: {{Public Benefits Received (SSI/Medi-Cal/CalFresh)}}
   (b) Gross Household Income: {{Monthly Gross Household Income}}
   (c) Family Household Members: {{Number of Household Family Members}}

Applicant requests full waiver of court filing fees.`
  },
  {
    id: 'ca-fw-003',
    name: 'CA FW-003: Order on Court Fee Waiver',
    category: 'Financial & Waivers (CA)',
    description: 'California FW-003. Proposed judicial order granting fee waiver.',
    defaultQuestions: ['Applicant Name', 'Waiver Grant Status (Granted/Denied/Hearing Scheduled)'],
    templateBody: `ORDER ON COURT FEE WAIVER (FW-003)

The Court grants the request to waive court fees for: {{Applicant Name}}.
STATUS: {{Waiver Grant Status (Granted/Denied/Hearing Scheduled)}}`
  },

  // --------------------------------------------------------------------------------------
  // NEVADA STATE & DISTRICT COURT FORMS
  // --------------------------------------------------------------------------------------
  {
    id: 'nv-fam-101',
    name: 'NV FAM-101: Nevada Family Division Cover Sheet',
    category: 'Nevada Practice',
    description: 'Nevada Eighth/Second Judicial District Court Cover Sheet required with all initial family filings.',
    defaultQuestions: ['District Court County (Clark/Washoe)', 'Case Type (Divorce/Custody/Paternity)', 'Attorney or Self-Represented Info'],
    templateBody: `IN THE EIGHTH JUDICIAL DISTRICT COURT OF THE STATE OF NEVADA
IN AND FOR THE COUNTY OF {{District Court County (Clark/Washoe)}}

FAMILY DIVISION CIVIL COVER SHEET

PLAINTIFF / PETITIONER: {{Client Name}}
DEFENDANT / RESPONDENT: {{Spouse Defendant Name}}

NATURE OF SUIT: {{Case Type (Divorce/Custody/Paternity)}}
FILED BY: {{Attorney or Self-Represented Info}}`
  },
  {
    id: 'nv-fam-102',
    name: 'NV FAM-102: Joint Petition for Divorce',
    category: 'Nevada Practice',
    description: 'Nevada District Court Joint Petition for un-contested divorce signed by both spouses.',
    defaultQuestions: ['Spouse A Name', 'Spouse B Name', 'Marriage Date and Location', 'Nevada Residency Jurisdictional Statement', 'Agreed Division of Assets'],
    templateBody: `IN THE FAMILY DIVISION OF THE DISTRICT COURT OF NEVADA

JOINT PETITION FOR DIVORCE

Joint Petitioners {{Spouse A Name}} and {{Spouse B Name}} respectfully declare:
1. RESIDENCY: At least one spouse has resided in Nevada for over 6 weeks prior.
2. MARRIAGE: Married on {{Marriage Date and Location}}.
3. AGREED SETTLEMENT: Petitioners have settled all asset division: {{Agreed Division of Assets}}.

Respectfully submitted jointly under penalty of perjury.`
  },
  {
    id: 'nv-fam-103',
    name: 'NV FAM-103: Complaint for Divorce (Nevada)',
    category: 'Nevada Practice',
    description: 'Nevada District Court Complaint for unilateral divorce filing.',
    defaultQuestions: ['Plaintiff Name', 'Defendant Name', 'Residency Affidavit Details', 'Grounds (Incompatibility)', 'Custody and Support Prayer'],
    templateBody: `IN THE FAMILY DIVISION OF THE DISTRICT COURT OF NEVADA

COMPLAINT FOR DIVORCE

Plaintiff {{Client Name}} v. Defendant {{Spouse Defendant Name}}

1. JURISDICTION: Plaintiff resides in Nevada: {{Residency Affidavit Details}}.
2. GROUNDS: Incompatibility.
3. RELIEF REQUESTED: {{Custody and Support Prayer}}.`
  },
  {
    id: 'nv-fam-107',
    name: 'NV FAM-107: Motion to Modify Custody and Support',
    category: 'Nevada Practice',
    description: 'Nevada District Court Motion requesting custody, visitation, or child support decree modification.',
    defaultQuestions: ['Existing Decree Date', 'Substantial Change in Circumstances', 'Proposed Modified Parenting Plan'],
    templateBody: `IN THE FAMILY DIVISION OF THE DISTRICT COURT OF NEVADA

MOTION TO MODIFY CUSTODY, VISITATION, AND CHILD SUPPORT

Moving Party: {{Client Name}}

1. EXISTING DECREE: Entered on {{Existing Decree Date}}.
2. CHANGE IN CIRCUMSTANCES: {{Substantial Change in Circumstances}}.
3. PROPOSED PLAN: {{Proposed Modified Parenting Plan}}.`
  },
  {
    id: 'nv-fin-201',
    name: 'NV FIN-201: Nevada Financial Disclosure Form (NRCP 16.2)',
    category: 'Nevada Practice',
    description: 'Mandatory Nevada Rule of Civil Procedure 16.2 detailed financial disclosure form.',
    defaultQuestions: ['Monthly Income Summary', 'Monthly Expenses Itemized', 'Real Estate and Bank Assets', 'Debts and Liens Schedule'],
    templateBody: `NEVADA FINANCIAL DISCLOSURE FORM (NRCP 16.2)

1. INCOME SUMMARY: {{Monthly Income Summary}}
2. EXPENSES SCHEDULE: {{Monthly Expenses Itemized}}
3. ASSET DISCLOSURE: {{Real Estate and Bank Assets}}
4. LIABILITIES: {{Debts and Liens Schedule}}

Verified under oath pursuant to NEFCR guidelines.`
  },
  {
    id: 'nv-nc-301',
    name: 'NV NC-301: Petition for Adult Name Change (Nevada)',
    category: 'Nevada Practice',
    description: 'Nevada District Court Petition for adult legal name change.',
    defaultQuestions: ['Current Legal Name', 'Proposed Legal Name', 'Reason for Request', 'Felony Record Disclosure'],
    templateBody: `IN THE DISTRICT COURT OF NEVADA

PETITION FOR ADULT CHANGE OF NAME

1. PETITIONER: {{Current Legal Name}}
2. REQUESTED NAME: {{Proposed Legal Name}}
3. REASON: {{Reason for Request}}
4. RECORD STATEMENT: {{Felony Record Disclosure}}`
  },
  {
    id: 'nv-gcn-401',
    name: 'NV GCN-401: Petition for Appointment of Guardian (Nevada)',
    category: 'Nevada Practice',
    description: 'Nevada District Court Petition for guardianship of minor or protected person under NRS Chapter 159/159A.',
    defaultQuestions: ['Protected Person Name', 'Proposed Guardian Name', 'Basis for Guardianship', 'Medical/Psychiatric Attachments'],
    templateBody: `IN THE DISTRICT COURT OF NEVADA — GUARDIANSHIP DIVISION

PETITION FOR APPOINTMENT OF GUARDIAN

1. PROTECTED PERSON: {{Protected Person Name}}
2. PETITIONER / GUARDIAN: {{Proposed Guardian Name}}
3. REASON FOR GUARDIANSHIP: {{Basis for Guardianship}}
4. MEDICAL PROOF: {{Medical/Psychiatric Attachments}}`
  },
  {
    id: 'nv-civ-501',
    name: 'NV CIV-501: Nevada Civil Cover Sheet and Summons',
    category: 'Nevada Practice',
    description: 'Nevada Civil Action Cover Sheet and Summons for tort, breach of contract, or property disputes.',
    defaultQuestions: ['Plaintiff Name', 'Defendant Name', 'Claim Category (Tort/Contract)', 'Damages Demanded'],
    templateBody: `NEVADA DISTRICT COURT CIVIL SUMMONS & COVER SHEET

PLAINTIFF: {{Client Name}} v. DEFENDANT: {{Spouse Defendant Name}}

CLAIM TYPE: {{Claim Category (Tort/Contract)}}
MONETARY DAMAGES DEMANDED: {{Damages Demanded}}`
  },
  {
    id: 'nv-fw-801',
    name: 'NV FW-801: Application to Waive Filing Fees (In Forma Pauperis)',
    category: 'Nevada Practice',
    description: 'Nevada District Court Application to proceed In Forma Pauperis and waive filing fees.',
    defaultQuestions: ['Applicant Wages', 'Public Benefits Received', 'Household Dependents'],
    templateBody: `IN THE DISTRICT COURT OF NEVADA

APPLICATION TO WAIVE FILING FEES (IN FORMA PAUPERIS)

Applicant {{Client Name}} moves court for an order waiving filing fees.
1. MONTHLY WAGES: {{Applicant Wages}}
2. PUBLIC ASSISTANCE: {{Public Benefits Received}}
3. DEPENDENTS: {{Household Dependents}}`
  },

  // --------------------------------------------------------------------------------------
  // FEDERAL CHAPTER 7 BANKRUPTCY FORMS (OFFICIAL U.S. COURTS STRUCTURAL MATRIX)
  // --------------------------------------------------------------------------------------
  {
    id: 'fed-b101',
    name: 'Official Form B 101: Voluntary Petition for Individuals',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 101. Voluntary petition for individuals filing Chapter 7 bankruptcy with district court data, asset/debt bands, and emergency filing declarations.',
    defaultQuestions: ['District Court Name', 'Estimated Creditors Range', 'Estimated Assets Band', 'Estimated Liabilities Band', 'Joint Filing Status', 'Primary Debtor Address', 'Emergency Filing Declaration'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

IN RE DEBTOR(S):
Debtor 1: {{Client Name}}
Debtor 2 (Spouse/Joint): {{Spouse Defendant Name}}

OFFICIAL FORM B 101: VOLUNTARY PETITION FOR INDIVIDUALS FILING FOR BANKRUPTCY

1. FILING CHAPTER: Chapter 7 Liquidation
2. ESTIMATED NUMBER OF CREDITORS: {{Estimated Creditors Range}}
3. ESTIMATED ASSETS VALUE BAND: {{Estimated Assets Band}}
4. ESTIMATED LIABILITIES VALUE BAND: {{Estimated Liabilities Band}}
5. JOINT FILING STATUS: {{Joint Filing Status}}
6. PRIMARY DEBTOR RESIDENCE ADDRESS: {{Primary Debtor Address}}
7. EMERGENCY FILING DECLARATION: {{Emergency Filing Declaration}}

DECLARATION AND SIGNATURE:
I declare under penalty of perjury under the laws of the United States of America that the information provided in this petition is true and correct.

Dated: {{Current Date}}
_________________________________________
Debtor Signature / Attorney: {{Attorney Name and Bar Number}}`
  },
  {
    id: 'fed-b106ab',
    name: 'Official Form B 106A/B: Schedule A/B — Property (Real & Personal)',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 106A/B. Normalized asset type tracking with real estate, vehicles, financial accounts, and strict unsecured value metrics.',
    defaultQuestions: ['Real Estate Property Description', 'Vehicle Description & Value', 'Financial Accounts & Cash Balances', 'Household Goods & Personal Effects', 'Business Assets & Claims', 'Unsecured Value Metrics'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 106A/B: SCHEDULE A/B — PROPERTY (REAL & PERSONAL)

PART 1: REAL ESTATE (HOUSES, CONDOS, LAND)
Description & Parcel Address: {{Real Estate Property Description}}

PART 2: VEHICLES (AUTOMOBILES, TRUCKS, MOTORCYCLES)
Year, Make, Model, VIN & Fair Market Value: {{Vehicle Description & Value}}

PART 3: FINANCIAL ACCOUNTS (BANK BALANCES, CRYPTO, INVESTMENTS)
Checking, Savings, Stocks, Retirement, Escrow Balances: {{Financial Accounts & Cash Balances}}

PART 4: HOUSEHOLD GOODS & PERSONAL EFFECTS
Furniture, Electronics, Clothing, Jewelry Total Valuation: {{Household Goods & Personal Effects}}

PART 5: BUSINESS ASSETS, IP & UNLIQUIDATED CLAIMS
Accounts Receivable, LLC Units, Legal Claims: {{Business Assets & Claims}}

PART 6: STRICT UNSECURED VALUE METRICS: {{Unsecured Value Metrics}}

Total Current Value of All Listed Property: Automatically aggregated in schedule petition.`
  },
  {
    id: 'fed-b106c',
    name: 'Official Form B 106C: Schedule C — The Property You Claim as Exempt',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 106C. Claims statutory exemptions protecting vehicle, wildcard, homestead, and household assets under CA CCP 703/704 or NV NRS 21 statutory parameters.',
    defaultQuestions: ['Primary Vehicle Exemption Statute', 'Primary Vehicle Exempt Amount', 'Wildcard / Bank Account Exemption Statute', 'Wildcard Exempt Amount', 'Homestead Exemption Statute', 'State Exemption Parameter (CA CCP 703/704 or NV NRS 21)'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 106C: SCHEDULE C — THE PROPERTY YOU CLAIM AS EXEMPT

APPLICABLE EXEMPTION ELECTION SYSTEM: {{State Exemption Parameter (CA CCP 703/704 or NV NRS 21)}}

1. MOTOR VEHICLE EXEMPTION CLAIM:
   Statute Authority: {{Primary Vehicle Exemption Statute}}
   Amount Claimed Exempt: {{Primary Vehicle Exempt Amount}}

2. FINANCIAL ACCOUNTS & WILDCARD EXEMPTION CLAIM:
   Statute Authority: {{Wildcard / Bank Account Exemption Statute}}
   Amount Claimed Exempt: {{Wildcard Exempt Amount}}

3. RESIDENTIAL HOMESTEAD EXEMPTION CLAIM:
   Statute Authority: {{Homestead Exemption Statute}}
   Exempt Amount: Max statutory allowance under chosen jurisdiction.

I declare under penalty of perjury that the property exemptions claimed above are authorized by law.`
  },
  {
    id: 'fed-b106d',
    name: 'Official Form B 106D: Schedule D — Creditors Who Have Claims Secured by Property',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 106D. Relates creditor IDs directly back to specific real estate or auto assets via foreign key links and collateral valuations.',
    defaultQuestions: ['Secured Creditor Name & Address', 'Collateral Asset Description (Real Estate/Auto)', 'Collateral Asset ID / Foreign Key', 'Total Amount of Claim', 'Unsecured Portion Value'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 106D: SCHEDULE D — CREDITORS WHO HAVE CLAIMS SECURED BY PROPERTY

1. PRIMARY SECURED CREDITOR RECORD:
   Creditor Name & Service Address: {{Secured Creditor Name & Address}}
   Collateral Asset Linked: {{Collateral Asset Description (Real Estate/Auto)}}
   Asset Foreign Key Identifier: {{Collateral Asset ID / Foreign Key}}
   Total Claim Amount: {{Total Amount of Claim}}
   Unsecured Deficiency Portion: {{Unsecured Portion Value}}

2. STATUTORY LIEN DETAILS:
   Nature of Lien: Purchase Money Mortgage / Deed of Trust / Vehicle Lien
   Agreement Date: Executed prior to filing.`
  },
  {
    id: 'fed-b106ef',
    name: 'Official Form B 106E/F: Schedule E/F — Creditors Who Have Unsecured Claims',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 106E/F. Isolates priority claims (taxes, domestic support) from nonpriority liabilities (credit cards, medical bills, personal loans).',
    defaultQuestions: ['Priority Unsecured Claims (Taxes/Domestic Support)', 'Nonpriority Unsecured Creditors (Credit Cards/Medical)', 'Priority Claim Total Amount', 'Nonpriority Claim Total Amount', 'Disputed / Unliquidated Claims'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 106E/F: SCHEDULE E/F — CREDITORS WHO HAVE UNSECURED CLAIMS

PART 1: SCHEDULE E — PRIORITY UNSECURED CLAIMS (11 U.S.C. 507)
Taxes, IRS/FTB Debts & Domestic Support Obligations: {{Priority Unsecured Claims (Taxes/Domestic Support)}}
Total Priority Claims: {{Priority Claim Total Amount}}

PART 2: SCHEDULE F — NONPRIORITY UNSECURED CLAIMS
Credit Cards, Revolving Credit, Medical Liabilities & Personal Loans: {{Nonpriority Unsecured Creditors (Credit Cards/Medical)}}
Total Nonpriority Claims: {{Nonpriority Claim Total Amount}}

PART 3: DISPUTED, CONTINGENT & UNLIQUIDATED CLAIMS
Explanatory Matrix Notes: {{Disputed / Unliquidated Claims}}`
  },
  {
    id: 'fed-b106gh',
    name: 'Official Form B 106G/H: Schedule G/H — Executory Contracts, Leases & Co-Debtors',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 106G/H. Handles lease tracking, landlord/contract agreements, and secondary co-debtor liability flags.',
    defaultQuestions: ['Executory Lease Description & Landlord', 'Unexpired Contract Expiration Date', 'Co-Debtor Full Name & Address', 'Co-Debtor Joint Obligation Flag'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 106G/H: SCHEDULE G/H — EXECUTORY CONTRACTS, LEASES & CO-DEBTORS

PART 1: SCHEDULE G — EXECUTORY CONTRACTS & UNEXPIRED LEASES
Residential / Commercial Lease & Landlord Details: {{Executory Lease Description & Landlord}}
Lease / Contract Term Expiration: {{Unexpired Contract Expiration Date}}
Intention: Assume or Reject Lease pursuant to 11 U.S.C. 365.

PART 2: SCHEDULE H — CO-DEBTORS & SECONDARY OBLIGORS
Co-Debtor Name & Address: {{Co-Debtor Full Name & Address}}
Joint Obligation Status: {{Co-Debtor Joint Obligation Flag}}`
  },
  {
    id: 'fed-b106ij',
    name: 'Official Form B 106I/J: Schedule I/J — Your Income & Ongoing Monthly Expenses',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 106I/J. Cross-references historical employment metrics with real-time monthly operational overhead and living expenses.',
    defaultQuestions: ['Debtor Gross Monthly Income', 'Spouse Gross Monthly Income', 'Total Monthly Payroll Deductions', 'Monthly Rent / Mortgage Payment', 'Monthly Utilities & Food Overhead', 'Net Monthly Operating Surplus / Deficit'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 106I/J: SCHEDULE I/J — YOUR INCOME & ONGOING MONTHLY EXPENSES

SCHEDULE I: YOUR INCOME
1. Debtor Monthly Gross Earnings: {{Debtor Gross Monthly Income}}
2. Spouse Monthly Gross Earnings: {{Spouse Gross Monthly Income}}
3. Payroll Taxes, Retirement & Mandatory Deductions: {{Total Monthly Payroll Deductions}}
   NET MONTHLY TAKE-HOME INCOME: Calculated automatically.

SCHEDULE J: ONGOING MONTHLY EXPENSES
1. Rent / Mortgage Payment: {{Monthly Rent / Mortgage Payment}}
2. Utilities, Food, Transportation & Insurance Overhead: {{Monthly Utilities & Food Overhead}}
   TOTAL MONTHLY OPERATING EXPENSES: Calculated automatically.

NET MONTHLY SURPLUS / DEFICIT: {{Net Monthly Operating Surplus / Deficit}}`
  },
  {
    id: 'fed-b107',
    name: 'Official Form B 107: Statement of Financial Affairs (SOFA)',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 107. Comprehensive Statement of Financial Affairs tracking prior income, asset transfers, gifts, losses, and business operations.',
    defaultQuestions: ['Gross Income Year-to-Date & Prior 2 Years', 'Prior Payments to Creditors / Insiders', 'Gifts & Charitable Contributions', 'Losses from Fire, Theft, or Gambling', 'Closed Financial Accounts or Transfers', 'Prior Business / Corporate Operations'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 107: STATEMENT OF FINANCIAL AFFAIRS FOR INDIVIDUALS (SOFA)

1. HISTORICAL GROSS INCOME (YTD & PREVIOUS 2 YEARS):
   Income Summary: {{Gross Income Year-to-Date & Prior 2 Years}}

2. PAYMENTS TO CREDITORS & INSIDERS (LAST 90 DAYS / 1 YEAR):
   Payment Log: {{Prior Payments to Creditors / Insiders}}

3. GIFTS, DONATIONS & CHARITABLE CONTRIBUTIONS: {{Gifts & Charitable Contributions}}

4. LOSSES FROM CASUALTY, FIRE, THEFT OR GAMBLING: {{Losses from Fire, Theft, or Gambling}}

5. CLOSED ACCOUNTS, TRANSFERS & PROPERTY SOLD: {{Closed Financial Accounts or Transfers}}

6. BUSINESS, LLC OR CORPORATE OWNERSHIP INTERESTS: {{Prior Business / Corporate Operations}}

I declare under penalty of perjury that the statements above are true and complete.`
  },
  {
    id: 'fed-b122a1',
    name: 'Official Form B 122A-1: Chapter 7 Statement of Monthly Income (Means Test)',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 122A-1. Chapter 7 Means Test calculation comparing debtor income to state median income.',
    defaultQuestions: ['Gross Monthly Employment Income', 'State Median Income Threshold', 'Marital Household Size', 'Presumption of Abuse Determination'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 122A-1: CHAPTER 7 STATEMENT OF YOUR CURRENT MONTHLY INCOME (MEANS TEST)

1. MARITAL HOUSEHOLD SIZE: {{Marital Household Size}}
2. CURRENT GROSS MONTHLY INCOME: {{Gross Monthly Employment Income}}
3. ANNUALIZED CURRENT MONTHLY INCOME: Calculated as Monthly Income x 12
4. APPLICABLE STATE MEDIAN INCOME: {{State Median Income Threshold}}

5. DETERMINATION:
   Income is below applicable state median: {{Presumption of Abuse Determination}}
   Presumption of Abuse does not arise under 11 U.S.C. 707(b)(2).`
  },
  {
    id: 'fed-b122a2',
    name: 'Official Form B 122A-2: Chapter 7 Means Test Calculation (Deductions)',
    category: 'Bankruptcy (Chapter 7)',
    description: 'Federal Judicial Form B 122A-2. Detailed Means Test expense deductions (IRS standards, housing, vehicle ownership, mandatory debt payments) and presumption rebuttal.',
    defaultQuestions: ['National & Local IRS Expense Deductions', 'Mandatory Debt & Payroll Deductions', 'Special Circumstances & Rebuttal Arguments', 'Final Rebutted Presumption Status'],
    templateBody: `UNITED STATES BANKRUPTCY COURT
DISTRICT OF: {{District Court Name}}

Debtor: {{Client Name}}
Case Number: {{Case Number}}

OFFICIAL FORM B 122A-2: CHAPTER 7 MEANS TEST CALCULATION (EXPENSE DEDUCTIONS)

1. NATIONAL & LOCAL IRS STANDARD DEDUCTIONS:
   Food, Clothing, Housing & Utilities Allowances: {{National & Local IRS Expense Deductions}}

2. MANDATORY DEBT SERVICE & HEALTHCARE DEDUCTIONS:
   Secured Debt Payments & Taxes: {{Mandatory Debt & Payroll Deductions}}

3. SPECIAL CIRCUMSTANCES & REBUTTAL DECLARATION:
   Factual Justification under 11 U.S.C. 707(b)(2)(B): {{Special Circumstances & Rebuttal Arguments}}

4. FINAL DETERMINATION STATUS: {{Final Rebutted Presumption Status}}`
  }
];

// ========================================================================================
// 2. ALL COURT FORM SCHEMAS (JUDICIAL MAPPINGS)
// ========================================================================================
export const ALL_COURT_FORM_SCHEMAS: CourtFormSchema[] = [
  {
    id: 'f-1',
    formNumber: 'FL-100',
    formTitle: 'Petition for Dissolution of Marriage/Domestic Partnership',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'ATTORNEY_OR_PARTY_WITHOUT_ATTORNEY', token: 'client.attorney', value: 'Alex, Esq. (State Bar 232323)', isRequired: true },
      { fieldName: 'SUPERIOR_COURT_OF_CALIFORNIA_COUNTY', token: 'client.county', value: 'ORANGE COUNTY', isRequired: true },
      { fieldName: 'PETITIONER_NAME', token: 'client.name', value: 'Jane Doe', isRequired: true },
      { fieldName: 'RESPONDENT_NAME', token: 'spouse_or_defendant', value: 'John Doe', isRequired: true },
      { fieldName: 'DATE_OF_MARRIAGE', token: 'intake.marriage_date', value: 'June 18, 2015', isRequired: true },
      { fieldName: 'DATE_OF_SEPARATION', token: 'intake.separation_date', value: 'May 15, 2025', isRequired: true },
      { fieldName: 'MINOR_CHILDREN_CUSTODY_PRAYER', token: 'intake.children_custody', value: 'Joint Legal Custody, Primary Physical to Petitioner', isRequired: false },
      { fieldName: 'SPOUSAL_SUPPORT_PRAYER', token: 'intake.spousal_support', value: 'Temporary spousal support of $1,250/mo to Petitioner', isRequired: false },
      { fieldName: 'COMMUNITY_PROPERTY_ASSET_DECLARATION', token: 'intake.community_prop', value: 'Marital home in Orange County purchased joint in 2018 is community', isRequired: false }
    ]
  },
  {
    id: 'f-110',
    formNumber: 'FL-110',
    formTitle: 'Summons (Family Law)',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'PETITIONER_NAME', token: 'client.name', value: 'Jane Doe', isRequired: true },
      { fieldName: 'RESPONDENT_NAME', token: 'spouse_or_defendant', value: 'John Doe', isRequired: true },
      { fieldName: 'COURT_ADDRESS', token: 'court.address', value: '341 The City Drive, Orange, CA 92868', isRequired: true }
    ]
  },
  {
    id: 'f-120',
    formNumber: 'FL-120',
    formTitle: 'Response — Marriage/Domestic Partnership',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'PETITIONER_NAME', token: 'client.name', value: 'Jane Doe', isRequired: true },
      { fieldName: 'RESPONDENT_NAME', token: 'spouse_or_defendant', value: 'John Doe', isRequired: true },
      { fieldName: 'RESPONSE_CUSTODY_PRAYER', token: 'intake.resp_custody', value: 'Joint Physical and Legal Custody', isRequired: false }
    ]
  },
  {
    id: 'f-150',
    formNumber: 'FL-150',
    formTitle: 'Income and Expense Declaration',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'EMPLOYER_NAME', token: 'client.employer', value: 'Aegis Systems Inc.', isRequired: true },
      { fieldName: 'GROSS_MONTHLY_INCOME', token: 'client.income', value: '$6,450.00', isRequired: true },
      { fieldName: 'MONTHLY_HOUSING_EXPENSE', token: 'client.housing_cost', value: '$2,200.00', isRequired: true }
    ]
  },
  {
    id: 'f-160',
    formNumber: 'FL-160',
    formTitle: 'Property Declaration (Community / Separate)',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'REAL_ESTATE_FMV', token: 'property.home_value', value: '$850,000.00', isRequired: true },
      { fieldName: 'REAL_ESTATE_ENCUMBRANCE', token: 'property.mortgage', value: '$420,000.00', isRequired: true }
    ]
  },
  {
    id: 'f-cm010',
    formNumber: 'CM-010',
    formTitle: 'Civil Case Cover Sheet',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'CASE_TYPE', token: 'case.type', value: 'Unlimited Civil', isRequired: true },
      { fieldName: 'PRIMARY_CAUSE_OF_ACTION', token: 'case.cause', value: 'Personal Injury — Motor Vehicle', isRequired: true },
      { fieldName: 'DEMAND_AMOUNT', token: 'case.demand', value: '$250,000.00', isRequired: true }
    ]
  },
  {
    id: 'f-pldpi001',
    formNumber: 'PLD-PI-001',
    formTitle: 'Complaint — Personal Injury, Property Damage, Wrongful Death',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'PLAINTIFF_NAME', token: 'client.name', value: 'Jane Doe', isRequired: true },
      { fieldName: 'DEFENDANT_NAME', token: 'defendant.name', value: 'John Doe', isRequired: true },
      { fieldName: 'INCIDENT_LOCATION', token: 'incident.location', value: 'Pacific Coast Hwy, Newport Beach, CA', isRequired: true }
    ]
  },
  {
    id: 'f-fw001',
    formNumber: 'FW-001',
    formTitle: 'Request to Waive Court Fees',
    courtSystem: 'Superior Court of California',
    mappings: [
      { fieldName: 'APPLICANT_NAME', token: 'client.name', value: 'Jane Doe', isRequired: true },
      { fieldName: 'PUBLIC_BENEFITS_STATUS', token: 'benefits.status', value: 'Medi-Cal Active', isRequired: true }
    ]
  },
  {
    id: 'f-nvfam101',
    formNumber: 'NV-FAM-101',
    formTitle: 'Nevada Family Division Cover Sheet',
    courtSystem: 'Eighth Judicial District Court, Clark County, Nevada',
    mappings: [
      { fieldName: 'PETITIONER_NAME', token: 'client.name', value: 'Jane Doe', isRequired: true },
      { fieldName: 'RESPONDENT_NAME', token: 'spouse_or_defendant', value: 'John Doe', isRequired: true },
      { fieldName: 'COUNTY_DISTRICT', token: 'client.nv_county', value: 'Clark County', isRequired: true }
    ]
  },
  {
    id: 'f-nvfin201',
    formNumber: 'NV-FIN-201',
    formTitle: 'Nevada Financial Disclosure Form (NRCP 16.2)',
    courtSystem: 'Eighth Judicial District Court, Clark County, Nevada',
    mappings: [
      { fieldName: 'MONTHLY_GROSS_WAGES', token: 'client.wages', value: '$5,200.00', isRequired: true },
      { fieldName: 'TOTAL_MONTHLY_DEBT', token: 'client.debts', value: '$1,400.00', isRequired: true }
    ]
  },
  {
    id: 'f-fed-b101',
    formNumber: 'Official Form B 101',
    formTitle: 'Voluntary Petition for Individuals Filing for Bankruptcy',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'DISTRICT_COURT_NAME', token: 'court.district', value: 'Central District of California', isRequired: true },
      { fieldName: 'PRIMARY_DEBTOR_NAME', token: 'client.name', value: 'Jane Doe', isRequired: true },
      { fieldName: 'ESTIMATED_ASSET_BAND', token: 'bankruptcy.asset_band', value: '$100,001 - $500,000', isRequired: true },
      { fieldName: 'ESTIMATED_DEBT_BAND', token: 'bankruptcy.debt_band', value: '$100,001 - $500,000', isRequired: true },
      { fieldName: 'EMERGENCY_FILING_STATUS', token: 'bankruptcy.emergency', value: 'Standard Filing (Complete Schedules Attached)', isRequired: false }
    ]
  },
  {
    id: 'f-fed-b106ab',
    formNumber: 'Official Form B 106A/B',
    formTitle: 'Schedule A/B: Property (Real and Personal)',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'REAL_ESTATE_PARCEL_DESC', token: 'property.real_estate', value: '100 Main Street, Santa Ana, CA 92701 (Single Family Residence)', isRequired: true },
      { fieldName: 'VEHICLE_MAKE_MODEL_VIN', token: 'property.vehicles', value: '2021 Honda Accord Sedan (VIN #1HGCR2F83MA019284)', isRequired: true },
      { fieldName: 'FINANCIAL_ACCOUNTS_BALANCES', token: 'property.bank_balances', value: 'Chase Checking #4910 ($2,450.00); Vanguard 401(k) ($48,200.00)', isRequired: true },
      { fieldName: 'STRICT_UNSECURED_VALUE_METRICS', token: 'bankruptcy.unsecured_metrics', value: 'Total Net Liquidation Equity: $12,850.00', isRequired: true }
    ]
  },
  {
    id: 'f-fed-b106c',
    formNumber: 'Official Form B 106C',
    formTitle: 'Schedule C: The Property You Claim as Exempt',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'EXEMPTION_SYSTEM_ELECTED', token: 'bankruptcy.exemption_sys', value: 'California System 2 (CCP 703.140(b))', isRequired: true },
      { fieldName: 'MOTOR_VEHICLE_EXEMPTION_STATUTE', token: 'bankruptcy.vehicle_statute', value: 'CCP 703.140(b)(2) — $6,375.00', isRequired: true },
      { fieldName: 'WILDCARD_EXEMPTION_STATUTE', token: 'bankruptcy.wildcard_statute', value: 'CCP 703.140(b)(5) — $33,625.00', isRequired: true }
    ]
  },
  {
    id: 'f-fed-b106d',
    formNumber: 'Official Form B 106D',
    formTitle: 'Schedule D: Creditors Who Have Claims Secured by Property',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'SECURED_CREDITOR_NAME_ADDRESS', token: 'creditor.secured_name', value: 'Wells Fargo Home Mortgage, P.O. Box 14411, Des Moines, IA', isRequired: true },
      { fieldName: 'COLLATERAL_ASSET_FK', token: 'creditor.asset_fk_id', value: 'REAL_ESTATE_PARCEL_100_MAIN', isRequired: true },
      { fieldName: 'SECURED_CLAIM_AMOUNT', token: 'creditor.secured_amount', value: '$385,000.00', isRequired: true }
    ]
  },
  {
    id: 'f-fed-b106ef',
    formNumber: 'Official Form B 106E/F',
    formTitle: 'Schedule E/F: Creditors Who Have Unsecured Claims',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'PRIORITY_UNSECURED_CLAIMS', token: 'creditor.priority_claims', value: 'IRS Tax Year 2024 Income Tax liability ($4,200.00)', isRequired: true },
      { fieldName: 'NONPRIORITY_UNSECURED_CREDITORS', token: 'creditor.nonpriority_list', value: 'Chase Sapphire ($8,400); Citibank Visa ($5,200); Quest Diagnostics ($850)', isRequired: true }
    ]
  },
  {
    id: 'f-fed-b106gh',
    formNumber: 'Official Form B 106G/H',
    formTitle: 'Schedule G/H: Executory Contracts, Leases & Co-Debtors',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'EXECUTORY_LEASE_DETAILS', token: 'contract.lease_desc', value: 'Residential Lease with Irvine Company Apartments (Expires 11/30/2026)', isRequired: true },
      { fieldName: 'CODEBTOR_FULL_RECORD', token: 'contract.codebtor_info', value: 'John Doe, 100 Main Street, Santa Ana, CA 92701 (Co-Signer on Honda Note)', isRequired: false }
    ]
  },
  {
    id: 'f-fed-b106ij',
    formNumber: 'Official Form B 106I/J',
    formTitle: 'Schedule I/J: Your Income and Ongoing Expenses',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'DEBTOR_GROSS_MONTHLY_INCOME', token: 'income.monthly_gross', value: '$5,850.00', isRequired: true },
      { fieldName: 'TOTAL_MONTHLY_OPERATING_EXPENSE', token: 'expense.monthly_total', value: '$4,920.00', isRequired: true },
      { fieldName: 'NET_MONTHLY_OPERATING_SURPLUS', token: 'income.net_surplus', value: '$930.00', isRequired: true }
    ]
  },
  {
    id: 'f-fed-b107',
    formNumber: 'Official Form B 107',
    formTitle: 'Statement of Financial Affairs for Individuals (SOFA)',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'HISTORICAL_GROSS_INCOME_YTD', token: 'sofa.gross_ytd', value: '2026 YTD: $38,400 | 2025: $72,000 | 2024: $68,500', isRequired: true },
      { fieldName: 'PRIOR_INSIDER_PAYMENTS', token: 'sofa.insider_pmts', value: 'None outside standard domestic household expenses', isRequired: false }
    ]
  },
  {
    id: 'f-fed-b122a1',
    formNumber: 'Official Form B 122A-1',
    formTitle: 'Chapter 7 Statement of Current Monthly Income (Means Test)',
    courtSystem: 'United States Bankruptcy Court',
    mappings: [
      { fieldName: 'ANNUALIZED_CURRENT_MONTHLY_INCOME', token: 'meanstest.annual_income', value: '$70,200.00', isRequired: true },
      { fieldName: 'STATE_MEDIAN_INCOME_BENCHMARK', token: 'meanstest.state_median', value: '$79,840.00 (California 1-Person Household)', isRequired: true },
      { fieldName: 'PRESUMPTION_OF_ABUSE_RESULT', token: 'meanstest.abuse_result', value: 'Presumption Does NOT Arise (Below State Median)', isRequired: true }
    ]
  }
];

// ========================================================================================
// 3. ALL RESEARCH PORTAL COURT FORMS (SEARCHABLE INDEX WITH GUIDELINES & PDF LINKS)
// ========================================================================================
export const ALL_RESEARCH_COURT_FORMS: ResearchCourtForm[] = [
  // California Family Law
  {
    code: "FL-100",
    title: "Petition — Marriage/Domestic Partnership",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl100.pdf",
    description: "Initial petition filed to start divorce, legal separation, or nullity in California.",
    guidelines: [
      "Verify residency requirement: 6 months in CA, 3 months in filing county.",
      "Accurately state date of marriage and date of separation.",
      "Check box requesting reservation of jurisdiction over spousal support."
    ]
  },
  {
    code: "FL-110",
    title: "Summons (Family Law)",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl110.pdf",
    description: "Official summons served on Respondent with standard family law restraining orders.",
    guidelines: [
      "Restrains both parties from removing children or transferring marital assets.",
      "Gives Respondent 30 calendar days to file a formal response."
    ]
  },
  {
    code: "FL-120",
    title: "Response — Marriage/Domestic Partnership",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl120.pdf",
    description: "Respondent's formal answer to petition for dissolution or legal separation.",
    guidelines: [
      "Confirm or dispute petitioner's separation date.",
      "Outline counter-requests for custody, spousal support, and asset division."
    ]
  },
  {
    code: "FL-105",
    title: "UCCJEA Declaration (FL-105 / GC-120)",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl105.pdf",
    description: "Mandatory declaration establishing child custody jurisdiction.",
    guidelines: [
      "Detail minor children addresses and cohabitants for the past 5 years.",
      "List all prior or pending child custody litigation in any jurisdiction."
    ]
  },
  {
    code: "FL-200",
    title: "Petition to Establish Parental Relationship",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl200.pdf",
    description: "Paternity petition for unmarried parents seeking custody and child support.",
    guidelines: [
      "Used when parents were not legally married at child's birth.",
      "Can request court-ordered DNA genetic testing."
    ]
  },
  {
    code: "FL-260",
    title: "Petition for Custody and Support of Minor Children",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl260.pdf",
    description: "Petition for custody/support when parentage is already established.",
    guidelines: [
      "Does not dissolve a marriage or declare paternity; focuses purely on custody/support."
    ]
  },
  {
    code: "FL-300",
    title: "Request for Order (RFO)",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl300.pdf",
    description: "Motion for court hearing requesting temporary custody, support, or fee orders.",
    guidelines: [
      "State clear factual emergency or material change in circumstances.",
      "Attach FL-150 Income & Expense Declaration if requesting support or fees."
    ]
  },
  {
    code: "FL-320",
    title: "Responsive Declaration to Request for Order",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl320.pdf",
    description: "Formal response opposing or proposing counter-orders to an RFO.",
    guidelines: [
      "Must be filed and served at least 9 court days before the scheduled hearing."
    ]
  },
  {
    code: "FL-311",
    title: "Child Custody and Visitation Application Attachment",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl311.pdf",
    description: "Attachment detailing specific weekly parenting and drop-off schedules.",
    guidelines: [
      "Attach to FL-100 or FL-300 to define explicit visitation terms."
    ]
  },
  {
    code: "FL-341(C)",
    title: "Children's Holiday Schedule Attachment",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl341c.pdf",
    description: "Attachment specifying holiday, summer break, and birthday rotations.",
    guidelines: [
      "Specify odd/even year holiday rotations clearly to avoid enforcement ambiguity."
    ]
  },
  {
    code: "FL-180",
    title: "Judgment (Family Law)",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl180.pdf",
    description: "Final judicial decree granting dissolution and incorporating marital settlement.",
    guidelines: [
      "Attach marital settlement agreement or detailed court order exhibits."
    ]
  },
  {
    code: "FL-190",
    title: "Notice of Entry of Judgment",
    category: "Family Law (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl190.pdf",
    description: "Official court clerk notice confirming entry of final judgment.",
    guidelines: [
      "Triggers the mandatory 6-month statutory waiting period for legal single status."
    ]
  },

  // California Financial & Disclosures
  {
    code: "FL-140",
    title: "Declaration of Disclosure (Cover Sheet)",
    category: "Financial & Disclosures (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl140.pdf",
    description: "Cover sheet declaring service of preliminary or final financial disclosures.",
    guidelines: [
      "Mandatory in all dissolution cases under CA Family Code Section 2104/2105."
    ]
  },
  {
    code: "FL-141",
    title: "Declaration Regarding Service of Disclosure",
    category: "Financial & Disclosures (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl141.pdf",
    description: "Proof filed with the court certifying financial disclosures were served.",
    guidelines: [
      "Do NOT attach asset details to FL-141 when filing with court (keeps financials private)."
    ]
  },
  {
    code: "FL-142",
    title: "Schedule of Assets and Debts",
    category: "Financial & Disclosures (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl142.pdf",
    description: "Itemized index of all community and separate property assets and liabilities.",
    guidelines: [
      "Attach recent bank, real estate, mortgage, and investment statements."
    ]
  },
  {
    code: "FL-150",
    title: "Income and Expense Declaration",
    category: "Financial & Disclosures (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl150.pdf",
    description: "Comprehensive disclosure of monthly wages, taxes, and living expenses.",
    guidelines: [
      "Attach paystubs for the last 2 months.",
      "Re-file if earnings or expenses change significantly."
    ]
  },
  {
    code: "FL-155",
    title: "Financial Statement (Simplified)",
    category: "Financial & Disclosures (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl155.pdf",
    description: "Simplified financial form for child support-only cases with low income.",
    guidelines: [
      "Cannot be used if requesting spousal support or attorney fees."
    ]
  },
  {
    code: "FL-160",
    title: "Property Declaration",
    category: "Financial & Disclosures (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl160.pdf",
    description: "Form listing community or separate assets and proposed property division.",
    guidelines: [
      "File separate FL-160 forms for Community Property and Separate Property."
    ]
  },

  // California Name Change & Guardianship
  {
    code: "NC-100",
    title: "Petition for Change of Name",
    category: "Name Change & Guardianship (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/nc100.pdf",
    description: "Petition requesting legal name change for adult or minor.",
    guidelines: [
      "Requires publication of Order to Show Cause (NC-120) in official newspaper."
    ]
  },
  {
    code: "NC-120",
    title: "Order to Show Cause for Change of Name",
    category: "Name Change & Guardianship (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/nc120.pdf",
    description: "Court order specifying publication requirements for name change.",
    guidelines: [
      "Must be published once a week for 4 consecutive weeks."
    ]
  },
  {
    code: "NC-130",
    title: "Decree Changing Name",
    category: "Name Change & Guardianship (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/nc130.pdf",
    description: "Official judicial order granting new legal name.",
    guidelines: [
      "Obtain certified copies to update Social Security and DMV records."
    ]
  },
  {
    code: "NC-200",
    title: "Petition for Name Change to Conform to Gender Identity",
    category: "Name Change & Guardianship (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/nc200.pdf",
    description: "Confidential name change petition conforming to gender identity.",
    guidelines: [
      "Exempt from newspaper publication requirements under CA law."
    ]
  },
  {
    code: "GC-210",
    title: "Petition for Appointment of Guardian of Minor",
    category: "Name Change & Guardianship (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/gc210.pdf",
    description: "Petition requesting appointment of guardian of minor person/estate.",
    guidelines: [
      "Requires background check and court investigation report."
    ]
  },
  {
    code: "GC-250",
    title: "Letters of Guardianship",
    category: "Name Change & Guardianship (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/gc250.pdf",
    description: "Official certificate issued to court-appointed guardian.",
    guidelines: [
      "Keep certified copy to present to schools, hospitals, and financial institutions."
    ]
  },

  // California Civil & Torts
  {
    code: "CM-010",
    title: "Civil Case Cover Sheet",
    category: "Civil & Torts (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/cm010.pdf",
    description: "Mandatory civil cover sheet classifying lawsuit category.",
    guidelines: [
      "Designate whether action is Limited (under $35,000) or Unlimited."
    ]
  },
  {
    code: "SUM-100",
    title: "Summons (Civil Action)",
    category: "Civil & Torts (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/sum100.pdf",
    description: "Summons notifying civil defendant of 30-day response deadline.",
    guidelines: [
      "Must be served along with Complaint and Civil Case Cover Sheet."
    ]
  },
  {
    code: "PLD-PI-001",
    title: "Complaint — Personal Injury, Property Damage, Wrongful Death",
    category: "Civil & Torts (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/pldpi001.pdf",
    description: "Pleading form for motor vehicle, negligence, and tort lawsuits.",
    guidelines: [
      "Attach cause of action attachments (PLD-PI-001(1), (2), (3), (4))."
    ]
  },
  {
    code: "PLD-C-001",
    title: "Complaint — Contract / Breach of Contract",
    category: "Civil & Torts (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/pldc001.pdf",
    description: "Complaint asserting breach of express or implied contract.",
    guidelines: [
      "Attach copy of written contract or state terms of oral agreement."
    ]
  },

  // California Small Claims & Proof of Service
  {
    code: "SC-100",
    title: "Plaintiff's Claim and Order to Go to Small Claims",
    category: "Small Claims & Service (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/sc100.pdf",
    description: "Initiates small claims dispute for claims up to $12,500.",
    guidelines: [
      "Attorneys cannot represent parties in small claims trial."
    ]
  },
  {
    code: "POS-010",
    title: "Proof of Service of Summons (Civil)",
    category: "Small Claims & Service (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/pos010.pdf",
    description: "Sworn affidavit confirming personal service of civil summons.",
    guidelines: [
      "Must be signed by registered process server or disinterested adult."
    ]
  },
  {
    code: "FL-115",
    title: "Proof of Service of Summons (Family Law)",
    category: "Small Claims & Service (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl115.pdf",
    description: "Affidavit confirming service of Family Law Petition & Summons.",
    guidelines: [
      "File prompt proof of service to begin 30-day clock."
    ]
  },
  {
    code: "FL-335",
    title: "Proof of Service by Mail (Family Law)",
    category: "Small Claims & Service (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fl335.pdf",
    description: "Proof of service confirming mail dispatch of motion documents.",
    guidelines: [
      "Mail service adds 5 calendar days to statutory notice deadlines in CA."
    ]
  },
  {
    code: "FW-001",
    title: "Request to Waive Court Fees",
    category: "Financial & Waivers (CA)",
    pdfUrl: "https://www.courts.ca.gov/documents/fw001.pdf",
    description: "Application requesting waiver of court filing fees.",
    guidelines: [
      "Qualify via public benefits (Medi-Cal, SSI, CalFresh) or household income thresholds."
    ]
  },

  // Nevada Forms
  {
    code: "NV-FAM-101",
    title: "Nevada Family Division Cover Sheet",
    category: "Nevada Practice",
    description: "Required cover sheet for all Nevada District Court family filings.",
    guidelines: [
      "Required in Clark County 8th Judicial District and Washoe County 2nd District."
    ]
  },
  {
    code: "NV-FAM-102",
    title: "Joint Petition for Divorce (Nevada)",
    category: "Nevada Practice",
    description: "Uncontested joint petition for divorce signed by both spouses.",
    guidelines: [
      "At least one spouse must meet Nevada's 6-week residency requirement."
    ]
  },
  {
    code: "NV-FAM-103",
    title: "Complaint for Divorce (Nevada)",
    category: "Nevada Practice",
    description: "Unilateral divorce complaint filed in Nevada District Court.",
    guidelines: [
      "File along with Affidavit of Resident Witness verifying 6-week residency."
    ]
  },
  {
    code: "NV-FIN-201",
    title: "Financial Disclosure Form (NRCP 16.2)",
    category: "Nevada Practice",
    description: "Mandatory detailed financial disclosure under Nevada Rules of Civil Procedure 16.2.",
    guidelines: [
      "Must be filed within 45 days of service of answer in Nevada family cases."
    ]
  },
  {
    code: "NV-NC-301",
    title: "Petition for Adult Name Change (Nevada)",
    category: "Nevada Practice",
    description: "Nevada petition for legal name change.",
    guidelines: [
      "Requires publication in designated newspaper unless waived by judge."
    ]
  },
  {
    code: "NV-GCN-401",
    title: "Petition for Appointment of Guardian (Nevada)",
    category: "Nevada Practice",
    description: "Nevada petition for guardianship under NRS Chapter 159 / 159A.",
    guidelines: [
      "Requires Citation to Appear served on all interested family relatives."
    ]
  },
  {
    code: "NV-FW-801",
    title: "Application to Waive Filing Fees (Nevada IFP)",
    category: "Nevada Practice",
    description: "Nevada In Forma Pauperis application for filing fee waiver.",
    guidelines: [
      "Submit detailed statement of income, expenses, and public benefits."
    ]
  },

  // Federal Chapter 7 Bankruptcy Forms (U.S. Administrative Office of the U.S. Courts)
  {
    code: "Official Form B 101",
    title: "Voluntary Petition for Individuals Filing for Bankruptcy",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_101.pdf",
    description: "Standard federal petition initiating individual Chapter 7 bankruptcy liquidation proceedings.",
    guidelines: [
      "Must state district bankruptcy court jurisdiction.",
      "Requires estimation of asset and liability ranges.",
      "Include emergency filing declaration if filing skeleton petition within 14-day cure window."
    ]
  },
  {
    code: "Official Form B 106A/B",
    title: "Schedule A/B: Property (Real and Personal)",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_106ab.pdf",
    description: "Itemized inventory of real estate, motor vehicles, bank balances, and personal property.",
    guidelines: [
      "List current fair market value without deducting liens.",
      "Itemize bank accounts, cryptocurrency wallets, and pending legal claims.",
      "Establish strict unsecured value metrics for liquidation calculations."
    ]
  },
  {
    code: "Official Form B 106C",
    title: "Schedule C: The Property You Claim as Exempt",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_106c.pdf",
    description: "Claims statutory exemptions protecting primary residence, motor vehicle, and wildcard assets.",
    guidelines: [
      "Elect statutory exemption system: Federal 11 U.S.C. 522 or State system (e.g. CA CCP 703/704 or NV NRS 21).",
      "Specify exact statutory citation and dollar amount claimed exempt for each asset."
    ]
  },
  {
    code: "Official Form B 106D",
    title: "Schedule D: Creditors Who Have Claims Secured by Property",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_106d.pdf",
    description: "Schedule listing all secured debt claims, mortgages, and vehicle liens.",
    guidelines: [
      "Relate creditor IDs directly back to specific real estate or auto assets via foreign key linkages.",
      "Disclose collateral description, total claim amount, and unsecured deficiency balance."
    ]
  },
  {
    code: "Official Form B 106E/F",
    title: "Schedule E/F: Creditors Who Have Unsecured Claims",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_106ef.pdf",
    description: "Matrix of priority unsecured claims (taxes, support) and nonpriority debts (credit cards, medical bills).",
    guidelines: [
      "Isolate priority statutory debts (IRS/state tax, domestic support) in Schedule E.",
      "List all general credit card, medical, personal loan, and utility debts in Schedule F."
    ]
  },
  {
    code: "Official Form B 106G/H",
    title: "Schedule G/H: Executory Contracts, Leases & Co-Debtors",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_106gh.pdf",
    description: "Schedule for unexpired residential/equipment leases and co-debtor liability tracking.",
    guidelines: [
      "Identify all ongoing leases, landlord service addresses, and contract terms.",
      "Flag co-debtors, co-signers, and secondary obligors."
    ]
  },
  {
    code: "Official Form B 106I/J",
    title: "Schedule I/J: Your Income & Ongoing Monthly Expenses",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_106ij.pdf",
    description: "Schedule cross-referencing gross monthly earnings with itemized living expenses.",
    guidelines: [
      "Include debtor and spouse gross earnings and mandatory deductions.",
      "Itemize rent, utilities, food, insurance, and operating overhead."
    ]
  },
  {
    code: "Official Form B 107",
    title: "Statement of Financial Affairs for Individuals (SOFA)",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_107.pdf",
    description: "Comprehensive financial history tracking prior income, gifts, losses, and asset sales.",
    guidelines: [
      "Disclose gross income for current calendar year and preceding 2 full years.",
      "Detail insider payments, repossessions, foreclosures, and business ownership."
    ]
  },
  {
    code: "Official Form B 122A-1",
    title: "Chapter 7 Statement of Your Current Monthly Income (Means Test)",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_122a-1.pdf",
    description: "First tier Chapter 7 Means Test comparing 6-month average income against state median threshold.",
    guidelines: [
      "Calculate current monthly income (CMI) from all sources.",
      "Compare annualized CMI against U.S. Trustee state median income benchmark."
    ]
  },
  {
    code: "Official Form B 122A-2",
    title: "Chapter 7 Means Test Calculation (Expense Deductions)",
    category: "Bankruptcy (Chapter 7)",
    pdfUrl: "https://www.uscourts.gov/sites/default/files/form_b_122a-2.pdf",
    description: "Second tier Means Test calculation deducting IRS standard expenses and debt service.",
    guidelines: [
      "Apply IRS National & Local Expense Standards.",
      "Deduct mandatory secured debt service and special circumstances rebuttal claims under 11 U.S.C. 707(b)(2)."
    ]
  }
];
