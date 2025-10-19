import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

// タスクアイテムのインターフェース
interface Task {
  id: string; // タスクの一意なID
  content: string; // タスクの内容
  statusId: string; // どのステータスに属するかを示すID (例: 'todoList', 'doneList')
  priority: number; // 各ステータス内での優先度（横方向の並び順）
}

// ステータス列のインターフェース
interface StatusColumn {
  id: string; // ステータスの一意なID (例: 'todoList', 'doneList')
  title: string; // 表示タイトル (例: 'To do', 'Done')
  isRejectColumn?: boolean; // Reject列かどうか
  isRejectEnabled?: boolean; // Reject列が有効かどうか
}

@Component({
  selector: 'app-status-board',
  templateUrl: './status-board.component.html',
  styleUrls: ['./status-board.component.scss'],
})
export class StatusBoardComponent implements OnInit {
  statusColumns: StatusColumn[] = []; // 縦に並ぶステータス列
  tasks: Task[] = []; // 全てのタスクアイテム

  newTaskContent: string = ''; // 新しいタスクの内容入力用
  newTaskPriority: number = 1; // 新しいタスクの優先度入力用
  newColumnTitle: string = ''; // 新しいステータスのタイトル入力用

  editingTask: {
    taskId: string;
    statusId: string;
    originalContent: string;
    originalPriority: number;
    currentContent: string; // 編集中の内容
    currentPriority: number; // 編集中の優先度
  } | null = null;

  constructor() {}

  ngOnInit(): void {
    this.statusColumns = [
      { id: 'todoList', title: 'To do' },
      { id: 'doneList', title: 'Done' },
      {
        id: 'rejectList',
        title: 'Reject',
        isRejectColumn: true,
        isRejectEnabled: false,
      },
    ];

    this.tasks = [
      {
        id: 'task-1',
        content: 'Get to work',
        statusId: 'todoList',
        priority: 1,
      },
      {
        id: 'task-2',
        content: 'Pick up groceries',
        statusId: 'todoList',
        priority: 2,
      },
      { id: 'task-3', content: 'Go home', statusId: 'todoList', priority: 3 },
      {
        id: 'task-4',
        content: 'Fall asleep',
        statusId: 'todoList',
        priority: 4,
      },
      { id: 'task-5', content: 'Get up', statusId: 'doneList', priority: 1 },
      {
        id: 'task-6',
        content: 'Brush teeth',
        statusId: 'doneList',
        priority: 2,
      },
      {
        id: 'task-7',
        content: 'Take a shower',
        statusId: 'doneList',
        priority: 3,
      },
      {
        id: 'task-8',
        content: 'Check e-mail',
        statusId: 'doneList',
        priority: 4,
      },
      { id: 'task-9', content: 'Walk dog', statusId: 'doneList', priority: 5 },
    ];

    this.sortTasksInAllColumns();
  }

  // 各ステータス内のタスクを優先度でソートする
  private sortTasksInColumn(statusId: string): void {
    const tasksInStatus = this.tasks
      .filter((task) => task.statusId === statusId)
      .sort((a, b) => a.priority - b.priority);
    tasksInStatus.forEach((task, index) => {
      const originalTaskIndex = this.tasks.findIndex((t) => t.id === task.id);
      if (originalTaskIndex !== -1) {
        this.tasks[originalTaskIndex].priority = index + 1;
      }
    });
  }

  private sortTasksInAllColumns(): void {
    this.statusColumns.forEach((column) => this.sortTasksInColumn(column.id));
  }

  // 指定されたステータスIDに属するタスクを取得し、優先度でソートして返す
  getTasksByStatus(statusId: string): Task[] {
    return this.tasks
      .filter((task) => task.statusId === statusId)
      .sort((a, b) => a.priority - b.priority);
  }

  // 新しいステータス列を追加
  addColumn(): void {
    if (this.newColumnTitle.trim()) {
      const newColumnId =
        this.newColumnTitle.trim().toLowerCase().replace(/\s/g, '') + 'List';
      this.statusColumns.push({
        id: newColumnId,
        title: this.newColumnTitle.trim(),
      });
      this.newColumnTitle = ''; // 入力フィールドをクリア
    }
  }

  // ドラッグ＆ドロップで接続可能なリストのIDを全て返す
  getConnectedListIds(): string[] {
    return this.statusColumns.map((column) => column.id);
  }

