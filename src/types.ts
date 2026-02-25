export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  childIds: string[];
  parentId: string | null;
}

export type TaskMap = { [id: string]: Task };
