import { Client, Matter } from '../types';

export const INITIAL_CLIENTS_ROSTER: Client[] = [
  {
    id: 'c-1',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 019-2831',
    status: 'active',
    practiceArea: 'Family Law',
    createdAt: '2026-08-01T08:00:00Z',
    intakeNotes: `========================================================================
CLIENT INTAKE MEMORANDUM & CASE FILE: JANE DOE [STANDARD PLACEHOLDER]
========================================================================
1. PARTY INFORMATION
- Client Legal Name: Jane Doe
- Status: Standard Placeholder Record
- Email: jane.doe@example.com
- Phone: +1 (555) 019-2831
- Practice Area: Family Law

2. INTAKE SUMMARY
Standard client placeholder available for modification or replacement with verified client credentials upon onboarding.
========================================================================`
  },
  {
    id: 'c-2',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 019-2832',
    status: 'active',
    practiceArea: 'Civil Litigation',
    createdAt: '2026-08-01T09:00:00Z',
    intakeNotes: `========================================================================
CLIENT INTAKE MEMORANDUM & CASE FILE: JOHN DOE [STANDARD PLACEHOLDER]
========================================================================
1. PARTY INFORMATION
- Client Legal Name: John Doe
- Status: Standard Placeholder Record
- Email: john.doe@example.com
- Phone: +1 (555) 019-2832
- Practice Area: Civil Litigation

2. INTAKE SUMMARY
Standard client placeholder available for modification or replacement with verified client credentials upon onboarding.
========================================================================`
  }
];

export const INITIAL_MATTERS_ROSTER: Matter[] = [
  {
    id: 'm-1',
    title: 'Matter Template — Jane Doe',
    caseNumber: 'CASE-2026-001',
    clientId: 'c-1',
    clientName: 'Jane Doe',
    practiceArea: 'Family Law',
    status: 'active',
    billingRate: 350,
    billedHours: 2.0,
    description: 'Standard placeholder legal matter ready for client onboarding and customized case management.',
    createdAt: '2026-08-01T08:30:00Z',
    tasks: [
      { id: 't-1-1', title: 'Onboard and verify client intake documentation', completed: false, dueDate: '2026-09-01' },
      { id: 't-1-2', title: 'Review initial pleadings & schedule client consultation', completed: false, dueDate: '2026-09-15' }
    ],
    riskAssessment: 'Standard initial intake assessment pending primary case filing.'
  },
  {
    id: 'm-2',
    title: 'Matter Template — John Doe',
    caseNumber: 'CASE-2026-002',
    clientId: 'c-2',
    clientName: 'John Doe',
    practiceArea: 'Civil Litigation',
    status: 'active',
    billingRate: 350,
    billedHours: 1.5,
    description: 'Standard placeholder legal matter ready for client onboarding and dispute resolution.',
    createdAt: '2026-08-01T09:30:00Z',
    tasks: [
      { id: 't-2-1', title: 'Compile initial discovery requests and client records', completed: false, dueDate: '2026-09-10' }
    ],
    riskAssessment: 'Preliminary case evaluation.'
  }
];
