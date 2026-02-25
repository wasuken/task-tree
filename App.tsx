import React, { useState } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Alert,
  Text,
  StatusBar,
} from "react-native";
import { Task, TaskMap } from "./src/types";
import { TaskNode } from "./src/components/TaskTree";
import { getCompletedMinutes, getProgress } from "./src/utils";

const initialTasks: TaskMap = {
  root: {
    id: "root",
    title: "ルートタスク",
    estimatedMinutes: 60,
    isCompleted: false,
    childIds: [],
    parentId: null,
  },
};

export default function App() {
  const [taskMap, setTaskMap] = useState<TaskMap>(initialTasks);

  const onAddTask = (parentId: string) => {
    const parent = taskMap[parentId];
    if (!parent) return;

    const newChildIds = [
      ...parent.childIds,
      Math.random().toString(36).substring(2, 9),
    ];
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

    const newId = newChildIds[count - 1];
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

      nextMap[parentId] = { ...parent, childIds: newChildIds };
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
      if (!task || !task.parentId) return prev;
      const parent = prev[task.parentId];
      const newParent = {
        ...parent,
        childIds: parent.childIds.filter((cid) => cid !== id),
      };
      const newMap = { ...prev, [task.parentId]: newParent };
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

  const completed = getCompletedMinutes("root", taskMap);
  const total = taskMap["root"]?.estimatedMinutes || 0;
  const progress = getProgress("root", taskMap);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>タスクツリー</Text>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            進捗: {completed} / {total} 分 ({Math.round(progress * 100)}%)
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TaskNode
          taskId="root"
          taskMap={taskMap}
          depth={0}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
        />
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
  appTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
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
});
