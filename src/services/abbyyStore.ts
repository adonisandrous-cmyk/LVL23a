import { AbbyyTaskItem, AbbyyFlexiCaptureAssociate } from '../lib/abbyy/abbyyFlexiCaptureService';

class AbbyyTaskStore {
  private tasks: AbbyyTaskItem[] = [];

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