  // タスクのドラッグ＆ドロップ処理
  drop(event: CdkDragDrop<Task[]>): void {
    const previousStatusColumn = this.statusColumns.find(
      (col) => col.id === event.previousContainer.id
    );
    const currentStatusColumn = this.statusColumns.find(
      (col) => col.id === event.container.id
    );

    if (!previousStatusColumn || !currentStatusColumn) {
      return;
    }

    // Reject列がOFFの場合の移動と並べ替えの制御
    if (
      currentStatusColumn.isRejectColumn &&
      !currentStatusColumn.isRejectEnabled
    ) {
      alert('Reject列は現在OFFのため、タスクを移動できません。');
      return;
    }
    if (
      previousStatusColumn.isRejectColumn &&
      !previousStatusColumn.isRejectEnabled
    ) {
      alert('Reject列がOFFのため、タスクを移動できません。');
      return;
    }
    if (
      currentStatusColumn.isRejectColumn &&
      currentStatusColumn.id === event.previousContainer.id &&
      !currentStatusColumn.isRejectEnabled
    ) {
      alert('Reject列がOFFのため、タスクの並べ替えはできません。');
      return;
    }

    if (event.previousContainer === event.container) {
      // 同じステータス内での並べ替え
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // 優先度を再割り当て
      event.container.data.forEach((task, index) => {
        const originalTaskIndex = this.tasks.findIndex((t) => t.id === task.id);
        if (originalTaskIndex !== -1) {
          this.tasks[originalTaskIndex].priority = index + 1;
        }
      });
    } else {
      // 異なるステータスへの移動
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // 移動したタスクのstatusIdを更新
      const movedTask = event.container.data[event.currentIndex];
      const taskIndexInAllTasks = this.tasks.findIndex(
        (task) => task.id === movedTask.id
      );
      if (taskIndexInAllTasks !== -1) {
        this.tasks[taskIndexInAllTasks].statusId = currentStatusColumn.id;
      }

      // 移動元と移動先の両方のステータスで優先度を再割り当て
      this.sortTasksInColumn(previousStatusColumn.id);
      this.sortTasksInColumn(currentStatusColumn.id);
    }
    // 全てのカラムで優先度を再ソート (念のため)
    this.sortTasksInAllColumns();
  }

  // 新しいタスクを追加
  addTask(statusColumn: StatusColumn): void {
    if (this.newTaskContent.trim()) {
      const newTaskId = `task-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`; // ユニークなIDを生成
      const tasksInColumn = this.getTasksByStatus(statusColumn.id);
      const newPriority =
        tasksInColumn.length > 0
          ? Math.max(...tasksInColumn.map((t) => t.priority)) + 1
          : 1;

      this.tasks.push({
        id: newTaskId,
        content: this.newTaskContent.trim(),
        statusId: statusColumn.id,
        priority: newPriority,
      });
      this.sortTasksInColumn(statusColumn.id); // 追加したカラムのタスクをソート
      this.newTaskContent = '';
      this.newTaskPriority = 1; // デフォルト値に戻す
    }
  }

  // タスクの編集モードを開始
  editTask(
    taskId: string,
    statusId: string,
    currentContent: string,
    currentPriority: number
  ): void {
    this.editingTask = {
      taskId,
      statusId,
      originalContent: currentContent,
      originalPriority: currentPriority,
      currentContent: currentContent, // 初期値として現在の内容を設定
      currentPriority: currentPriority, // 初期値として現在の優先度を設定
    };
  }

  // タスクを保存
  saveTask(taskId: string, newContent: string, newPriority: number): void {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1 && newContent.trim()) {
      this.tasks[taskIndex].content = newContent.trim();
      this.tasks[taskIndex].priority = newPriority;
      this.sortTasksInColumn(this.tasks[taskIndex].statusId); // 変更したタスクのカラムをソート
    }
    this.editingTask = null;
  }

  // タスクの編集をキャンセル
  cancelEdit(): void {
    if (this.editingTask) {
      const taskIndex = this.tasks.findIndex(
        (task) => task.id === this.editingTask?.taskId
      );
      if (taskIndex !== -1) {
        this.tasks[taskIndex].content = this.editingTask.originalContent;
        this.tasks[taskIndex].priority = this.editingTask.originalPriority;
        this.sortTasksInColumn(this.editingTask.statusId); // 編集前の値に戻した後、ソートし直す
      }
      this.editingTask = null;
    }
  }

  // タスクを削除
  deleteTask(taskId: string): void {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1) {
      const statusIdOfDeletedTask = this.tasks[taskIndex].statusId;
      this.tasks.splice(taskIndex, 1);
      this.sortTasksInColumn(statusIdOfDeletedTask); // 削除したカラムのタスクをソート
    }
  }
}
