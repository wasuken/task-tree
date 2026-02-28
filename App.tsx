import React, { useState } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Alert,
  Text,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Task, TaskMap } from "./src/types";
import { TaskNode } from "./src/components/TaskTree";
import { getCompletedMinutes, getProgress } from "./src/utils";

const initialTasks: TaskMap = {
  root1: {
    id: "root1",
    title: "ルートタスク",
    estimatedMinutes: 60,
    isCompleted: false,
    childIds: [],
    parentId: null,
  },
};

export default function App() {
  const [taskMap, setTaskMap] = useState<TaskMap>(initialTasks);

  const onAddRootTask = () => {
    const newId = `root_${Math.random().toString(36).substring(2, 9)}`;
    const newTask: Task = {
      id: newId,
      title: "新規ルートタスク",
      estimatedMinutes: 60,
      isCompleted: false,
      childIds: [],
      parentId: null,
    };
    setTaskMap((prev) => ({ ...prev, [newId]: newTask }));
  };

  const onAddTask = (parentId: string) => {
    const parent = taskMap[parentId];
    if (!parent) return;

    const newId = Math.random().toString(36).substring(2, 9);
    const newChildIds = [...parent.childIds, newId];
    const count = newChildIds.length;

    // 最小タスク時間（5分）のチェック
    const minRequired = count * 5;
    if (parent.estimatedMinutes < minRequired) {
      Alert.alert(
        "制限",
        `各タスクの最小時間は5分です。この親タスク(${parent.estimatedMinutes}分)には最大${Math.floor(parent.estimatedMinutes / 5)}個までしかタスクを追加できません。`,
      );
      return;
    }

    // 親の全工数を新しい子要素数で割る
    const base = Math.floor(parent.estimatedMinutes / count);
    const remainder = parent.estimatedMinutes % count;

    const newTask: Task = {
      id: newId,
      title: `子タスク`,
      estimatedMinutes: 0,
      isCompleted: false,
      childIds: [],
      parentId: parentId,
    };

    setTaskMap((prev) => {
      const nextMap = { ...prev, [newId]: newTask };

      newChildIds.forEach((cid, index) => {
        const targetTask = nextMap[cid];
        if (targetTask) {
          let assigned = base + (index < remainder ? 1 : 0);

          const currentChildrenSum = targetTask.childIds.reduce((sum, ccid) => {
            return sum + (nextMap[ccid]?.estimatedMinutes || 0);
          }, 0);

          if (assigned < currentChildrenSum) {
            assigned = currentChildrenSum;
          }

          nextMap[cid] = { ...targetTask, estimatedMinutes: assigned };
        }
      });

      nextMap[parentId] = { ...nextMap[parentId], childIds: newChildIds };
      return nextMap;
    });
  };

  const onUpdateTask = (id: string, updates: Partial<Task>) => {
    setTaskMap((prev) => {
      const task = prev[id];
      if (!task) return prev;

      let finalUpdates = { ...updates };

      if (updates.estimatedMinutes !== undefined) {
        let newVal = updates.estimatedMinutes;
        const childrenSum = task.childIds.reduce((sum, childId) => {
          return sum + (prev[childId]?.estimatedMinutes || 0);
        }, 0);
        if (newVal < childrenSum) newVal = childrenSum;

        if (task.parentId) {
          const parent = prev[task.parentId];
          const otherChildrenSum = parent.childIds.reduce((sum, childId) => {
            if (childId === id) return sum;
            return sum + (prev[childId]?.estimatedMinutes || 0);
          }, 0);
          if (newVal + otherChildrenSum > parent.estimatedMinutes) {
            newVal = parent.estimatedMinutes - otherChildrenSum;
          }
        }
        finalUpdates.estimatedMinutes = newVal;
      }

      return {
        ...prev,
        [id]: { ...task, ...finalUpdates },
      };
    });
  };

  const onDeleteTask = (id: string) => {
    setTaskMap((prev) => {
      const task = prev[id];
      if (!task) return prev;

      const newMap = { ...prev };

      // 親タスクから削除
      if (task.parentId && newMap[task.parentId]) {
        const parent = newMap[task.parentId];
        newMap[task.parentId] = {
          ...parent,
          childIds: parent.childIds.filter((cid) => cid !== id),
        };
      }

      // 再帰的に子タスクを削除
      const deleteRecursive = (taskId: string, map: TaskMap) => {
        const t = map[taskId];
        if (!t) return;
        t.childIds.forEach((cid) => deleteRecursive(cid, map));
        delete map[taskId];
      };

      deleteRecursive(id, newMap);
      return newMap;
    });
  };

  const rootTasks = Object.values(taskMap).filter((t) => t.parentId === null);
  const total = rootTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completed = rootTasks.reduce(
    (sum, t) => sum + getCompletedMinutes(t.id, taskMap),
    0,
  );
  const progress = total > 0 ? completed / total : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>タスクツリー</Text>
          <TouchableOpacity style={styles.headerButton} onPress={onAddRootTask}>
            <Text style={styles.headerButtonText}>+ ルート追加</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            全体の進捗: {completed} / {total} 分 ({Math.round(progress * 100)}%)
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {rootTasks.map((task) => (
          <TaskNode
            key={task.id}
            taskId={task.id}
            taskMap={taskMap}
            depth={0}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
        {rootTasks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>タスクがありません</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  appHeader: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryContainer: {
    marginTop: 4,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CD964",
  },
  scrollContent: {
    padding: 8,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
});
