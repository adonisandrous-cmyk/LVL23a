import { AbbyyTaskItem, AbbyyFlexiCaptureAssociate } from '../lib/abbyy/abbyyFlexiCaptureService';

class AbbyyTaskStore {
  private tasks: AbbyyTaskItem[] = [
    {
      id: 'task-101',
      taskId: 'TASK-48921',
      batchName: 'Trescon_Legal_Batch_001',
      workId: 'WID-9921',
      documentType: 'Invoice',
      status: 'Pending',
      fields: {
        workId: 'WID-9921',
        invoiceNo: '23-12345',
        invoiceDate: '12/05/20',
        description: 'Legal Representation - Maria Lopez Family Law Proceeding',
        jobNumber: 'JOB-23091',
        location: 'Santa Ana, CA 92701',
        invoiceAmount: '3500.00',
        gstAmount: '350.00',
        receivedDate: '28/09/26',
        clientName: 'Maria Lopez',
        courtName: 'Superior Court of California, County of Orange'
      },
      redErrors: [],
      pagesMerged: true,
      receivedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'task-102',
      taskId: 'TASK-48922',
      batchName: 'Trescon_NewVersion_002',
      workId: 'WID-9924',
      documentType: 'CourtNotice',
      status: 'Pending',
      fields: {
        workId: 'WID-9924',
        invoiceNo: '24-88412',
        invoiceDate: '15/09/26',
        description: 'Notice of Response Filing - Respondent Dissolution',
        jobNumber: 'JOB-23094',
        location: 'Los Angeles, CA 90012',
        invoiceAmount: '1250.00',
        gstAmount: '125.00',
        receivedDate: '27/09/26',
        clientName: 'David Chen',
        courtName: 'Superior Court of California, County of Los Angeles'
      },
      redErrors: [],
      pagesMerged: true,
      receivedAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'task-103',
      taskId: 'TASK-48923',
      batchName: 'Trescon_NewVersion_003',
      workId: '',
      documentType: 'Invoice',
      status: 'Pending',
      fields: {
        workId: '',
        invoiceNo: 'INV-7721',
        invoiceDate: '2026-09-25', // Incorrect format (needs dd/MM/yy)
        description: 'Expert Witness Retainer Billing',
        jobNumber: 'JOB-23099',
        location: 'San Diego, CA 92101',
        invoiceAmount: '4200.00',
        gstAmount: '420.00',
        receivedDate: '28/09/26',
        clientName: 'Elena Rostova',
        courtName: 'Superior Court of California, County of San Diego'
      },
      redErrors: ['WorkId is Required', 'Invoice Date Format Incorrect (Expected dd/MM/yy)'],
      pagesMerged: false,
      receivedAt: new Date(Date.now() - 600000).toISOString()
    }
  ];

  public getTasks(): AbbyyTaskItem[] {
    return this.tasks;
  }

  public getTask(id: string): AbbyyTaskItem | undefined {
    return this.tasks.find((t) => t.id === id || t.taskId === id);
  }

  public addTask(task: Omit<AbbyyTaskItem, 'id' | 'receivedAt'>): AbbyyTaskItem {
    const newTask: AbbyyTaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      redErrors: AbbyyFlexiCaptureAssociate.auditRedErrors(task.fields)
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  public updateTaskStatus(id: string, status: AbbyyTaskItem['status']): AbbyyTaskItem | undefined {
    const task = this.getTask(id);
    if (task) {
      task.status = status;
    }
    return task;
  }

  public mergePages(id: string): AbbyyTaskItem | undefined {
    const task = this.getTask(id);
    if (task) {
      task.pagesMerged = true;
    }
    return task;
  }

  public resolveErrors(id: string, fixedFields: Partial<AbbyyTaskItem['fields']>): AbbyyTaskItem | undefined {
    const task = this.getTask(id);
    if (task) {
      task.fields = { ...task.fields, ...fixedFields };
      task.redErrors = AbbyyFlexiCaptureAssociate.auditRedErrors(task.fields);
    }
    return task;
  }
}

export const abbyyStore = new AbbyyTaskStore();
