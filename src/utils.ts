import { TaskMap } from "./types";

/**
 * 指定したタスク（とそのサブツリー）において、完了した工数の合計を返します。
 * 親タスクの未割当工数（親の工数 - 子の合計工数）も、親が完了していれば完了済みとみなします。
 */
export const getCompletedMinutes = (
  taskId: string,
  taskMap: TaskMap,
): number => {
  const task = taskMap[taskId];
  if (!task) return 0;

  if (task.childIds.length === 0) {
    return task.isCompleted ? task.estimatedMinutes : 0;
  }

  const childrenMinutesSum = task.childIds.reduce((sum, cid) => {
    return sum + (taskMap[cid]?.estimatedMinutes || 0);
  }, 0);

  const unassignedMinutes = Math.max(
    0,
    task.estimatedMinutes - childrenMinutesSum,
  );
  const unassignedCompleted = task.isCompleted ? unassignedMinutes : 0;

  const childrenCompleted = task.childIds.reduce((sum, cid) => {
    return sum + getCompletedMinutes(cid, taskMap);
  }, 0);

  return unassignedCompleted + childrenCompleted;
};

/**
 * 進捗率を 0 から 1 の間で返します。
 */
export const getProgress = (taskId: string, taskMap: TaskMap): number => {
  const task = taskMap[taskId];
  if (!task || task.estimatedMinutes === 0) return 0;
  return getCompletedMinutes(taskId, taskMap) / task.estimatedMinutes;
};
