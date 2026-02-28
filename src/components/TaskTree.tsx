import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Task, TaskMap } from "../types";
import { getProgress } from "../utils";

interface TaskNodeProps {
  taskId: string;
  taskMap: TaskMap;
  depth: number;
  onAddTask: (parentId: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskNode: React.FC<TaskNodeProps> = ({
  taskId,
  taskMap,
  depth,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const task = taskMap[taskId];
  if (!task) return null;

  const childrenSum = task.childIds.reduce((sum, childId) => {
    return sum + (taskMap[childId]?.estimatedMinutes || 0);
  }, 0);

  const remaining = Math.max(0, task.estimatedMinutes - childrenSum);
  const progress = getProgress(taskId, taskMap);

  const toggleComplete = () => {
    onUpdateTask(taskId, { isCompleted: !task.isCompleted });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.node, { marginLeft: depth > 0 ? 16 : 0 }]}>
      <View style={styles.header}>
        {task.childIds.length === 0 ? (
          <TouchableOpacity
            style={[
              styles.checkbox,
              task.isCompleted && styles.checkboxChecked,
            ]}
            onPress={toggleComplete}
          >
            {task.isCompleted && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
            <Text style={styles.expandButtonText}>
              {isExpanded ? "▼" : "▶"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.mainContent}>
          <View style={styles.topRow}>
            <TextInput
              style={[
                styles.titleInput,
                task.isCompleted && styles.textCompleted,
              ]}
              value={task.title}
              placeholder="タスク名"
              onChangeText={(text) => onUpdateTask(taskId, { title: text })}
            />
            <View style={styles.timeContainer}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={task.estimatedMinutes.toString()}
                onChangeText={(text) => {
                  const val = parseInt(text) || 0;
                  onUpdateTask(taskId, { estimatedMinutes: val });
                }}
              />
              <Text style={styles.unitText}>
                分 ({remaining > 0 ? `空:${remaining}` : "満"})
              </Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddTask(taskId)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeleteTask(taskId)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      {isExpanded &&
        task.childIds.map((childId) => (
          <TaskNode
            key={childId}
            taskId={childId}
            taskMap={taskMap}
            depth={depth + 1}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  node: {
    paddingVertical: 2,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingLeft: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  expandButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  expandButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "bold",
  },
  checkMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  mainContent: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleInput: {
    flex: 1,
    fontSize: 14,
    padding: 2,
    fontWeight: "500",
  },
  textCompleted: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    width: 30,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    textAlign: "center",
    fontSize: 12,
  },
  unitText: {
    fontSize: 9,
    color: "#888",
    marginLeft: 2,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#007AFF",
  },
  addButton: {
    width: 24,
    height: 24,
    backgroundColor: "#4CD964",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    width: 24,
    height: 24,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
